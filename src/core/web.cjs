const https=require('node:https');const dns=require('node:dns/promises');const net=require('node:net');
function publicIPv4(ip) {
  if(net.isIP(ip)!==4)return false;const [a,b]=ip.split('.').map(Number);
  return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19)));
}
async function publicTarget(raw,resolve=dns.lookup) {
  let u;try{u=new URL(raw);}catch{throw Error('Invalid web URL.');}
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443'))throw Error('Web research accepts public HTTPS URLs on port 443 only.');
  const addresses=await resolve(u.hostname,{family:4,all:true});
  if(!addresses.length||addresses.some(x=>!publicIPv4(x.address)))throw Error('Private, loopback, and reserved network destinations are blocked.');
  return {url:u,address:addresses[0].address};
}
async function readWeb(raw,signal) {
  const {url,address}=await publicTarget(raw);
  return new Promise((resolve,reject)=>{
    const req=https.get(url,{signal,headers:{'User-Agent':'Nagol/0.1 (user-requested research)','Accept':'text/html,text/plain,application/json'},lookup:(_host,_options,cb)=>cb(null,address,4)},res=>{
      if(res.statusCode>=300&&res.statusCode<400){res.resume();reject(Error('This page redirects. Open and approve the final HTTPS URL instead.'));return;}
      if(res.statusCode!==200){res.resume();reject(Error(`Website returned HTTP ${res.statusCode}.`));return;}
      if(!/text\/|application\/json/.test(res.headers['content-type']||'')){res.resume();reject(Error('Only text, HTML, and JSON web content are supported.'));return;}
      let bytes=0;const chunks=[];
      res.on('data',c=>{bytes+=c.length;if(bytes>2_000_000)req.destroy(Error('Page exceeds the 2 MB research limit.'));else chunks.push(c);});
      res.on('error',reject);res.on('end',()=>{let body=Buffer.concat(chunks).toString('utf8');body=body.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();resolve({url:url.href,text:body.slice(0,24000),truncated:body.length>24000});});
    });req.setTimeout(25000,()=>req.destroy(Error('Website timed out.')));req.on('error',()=>reject(Error('Website request failed, was cancelled, or exceeded its size/time limit.')));
  });
}
module.exports={publicIPv4,publicTarget,readWeb};
