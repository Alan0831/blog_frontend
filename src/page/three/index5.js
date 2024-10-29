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

    //  创建三个球
    const cube1 = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0x00ff00,
        })
    )
    cube1.position.x = -4;

    const cube2 = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0x0000ff,
        })
    )

    const cube3 = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0xff00ff,
        })
    )
    cube3.position.x = 4;

    //  创建射线
    const raycaster = new THREE.Raycaster();
    //  创建鼠标向量
    const mouse = new THREE.Vector2();

    
    

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

        window.addEventListener('resize', function () {
            renderer.setSize(window.innerWidth, window.innerHeight);    //  重置渲染器宽高
            camera.aspect = window.innerWidth / window.innerHeight  //  重置相机宽高比
            camera.updateProjectionMatrix() //  更新相机投影矩阵
        });
        window.addEventListener('click', (event) => {
            //  设置鼠标向量的x,y值
            mouse.x = (event.x / window.innerWidth) * 2 - 1;
            mouse.y = -(event.y / window.innerHeight) * 2 +  1;

            //  通过相机和鼠标更新射线
            raycaster.setFromCamera(mouse, camera);
            //  计算物体和射线的焦点
            const intersects = raycaster.intersectObjects([cube1, cube2, cube3]);
            if (intersects.length > 0) {
                if (intersects[0].object._isSelect) {
                    intersects[0].object.material.color.set(intersects[0].object._originalColor);
                    intersects[0].object._isSelect = false;
                    return;
                }
                intersects[0].object._isSelect = true;
                intersects[0].object._originalColor = intersects[0].object.material.color.getHex();   
                intersects[0].object.material.color.set(0xff0000)
            }
        })
    }, [])

    return (
        <div>
            <div className='three'>

            </div>
        </div>
    )
}

export default THREETEST
