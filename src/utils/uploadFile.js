const CHUNK_SIZE = 1024 * 1024; // 1MB
const SparkMD5 = require('spark-md5');
import { request } from './request';
import { message } from 'antd';

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
    return new Promise((resolve) => {
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
 */
const uploadChunks = async (chunks, fileHash, existChunks) => {
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
    await concurRequest(taskPool, 6);
};

// 控制请求并发
const concurRequest = (taskPool, max) => {
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
                console.log('请求')
                request();
            }
        };

        const times = Math.min(max, taskPool.length);
        for (let i = 0; i < times; i++) {
            request();
        }
    });
};

const mergeRequest = async (fileHash, fileName) => {
    try {
        let res = await request('/mergeChunks', { data: { fileHash, fileName } });
        return res;
    } catch (err) {
        console.error(err);
        return {};
    }
}

// 校验文件、文件分片是否存在
const verify = async (fileHash, fileName) => {
    try {
        let res = await request('/verify', { data: { fileHash, fileName } });
        return res;
    } catch (err) {
        console.error(err);
        return {};
    }
};

export async function uploadFileChunk(file, cb, failcb) {
    console.log(file);
    const fileName = file.name;
    // 创建文件分片
    const chunks = createChunks(file);
    // 计算文件内容hash值
    let fileHash = await calculateHash(file);

    try {
        // 校验文件、文件分片是否存在
        const verifyRes = await verify(fileHash, fileName);
        console.log(verifyRes);
        const { existFile, existChunks, videoUrl = '' } = verifyRes.data;
        if (existFile) {
            message.success('上传成功');
            cb && cb(videoUrl);
            return
        };
        // 上传分片文件
        await uploadChunks(chunks, fileHash, existChunks);

        // 合并分片文件
        let mergeRes = await mergeRequest(fileHash, fileName);
        console.log(mergeRes);
        const { videoUrl: url } = mergeRes.data;
        if (url) {
            message.success('上传成功');
            cb && cb(url);
        } else {
            message.error('上传失败');
            failcb && failcb();
        }
    } catch (error) {
        console.error(error);
        failcb && failcb();
    }
}