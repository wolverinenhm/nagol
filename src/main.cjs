const {app,BrowserWindow,ipcMain,dialog,safeStorage,Notification,Tray,Menu,nativeImage,shell,session}=require('electron');
const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');
const {Store,id}=require('./core/store.cjs');const {text,task,workspacePath}=require('./core/validation.cjs');
const providers=require('./core/providers.cjs');const {Approvals}=require('./core/approvals.cjs');const {ToolRunner,listFiles}=require('./core/tools.cjs');const {Agent}=require('./core/agent.cjs');const {tick,calendar}=require('./core/scheduler.cjs');const {MCP,connectorConfig}=require('./core/connectors.cjs');
let win,tray,store,agent,approvals,workspace,quitting=false,timer;const taskRuns=new Set();
const ui=path.join(__dirname,'renderer','index.html');
function encrypt(key){if(!key)return '';if(!safeStorage.isEncryptionAvailable())throw Error('Windows credential encryption is unavailable. Keys will not be saved.');return safeStorage.encryptString(key).toString('base64');}
function decrypt(secret){if(!secret)return '';try{return safeStorage.decryptString(Buffer.from(secret,'base64'));}catch{throw Error('Cannot decrypt this key under the current Windows account. Re-enter it in Settings.');}}
function snapshot(){return {...store.public(),approvals:approvals.list(),running:[...agent.running.keys()],files:listFiles(workspace),workspace,version:app.getVersion()};}
function changed(){if(win&&!win.isDestroyed())win.webContents.send('nagol:change');}
function security(w){w.webContents.setWindowOpenHandler(()=>({action:'deny'}));w.webContents.on('will-navigate',e=>e.preventDefault());}
async function saveAs(name,content){const result=await dialog.showSaveDialog(win,{defaultPath:name});if(result.canceled)return {cancelled:true};fs.writeFileSync(result.filePath,content);return {saved:true};}
async function dispatch(command,a={}) {
  const d=store.data;
  switch(command) {
    case 'state':return snapshot();
    case 'chat.new': {const c={id:id(),title:text(a.title,'Chat title',80),messages:[]};d.chats.push(c);store.save();changed();return c.id;}
    case 'chat.delete': {if(a.id==='main')throw Error('Home chat cannot be deleted.');if(agent.running.has(a.id))throw Error('Stop this chat before deleting it.');d.chats=d.chats.filter(c=>c.id!==a.id);store.save();changed();return;}
    case 'chat.clear': {if(agent.running.has(a.id))throw Error('Stop this chat before clearing it.');const c=d.chats.find(c=>c.id===a.id);if(c)c.messages=[];store.save();changed();return;}
    case 'chat.send':return agent.run(a.id,text(a.message,'Message',30000),a.mode===true);
    case 'chat.stop':agent.stop(a.id);return;
    case 'approval':approvals.decide(a.id,a.allow===true);store.log('approval',a.allow?'User allowed one action.':'User denied an action.');changed();return;
    case 'settings':d.settings={...d.settings,name:text(a.name,'Assistant name',50),avatar:text(a.avatar,'Avatar',4),persona:text(a.persona,'Personality',2000),theme:a.theme==='light'?'light':'dark',onboarding:true};store.save();changed();return;
    case 'provider.save': {if(a.id&&!d.providers.some(p=>p.id===a.id))throw Error('Provider no longer exists.');const p=providers.config(a);const previous=d.providers.find(x=>x.id===a.id);p.id=previous?.id||id();p.secret=a.clearKey?'':a.key?encrypt(text(a.key,'API key',4000)):previous?.secret||'';d.providers=d.providers.filter(x=>x.id!==p.id);d.providers.push(p);store.save();changed();return p.id;}
    case 'provider.select':if(!d.providers.some(p=>p.id===a.id))throw Error('Provider not found.');d.settings.activeProvider=a.id;store.save();changed();return;
    case 'provider.delete':d.providers=d.providers.filter(p=>p.id!==a.id);if(d.settings.activeProvider===a.id)d.settings.activeProvider='';store.save();changed();return;
    case 'provider.test':case 'provider.models': {const p=d.providers.find(p=>p.id===a.id);if(!p)throw Error('Save the provider first.');if(command==='provider.models')return providers.models(p,decrypt(p.secret));await providers.generate(p,decrypt(p.secret),[{role:'system',content:'Respond briefly.'},{role:'user',content:'Reply with OK. Connection test, no user data.'}]);return 'Connection and text generation succeeded.';}
    case 'memory':if(typeof a.content!=='string'||a.content.length>10000)throw Error('Memory must be under 10,000 characters.');d.memory=a.content;store.save();changed();return;
    case 'goal.save': {const g={id:a.id||id(),title:text(a.title,'Goal title',200),plan:text(a.plan,'Plan',10000),done:!!a.done};d.goals=d.goals.filter(g=>g.id!==a.id);d.goals.push(g);store.save();changed();return;}
    case 'goal.toggle':{const g=d.goals.find(g=>g.id===a.id);if(g)g.done=!g.done;store.save();changed();return;}
    case 'goal.delete':d.goals=d.goals.filter(g=>g.id!==a.id);store.save();changed();return;
    case 'task.save':{const t={id:id(),...task(a)};if(a.prompt){t.prompt=text(a.prompt,'Automation prompt',10000);const p=d.providers.find(p=>p.id===d.settings.activeProvider);if(!p?.agent)throw Error('Select a provider with Agent mode enabled before scheduling AI work.');t.providerId=p.id;}d.tasks.push(t);store.save();changed();return;}
    case 'task.toggle':{const t=d.tasks.find(t=>t.id===a.id);if(t)t.enabled=!t.enabled;store.save();changed();return;}
    case 'task.delete':d.tasks=d.tasks.filter(t=>t.id!==a.id);store.save();changed();return;
    case 'calendar.export':return saveAs('nagol-calendar.ics',calendar(d.tasks.filter(t=>t.enabled)));
    case 'connector.save':{const c=connectorConfig(a);const old=d.connectors.find(x=>x.id===a.id);c.id=old?.id||id();c.secret=a.clearKey?'':a.key?encrypt(text(a.key,'Token',4000)):old?.secret||'';d.connectors=d.connectors.filter(x=>x.id!==c.id);d.connectors.push(c);store.save();changed();return c.id;}
    case 'connector.test':{const c=d.connectors.find(c=>c.id===a.id);if(!c)throw Error('Save connector first.');c.tools=await new MCP(c,decrypt(c.secret)).list();store.save();changed();return `Connected. Discovered ${c.tools.length} tools.`;}
    case 'connector.delete':d.connectors=d.connectors.filter(c=>c.id!==a.id);store.save();changed();return;
    case 'files.import':{const result=await dialog.showOpenDialog(win,{properties:['openFile','multiSelections'],filters:[{name:'Text and documents',extensions:['txt','md','csv','json','html','py','js','css','ics']}]});if(result.canceled)return;for(const file of result.filePaths){if(fs.statSync(file).size>100000)throw Error('Import limit is 100 KB per text file.');const base=path.basename(file);const target=workspacePath(workspace,base);if(fs.existsSync(target))throw Error(`A file named ${base} already exists. Rename it before importing.`);fs.copyFileSync(file,target,fs.constants.COPYFILE_EXCL);}changed();return;}
    case 'files.read':{const target=workspacePath(workspace,a.path);if(/\.(png|jpg)$/i.test(target))throw Error('Image files can be exported from the file list.');if(fs.statSync(target).size>200000)throw Error('File too large for the editor.');return fs.readFileSync(target,'utf8');}
    case 'files.save':{const target=workspacePath(workspace,a.path);if(typeof a.content!=='string'||a.content.length>200000)throw Error('Text exceeds the 200 KB editor limit.');if(!/\.(md|txt|html|csv|json|py|js|css|ics|svg)$/i.test(target))throw Error('Use a supported document extension.');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,a.content);changed();return;}
    case 'files.export':return saveAs(path.basename(a.path),fs.readFileSync(workspacePath(workspace,a.path)));
    case 'files.pdf':{const source=workspacePath(workspace,a.path);if(fs.statSync(source).size>200000)throw Error('File too large for PDF export.');const content=fs.readFileSync(source,'utf8');const escaped=content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');const isolated=session.fromPartition('nagol-pdf-'+id());isolated.webRequest.onBeforeRequest((details,cb)=>cb({cancel:!details.url.startsWith('data:')}));const p=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,javascript:false,session:isolated}});security(p);try{await p.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(`<meta charset="utf-8"><style>body{font:14px sans-serif;padding:32px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><pre>${escaped}</pre>`));return await saveAs(path.basename(a.path)+'.pdf',await p.webContents.printToPDF({printBackground:true}));}finally{p.destroy();}}
    case 'workspace.open':await shell.openPath(workspace);return;
    case 'backup':{const clean=store.public();delete clean.providers;delete clean.connectors;clean.settings.activeProvider='';return saveAs('nagol-backup.json',JSON.stringify(clean,null,2));}
    case 'chat.export':{const c=d.chats.find(c=>c.id===a.id);if(!c)throw Error('Chat not found.');return saveAs('nagol-chat.md',c.messages.map(m=>`## ${m.role}\n\n${m.content}`).join('\n\n'));}
    default:throw Error('Unknown application command.');
  }
}
if(!app.requestSingleInstanceLock())app.quit();
else {
  app.on('second-instance',()=>{win?.show();win?.focus();});
  app.whenReady().then(()=>{
    app.setAppUserModelId('org.nagol.desktop');store=new Store(app.getPath('userData'));workspace=path.join(app.getPath('userData'),'workspace');fs.mkdirSync(workspace,{recursive:true});
    approvals=new Approvals(changed);const {ResearchBrowser}=require('./browser.cjs');const tools=new ToolRunner({store,root:workspace,approvals,secret:decrypt,changed,browser:new ResearchBrowser()});agent=new Agent({store,tools,approvals,secret:decrypt,changed});
    win=new BrowserWindow({width:1320,height:880,minWidth:860,minHeight:620,title:'Nagol',backgroundColor:'#111318',webPreferences:{preload:path.join(__dirname,'preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false}});security(win);win.setMenuBarVisibility(false);
    session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));session.defaultSession.setPermissionCheckHandler(()=>false);
    ipcMain.handle('nagol:invoke',async(event,command,args)=>{if(event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame||event.senderFrame.url!==pathToFileURL(ui).href)throw Error('Untrusted IPC sender.');try{return {ok:true,value:await dispatch(command,args)};}catch(e){return {ok:false,error:e.message||'Operation failed.'};}});
    win.loadFile(ui);win.on('close',e=>{if(!quitting&&tray){e.preventDefault();win.hide();}});
    const icon=path.join(__dirname,'renderer','icon.png');if(fs.existsSync(icon)){tray=new Tray(nativeImage.createFromPath(icon));tray.setToolTip('Nagol — local AI workspace');tray.setContextMenu(Menu.buildFromTemplate([{label:'Open Nagol',click:()=>win.show()},{label:'Quit',click:()=>{quitting=true;app.quit();}}]));tray.on('double-click',()=>win.show());}
    timer=setInterval(()=>{const due=tick(store.data.tasks);if(!due.length)return;store.save();for(const t of due){store.log('reminder',t.title);if(Notification.isSupported()){const n=new Notification({title:'Nagol reminder',body:t.title});n.on('click',()=>win.show());n.show();}if(t.prompt){if(taskRuns.has(t.id)){store.log('schedule','Skipped overlapping task: '+t.title);continue;}taskRuns.add(t.id);const c={id:id(),title:'Scheduled: '+t.title,messages:[]};store.data.chats.push(c);store.save();agent.run(c.id,t.prompt,true,t.providerId).catch(e=>store.log('schedule','Scheduled task stopped: '+e.message.slice(0,200))).finally(()=>{taskRuns.delete(t.id);changed();});}}changed();},15000);
  }).catch(e=>{dialog.showErrorBox('Nagol could not start',e.message);app.quit();});
}
app.on('before-quit',()=>{quitting=true;clearInterval(timer);approvals?.clear();for(const key of agent?.running.keys()||[])agent.stop(key);});
app.on('window-all-closed',()=>{if(!tray)app.quit();});
