import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Modal, message } from 'antd'
import './index.less'
// redux
import { login, register } from '../../../redux/user/actions'
import { useDispatch } from 'react-redux'

// hooks
import useBus, { useListener } from '../../../hooks/useBus'

function SignModal(props) {
  const [form] = Form.useForm();
  const dispatch = useDispatch() // dispatch hooks
  const [open, setVisible] = useState(false)
  const [type, setType] = useState('login')
  const bus = useBus();

  useListener('openSignModal', type => {
    form.resetFields()
    setType(type)
    setVisible(true)
  })

  const handleSubmit = (values) => {
    if (type == 'login') {
      submitLogin(values);
    } else {
      submitRegister(values);
    }
  }

  const submitLogin = (values) => {
    let obj = {
      username: values.account,
      password: values.password
    }
    dispatch(login(obj)).then((res) => {
      if (res.status === 200) {
        message.success('登录成功！');
        bus.emit('getLogin', res.data);
        form.resetFields();
        setVisible(false);
      } else {
        message.error(res.errorMessage);
        form.resetFields();
      }
    })
  }

  const submitRegister = (values) => {
    if (!values.username || !values.password || !values.email) {
      message.error('请填写用户名、邮箱以及密码！');
      return;
    }
    let obj = {
      username: values.username,
      password: values.password,
      email: values.email,
    }
    dispatch(register(obj)).then((res) => {
      if (res.status === 200) {
        message.success('注册成功！');
        form.resetFields();
        setVisible(false);
      } else {
        message.error(res.errorMessage);
        form.resetFields();
      }
    })
  }


  return (
    <Modal
      width={460}
      title={type === 'login' ? '登录' : '注册'}
      open={open}
      style={{ height: '500px' }}
      onCancel={() => setVisible(false)}
      footer={null}>
      <Form layout='horizontal' onFinish={handleSubmit} form={form} className='form'>
        {type === 'login' ? (
          <>
            <Form.Item name="account">
              <Input className='text' placeholder='请输入用户名' />
            </Form.Item>
            <Form.Item name="password">
              <Input className='password' type="password" placeholder='请输入密码' />
            </Form.Item>
          </>
        )
          : (
            <>
              <Form.Item name="username" >
                <Input className='text' placeholder='请输入用户名' />
              </Form.Item>
              <Form.Item name="password">
                <Input className='password' type='password' placeholder='请输入密码' />
              </Form.Item>
              <Form.Item name="confirm" rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次密码输入不一致!'));
                  },
                }),
              ]}>
                <Input className='password' type='password' placeholder='确认密码' />
              </Form.Item>
              <Form.Item name="email">
                <Input className='text' placeholder='请输入您的邮箱' />
              </Form.Item>
            </>
          )}
        <Form.Item>
          <Button type='primary' block htmlType="submit">
            {type === 'login' ? '登录' : '注册'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default SignModal
