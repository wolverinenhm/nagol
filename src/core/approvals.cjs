const {id}=require('./store.cjs');
class Approvals {
  constructor(onChange=()=>{}) {this.pending=new Map();this.onChange=onChange;}
  ask(action,signal) {if(signal?.aborted)return Promise.reject(Error('Task cancelled.'));
    return new Promise((resolve,reject)=>{const key=id();const timer=setTimeout(()=>finish(false,'Approval expired.'),300000);
      const abort=()=>finish(false,'Task cancelled.');
      const finish=(allow,reason)=>{if(!this.pending.has(key))return;clearTimeout(timer);signal?.removeEventListener('abort',abort);this.pending.delete(key);this.onChange();allow?resolve(true):reject(Error(reason||'Action denied by user.'));};
      this.pending.set(key,{id:key,action:structuredClone(action),finish});signal?.addEventListener('abort',abort,{once:true});this.onChange();
    });
  }
  decide(key,allow) {const p=this.pending.get(key);if(!p)throw Error('This approval has expired or was already used.');p.finish(allow===true);}
  list() {return [...this.pending.values()].map(({id,action})=>({id,action}));}
  clear(){for(const p of [...this.pending.values()])p.finish(false,'Application closing.');}
}
module.exports={Approvals};
