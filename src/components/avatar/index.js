import React from 'react'
import PropTypes from 'prop-types'
import './index.less'
// config
import { DISCUSS_AVATAR } from '../../config'

// components
import { Avatar } from 'antd'

function AvatarComponent({ username, role, image }) {
    let avatarSrc = ''
    if (image) {
        avatarSrc = image;
    } else {
        avatarSrc = DISCUSS_AVATAR;
    }
    // if (role === 1) 
    return avatarSrc ? (<Avatar src={avatarSrc}>{username}</Avatar>) : (<Avatar>{username}</Avatar>)
}
//
function AppAvatar(props) {
    const { role, username } = props.userInfo
    const image = props.image
    return <AvatarComponent role={role} username={username} image={image} />
}

AppAvatar.propTypes = {
    userInfo: PropTypes.object.isRequired,
    popoverVisible: PropTypes.bool
}

// AppAvatar.defaultProps = {
//     popoverVisible: true
// }

export default AppAvatar
