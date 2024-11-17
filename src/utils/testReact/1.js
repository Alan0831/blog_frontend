class Update {  //payload数据（元素）
    constructor(payload, nextUpdate) {
        this.payload = payload;
        this.nextUpdate = nextUpdate;   // 指向下一个节点的指针
    }
}

class UpdateQueue {
    constructor() {
        this.baseState = null;  // 保存第一个节点的payload  原状态
        this.firstUpdate = null; // 第一个更新
        this.lastUpdate = null; // 最后一个更新
    }
    enqueueUpdate(update) {
        if(this.firstUpdate === null) {
            this.firstUpdate = this.lastUpdate = update;
        } else {
            this.lastUpdate.nextUpdate = update;
            this.lastUpdate = update;
        }
    }
    //  获取老状态，然后遍历链表进行更新
    forceUpdate() {
        let currentState = this.baseState || {};
        let currentUpdate = this.firstUpdate;
        while(currentUpdate) {
            const nextState = typeof currentUpdate.payload === 'function' ? currentUpdate.payload(currentState) : currentUpdate.payload;
            currentState = {...currentState, ...nextState};
            currentUpdate = currentUpdate.nextUpdate;
        }
        this.firstUpdate = this.lastUpdate = null;
        this.baseState = currentState;
        return currentState;
    }
}
// 计数器 {number:0} setState({number:1}) setState((state)=>({number:state.number+1}))
// 1. 创建一个队列
const queue = new UpdateQueue();
queue.enqueueUpdate(new Update({ name: 'alan' }));
queue.enqueueUpdate(new Update({ number: 0 }));
queue.enqueueUpdate(new Update((state)=>({number:state.number+1})));
queue.enqueueUpdate(new Update((state)=>({number:state.number+1})));
queue.forceUpdate();

console.log(queue.baseState)