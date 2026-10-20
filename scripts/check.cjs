const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
function walk(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(root,x.name)):[path.join(root,x.name)]);}
for(const file of [...walk('src'),...walk('scripts'),...walk('tests')].filter(x=>/\.(js|cjs)$/.test(x))){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0){console.error(r.stderr);process.exit(1);}}
for(const name of ['README.md','LICENSE','docs/FEATURES.md','docs/SECURITY.md','docs/TESTING.md','.gitignore','.env.example','src/renderer/icon.png'])if(!fs.existsSync(name))throw Error('Missing release file: '+name);
console.log('Syntax and release-file checks passed.');
