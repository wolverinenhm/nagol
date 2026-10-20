// Run the real main process, sandboxed preload and renderer with isolated test data.
// The loopback fixture never uses credentials or external AI services.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'nagol-desktop-smoke-'));
app.setPath('userData',root);
const errors=[];
let finished=false;
const deadline=setTimeout(()=>finish(new Error('Desktop smoke test timed out. '+errors.join(' | '))),30000);
function finish(error){if(finished)return;finished=true;clearTimeout(deadline);server.close();if(error)console.error('DESKTOP FAIL:',error.message,errors);else console.log('DESKTOP PASS: startup, settings navigation, provider save, discovery, test, selection, and persistence.');app.exit(error?1:0);}
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');req.resume();req.on('end',()=>{if(req.url==='/api/tags')res.end(JSON.stringify({models:[{name:'smoke-local'}]}));else if(req.url==='/api/show')res.end('{}');else if(req.url==='/api/chat')res.end(JSON.stringify({message:{content:'OK'}}));else{res.statusCode=404;res.end('{}');}});});
server.listen(0,'127.0.0.1',()=>{
 app.on('browser-window-created',(_event,window)=>{
  window.webContents.on('preload-error',(_e,_file,error)=>errors.push('Preload: '+error.message));
  window.webContents.on('console-message',(_e,level,message)=>{if(typeof level==='object'){if(level.level==='error')errors.push(level.message);}else if(level>=3)errors.push(message);});
  window.webContents.once('did-finish-load',async()=>{
   try{
    const endpoint='http://127.0.0.1:'+server.address().port;
    const result=await window.webContents.executeJavaScript(`(async()=>{
      const wait=async(check,label)=>{const end=Date.now()+6000;while(!check()){if(Date.now()>end)throw Error(label+'; visible notice: '+document.querySelector('#notice')?.textContent);await new Promise(r=>setTimeout(r,25));}};
      await wait(()=>document.querySelector('#chat-form'),'Startup did not render');
      document.querySelector('#provider-badge').click();
      await wait(()=>document.querySelector('#provider-form'),'Setup button did not open settings');
      document.querySelector('#provider-name').value='Desktop smoke fixture';
      document.querySelector('#provider-base').value=${JSON.stringify(endpoint)};
      document.querySelector('#provider-model').value='smoke-local';
      document.querySelector('#provider-form').requestSubmit();
      await wait(()=>document.querySelector('[data-action="provider.test"]'),'Connection did not save');
      document.querySelector('[data-action="provider.models"]').click();
      await wait(()=>document.querySelector('#models option'),'Model discovery failed');
      document.querySelector('[data-action="provider.test"]').click();
      await wait(()=>document.querySelector('#notice').textContent.includes('generation succeeded'),'Connection test failed');
      document.querySelector('[data-action="provider.select"]').click();
      await wait(()=>document.querySelector('#confirm-dialog').open,'Provider confirmation did not open');
      document.querySelector('#confirm-yes').click();
      await wait(()=>document.querySelector('#provider-badge').textContent.includes('Desktop smoke fixture'),'Selection did not persist');
      document.querySelector('[data-page="chat"]').click();
      await wait(()=>document.querySelector('#chat-form'),'Return to chat failed');
      document.querySelector('[data-page="settings"]').click();
      await wait(()=>document.querySelector('#provider-form'),'Sidebar settings failed');
      return true;
    })()`);
    if(!result)throw Error('Renderer checks did not finish');
    const saved=JSON.parse(fs.readFileSync(path.join(root,'state.json'),'utf8'));
    if(saved.providers.length!==1||saved.settings.activeProvider!==saved.providers[0].id)throw Error('Provider persistence mismatch');
    finish();
   }catch(error){finish(error);}
  });
 });
 require('../src/main.cjs');
});
