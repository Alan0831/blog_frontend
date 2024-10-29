import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
//  导入gltf加载器
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
//  导入draco解码器
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

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

    //  创建几何体
    const geometry = new THREE.BoxGeometry(1, 1, 100);

    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
    });

    //  创建场景fog
    // scene.fog = new THREE.Fog(0x999999, 0.1, 50);
    scene.fog = new THREE.FogExp2(0x999999, 0.1);
    scene.background = new THREE.Color(0x999999);

    //  实例化gltf加载器
    const gltfLoader = new GLTFLoader();
    //  加载模型
    gltfLoader.load(
        '../../../public/bback.jpeg', 
        (gltf) => {
            scene.add(gltf.scene); 
        }
    )

    //  实例化draco解码器
    const dracoLoader = new DRACOLoader();
    //  设置draco路径  （先从node_module文件中复制到public文件）
    dracoLoader.setDecoderPath('./draco/')
    //  设置gltf加载器draco解码器
    gltfLoader.setDRACOLoader(dracoLoader);

    const cube = new THREE.Mesh(geometry, material);

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
        scene.add(cube);

        // 设置相机位置
        camera.position.z = 5;
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
            controls.update();
            requestAnimationFrame(animate);
            //  旋转
            // cube.rotation.x += 0.01;
            // cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
        animate();

        let objEvent = {
            fullScreen: function () {
                document.body.requestFullscreen();  //  全屏
            },
            exitFullScreen: function () {
                document.exitFullscreen(); //  退出全屏
            }
        }
        gui.add(objEvent, 'fullScreen').name('全屏');
        gui.add(objEvent, 'exitFullScreen').name('退出全屏');

        let folder = gui.addFolder('立方体位置');
        folder.add(cube.position, 'x', -5, 5).name('立方体x位置');   //  控制立方体的位置
        folder.add(cube.position, 'y').min(-5).max(5).step(0.1).name('立方体y位置');
        folder.add(cube.position, 'z').min(-5).max(5).step(0.1).name('立方体z位置');

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
