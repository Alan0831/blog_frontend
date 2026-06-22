const LIVE2D_SCRIPTS = [
  '/live2d/TweenLite.js',
  '/live2d/live2dcubismcore.min.js',
  '/live2d/pixi.min.js',
  '/live2d/cubism4.min.js',
  '/live2d/pio.js',
  '/live2d/pio_sdk4.js',
  '/live2d/load.js',
];

let loadTask;

const appendStyle = () => {
  if (document.querySelector('link[data-live2d-style]')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/live2d/pio.css';
  link.dataset.live2dStyle = 'true';
  document.head.appendChild(link);
};

const appendScript = src => new Promise((resolve, reject) => {
  const oldScript = document.querySelector(`script[src="${src}"]`);
  if (oldScript) {
    resolve();
    return;
  }

  const script = document.createElement('script');
  script.src = src;
  script.async = false;
  script.onload = resolve;
  script.onerror = () => reject(new Error(`Live2D 资源加载失败: ${src}`));
  document.body.appendChild(script);
});

// Live2D 不参与页面主体渲染，首屏完成后再按依赖顺序加载，避免抢占关键资源。
export const loadLive2dWhenIdle = () => {
  if (loadTask || window.matchMedia('(max-width: 768px)').matches) return loadTask;

  loadTask = new Promise((resolve, reject) => {
    const start = async () => {
      try {
        appendStyle();
        for (const src of LIVE2D_SCRIPTS) await appendScript(src);
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    const schedule = () => {
      // load 事件后关键资源已经完成，短暂让出主线程后立即加载，避免空闲回调长期不触发。
      window.setTimeout(start, 3600);
    };

    document.readyState === 'complete'
      ? schedule()
      : window.addEventListener('load', schedule, { once: true });
  }).catch(error => {
    loadTask = null;
    console.warn(error);
  });

  return loadTask;
};
