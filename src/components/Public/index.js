import React, { useState, useEffect } from 'react'
// import { useDispatch } from 'react-redux'

// hooks
// import useMount from '../../hooks/useMount'

// actions
// import { getTagList, getCategoryList } from '@/redux/article/actions'

// components
import SignModal from './SignModal'
// import UploadModal from '@/components/Public/UploadModal'
// import { Modal } from 'antd'
// import useModal from '../../hooks/useModal'

/**
 * @component Public 公共组件，挂在在 APP.jsx 中，用于存放初始化的组件/方法 或者公用的 modal 等
 */
function PublicComponent(props) {
  // const dispatch = useDispatch() // dispatch hooks
  // const { modalProps } = useModal()

  // useMount(() => {
    // dispatch(getTagList())
    // dispatch(getCategoryList())
  // })

  return (
    <>
      <SignModal />
      {/* <UploadModal /> */}
      {/* <Modal {...modalProps} title='公告'>
        <h2>本次更新内容：</h2>
        <h6>1.优化帖子列表</h6>
        <h6>2.增加热门笔记，热门分享</h6>
        <h6>3.增加个人信息显示</h6>
        <h6>4.增加文章搜索功能</h6>
      </Modal> */}
    </>
  )
}

export default PublicComponent
