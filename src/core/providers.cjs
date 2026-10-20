const {endpoint,text}=require('./validation.cjs');
const BASES={openai:'https://api.openai.com/v1',anthropic:'https://api.anthropic.com/v1',gemini:'https://generativelanguage.googleapis.com/v1beta',ollama:'http://127.0.0.1:11434',custom:''};
function config(input) {
  if(!(input.kind in BASES)) throw Error('Unknown provider.');
  const base=endpoint(input.kind==='custom'||input.kind==='ollama'?input.base:BASES[input.kind],input.kind==='ollama');
  return {id:input.id,name:text(input.name,'Provider name',80),kind:input.kind,base,model:text(input.model,'Model ID',150),imageModel:input.imageModel?text(input.imageModel,'Image model',150):'',agent:!!input.agent};
}
function request(p,key,messages) {
  const system=messages.filter(m=>m.role==='system').map(m=>m.content).join('\n');
  const dialog=messages.filter(m=>m.role!=='system').map(m=>({role:m.role,content:m.content}));
  let url=p.base, headers={'Content-Type':'application/json'}, body;
  if(p.kind==='anthropic') {url+='/messages';headers['x-api-key']=key;headers['anthropic-version']='2023-06-01';body={model:p.model,max_tokens:4096,system,messages:dialog};}
  else if(p.kind==='gemini') {url+=`/models/${encodeURIComponent(p.model.replace(/^models\//,''))}:generateContent`;headers['x-goog-api-key']=key;body={systemInstruction:{parts:[{text:system}]},contents:dialog.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}))};}
  else if(p.kind==='ollama') {url+='/api/chat';body={model:p.model,messages,stream:false,options:{num_predict:4096}};}
  else {url+='/chat/completions';if(key)headers.Authorization=`Bearer ${key}`;body={model:p.model,messages,stream:false};}
  return {url,headers,body};
}
async function jsonRequest(url,options={},fetcher=fetch) {
  let r;
  try {r=await fetcher(url,{...options,redirect:'error',signal:options.signal||AbortSignal.timeout(120000)});}
  catch(e) {if(options.signal?.aborted) throw Error('Request cancelled.');throw Error('Connection failed or timed out. Check the endpoint, network, and whether your local runtime is running.');}
  if(!r.ok) {const hints={400:'This model may not support this API or request format. Choose a compatible text model.',401:'Check your API key.',403:'Check your account permissions and regional availability.',404:'Check the endpoint and exact model ID.',429:'Rate limit or quota reached. Wait or check provider billing. No fallback was attempted.'};throw Error(`Provider returned HTTP ${r.status}. ${hints[r.status]||'Check provider status and try again.'}`);}
  let raw;
  if(r.body?.getReader){const reader=r.body.getReader();const chunks=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4_000_000){await reader.cancel();throw Error('Provider response exceeded the size limit.');}chunks.push(Buffer.from(value));}raw=Buffer.concat(chunks).toString('utf8');}finally{reader.releaseLock();}}
  else raw=await r.text();if(raw.length>4_000_000)throw Error('Provider response exceeded the size limit.');
  try {return JSON.parse(raw);}catch{throw Error('Provider did not return valid JSON. Check API compatibility.');}
}
async function generate(p,key,messages,signal,fetcher=fetch) {
  if(!p.model)throw Error('Select a model in Settings.');
  if(!['ollama','custom'].includes(p.kind)&&!key)throw Error('Add your API key in Settings.');
  if(p.kind==='ollama'){
    if(/cloud/i.test(p.model))throw Error('Cloud-routed Ollama models are disabled in local mode. Configure a remote provider explicitly.');
    const info=await jsonRequest(p.base+'/api/show',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:p.model}),signal},fetcher);
    if(info.remote_host||info.remote_model)throw Error('This Ollama model forwards to a cloud service. Select a locally installed model or configure a remote provider explicitly.');
  }
  const r=request(p,key,messages);const j=await jsonRequest(r.url,{method:'POST',headers:r.headers,body:JSON.stringify(r.body),signal},fetcher);
  let answer=p.kind==='anthropic'?j.content?.filter(x=>x.type==='text').map(x=>x.text).join('\n'):p.kind==='gemini'?j.candidates?.[0]?.content?.parts?.filter(x=>x.text&&!x.thought).map(x=>x.text).join('\n'):p.kind==='ollama'?j.message?.content:j.choices?.[0]?.message?.content;
  if(typeof answer!=='string'||!answer.trim())throw Error('Model returned no text. It may have refused or lack text-generation support.');
  if(answer.length>200000)throw Error('Model output exceeded the supported length.');return answer;
}
async function models(p,key,fetcher=fetch) {
  let url=p.base+(p.kind==='ollama'?'/api/tags':'/models'),headers={};
  if(p.kind==='anthropic')headers={'x-api-key':key,'anthropic-version':'2023-06-01'};
  else if(p.kind==='gemini')headers={'x-goog-api-key':key};else if(key)headers.Authorization=`Bearer ${key}`;
  const j=await jsonRequest(url,{headers},fetcher);
  return (p.kind==='ollama'?j.models?.map(m=>m.name):p.kind==='gemini'?j.models?.filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name.replace(/^models\//,'')):j.data?.map(m=>m.id))||[];
}
async function generateImage(p,key,prompt,signal,fetcher=fetch){
  if(!p.imageModel||!['openai','custom','gemini'].includes(p.kind))throw Error('Image generation requires an explicitly configured image model on OpenAI, Gemini, or a compatible endpoint. No fallback was attempted.');
  let url,headers,body;
  if(p.kind==='gemini'){url=p.base+`/models/${encodeURIComponent(p.imageModel.replace(/^models\//,''))}:generateContent`;headers={'Content-Type':'application/json','x-goog-api-key':key};body={contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['TEXT','IMAGE']}};}
  else {url=p.base+'/images/generations';headers={'Content-Type':'application/json',...(key?{Authorization:`Bearer ${key}`}:{})};body={model:p.imageModel,prompt,n:1,size:'1024x1024'};}
  const j=await jsonRequest(url,{method:'POST',headers,body:JSON.stringify(body),signal},fetcher);
  const encoded=p.kind==='gemini'?j.candidates?.[0]?.content?.parts?.find(x=>x.inlineData)?.inlineData?.data:j.data?.[0]?.b64_json;
  if(!encoded)throw Error('No inline image returned. Use an image model returning base64 PNG/JPEG; remote image URLs are not automatically fetched.');
  const bytes=Buffer.from(encoded,'base64');const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(!png&&!jpg)throw Error('Provider did not return a supported PNG/JPEG image.');return {bytes,extension:png?'png':'jpg'};
}
module.exports={BASES,config,request,generate,models,jsonRequest,generateImage};
