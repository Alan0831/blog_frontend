import React from 'react';
import './index.less';

// 路由代码下载期间立即展示页面骨架，避免懒加载时出现整页白屏。
export default function PageLoading() {
  return (
    <main className="page-loading" aria-busy="true" aria-label="页面加载中">
      <div className="page-loading__header" />
      <div className="page-loading__layout">
        <aside className="page-loading__aside">
          <span />
          <span />
          <span />
        </aside>
        <section className="page-loading__content">
          {[0, 1, 2].map(item => (
            <article className="page-loading__card" key={item}>
              <div className="page-loading__title" />
              <div className="page-loading__line" />
              <div className="page-loading__line page-loading__line--short" />
            </article>
          ))}
        </section>
      </div>
      <span className="page-loading__text">页面加载中，请稍候</span>
    </main>
  );
}
