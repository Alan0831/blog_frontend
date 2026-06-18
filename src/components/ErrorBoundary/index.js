import React from 'react';
import { Button, Modal } from 'antd';
import './index.less';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
      modalOpen: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      error,
      modalOpen: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Page render error:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({
        error: null,
        errorInfo: null,
        modalOpen: false,
      });
    }
  }

  getErrorText = () => {
    const { error, errorInfo } = this.state;
    const message = error?.message || String(error || '未知错误');
    const stack = errorInfo?.componentStack || error?.stack || '';
    return stack ? `${message}\n${stack}` : message;
  };

  closeModal = () => {
    this.setState({ modalOpen: false });
  };

  retryRender = () => {
    this.setState({
      error: null,
      errorInfo: null,
      modalOpen: false,
    });
  };

  render() {
    const { error, modalOpen } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <div className="page-error-boundary">
        <div className="page-error-panel">
          <div className="page-error-kicker">页面渲染异常</div>
          <h2>当前页面没有正常加载</h2>
          <p>错误已被拦截，页面不会白屏。可以查看错误原因，或重试渲染当前页面。</p>
          <div className="page-error-actions">
            <Button type="primary" onClick={this.retryRender}>重试</Button>
            <Button onClick={() => this.setState({ modalOpen: true })}>查看原因</Button>
          </div>
        </div>
        <Modal
          title="页面报错原因"
          open={modalOpen}
          okText="重试"
          cancelText="关闭"
          onOk={this.retryRender}
          onCancel={this.closeModal}
          width={720}
        >
          <pre className="page-error-detail">{this.getErrorText()}</pre>
        </Modal>
      </div>
    );
  }
}

export default ErrorBoundary;
