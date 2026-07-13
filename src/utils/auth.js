import { get, remove } from './storage';

export const AUTH_ERROR_CODES = ['TOKEN_MISSING', 'TOKEN_EXPIRED', 'TOKEN_INVALID'];

const LOGIN_PATH = '/login';
let lastAuthTipAt = 0;
let lastAuthRedirectAt = 0;

export const getAuthErrorCode = (res = {}) => res.errorCode || res.data?.errorCode;

export const isAuthErrorResponse = (res = {}) => {
  const errorCode = getAuthErrorCode(res);
  const errorType = res.data?.errorType || res.errorType;
  return AUTH_ERROR_CODES.includes(errorCode) || ['tokenInvalid', 'tokenExpired'].includes(errorType);
};

export const isTokenExpired = (userInfo = get('userInfo')) => {
  const expiresAt = Number(userInfo?.tokenExpiresAt);
  return Boolean(expiresAt && Date.now() >= expiresAt);
};

export const clearLoginState = () => {
  remove('userInfo');
};

export const getValidUserInfo = () => {
  const userInfo = get('userInfo');

  if (!userInfo || typeof userInfo !== 'object') {
    return null;
  }

  // 进入页面时先校验本地 token 到期时间，过期则直接清理，避免继续展示已登录状态。
  if (isTokenExpired(userInfo)) {
    clearLoginState();
    return null;
  }

  return userInfo;
};

export const getAuthorizationHeader = () => {
  const userInfo = getValidUserInfo();

  // 所有登录态接口统一走 Authorization: Bearer <token>，便于后续彻底下线旧 header。
  return userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {};
};

export const getAuthErrorMessage = (res = {}) => {
  return res.errorMessage || res.message || '登录已过期，请重新登录';
};

export const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === LOGIN_PATH) return;

  const now = Date.now();
  if (now - lastAuthRedirectAt < 1000) return;

  lastAuthRedirectAt = now;
  window.location.href = LOGIN_PATH;
};

export const handleAuthFailure = (res = {}, messageApi) => {
  const now = Date.now();

  clearLoginState();

  // 多个并发接口同时 401 时，只提示一次，避免消息刷屏。
  if (messageApi && now - lastAuthTipAt > 1000) {
    lastAuthTipAt = now;
    messageApi.error(getAuthErrorMessage(res));
  }

  // redirectToLogin();
};
