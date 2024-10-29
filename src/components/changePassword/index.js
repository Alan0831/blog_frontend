import React, { useState, useEffect } from 'react'
import { Input, Form, message, Button } from 'antd'
import { request } from '../../utils/request';

import './index.less'
/**
 * 修改密码
*/
function ChangePassword(props) {
    const [userId, setUserId] = useState(props.userInfo.userId);
    const [form] = Form.useForm();
    useEffect(() => {

    }, [])

    const submit = async (value) => {
        console.log(value)
        let obj = {
            password: value.oldPassword,
            newPassword: value.newPassword,
            userId
        }
        let res = await request('/changePassword', { data: obj });
        if (res.status == 200) {
            message.success('修改成功');
            form.resetFields();
        } else {
            form.resetFields();
            message.error(res.errorMessage);
        }
    }

    const formItemLayout = {
        labelCol: {
            span: 4,
        },
        wrapperCol: {
            span: 14,
        },
    }

    return (
        <div className='help-article'>
            <Form
                {...formItemLayout}
                name="normal_login"
                form={form}
                onFinish={submit}
            >
                <Form.Item
                    label='原密码'
                    name="oldPassword"
                    rules={[
                        {required: true, message: '请输入原密码'}
                    ]}
                >
                    <Input
                        type='password'
                        className='title-input'
                    />
                </Form.Item>
                <Form.Item
                    label='新密码'
                    name="newPassword"
                    rules={[
                        {required: true, message: '请输入原密码'}
                    ]}
                >
                    <Input
                        type='password'
                        className='title-input'
                    />
                </Form.Item>
                <Form.Item label='确认密码' name="confirm" rules={[{ required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                    validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次密码输入不一致!'));
                    },
                }),
                ]}>
                    <Input
                        type='password'
                        className='title-input'
                    />
                </Form.Item>
                <Form.Item
                    style={{ textAlign: 'center' }}
                >
                    <Button type='primary' htmlType="submit">提交</Button>
                </Form.Item>
            </Form>
        </div>
    )
}

export default ChangePassword
