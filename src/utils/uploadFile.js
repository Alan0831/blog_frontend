const CHUNK_SIZE = 1024 * 1024; // 1MB
const SparkMD5 = require('spark-md5');
import { request } from './request';
import { message } from 'antd';
import { createErrorByResponse } from './errorMessage';

// 对视频切片
const createChunks = (file) => {
    let start = 0;
    const chunks = [];
    while (start < file.size) {
        chunks.push(file.slice(start, start + CHUNK_SIZE));
        start += CHUNK_SIZE;
    }
    return chunks;
};

// 计算文件内容hash值
const calculateHash = (file) => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = function (e) {
            const spark = new SparkMD5.ArrayBuffer();
            spark.append(e.target.result);
            resolve(spark.end());
        };
        fileReader.onerror = function (error) {
            reject(error);
        };
    });
};

// 上传分片文件
/**
 * 
 * @param {*} chunks 文件list[Blob]
 * @param {*} fileHash 文件hash
 * @param {*} existChunks 服务器已存在的包
 * @param {*} progresscb 进行中的回调
 */
const uploadChunks = async (chunks, fileHash, existChunks, progresscb) => {
    const formDatas = chunks
        .map((chunk, index) => ({
            fileHash,
            chunkHash: fileHash + "-" + index,
            chunk,
        }))
        .filter((item) => !existChunks.includes(item.chunkHash))
        .map((item) => {
            const formData = new FormData();
            formData.append("fileHash", item.fileHash);
            formData.append("chunkHash", item.chunkHash);
            formData.append("chunk", item.chunk);
            return formData;
        });
    console.log(formDatas);
    const taskPool = formDatas.map(
        (formData) => () =>
            fetch("/commit/api/uploadChunks", {
                method: "POST",
                body: formData,
            })
    );

    // 控制请求并发
    const results = await concurRequest(taskPool, 6, progresscb);
    for (const result of results) {
        if (result instanceof Error) {
            throw result;
        }
        if (!result?.ok) {
            let errorData = {};
            try {
                errorData = await result.clone().json();
            } catch (error) {
                errorData = { errorCode: 'VIDEO_CHUNK_UPLOAD_FAILED' };
            }
            throw createErrorByResponse(errorData, '单片上传失败，请重试当前视频');
        }
        try {
            const data = await result.clone().json();
            if (data?.status && data.status != 200) {
                throw createErrorByResponse(data, '单片上传失败，请重试当前视频');
            }
        } catch (error) {
            if (error?.errorCode) throw error;
        }
    }
};

// 控制请求并发
const concurRequest = (taskPool, max, progresscb) => {
    return new Promise((resolve) => {
        if (taskPool.length === 0) {
            resolve([]);
            return;
        }

        const results = [];
        let index = 0;
        let count = 0;

        const request = async () => {
            if (index === taskPool.length) return;
            const i = index;
            const task = taskPool[index];
            index++;
            try {
                results[i] = await task();
            } catch (err) {
                results[i] = err;
            } finally {
                count++;
                if (count === taskPool.length) {
                    resolve(results);
                }
                console.log('请求');
                let percent = (count / taskPool.length) * 100;
                progresscb(percent);
                request();
            }
        };

        const times = Math.min(max, taskPool.length);
        for (let i = 0; i < times; i++) {
            request();
        }
    });
};

const mergeRequest = async (fileHash, fileName, userId) => {
    try {
        let res = await request('/mergeChunks', { data: { fileHash, fileName, userId } });
        return res;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// 校验文件、文件分片是否存在
const verify = async (fileHash, fileName) => {
    try {
        let res = await request('/verify', { data: { fileHash, fileName } });
        return res;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

/**
 *  
 * @param {*} file 文件名
 * @param {*} userId 用户ID
 * @param {*} cb 成功回调
 * @param {*} failcb 失败回调
 * @param {*} progresscb 进行中回调
 * @returns 
 */
export async function uploadFileChunk(file, userId, cb, failcb, progresscb) {
    console.log(file);
    const fileName = file.name;
    // 创建文件分片
    const chunks = createChunks(file);
    // 计算文件内容hash值
    let fileHash = await calculateHash(file);

    try {
        // 校验文件、文件分片是否存在
        const verifyRes = await verify(fileHash, fileName);
        progresscb(1);
        console.log(verifyRes);
        if (verifyRes.status != 200) {
            throw createErrorByResponse(verifyRes, '视频校验失败，请稍后重试');
        }
        const { existFile, existChunks = [], videoUrl = '' } = verifyRes.data || {};
        if (existFile) {
            message.success('上传成功');
            progresscb(100);
            cb && cb(videoUrl);
            return
        };
        // 上传分片文件
        await uploadChunks(chunks, fileHash, Array.isArray(existChunks) ? existChunks : [], progresscb);

        // 合并分片文件
        let mergeRes = await mergeRequest(fileHash, fileName, userId);
        console.log(mergeRes);
        if (mergeRes.status != 200) {
            throw createErrorByResponse(mergeRes, '视频合并失败，请稍后重试或重新上传');
        }
        const { videoUrl: url } = mergeRes.data || {};
        if (url) {
            message.success('上传成功');
            cb && cb(url);
        } else {
            throw createErrorByResponse({ errorCode: 'VIDEO_MERGE_FAILED' }, '视频合并失败，请稍后重试或重新上传');
        }
    } catch (error) {
        console.error(error);
        failcb && failcb(error);
    }
}
