import routers from './router';    // 路由文件
import { Routes, Route } from 'react-router-dom';    // 路由插件
import './App.css';
import PublicComponent from './components/Public'
import Header from './components/header';
import { useEffect } from 'react';
function App() {
  useEffect(() => {
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
          routers.map((item, index) => (
            <Route path={item.path} key={index} element={<item.components />}></Route>
          ))
        }
      </Routes>
      <PublicComponent />
      <canvas></canvas>
    </div>
  );
}

export default App;
