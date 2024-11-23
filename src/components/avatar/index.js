import React from 'react'
import PropTypes from 'prop-types'
import './index.less'
// config
import { DISCUSS_AVATAR } from '../../config'

// components
import { Avatar } from 'antd'

function AvatarComponent({ username, role, image, style }) {
    let avatarSrc = '';
    if (image) {
        avatarSrc = image;
    } else {
        avatarSrc = DISCUSS_AVATAR;
    }
    // if (role === 1) 
    return avatarSrc ? (<Avatar style={style} src={avatarSrc}>{username}</Avatar>) : (<Avatar style={style}>{username}</Avatar>)
}
//
function AppAvatar(props) {
    const { role = '2', username = '' } = props?.userInfo || {};
    const image = props.image;
    const style = props.style;
    return <AvatarComponent style={style} role={role} username={username} image={image} />
}

// AppAvatar.propTypes = {
//     userInfo: PropTypes.object.isRequired,
//     popoverVisible: PropTypes.bool
// }

// AppAvatar.defaultProps = {
//     popoverVisible: true
// }

export default AppAvatar
