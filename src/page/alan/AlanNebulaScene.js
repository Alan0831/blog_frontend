import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './AlanNebulaScene.less';

function AlanNebulaScene() {
  const sceneRef = useRef(null);

  useEffect(() => {
    const mountNode = sceneRef.current;
    if (!mountNode) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    mountNode.appendChild(renderer.domElement);

    const resizeRenderer = () => {
      const { clientWidth, clientHeight } = mountNode;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };

    // 用点阵模拟二次元星尘，轻量且适合当作固定背景。
    const particleCount = 320;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const teal = new THREE.Color('#2d7f8c');
    const rose = new THREE.Color('#c96c84');
    const pearl = new THREE.Color('#f2fbff');

    for (let index = 0; index < particleCount; index += 1) {
      const stride = index * 3;
      const radius = 2.2 + Math.random() * 4.8;
      const angle = Math.random() * Math.PI * 2;
      positions[stride] = Math.cos(angle) * radius;
      positions[stride + 1] = (Math.random() - 0.5) * 6;
      positions[stride + 2] = Math.sin(angle) * radius - Math.random() * 3;

      const mixedColor = pearl.clone().lerp(index % 3 === 0 ? rose : teal, Math.random() * 0.74);
      colors[stride] = mixedColor.r;
      colors[stride + 1] = mixedColor.g;
      colors[stride + 2] = mixedColor.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 环形轨道给页面一点“异世界终端”的视觉锚点。
    const orbitGroup = new THREE.Group();
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: '#6aa6ad',
      transparent: true,
      opacity: 0.17,
      wireframe: true,
    });

    [2.3, 3.1, 3.9].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.012, 8, 96),
        orbitMaterial.clone(),
      );
      ring.rotation.x = Math.PI / 2.25 + index * 0.12;
      ring.rotation.y = index * 0.45;
      orbitGroup.add(ring);
    });
    orbitGroup.position.set(2.6, -0.6, -1.6);
    scene.add(orbitGroup);

    resizeRenderer();

    let animationFrame = 0;
    const clock = new THREE.Clock();

    const renderScene = () => {
      const elapsed = clock.getElapsedTime();
      particles.rotation.y = elapsed * 0.035;
      particles.rotation.x = Math.sin(elapsed * 0.28) * 0.05;
      orbitGroup.rotation.z = elapsed * 0.12;
      orbitGroup.rotation.x = Math.sin(elapsed * 0.2) * 0.12;
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(renderScene);
    };

    window.addEventListener('resize', resizeRenderer);
    renderScene();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeRenderer);
      scene.remove(particles);
      scene.remove(orbitGroup);
      particleGeometry.dispose();
      particleMaterial.dispose();
      orbitGroup.children.forEach((child) => {
        child.geometry.dispose();
        child.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className='alan-nebula-scene' ref={sceneRef} aria-hidden='true' />;
}

export default React.memo(AlanNebulaScene);
