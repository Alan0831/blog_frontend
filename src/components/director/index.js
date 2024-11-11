import React, { useState, useEffect } from 'react';
import { List, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { request } from '../../utils/request';
import './index.less'

/**
 * 文章导航
*/
function Director(props) {
    const { articleList } = props;

    const [directorList, setDirectorList] = useState([]);

    useEffect(() => {
        getDirector(articleList);
    }, [articleList]);

    //  生成导航
    const getDirector = (list) => {
        let directorList = [];
        let article_ul = document.querySelectorAll('ol');
        if (article_ul.length > 0) {
            Array.from(article_ul).map((item, index) => {
                Array.from(item.childNodes).map((_item, _index) => {
                    let id = `${index}_${_index}`
                    _item.id = id;
                    directorList.push({value: _item.innerText, id});
                });
            });
            setDirectorList(directorList);
        }
    };

    const clickDirector = (item) => {
        let node = document.getElementById(item.id);
        node.scrollIntoView({behavior: 'smooth',block: 'center'});
    }

    return (
        <Card style={{ margin: '16px auto' }}>
            <div className='director-card'>
                <p className='director-title'>目录</p>
                <div className='director-list'>
                    {
                        directorList.map((item) => (
                            <a onClick={() => clickDirector(item)} key={item.id}>{item.value}</a>
                        ))
                    }
                </div>
            </div>
        </Card>
    )
}

export default Director
