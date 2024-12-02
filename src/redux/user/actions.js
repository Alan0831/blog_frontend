import * as TYPES from '../types'
import { request } from '../../utils/request';
import * as PSW from '../../utils/password';

export const login = params => {
  if (params.password !== undefined) {
    params.password = PSW.default.encrypt(params.password);
  }
  return dispatch =>
    request('/doLogin', { data: params }).then(res => {
      if (res.status == 200) {
        dispatch({
          type: TYPES.USER_LOGIN,
          payload: res.data,
        })
      }
      return res;
    })
}

export const edit = params => ({
  type: TYPES.USER_EDIT,
  payload: params,
})

export const register = params => {
  if (params.password !== undefined) {
    params.password = PSW.default.encrypt(params.password);
  }
  return dispatch =>
    request('/doregister', { data: params }).then(res => {
      return res;
    })
}

export const loginout = () => ({
  type: TYPES.USER_LOGIN_OUT
})
