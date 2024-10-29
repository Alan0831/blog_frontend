import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'


import React, { useState, useEffect } from 'react'
import { Button, Card, Divider, Tag } from 'antd'
import { request } from '../../utils/request';

import './index.less'
/**
 * three.js
*/
function THREETEST(props) {
    //   创建场景
    const scene = new THREE.Scene();

    //  创建相机
    const camera = new THREE.PerspectiveCamera(
        45, //  值越大，视角越大
        window.innerWidth / window.innerHeight, //  相机宽高比
        0.1,    //  进平面
        1000    //  远平面
    );

    //  创建渲染器
    const renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;

    //  创建物体
    const cube1 = new THREE.Mesh(
        new THREE.SphereGeometry(1, 20, 20),
        new THREE.MeshStandardMaterial()
    )  
    cube1.castShadow = true; 
    const cube2 = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial()
    )  
    cube2.receiveShadow = true;
    cube2.position.set(0, -1, 0);
    cube2.rotation.x = -Math.PI / 2;

    const cube3 = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 20, 20),
        new THREE.MeshBasicMaterial({
            color: 0xff0000,
        })
    )  
    cube3.position.set(2, 2, 2);

    //  灯光阴影
    //  1、材质要满足能对灯光有反应
    //  2、设置渲染器开启阴影的计算 renderer.shadowMap.enabled = true
    //  3、设置光照投射阴影 directionalLight.castShadow = true
    //  4、设置物体投影阴影 cube.castShadow = true
    //  5、设置平面物体（地面）接受阴影 cube2.receiveShadow = true

    //  环境光
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);
    //  直线光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;

    //  聚光灯
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(5, 5, 5);
    spotLight.castShadow = true;
    spotLight.shadow.radius = 20;   //  阴影模糊度
    spotLight.shadow.mapSize.set(2048, 2048);   //阴影模糊度像素
    spotLight.target = cube1;   //  目标物体
    spotLight.angle = Math.PI / 6;  //  光源角度
    spotLight.distance = 20;    //  距离
    spotLight.intensity = 2;    //  亮度
    spotLight.decay = 0;    //  亮度衰减程度
    spotLight.shadow.camera.near = 0.5;
    spotLight.shadow.camera.far = 500;
    spotLight.shadow.camera.fov = 30;

    //  点光源
    const pointLight = new THREE.PointLight(0xff0000, 1);
    // pointLight.position.set(5, 5, 5);
    pointLight.castShadow = true;
    pointLight.shadow.radius = 20;   //  阴影模糊度
    pointLight.shadow.mapSize.set(2048, 2048);   //阴影模糊度像素
    pointLight.decay = 0;
    cube3.add(pointLight); 

    //  设置时钟
    const clock = new THREE.Clock();

    //  设置阴影贴图模糊度
    directionalLight.shadow.radius = 20;
    //  设置阴影贴图的分辨率
    directionalLight.shadow.mapSize.set(2048, 2048);
    //  设置平行光投射相机的属性
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;


    //  添加世界坐标辅助器  红色X轴 绿色Y轴  蓝色Z轴
    const axesHelper = new THREE.AxesHelper(5);

    //  添加轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);

    //  创建gui
    const gui = new GUI();

    useEffect(() => {
        renderer.setSize(window.innerWidth, window.innerHeight);  //  设置屏幕的宽高
        document.body.appendChild(renderer.domElement);

        // 将网格添加到场景中
        scene.add(cube1);
        scene.add(cube2);
        scene.add(cube3);
       
        // scene.add(pointLight);
        // scene.add(directionalLight);

        // 设置相机位置
        camera.position.z = 15;
        camera.position.y = 2;
        camera.position.x = 2;
        camera.lookAt(0, 0, 0);

        scene.add(axesHelper);

        //  添加带阻尼的惯性
        controls.enableDamping = true;
        //  设置阻尼系数
        controls.dampingFactor = 0.05;

        //  渲染
        function animate() {
            let time = clock.getElapsedTime()
            cube3.position.x = Math.sin(time) * 3;
            cube3.position.z = Math.cos(time) * 3;
            cube3.position.y = 2 +  Math.sin(time *10) / 2;
            controls.update();
            requestAnimationFrame(animate);
            //  旋转
            // cube.rotation.x += 0.01;
            // cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
        animate();

        // gui.add(directionalLight.shadow, 'mapSize')

        window.addEventListener('resize', function () {
            renderer.setSize(window.innerWidth, window.innerHeight);    //  重置渲染器宽高
            camera.aspect = window.innerWidth / window.innerHeight  //  重置相机宽高比
            camera.updateProjectionMatrix() //  更新相机投影矩阵
        });
       
    }, [])

    return (
        <div>
            <div className='three'>

            </div>
        </div>
    )
}

export default THREETEST



function getDomFromPage(nodeName) {
    return new Promise((res) => {
        let node = null;
        let timer = setInterval(() => {
            if (node) {
                clearInterval(timer);
                res(node);
            } else {
                node = document.body.getElementsByClassName(nodeName);
            }
        }, 50);
    })
}