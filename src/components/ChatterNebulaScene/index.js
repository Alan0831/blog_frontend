import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './index.less';

function ChatterNebulaScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0, 13);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      // 本地开发需要读取 canvas 像素做渲染检查，生产环境保持默认缓冲策略以减少显存压力。
      preserveDrawingBuffer: process.env.NODE_ENV !== 'production',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setClearColor(0x000000, 0);
    mountNode.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    const mouse = new THREE.Vector2(0, 0);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 用点云做二次元星尘背景，顶点色能保持酷感但不依赖额外贴图资源。
    const particleCount = 420;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [
      new THREE.Color('#f2a4b8'),
      new THREE.Color('#7bd7d2'),
      new THREE.Color('#f7ead4'),
      new THREE.Color('#244a57'),
    ];

    for (let index = 0; index < particleCount; index += 1) {
      const radius = 3.5 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 7.2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = height;
      positions[index * 3 + 2] = Math.sin(angle) * radius - 2;

      const color = palette[index % palette.length];
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        size: 0.055,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        depthWrite: false,
      })
    );
    scene.add(particles);

    // 中心晶体和光环是杂谈页的视觉锚点，统一放进 group 方便整体旋转和视差。
    const coreGroup = new THREE.Group();
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: '#f2a4b8',
      roughness: 0.38,
      metalness: 0.28,
      transparent: true,
      opacity: 0.92,
    });
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: '#7bd7d2',
      roughness: 0.2,
      metalness: 0.12,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });

    const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), coreMaterial);
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.018, 12, 96), glassMaterial);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.012, 12, 120), glassMaterial);
    const ribbon = new THREE.Mesh(new THREE.TorusKnotGeometry(1.75, 0.018, 140, 8, 2, 5), glassMaterial);
    ringA.rotation.x = Math.PI / 2.55;
    ringB.rotation.y = Math.PI / 2.2;
    ribbon.rotation.x = Math.PI / 2.8;
    coreGroup.add(crystal, ringA, ringB, ribbon);
    coreGroup.position.set(3.2, -0.2, -0.4);
    scene.add(coreGroup);

    const ambient = new THREE.AmbientLight('#ffffff', 1.25);
    const keyLight = new THREE.PointLight('#f2a4b8', 3.2, 18);
    const fillLight = new THREE.PointLight('#7bd7d2', 2.2, 16);
    keyLight.position.set(4, 3, 5);
    fillLight.position.set(-5, -2, 4);
    scene.add(ambient, keyLight, fillLight);

    const resizeScene = () => {
      const { clientWidth, clientHeight } = mountNode;
      const width = Math.max(clientWidth, 1);
      const height = Math.max(clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const handlePointerMove = (event) => {
      const rect = mountNode.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.y = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    let frameId = 0;
    const renderScene = () => {
      const elapsed = clock.getElapsedTime();
      const motionScale = reduceMotion ? 0.12 : 1;

      particles.rotation.y = elapsed * 0.045 * motionScale;
      particles.rotation.x = Math.sin(elapsed * 0.22) * 0.05 * motionScale;
      coreGroup.rotation.y = elapsed * 0.34 * motionScale + mouse.x * 0.12;
      coreGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.18 * motionScale + mouse.y * 0.08;
      ribbon.rotation.z = elapsed * 0.42 * motionScale;
      camera.position.x += (mouse.x * 0.32 - camera.position.x) * 0.035;
      camera.position.y += (mouse.y * 0.22 - camera.position.y) * 0.035;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderScene);
    };

    resizeScene();
    window.addEventListener('resize', resizeScene);
    window.addEventListener('pointermove', handlePointerMove);
    renderScene();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resizeScene);
      window.removeEventListener('pointermove', handlePointerMove);
      particleGeometry.dispose();
      coreGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className='chatter-nebula-scene' ref={mountRef} aria-hidden='true' />;
}

export default React.memo(ChatterNebulaScene);
