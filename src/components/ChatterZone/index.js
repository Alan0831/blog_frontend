import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Empty, Input, Pagination } from 'antd';
import AlanCard from '../alanCard';
import MenuType from '../menuType';
import Recommend from '../Recommend';
import TagCard from '../TagCard';
import ChatterPostCard from '../ChatterPostCard';
import ChatterCodeCard from '../ChatterCodeCard';
import './index.less';

const ChatterNebulaScene = lazy(() => import('../ChatterNebulaScene'));

function ChatterZone(props) {
  const [showNebula, setShowNebula] = useState(false);
  const {
    topicTabs,
    activeTopic,
    activeMenuOptions,
    menuType,
    keyword,
    total,
    pageNum,
    userInfo,
    articleTotal,
    videoTotal,
    activeArticleList,
    activeVideoList,
    activeCodeList,
    recommendListData,
    activeTagList,
    searchedKeyword,
    loading,
    getSearchPlaceholder,
    onKeywordChange,
    onSearch,
    onClickTopic,
    onClickMenu,
    onChangePage,
    onBeforeOpenPost,
  } = props;

  useEffect(() => {
    // Three.js 仅用于装饰背景，正文和 LCP 图片稳定后再加载，避免阻塞首页内容。
    const timer = window.setTimeout(() => setShowNebula(true), 2800);
    return () => window.clearTimeout(timer);
  }, []);

  const currentList = menuType == 1
    ? activeArticleList
    : menuType == 2
      ? activeVideoList
      : activeCodeList;

  const getEmptyText = () => {
    if (searchedKeyword) return `没有搜索到“${searchedKeyword}”对应内容`;
    if (menuType == 3) return '这里还没有代码题目';
    return '这里还没有内容';
  };

  const renderList = () => {
    if (!loading && currentList.length === 0) {
      return (
        <div className='chatter-zone__empty'>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>{getEmptyText()}</span>}
          />
        </div>
      );
    }

    if (menuType == 3) {
      return activeCodeList.map((item, index) => (
        <ChatterCodeCard
          codeInfo={item}
          index={index}
          onBeforeOpenPost={onBeforeOpenPost}
          key={item.id}
        />
      ));
    }

    return currentList.map((item, index) => (
      <ChatterPostCard
        post={item}
        type={menuType == 1 ? 'article' : 'video'}
        userInfo={userInfo}
        index={index}
        onBeforeOpenPost={onBeforeOpenPost}
        key={item.id}
      />
    ));
  };

  return (
    <section className={`chatter-zone ${menuType == 3 ? 'is-code-mode' : ''}`}>
      {showNebula ? (
        <Suspense fallback={null}>
          <ChatterNebulaScene />
        </Suspense>
      ) : null}
      <div className='chatter-zone__veil' />
      <div className='chatter-zone__inner'>
        <aside className='chatter-zone__left'>
          <AlanCard articleTotal={articleTotal} videoTotal={videoTotal} />
          <div className='chatter-zone__search'>
            <Input
              placeholder={getSearchPlaceholder()}
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              onPressEnter={onSearch}
            />
          </div>
          <MenuType clickMenu={onClickMenu} activeType={menuType} options={activeMenuOptions} />
        </aside>

        <main className='chatter-zone__main'>
          <div className='chatter-zone__hero'>
            <div className='chatter-zone__hero-copy'>
              <span className='chatter-zone__label'>Signal Club</span>
              <h1>灵感电波站</h1>
            </div>
            <div className='chatter-zone__topic-tabs' role='tablist' aria-label='内容分区'>
              {topicTabs.map(item => (
                <button
                  type='button'
                  role='tab'
                  aria-selected={activeTopic === item.key}
                  className={`chatter-zone__topic-tab ${activeTopic === item.key ? 'is-active' : ''}`}
                  key={item.key}
                  onClick={() => onClickTopic(item.key)}
                >
                  <span>{item.title}</span>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </div>
          <div className='chatter-zone__list'>{renderList()}</div>
          <div className='chatter-zone__pagination'>
            {total > 10 ? <Pagination current={pageNum} total={total} onChange={onChangePage} pageSize={10} /> : null}
          </div>
        </main>

        {menuType !== 3 ? (
          <aside className='chatter-zone__right'>
            <Recommend type={menuType == 1 ? 1 : 3} articleList={recommendListData} onBeforeOpenPost={onBeforeOpenPost} />
            <TagCard tagList={activeTagList} />
          </aside>
        ) : null}
      </div>
    </section>
  );
}

export default ChatterZone;
