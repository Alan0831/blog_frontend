import routers from './router';    // 路由文件
import { Routes, Route } from 'react-router-dom';    // 路由插件
import './App.css';
import PublicComponent from './components/Public'
import Header from './components/header';
import { useEffect } from 'react';
import { setCursor } from './utils/curlyCursor'
function App() {
  useEffect(() => {
    setCursor();
  },[])

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
