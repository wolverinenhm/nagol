const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('nagol',Object.freeze({
  invoke:async(command,args)=>{const r=await ipcRenderer.invoke('nagol:invoke',command,args);if(!r.ok)throw Error(r.error);return r.value;},
  onChange:callback=>{const listener=()=>callback();ipcRenderer.on('nagol:change',listener);return ()=>ipcRenderer.removeListener('nagol:change',listener);}
}));
