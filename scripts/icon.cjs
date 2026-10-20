// Original geometric N icon, generated without external assets.
const fs=require('node:fs');const zlib=require('node:zlib');
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return (c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),len=Buffer.alloc(4),sum=Buffer.alloc(4);len.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([len,t,data,sum]);}
const n=64,raw=Buffer.alloc(n*(1+n*4));for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*(1+n*4)+1+x*4;const ink=y>=16&&y<48&&(x>=16&&x<23||x>=41&&x<48||Math.abs(x-(19+(y-16)*.78))<4);raw.set(ink?[20,35,26,255]:[180,214,156,255],i);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(n);ihdr.writeUInt32BE(n,4);ihdr[8]=8;ihdr[9]=6;
fs.writeFileSync('src/renderer/icon.png',Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
