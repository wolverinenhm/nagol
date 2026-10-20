const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const defaults = () => ({version:1, settings:{name:'Nagol', persona:'Be practical, warm and concise.', avatar:'N', theme:'dark', activeProvider:'', onboarding:false}, providers:[], connectors:[], chats:[{id:'main',title:'Home',messages:[]}], memory:'', goals:[], tasks:[], activity:[]});
const id = () => crypto.randomUUID();
class Store {
  constructor(root) {
    this.root=root; fs.mkdirSync(root,{recursive:true}); this.file=path.join(root,'state.json');
    this.data=defaults();
    if(fs.existsSync(this.file)) {
      try { const data=JSON.parse(fs.readFileSync(this.file,'utf8')); if(data.version!==1 || !Array.isArray(data.chats)) throw Error(); this.data={...this.data,...data}; }
      catch { throw new Error('Local data could not be read. Restore state.json from a backup; the original has not been overwritten.'); }
    }
  }
  save() { const temp=this.file+'.tmp'; fs.writeFileSync(temp,JSON.stringify(this.data,null,2),{mode:0o600}); fs.renameSync(temp,this.file); }
  log(type,message) { this.data.activity.unshift({id:id(),at:new Date().toISOString(),type,message}); this.data.activity=this.data.activity.slice(0,1000); this.save(); }
  public() { const d=structuredClone(this.data); d.providers=d.providers.map(({secret,...p})=>({...p,hasKey:!!secret})); d.connectors=d.connectors.map(({secret,...p})=>({...p,hasKey:!!secret})); return d; }
}
module.exports={Store,defaults,id};
