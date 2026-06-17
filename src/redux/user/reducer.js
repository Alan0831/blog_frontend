import * as TYPES from '../types'
import { save, get, remove } from '../../utils/storage';
import { getValidUserInfo } from '../../utils/auth';

// ====== state
let defaultState = {
  username: '',
  role: 1,
  userId: -1,
  github: null,
  token: null,
  tokenExpiresIn: null,
  tokenExpiresAt: null,
  gender: 'male',
  description: null,
  email: null,
}

const userInfo = getValidUserInfo();

if (userInfo) {
  defaultState = { ...defaultState, ...userInfo }
}

// console.log('%c defaultState', 'background: yellow', defaultState)
/**
 * UserReducer
 */
export default function UserReducer(state = defaultState, action) {
  const { type, payload } = action
  switch (type) {
    case TYPES.USER_LOGIN:
      console.log(payload);
      const { username, userId, role, github = null, token, tokenExpiresIn = null, tokenExpiresAt = null, gender = 'male', description = null, email = null } = payload;
      // 登录成功后同步保存 token 到期信息，请求前会用它判断本地登录态是否已过期。
      save('userInfo', { username, userId, role, github, token, tokenExpiresIn, tokenExpiresAt, gender, description, email});
      // save('avatar', { avatar })
      return { ...state, username, userId, role, github, token, tokenExpiresIn, tokenExpiresAt, gender, description, email};

    case TYPES.USER_LOGIN_OUT:
      remove('userInfo');
      return { ...state, username: '', userId: 0, role: 2, github: null, token: null, tokenExpiresIn: null, tokenExpiresAt: null, gender: 'male', description: null, email: null};

    case TYPES.USER_EDIT:
      let oldInfo = get('userInfo');
      save('userInfo', { ...oldInfo, username: payload.username, gender: payload.gender, description: payload.description, email: payload.email});
      return { ...state, username: payload.username, gender: payload.gender, description: payload.description, email: payload.email};
    default:
      return state
  }
}
