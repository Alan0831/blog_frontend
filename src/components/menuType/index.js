import React from 'react'
import './index.less';
export const defaultMenuTypes = [
    {title: '文章', description: '文章笔记，记录生活', color: '#18c0ff', menuType: 1},
    {title: '视频', description: '视频分享，感受自我', color: '#ff6b36', menuType: 2},
    {title: '代码', description: '挑战算法，更上一层', color: '#1fe236', menuType: 3},
]
/**
 * 菜单类型
*/
function MenuType(props) {
    const menuType = props.options || defaultMenuTypes;
    return (
        <div className='menuType'>
            {
                menuType.map((item) => 
                    <div
                        className={`menu-type-card-content ${props.activeType === item.menuType ? 'is-active' : ''}`}
                        key={item.menuType}
                        onClick={() => props.clickMenu(item.menuType)}
                        style={{backgroundColor: item.color}}
                    >
                        <div className='menu-type-card-content-title'>{item.title}</div>
                        <div className='menu-type-card-content-description'>{item.description}</div>
                    </div>)
            }
        </div>
    )
}

export default React.memo(MenuType)
