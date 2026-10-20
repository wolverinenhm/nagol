const {BrowserWindow,session}=require('electron');
const {publicTarget}=require('./core/web.cjs');
// A separate Chromium session. The agent may navigate/read, never execute arbitrary JS,
// click buttons, submit forms, access cookies, or read password input values.
class ResearchBrowser {
  constructor(){this.window=null;this.session=session.fromPartition('persist:nagol-research');
    this.session.setPermissionRequestHandler((_wc,_permission,cb)=>cb(false));this.session.setPermissionCheckHandler(()=>false);
    this.session.on('will-download',e=>e.preventDefault());
    this.session.webRequest.onBeforeRequest((details,cb)=>{if(details.url==='about:blank')return cb({cancel:false});publicTarget(details.url).then(()=>cb({cancel:false})).catch(()=>cb({cancel:true}));});
  }
  async navigate(url,signal){await publicTarget(url);if(signal?.aborted)throw Error('Task cancelled.');
    if(!this.window||this.window.isDestroyed()) {this.window=new BrowserWindow({width:1100,height:800,title:'Nagol research browser',webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,session:this.session}});this.window.setMenuBarVisibility(false);this.window.webContents.setWindowOpenHandler(()=>({action:'deny'}));this.window.on('closed',()=>this.window=null);}
    const w=this.window;w.show();const stop=()=>w.webContents.stop();signal?.addEventListener('abort',stop,{once:true});
    const timeout=setTimeout(stop,30000);
    try{await w.loadURL(url);if(signal?.aborted)throw Error('Task cancelled.');return {opened:w.webContents.getURL(),next:'Use browser_read to share page text with the model. Forms and purchases must be completed by you.'};}
    catch{throw Error('Browser navigation failed, timed out, or was cancelled. Check the URL.');}
    finally{clearTimeout(timeout);signal?.removeEventListener('abort',stop);}
  }
  url(){if(!this.window||this.window.isDestroyed())throw Error('Open a page in the research browser first.');return this.window.webContents.getURL();}
  async read(expectedURL){const w=this.window;if(!w||w.isDestroyed()||w.webContents.getURL()!==expectedURL)throw Error('The browser page changed. Request a fresh read approval.');
    const result=await w.webContents.executeJavaScript(`(()=>({url:location.href,title:document.title,text:(document.body?.innerText||'').slice(0,20000),links:Array.from(document.querySelectorAll('a[href]')).filter(a=>a.href.startsWith('https://')).slice(0,60).map(a=>({text:a.innerText.slice(0,150),url:a.href}))}))()`);
    if(result.url!==expectedURL||w.webContents.getURL()!==expectedURL)throw Error('The browser navigated during extraction. Request a fresh read approval.');return result;
  }
}
module.exports={ResearchBrowser};
