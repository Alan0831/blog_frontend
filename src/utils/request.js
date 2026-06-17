import axios from 'axios'

// const loginToken = localStorage.getItem('loginToken') 
import { message } from 'antd';
import {
    getAuthorizationHeader,
    handleAuthFailure,
    isAuthErrorResponse,
} from './auth';
const initOptions = {
    headers: {
        'Range': 'bytes=0-99',
        'Accept': 'application/json;charset=utf-8',
        'Accept-Language': 'zh-CN,zh',
        'Content-Type': 'application/json;charset=utf-8',
    },
    params: {
        'timeout': 300000,
        'responseData': 'json',
        'maxContentLength': 200000,
    }
}

const instance = axios.create({
    timeout: 300000,
    baseURL: '/commit/api',
    headers: {
        ...initOptions.headers,
    },
    ...initOptions.params,
    // validateStatus: (status) => validateStatus(status)
})

// 拦截请求
instance.interceptors.request.use(
    config => {
        // 需要登录态的接口统一使用后端推荐的 Authorization Bearer 头。
        config.headers = config.headers || {};
        Object.assign(config.headers, getAuthorizationHeader());
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 拦截响应
instance.interceptors.response.use(
    config => {
        // 兼容后端以 200 返回业务错误的情况，发现登录态错误后统一清理并跳登录页。
        if (isAuthErrorResponse(config.data)) {
            handleAuthFailure(config.data, message);
        }
        return config
    },
    error => {
        const res = error?.response;
        if (res?.status === 401 || isAuthErrorResponse(res?.data)) {
            handleAuthFailure(res?.data, message);
        }
        return Promise.reject(error)
    }
)

export function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const method = (options.method || 'post').toLowerCase();
        instance({
            url,
            method,
            data: method === 'get' ? undefined : { ...options.data },
            params: method === 'get' ? { ...options.data, ...options.params } : options.params,
            responseType: options.responseType ? options.responseType : 'json'
        }).then((res) => {
            resolve(res.data)
        }).catch((err) => {
            if (err?.response?.data) {
                resolve(err.response.data);
                return;
            }
            reject(err)
        })
    })
}
