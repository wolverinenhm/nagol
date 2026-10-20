const {endpoint,text}=require('./validation.cjs');const {jsonRequest}=require('./providers.cjs');
function connectorConfig(c){return {id:c.id,name:text(c.name,'Connector name',80),url:endpoint(c.url),tools:[]};}
class MCP {
  constructor(config,key,fetcher=fetch){this.config=config;this.key=key;this.fetcher=fetcher;this.seq=0;this.session='';}
  async call(method,params={},notify=false,signal) {
    const headers={'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-03-26'};
    if(this.key)headers.Authorization=`Bearer ${this.key}`;if(this.session)headers['Mcp-Session-Id']=this.session;
    const wrapped=async(url,options)=>{const response=await this.fetcher(url,options);const session=response.headers?.get('mcp-session-id');if(session)this.session=session;
      if(notify&&response.ok)return {ok:true,text:async()=> '{}'};
      if(response.ok&&response.headers?.get('content-type')?.includes('text/event-stream'))throw Error('This server requires SSE streaming. Use a JSON-response Streamable HTTP MCP server.');
      return response;};
    const result=await jsonRequest(this.config.url,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',...(notify?{}:{id:++this.seq}),method,params}),signal},wrapped);
    if(result.error)throw Error(`Connector rejected ${method}. Check server configuration and tool arguments.`);return result.result;
  }
  async init(signal){await this.call('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'nagol',version:'0.1.0'}},false,signal);await this.call('notifications/initialized',{},true,signal);}
  async list(signal){await this.init(signal);const result=await this.call('tools/list',{},false,signal);if(result.nextCursor)throw Error('Paginated tool discovery is not supported yet. Configure a smaller tool set.');return (result.tools||[]).slice(0,50).map(t=>({name:text(t.name,'Tool name',120),description:String(t.description||'').slice(0,1000),inputSchema:t.inputSchema}));}
  async invoke(name,args,signal){await this.init(signal);return this.call('tools/call',{name,arguments:args},false,signal);}
}
module.exports={MCP,connectorConfig};
