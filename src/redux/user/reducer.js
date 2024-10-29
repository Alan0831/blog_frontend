import * as TYPES from '../types'
import { save, get, remove } from '../../utils/storage';

// ====== state
let defaultState = {
  username: '',
  role: 1,
  userId: -1,
  github: null,
  gender: 'male',
  description: null,
  email: null,
}

const userInfo = get('userInfo');

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
      const { username, userId, role, github = null, token, gender = 'male', description = null, email = null } = payload;
      save('userInfo', { username, userId, role, github, token, gender, description, email});
      // save('avatar', { avatar })
      return { ...state, username, userId, role, github, gender, description, email};

    case TYPES.USER_LOGIN_OUT:
      remove('userInfo');
      return { ...state, username: '', userId: 0, role: 2, github: null, gender: 'male', description: null, email: null};

    case TYPES.USER_EDIT:
      let oldInfo = get('userInfo');
      save('userInfo', { ...oldInfo, username: payload.username, gender: payload.gender, description: payload.description, email: payload.email});
      return { ...state, username: payload.username, gender: payload.gender, description: payload.description, email: payload.email};
    default:
      return state
  }
}
