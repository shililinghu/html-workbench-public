import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const url='http://127.0.0.1:4317';
async function ready(){try{const r=await fetch(url,{signal:AbortSignal.timeout(1000)});return r.ok&&(await r.text()).includes('画页 · HTML 工作台');}catch{return false;}}
if(!await ready()) {
  const child=spawn(process.execPath,[fileURLToPath(new URL('server.mjs',import.meta.url))],{cwd:fileURLToPath(new URL('.',import.meta.url)),detached:true,windowsHide:true,stdio:'ignore'});child.unref();
  let ok=false;for(let i=0;i<30;i++){if(await ready()){ok=true;break;}await new Promise(r=>setTimeout(r,200));}
  if(!ok){console.error('工作台启动失败。请在本目录运行 node server.mjs 查看原因，或检查 4317 端口。');process.exit(1);}
}
spawn('cmd.exe',['/c','start','',url],{windowsHide:true,stdio:'ignore'}).unref();
console.log('画页已启动：'+url);
