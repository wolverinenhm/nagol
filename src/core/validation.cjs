const fs=require('node:fs'); const path=require('node:path');
function text(value,name,max=10000) { if(typeof value!=='string'||!value.trim()||value.length>max) throw Error(`${name} must contain 1–${max} characters.`); return value.trim(); }
function endpoint(raw,localOnly=false) {
  let u; try {u=new URL(raw);} catch {throw Error('Enter a valid endpoint URL.');}
  const local=['localhost','127.0.0.1','[::1]'].includes(u.hostname);
  if(u.username||u.password||u.search||u.hash) throw Error('Endpoint must not contain credentials, a query, or a fragment.');
  if(localOnly&&!local) throw Error('Local inference requires a loopback endpoint. Use a custom provider for a remote server.');
  if(u.protocol!=='https:'&&!(local&&u.protocol==='http:')) throw Error('Use HTTPS, or HTTP on localhost only.');
  return u.toString().replace(/\/$/,'');
}
function workspacePath(root,relative) {
  text(relative,'Filename',180);
  if(path.isAbsolute(relative)||relative.includes('..')||/[:<>"|?*\x00-\x1f]/.test(relative)) throw Error('Use a relative workspace filename without special characters or parent paths.');
  const parts=relative.split(/[\\/]/); if(parts.some(p=>!p||/[. ]$/.test(p)||/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\.|$)/i.test(p))) throw Error('Invalid Windows filename.');
  const base=fs.realpathSync(root); let current=base;
  for(const part of parts) {current=path.join(current,part); if(fs.existsSync(current)&&fs.lstatSync(current).isSymbolicLink()) throw Error('Linked paths are not allowed in the workspace.');}
  if(!current.startsWith(base+path.sep)) throw Error('File must stay inside the Nagol workspace.');
  return current;
}
function task(input) {
  const title=text(input.title,'Task title',200); const due=new Date(input.due);
  if(!Number.isFinite(due.getTime())) throw Error('Choose a valid date and time.');
  const repeat=Number(input.repeat||0); if(!Number.isInteger(repeat)||repeat<0||(repeat>0&&repeat<5)||repeat>525600) throw Error('Repeat must be 0, or between 5 and 525600 minutes.');
  return {title,due:due.toISOString(),repeat,enabled:true};
}
module.exports={text,endpoint,workspacePath,task};
