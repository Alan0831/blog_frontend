import routers from './router';    // 路由文件
import { Routes, Route, useLocation } from 'react-router-dom';    // 路由插件
import './App.css';
import PublicComponent from './components/Public'
import Header from './components/header';
import ErrorBoundary from './components/ErrorBoundary';
import { useEffect } from 'react';
import { getValidUserInfo } from './utils/auth';
function App() {
  const location = useLocation();

  useEffect(() => {
    // 应用启动时校验一次本地登录态，token 过期则清理，避免刷新后仍显示已登录。
    getValidUserInfo();
    let isDark = localStorage.getItem('isDark') || false;
    const body = document.querySelector('body');
    const header = document.getElementsByClassName('header')[0];
    if (isDark == 'true') {
      body.classList.add('dark');
      header.classList.add('dark');
    }
  }, [])
  return (
    <div className="App">
      <Header />
      <Routes>
        {
          routers.map((item, index) => {
            const PageComponent = item.components;
            return (
              <Route
                path={item.path}
                key={index}
                element={
                  <ErrorBoundary resetKey={location.pathname} pageName={item.name}>
                    <PageComponent />
                  </ErrorBoundary>
                }
              ></Route>
            );
          })
        }
      </Routes>
      <PublicComponent />
      {/* <canvas></canvas> */}
    </div>
  );
}

export default App;
