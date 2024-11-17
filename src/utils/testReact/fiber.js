//  从顶点开始遍历，如果有儿子，先遍历大儿子
let rootFiber = require('./element.js');
let nextUnitOfWork = null; // 下一个要处理的fiber
function workLoop(deadline) {
    while((deadline.timeRemaining() > 1 || deadline.didTimeout) && nextUnitOfWork) { // 如果有待执行的执行单元，则执行，然后返回下一个执行单元
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
    if(!nextUnitOfWork) {
        console.log('render结束')
    } else {
        requestIdleCallback(workLoop, {timeout: 1000});
    }
}
function performUnitOfWork(fiber) {
    beginWork(fiber);   //  处理此fiber
    if(fiber.child) {   //  有儿子则返回儿子
        return fiber.child;
    }
    while(fiber) {
        completeUnitOfWork(fiber);
        if(fiber.sibling) { 
            return fiber.sibling;
        }
        fiber = fiber.return;
    }
}
function beginWork(fiber) {
    console.log(fiber.key);
}
function completeUnitOfWork(fiber) {
    console.log('complete', fiber.key);
}
nextUnitOfWork = rootFiber;
window.requestIdleCallback(workLoop, {timeout: 1000});

