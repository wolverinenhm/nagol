// Portable Windows distribution; no installer is claimed or generated.
const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
if(process.platform!=='win32'||process.arch!=='x64')throw Error('Build the Windows x64 distribution on Windows x64.');
for(const args of [['--test','tests/agent.test.cjs','tests/core.test.cjs','tests/providers.test.cjs'],['scripts/check.cjs']]){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(1);}
const electronExe=require('electron');const source=path.dirname(electronExe);const output=path.resolve('dist','Nagol-win-x64');
if(fs.existsSync(output))throw Error('dist/Nagol-win-x64 already exists. Move that previous build before rebuilding.');
fs.cpSync(source,output,{recursive:true});fs.renameSync(path.join(output,'electron.exe'),path.join(output,'Nagol.exe'));
const appRoot=path.join(output,'resources','app');fs.mkdirSync(appRoot,{recursive:true});fs.cpSync('src',path.join(appRoot,'src'),{recursive:true});
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));delete pkg.devDependencies;delete pkg.scripts;fs.writeFileSync(path.join(appRoot,'package.json'),JSON.stringify(pkg,null,2));
fs.copyFileSync('LICENSE',path.join(output,'NAGOL-LICENSE.txt'));for(const f of ['README.md','THIRD_PARTY_NOTICES.md'])fs.copyFileSync(f,path.join(output,f));fs.cpSync('docs',path.join(output,'docs'),{recursive:true});
console.log('Built '+output+'\\Nagol.exe. Retain the entire directory; the executable needs its adjacent runtime files.');
