import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card } from 'antd';
import { UpOutlined } from '@ant-design/icons';
import './index.less';

function Director({ headings = [] }) {
    const [activeId, setActiveId] = useState(headings[0]?.id || '');
    const [collapsed, setCollapsed] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);

    const visibleHeadings = useMemo(() => headings.filter(item => item?.id && item?.value), [headings]);

    useEffect(() => {
        setActiveId(visibleHeadings[0]?.id || '');
    }, [visibleHeadings]);

    useEffect(() => {
        if (!visibleHeadings.length) return undefined;

        const headingElements = visibleHeadings
            .map(item => document.getElementById(item.id))
            .filter(Boolean);

        const observer = new IntersectionObserver((entries) => {
            const activeEntry = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

            if (activeEntry?.target?.id) {
                setActiveId(activeEntry.target.id);
            }
        }, {
            rootMargin: '-18% 0px -68% 0px',
            threshold: [0, 1],
        });

        headingElements.forEach(node => observer.observe(node));

        return () => observer.disconnect();
    }, [visibleHeadings]);

    useEffect(() => {
        let frameId = 0;

        const updateProgress = () => {
            window.cancelAnimationFrame(frameId);
            frameId = window.requestAnimationFrame(() => {
                const page = document.documentElement;
                const scrollable = page.scrollHeight - window.innerHeight;
                const progress = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 0;
                setReadingProgress(Math.min(100, Math.max(0, progress)));
            });
        };

        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.removeEventListener('scroll', updateProgress);
            window.removeEventListener('resize', updateProgress);
        };
    }, []);

    const clickDirector = (event, item) => {
        event.preventDefault();
        const node = document.getElementById(item.id);
        setActiveId(item.id);
        node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const backToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!visibleHeadings.length) return null;

    return (
        <Card className='director-shell' bodyStyle={{ padding: 0 }}>
            <div className={`director-card ${collapsed ? 'is-collapsed' : ''}`}>
                <div className='director-head'>
                    <div>
                        <p className='director-title'>目录</p>
                        <span>{visibleHeadings.length} 个小节</span>
                    </div>
                    <button
                        type='button'
                        className='director-toggle'
                        aria-expanded={!collapsed}
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? '展开' : '收起'}
                    </button>
                </div>

                <div className='director-progress' aria-hidden='true'>
                    <span style={{ width: `${readingProgress}%` }} />
                </div>

                {!collapsed ? (
                    <>
                        <div className='director-list'>
                            {visibleHeadings.map(item => (
                                <a
                                    href={`#${item.id}`}
                                    onClick={event => clickDirector(event, item)}
                                    key={item.id}
                                    title={item.value}
                                    className={`director-item director-level-${item.level} ${activeId === item.id ? 'is-active' : ''}`}
                                >
                                    <span className='director-dot' />
                                    <span className='director-text'>{item.value}</span>
                                </a>
                            ))}
                        </div>

                        <div className='director-actions'>
                            <Button type='text' size='small' icon={<UpOutlined />} onClick={backToTop}>
                                回到顶部
                            </Button>
                            <span>{readingProgress}%</span>
                        </div>
                    </>
                ) : null}
            </div>
        </Card>
    );
}

export default Director;
