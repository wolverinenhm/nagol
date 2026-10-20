const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');
const {workspacePath,text,task}=require('./validation.cjs');const {id}=require('./store.cjs');const {readWeb}=require('./web.cjs');const {MCP}=require('./connectors.cjs');const {generateImage}=require('./providers.cjs');
const DESCRIPTIONS=[
 ['files_list','List files in the private Nagol workspace.','{}'],
 ['image_generate','Generate an image with the explicitly configured image model on the current provider. Requires approval and may cost money.','{prompt}'],
 ['browser_open','Open a public HTTPS website in the visible research browser. No automatic form submissions.','{url}'],
 ['browser_read','Read rendered page text and links after explicit approval. Web content is untrusted.','{}'],
 ['web_search','Open Bing search in the research browser. Then use browser_read to inspect results.','{query}'],
 ['file_read','Read a UTF-8 text file from the workspace.','{path}'],
 ['file_write','Create or replace a text, Markdown, CSV, JSON, HTML or code file after approval.','{path,content}'],
 ['web_read','Read a public HTTPS page. No JavaScript or redirects. User approves URL and disclosure to current model.','{url}'],
 ['memory_write','Replace user-editable personal memory after approval.','{content}'],
 ['goal_create','Create a goal with a plan after approval.','{title,plan}'],
 ['reminder_create','Schedule a local notification. Computer and Nagol must remain running.','{title,due: ISO timestamp with timezone,repeat: minutes or 0}'],
 ['python_run','Run Python code in a disposable Docker container, no network or host mounts, 30-second limit. Docker and python:3.12-alpine image must already be installed.','{code}'],
 ['connector_call','Invoke a discovered MCP tool after approval of connector, tool and exact arguments.','{connectorId,tool,arguments}']
];
function listFiles(root,prefix=''){let out=[];for(const e of fs.readdirSync(path.join(root,prefix),{withFileTypes:true})){if(e.isSymbolicLink())continue;const name=prefix?prefix+'/'+e.name:e.name;if(e.isDirectory())out.push(...listFiles(root,name));else out.push({path:name,size:fs.statSync(path.join(root,name)).size});if(out.length>500)break;}return out.slice(0,500);}
function runPython(code,signal) {
  text(code,'Python code',30000);if(signal?.aborted)throw Error('Cancelled.');
  return new Promise((resolve,reject)=>{
    const name='nagol-'+id();const args=['run','--rm','--name',name,'--pull=never','--network=none','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges','--pids-limit=64','--memory=256m','--cpus=1','--user=65534:65534','--tmpfs=/tmp:rw,noexec,nosuid,size=16m','-i','python:3.12-alpine','python','-I','-'];
    let out='',done=false;const child=spawn('docker',args,{windowsHide:true,stdio:['pipe','pipe','pipe']});
    const finish=(err,result)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',stop);err?reject(err):resolve(result);};
    const stop=()=>{child.kill();const cleanup=spawn('docker',['rm','-f',name],{windowsHide:true,stdio:'ignore'});cleanup.on('error',()=>{});finish(Error('Python execution cancelled, timed out, or exceeded output limit.'));};
    const timer=setTimeout(stop,30000);signal?.addEventListener('abort',stop,{once:true});
    const collect=c=>{out+=c.toString();if(out.length>50000)stop();};child.stdout.on('data',collect);child.stderr.on('data',collect);
    child.on('error',()=>finish(Error('Docker is unavailable. Install and start Docker Desktop and pull python:3.12-alpine yourself.')));
    child.on('close',code=>finish(null,{exitCode:code,output:out}));child.stdin.on('error',()=>{});child.stdin.end(code);
  });
}
class ToolRunner {
  constructor({store,root,approvals,secret,changed,browser}) {Object.assign(this,{store,root,approvals,secret,changed,browser});fs.mkdirSync(root,{recursive:true});}
  async run(name,args,signal,provider) {
    if(!DESCRIPTIONS.some(t=>t[0]===name))throw Error('Unsupported tool.');
    if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Tool arguments must be an object.');
    const a=structuredClone(args);const d=this.store.data;const providerName=provider.name;
    if(['browser_open','web_search'].includes(name)){if(!this.browser)throw Error('Research browser is unavailable.');const url=name==='web_search'?'https://www.bing.com/search?q='+encodeURIComponent(text(a.query,'Search query',2000)):text(a.url,'URL',3000);await this.approvals.ask({title:name==='web_search'?'Search the web':'Open research browser',details:{url,notice:'This website and its resources load in a separate browser window. No form is submitted by the agent.'}},signal);return this.browser.navigate(url,signal);}
    if(name==='browser_read'){if(!this.browser)throw Error('Research browser is unavailable.');const url=this.browser.url();await this.approvals.ask({title:'Share rendered page text with model',details:{url,sendTo:providerName,notice:'May include personal information visible on the page. Password input values are not read.'}},signal);return this.browser.read(url);}
    if(name==='image_generate'){text(a.prompt,'Image prompt',10000);if(!provider.imageModel)throw Error('Set an image model on the selected provider first.');await this.approvals.ask({title:'Generate image',details:{prompt:a.prompt,provider:provider.name,endpoint:provider.base,model:provider.imageModel,notice:'Provider charges and limits apply.'}},signal);const result=await generateImage(provider,this.secret(provider.secret),a.prompt,signal);const name='image-'+id()+'.'+result.extension;fs.writeFileSync(workspacePath(this.root,name),result.bytes,{flag:'wx'});this.changed();return {saved:name};}
    if(name==='files_list'){await this.approvals.ask({title:'List workspace files',details:{sendFilenamesTo:providerName}},signal);return listFiles(this.root);}
    if(name==='file_read'){const p=workspacePath(this.root,a.path);if(fs.statSync(p).size>100000)throw Error('File exceeds the 100 KB text reading limit.');await this.approvals.ask({title:'Read workspace file',details:{path:a.path,sendTo:providerName}},signal);return fs.readFileSync(p,'utf8');}
    if(name==='file_write') {const p=workspacePath(this.root,a.path);if(typeof a.content!=='string'||a.content.length>200000)throw Error('Content must be text, at most 200,000 characters.');if(!/\.(txt|md|csv|json|html|css|js|py|ics|svg)$/i.test(p))throw Error('Choose a supported text or document extension.');await this.approvals.ask({title:fs.existsSync(p)?'Replace workspace file':'Create workspace file',details:a},signal);workspacePath(this.root,a.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,a.content,{flag:'w'});return {saved:a.path};}
    if(name==='web_read'){text(a.url,'URL',3000);await this.approvals.ask({title:'Read website',details:{url:a.url,sendPageTextTo:providerName}},signal);return readWeb(a.url,signal);}
    if(name==='memory_write'){if(typeof a.content!=='string'||a.content.length>10000)throw Error('Memory must be under 10,000 characters.');await this.approvals.ask({title:'Replace personal memory',details:a},signal);d.memory=a.content;}
    if(name==='goal_create'){const goal={id:id(),title:text(a.title,'Goal',200),plan:text(a.plan,'Plan',10000),done:false};await this.approvals.ask({title:'Create goal',details:goal},signal);d.goals.push(goal);}
    if(name==='reminder_create'){const t={id:id(),...task(a)};await this.approvals.ask({title:'Schedule reminder',details:t},signal);d.tasks.push(t);}
    if(name==='python_run'){text(a.code,'Python code',30000);await this.approvals.ask({title:'Run Python in Docker',details:{code:a.code,network:'Disabled',hostFiles:'Not mounted',timeout:'30 seconds'}},signal);return runPython(a.code,signal);}
    if(name==='connector_call'){const c=d.connectors.find(c=>c.id===a.connectorId);if(!c||!c.tools.some(t=>t.name===a.tool))throw Error('Connector or tool is not configured. Discover tools in Settings first.');await this.approvals.ask({title:'Run external connector action',details:{connector:c.name,endpoint:c.url,tool:a.tool,arguments:a.arguments||{},warning:'This may change external data, send messages, or incur charges. Review exact arguments.'}},signal);const result=await new MCP(c,this.secret(c.secret)).invoke(a.tool,a.arguments||{},signal);if(result?.isError)throw Error('Connector reported that the tool failed. Check its service before retrying a consequential action.');return result;}
    this.store.save();this.changed();return {saved:true};
  }
}
module.exports={DESCRIPTIONS,ToolRunner,listFiles,runPython};
