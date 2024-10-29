import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message, Spin, Tabs } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { request } from '../../utils/request';
import { login } from '../../redux/user/actions'
import { useDispatch } from 'react-redux';
import useBus from '../../hooks/useBus';
import './index.less'
const { TabPane } = Tabs;

function Login() {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const [formLogin] = Form.useForm();
    const [formRegister] = Form.useForm();
    const [active, setActive] = useState('');
    const [nowStatus, setNowstatus] = useState('login');
    const navigate = useNavigate();
    const bus = useBus();
    const location = useLocation()
    useEffect(() => {
        setNowstatus(location.state?.nowStatus || 'login');
    }, [])

    //  登录
    const submitLogin = async (values) => {
        if (!values.username || !values.password) {
            message.error('请填写用户名和密码！');
            return;
        }
        let obj = {
            username: values.username,
            password: values.password
        }
        dispatch(login(obj)).then((res) => {
            if (res.status === 200) {
                message.success('登录成功！');
                formLogin.resetFields();
                bus.emit('getLogin', res.data);
                navigate('/');
            } else {
                message.error(res.errorMessage);
                formLogin.resetFields();
            }
        })
    }
    //  注册
    const submitRegister = async (values) => {
        if (!values.username || !values.password || !values.email) {
            message.error('请填写用户名、邮箱以及密码！');
            return;
        }
        let obj = {
            username: values.username,
            password: values.password,
            email: values.email,
        }
        const res = await request('/doregister', { data: obj });
        if (res.status === 200) {
            message.success('注册成功！');
            setActive('login');
            setNowstatus('login');
            formRegister.resetFields();
        } else {
            message.error(res.errorMessage);
            formRegister.resetFields();
        }
    }

    //  切换至注册弹窗
    const changeToregister = () => {
        setActive('register');
        setNowstatus('register');
        formRegister.resetFields();
        formLogin.resetFields();
    }
    //  切换至登录弹窗
    const changeToLogin = () => {
        setActive('login');
        setNowstatus('login');
        formRegister.resetFields();
        formLogin.resetFields();
    }

    return (
        <div className='container'>
            <div className={'box' + (active === 'login' ? ' active' : active === 'register' ? ' nagative' : '') + (nowStatus === 'register' ? ' hidden' : '')}>
                <div className='card'>
                    <Spin tip="请稍后" spinning={loading}>
                        <div className='loginContent'>
                            <p className='contentTitle'>登&nbsp;&nbsp;录</p>
                            <Form
                                name="normal_login"
                                form={formLogin}
                                // initialValues={{ remember: true }}
                                labelCol={{ span: 6 }}
                                wrapperCol={{ span: 18 }}
                                onFinish={submitLogin}
                            >
                                <Form.Item
                                    name="username"
                                    label='用户名'
                                >
                                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                                </Form.Item>
                                <Form.Item
                                    name="password"
                                    label='密码'
                                >
                                    <Input
                                        prefix={<LockOutlined />}
                                        type="password"
                                        placeholder="密码"
                                    />
                                </Form.Item>
                                <div className='center'>
                                    <Button htmlType="submit" className='button'>
                                        登录
                                    </Button>
                                </div>
                                <p className='description' onClick={changeToregister}>
                                    没有账号？注册一个
                                </p>
                            </Form>
                        </div>
                    </Spin>
                </div>
            </div>
            <div className={'box' + (active === 'register' ? ' active' : active === 'login' ? ' nagative' : '') + (nowStatus === 'login' ? ' hidden' : '')}>
                <div className='card'>
                    <Spin tip="请稍后" spinning={loading}>
                        <div className='loginContent'>
                            <p className='contentTitle'>注&nbsp;&nbsp;册</p>
                            <Form
                                name="normal_register"
                                form={formRegister}
                                // initialValues={{ remember: true }}
                                labelCol={{ span: 6 }}
                                wrapperCol={{ span: 18 }}
                                onFinish={submitRegister}
                            >
                                <Form.Item
                                    name="username"
                                    label='用户名'
                                >
                                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                                </Form.Item>
                                <Form.Item
                                    name="email"
                                    label='邮箱'
                                >
                                    <Input prefix={<UserOutlined />} placeholder="用户名" />
                                </Form.Item>
                                <Form.Item
                                    name="password"
                                    label='密码'
                                >
                                    <Input
                                        prefix={<LockOutlined />}
                                        type="password"
                                        placeholder="密码"
                                    />
                                </Form.Item>
                                <div className='center'>
                                    <Button htmlType="submit" className='button'>
                                        注册
                                    </Button>
                                </div>
                                <p className='description' onClick={changeToLogin}>
                                    已有账号？直接登录
                                </p>
                            </Form>
                        </div>
                    </Spin>
                </div>
            </div>
            <div className='backpic'>
                <img src='bilan.jpeg'></img>
            </div>
        </div>
    )
}

export default Login
