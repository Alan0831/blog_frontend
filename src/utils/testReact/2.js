//  fiber之前的代码是这样的，这种是递归调用，执行栈越来越深，且不能中断
let root = {
    key: 'A1',
    children: [
        {
            key: 'B1',
            children: [
                {
                    key: 'C1',
                    children: []
                },
                {
                    key: 'C2',
                    children: []
                }
            ]
        },
        {
            key: 'B2',
            children: []
        }
    ]
}

function walk(vdom) {
    doWalk(vdom);
    vdom.children.forEach(child => {
        walk(child);
    });
}
function doWalk(vdom) {
    console.log(vdom.key);
}
walk(root);  
