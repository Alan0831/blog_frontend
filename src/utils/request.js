import axios from 'axios'

// const loginToken = localStorage.getItem('loginToken') 
import { get } from './storage';
import { message } from 'antd';
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
        const token = get('userInfo')?.token;
        if (token) {
            config.headers['authorization'] = token;
        }
        return config
    },
    error => {
        Promise.reject(error)
    }
)

// 拦截响应
instance.interceptors.response.use(
    config => {
        // 拦截token失效的请求，统一处理
        if (config.data && config.data.data.errorType === 'tokenInvalid') {
            message.error('登录失效，请重新登录');
        }
        return config
    },
    error => {
        Promise.reject(error)
    }
)

export function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        instance({
            url,
            method: (options.method || 'post').toLowerCase(),
            data: { ...options.data },
            responseType: options.responseType ? options.responseType : 'json'
        }).then((res) => {
            resolve(res.data)
        }).catch((err) => {
            reject(err)
        })
    })
}