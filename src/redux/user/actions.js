import * as TYPES from '../types'
import { request } from '../../utils/request';

export const login = params => {
  return dispatch =>
    request('/doLogin', { data: params }).then(res => {
      dispatch({
        type: TYPES.USER_LOGIN,
        payload: res.data,
      })
      return res;
    })
}

export const edit = params => ({
  type: TYPES.USER_EDIT,
  payload: params,
})

export const register = params => {
  return dispatch =>
    request('/doregister', { data: params }).then(res => {
      return res;
    })
}

export const loginout = () => ({
  type: TYPES.USER_LOGIN_OUT
})
