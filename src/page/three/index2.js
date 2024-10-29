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

    //  创建几何体
    const geometry = new THREE.BufferGeometry();

    const test = new THREE.BoxGeometry(1, 1, 1);
    // //  创建顶点位置,顶点是有顺序的，每三个为一个顶点，逆时针为正面
    // const vertices = new Float32Array([
    //     -1.0, -1.0, 0.0,
    //     1.0, -1.0, 0.0,
    //     1.0, 1.0, 0.0,
    //     1.0, 1.0, 0.0,
    //     -1.0, 1.0, 0.0,
    //     -1.0, -1.0, 0.0
    // ])
    // //  创建顶点属性
    // geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    //  使用索引来绘制
    const vertices = new Float32Array([
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0
    ])
    //  创建顶点属性
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    //  创建索引
    const indices = new Uint16Array([0, 1, 2, 2, 3, 0]);
    //  创建索引属性
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    //  设置两个索引组，设置两个材质
    geometry.addGroup(0, 3, 0);  //  第0个索引开始，3个索引，使用第0个材质
    geometry.addGroup(3, 3, 1); 

    // 创建材质  
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        // wireframe: true,
    });
    const material1 = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        // wireframe: true,
    });

    // 创建网格
    // const cube = new THREE.Mesh(geometry, material);
    const cube = new THREE.Mesh(geometry, [material, material1 ]);

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

        let colorParams = {
            cubeColor: '#ff0000'
        }
        gui.addColor(colorParams, 'cubeColor').name('立方体颜色')
            .onChange((val) => {
                cube.material.color.set(val);
            });

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
