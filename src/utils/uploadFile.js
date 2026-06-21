const CHUNK_SIZE = 1024 * 1024; // 1MB
const VIDEO_PROCESS_POLL_INTERVAL = 4000; // 后端切片是异步任务，前端每 4 秒查一次状态
const VIDEO_PROCESS_MAX_RETRY = 450; // 最多等待 30 分钟，防止轮询无限卡住
const SparkMD5 = require('spark-md5');
import { request } from './request';
import { message } from 'antd';
import { createErrorByResponse } from './errorMessage';
import { getAuthorizationHeader, handleAuthFailure, isAuthErrorResponse } from './auth';
import { getAjaxHeaders } from './security';

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
                // 分片上传不手动设置 Content-Type，避免破坏浏览器自动生成的 multipart boundary。
                // fetch 不经过 axios 拦截器，AJAX 标识与登录头需要在这里显式补齐。
                headers: {
                    ...getAjaxHeaders('post'),
                    ...getAuthorizationHeader(),
                },
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
            if (result.status === 401 || isAuthErrorResponse(errorData)) {
                // fetch 分片上传绕过 axios 拦截器，401 时同样清理登录态并引导重新登录。
                handleAuthFailure(errorData, message);
            }
            throw createErrorByResponse(errorData, '单片上传失败，请重试当前视频');
        }
        try {
            const data = await result.clone().json();
            if (data?.status && data.status != 200) {
                if (isAuthErrorResponse(data)) {
                    // 后端若用业务错误体返回 token 问题，也走统一登录态失效处理。
                    handleAuthFailure(data, message);
                }
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

const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));

// 查询视频后台切片/转码进度，mergeChunks 返回 processing 后依靠这个接口继续等
const getVideoProcessStatus = async (fileHash) => {
    try {
        let res = await request('/getVideoProcessStatus', { data: { fileHash } });
        return res;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

// 轮询后端排队/处理状态：只有 success 才把播放地址交给业务表单，queued/processing 都继续等待。
const waitVideoProcessFinish = async (fileHash, progresscb) => {
    let lastPercent = 80;

    for (let i = 0; i < VIDEO_PROCESS_MAX_RETRY; i++) {
        const statusRes = await getVideoProcessStatus(fileHash);
        if (statusRes.status != 200) {
            throw createErrorByResponse(statusRes, '获取视频处理进度失败');
        }

        const processInfo = statusRes.data || {};
        const serverProgress = Number(processInfo.progress || 0);
        // 从 80% 开始展示后端处理进度，queued 可能没有 progress，此时保持上一次进度不乱跳。
        lastPercent = Math.min(99, Math.max(lastPercent, 80 + Math.round(serverProgress * 0.2)));
        progresscb && progresscb(lastPercent, processInfo);

        if (processInfo.status === 'success') {
            progresscb && progresscb(100, processInfo);
            return processInfo;
        }

        if (processInfo.status === 'failed') {
            throw new Error(processInfo.errorMessage || processInfo.message || '视频处理失败');
        }

        // queued 表示后端任务还在排队，可能带 queuePosition；发布仍然只认 success。
        if (processInfo.status === 'queued' || processInfo.status === 'processing') {
            await sleep(VIDEO_PROCESS_POLL_INTERVAL);
            continue;
        }

        await sleep(VIDEO_PROCESS_POLL_INTERVAL);
    }

    throw new Error('视频处理超时，请稍后刷新或重新上传');
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
    // 生成分片
    const chunks = createChunks(file);
    // 计算文件 hash，后端依据该值做秒传/断点续传
    let fileHash = await calculateHash(file);

    try {
        // 先问后端是否已有该文件，如果已在处理中就直接轮询等结果
        const verifyRes = await verify(fileHash, fileName);
        progresscb(1);
        console.log(verifyRes);
        if (verifyRes.status != 200) {
            throw createErrorByResponse(verifyRes, '验证视频状态失败');
        }
        const { existFile, existChunks = [], videoUrl = '', processStatus = '', processInfo = {} } = verifyRes.data || {};
        if (existFile) {
            const currentStatus = processInfo.status || processStatus;
            // 秒传只能在后端确认 master.m3u8 已生成后才算成功
            if (currentStatus === 'success') {
                message.success('视频已存在');
                progresscb(100, processInfo);
                cb && cb(videoUrl || processInfo.videoUrl, processInfo);
                return;
            }
            if (currentStatus === 'queued' || currentStatus === 'processing') {
                message.info(currentStatus === 'queued' ? '视频已上传，正在排队等待处理' : '视频已上传，正在等待后端处理');
                const finishedInfo = await waitVideoProcessFinish(fileHash, progresscb);
                cb && cb(finishedInfo.videoUrl || videoUrl, finishedInfo);
                return;
            }
            throw createErrorByResponse({ errorCode: 'VIDEO_PROCESS_UNKNOWN' }, '视频处理状态异常，请重新上传');
        };
        // 实际文件分片上传占 1%-78%，剩余进度留给后端切片/转码
        await uploadChunks(chunks, fileHash, Array.isArray(existChunks) ? existChunks : [], (chunkPercent) => {
            progresscb(Math.max(1, Math.min(78, Math.round(chunkPercent * 0.78))));
        });

        // 合并请求现在只启动后端异步任务，不代表视频已经可播
        let mergeRes = await mergeRequest(fileHash, fileName, userId);
        console.log(mergeRes);
        if (mergeRes.status != 200) {
            throw createErrorByResponse(mergeRes, '视频合并或处理启动失败');
        }
        const { videoUrl: url, fileHash: mergedHash = fileHash, processStatus: mergedStatus = '' } = mergeRes.data || {};
        if (!url) {
            throw createErrorByResponse({ errorCode: 'VIDEO_MERGE_FAILED' }, '后端未返回视频地址，请重试');
        }

        progresscb(80, { status: mergedStatus || 'processing', videoUrl: url, fileHash: mergedHash });
        if (mergedStatus === 'queued' || mergedStatus === 'processing') {
            message.info(mergedStatus === 'queued' ? '视频上传完成，正在排队等待处理' : '视频上传完成，正在后台处理');
            const finishedInfo = await waitVideoProcessFinish(mergedHash, progresscb);
            cb && cb(finishedInfo.videoUrl || url, finishedInfo);
            return;
        }

        progresscb(100, { status: mergedStatus || 'success', videoUrl: url, fileHash: mergedHash });
        cb && cb(url, { status: mergedStatus || 'success', videoUrl: url, fileHash: mergedHash });
    } catch (error) {
        console.error(error);
        failcb && failcb(error);
        throw error;
    }
}
