export const clone = x => JSON.parse(JSON.stringify(x));
export const uid = () => 'b' + Math.random().toString(36).slice(2,11);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const TYPES = {hero:'封面',text:'文字',cards:'卡片',image:'图片',quote:'引言'};
export function block(type='text') {
  return {id:uid(),type,title:({hero:'让你的想法，成为页面。',text:'写下一个新的想法',cards:'把想法展开',image:'一张图，一个故事',quote:'好的表达，让想法被看见。'})[type],body:'点击这里，写下你想表达的内容。你可以自己编辑，也可以让 AI 帮你调整。',label:type==='hero'?'YOUR NEXT IDEA':'',items:type==='cards'?[{title:'开始',body:'从一个清晰的想法开始。'},{title:'表达',body:'让内容找到合适的形式。'},{title:'分享',body:'把作品带到更多人面前。'}]:[],src:'',alt:'图片',style:{bg:type==='hero'?'#f0edff':'#ffffff',color:'#252332',accent:'#7760dc',fontSize:type==='hero'?48:30,padding:56,align:'left',columns:3,imageWidth:100}};
}
export function starter() {
  const h=block('hero'); h.label='IDEA → PAGE'; h.body='一个可以亲手打磨的页面。\n从文字、图片到布局，每一处都由你决定。';
  const c=block('cards'); c.title='从想法到作品，只差一次开始'; c.body='用熟悉的方式编辑，让每一处变化都清晰可见。'; c.items=[{title:'01 / 直接编辑',body:'点击文字就能修改。选中区块，调整颜色、留白和排版。'},{title:'02 / 与 AI 一起',body:'提出要求，查看修改方案，再把变化应用到你的页面。'},{title:'03 / 自由分享',body:'导出独立 HTML，打开浏览器，就能看到完整作品。'}];
  const q=block('quote'); q.style.bg='#252332';q.style.color='#f9f7ff';q.title='让工具退后，让表达向前。';q.body='你的第一份作品，从这里开始。';
  return {version:1,name:'我的第一个页面',blocks:[h,c,q]};
}
const string = (v,max=10000) => typeof v==='string' && v.length<=max;
export function validImage(v) {return v==='' || /^data:image\/(png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=\s]+$/.test(v);}
export function fieldText(b,key){const parts=key.split('.');return parts[0]==='items'?b.items[Number(parts[1])]?.[parts[2]]:b[key];}
export function editRuns(runs,start,end,patch=null,replacement=null){const length=runs.reduce((n,r)=>n+r.text.length,0);if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>length||start>=end)throw Error('请先选中要修改的文字。');let offset=0;const out=[];for(const r of runs){const from=offset,to=offset+r.text.length;offset=to;if(from<start)out.push({...r,text:r.text.slice(0,Math.min(r.text.length,start-from))});if(to>start&&from<end&&replacement===null){const text=r.text.slice(Math.max(0,start-from),Math.min(r.text.length,end-from));out.push(patch===null?{text}:{...r,...patch,text});}if(from<=start&&to>start&&replacement!==null)out.push({...r,text:replacement});if(to>end)out.push({...r,text:r.text.slice(Math.max(0,end-from))});}return out.filter(r=>r.text.length);}
export function inlineHTML(b,key){const text=fieldText(b,key),runs=b.rich?.[key];if(!runs||runs.map(r=>r.text).join('')!==text)return esc(text);return runs.map(r=>{const style=[r.bold!==undefined?'font-weight:'+(r.bold?'700':'400'):'',r.italic!==undefined?'font-style:'+(r.italic?'italic':'normal'):'',r.underline!==undefined?'text-decoration:'+(r.underline?'underline':'none'):'',r.color?'color:'+r.color:'',r.fontSize?'font-size:'+r.fontSize+'px':''].filter(Boolean).join(';');return style?'<span style="'+style+'">'+esc(r.text)+'</span>':esc(r.text);}).join('');}
function validateRich(b){if(b.rich===undefined)return; if(!b.rich||typeof b.rich!=='object'||Array.isArray(b.rich)||Object.keys(b.rich).length>28)throw Error('局部文字样式无效。');for(const [key,runs] of Object.entries(b.rich)){if(!/^(title|body|label|items\.\d+\.(title|body))$/.test(key)||typeof fieldText(b,key)!=='string'||!Array.isArray(runs)||runs.length>2000)throw Error('局部文字内容无效。');for(const r of runs){if(!r||!string(r.text)||Object.keys(r).some(k=>!['text','bold','italic','underline','fontSize','color'].includes(k)))throw Error('局部文字字段无效。');for(const k of ['bold','italic','underline'])if(r[k]!==undefined&&typeof r[k]!=='boolean')throw Error('局部文字样式无效。');if(r.fontSize!==undefined&&(!Number.isFinite(r.fontSize)||r.fontSize<8||r.fontSize>120))throw Error('局部字号需为 8–120。');if(r.color!==undefined&&!/^#[a-f\d]{6}$/i.test(r.color))throw Error('局部颜色无效。');}if(runs.map(r=>r.text).join('')!==fieldText(b,key))throw Error('局部样式与文字不匹配。');}}
export function validateProject(p) {
  if (!p || p.version!==1 || !string(p.name,120) || !Array.isArray(p.blocks) || p.blocks.length>100) throw Error('文件不是有效的工作台项目（最多 100 个区块）。');
  const ids=new Set();
  for(const b of p.blocks) {
    if(!b || !string(b.id,80)||! /^[a-zA-Z0-9_-]+$/.test(b.id)||ids.has(b.id)||!Object.hasOwn(TYPES,b.type)) throw Error('区块类型或编号无效。');ids.add(b.id);
    for(const k of ['title','body','label','alt']) if(!string(b[k])) throw Error('内容格式无效。');
    if(!string(b.src,12000000)||!validImage(b.src)) throw Error('图片必须为内嵌 PNG、JPEG、WebP 或 GIF。');
    if(!Array.isArray(b.items)||b.items.length>12||b.items.some(i=>!i||!string(i.title)||!string(i.body))) throw Error('卡片格式无效。');
    const s=b.style;
    validateRich(b);
    if(!s||!['left','center','right'].includes(s.align)) throw Error('对齐方式无效。');
    for(const k of ['bg','color','accent']) if(!/^#[a-f\d]{6}$/i.test(s[k])) throw Error('颜色格式无效。');
    for(const [k,min,max] of [['fontSize',12,96],['padding',12,120],['columns',1,4],['imageWidth',20,100]]) if(!Number.isFinite(s[k])||s[k]<min||s[k]>max||(k==='columns'&&!Number.isInteger(s[k]))) throw Error('样式数值超出范围。');
  }
  return clone({version:1,name:p.name,blocks:p.blocks.map(b=>({id:b.id,type:b.type,title:b.title,body:b.body,label:b.label,alt:b.alt,src:b.src,items:b.items.map(i=>({title:i.title,body:i.body})),...(b.rich?{rich:b.rich}:{}),style:{bg:b.style.bg,color:b.style.color,accent:b.style.accent,fontSize:b.style.fontSize,padding:b.style.padding,align:b.style.align,columns:b.style.columns,imageWidth:b.style.imageWidth}}))});
}
export function applyOperations(project, ops, scope='all') {
  if(!Array.isArray(ops)||!ops.length||ops.length>30) throw Error('AI 没有给出有效修改（需要 1–30 项操作）。');
  const next=clone(project), changes=[];
  for(const op of ops) {
    if(!op||!['update','add','remove','move'].includes(op.action)) throw Error('不支持的 AI 操作。');
    if(scope!=='all' && (op.action==='add'||op.id!==scope)) throw Error('AI 尝试修改选中范围以外的内容，已拦截。');
    const idx=next.blocks.findIndex(b=>b.id===op.id), b=next.blocks[idx];
    if(op.action==='add') {if(!Object.hasOwn(TYPES,op.type)) throw Error('新增区块类型无效。');const n=block(op.type);if(op.patch) patch(n,op.patch); next.blocks.splice(Math.min(next.blocks.length,Math.max(0,Number.isInteger(op.index)?op.index:next.blocks.length)),0,n);changes.push('新增「'+n.title+'」');}
    else {
      if(!b) throw Error('AI 指定的区块不存在。');
      if(op.action==='update') {patch(b,op.patch);changes.push('修改「'+b.title+'」：'+Object.keys(op.patch).map(k=>({title:'标题',body:'正文',label:'标签',items:'卡片',style:'样式',alt:'图片描述'})[k]||k).join('、'));}
      if(op.action==='remove'){next.blocks.splice(idx,1);changes.push('删除「'+b.title+'」');}
      if(op.action==='move'){if(!Number.isInteger(op.index)||op.index<0||op.index>=next.blocks.length) throw Error('移动位置无效。');next.blocks.splice(idx,1);next.blocks.splice(op.index,0,b);changes.push('移动「'+b.title+'」到第 '+(op.index+1)+' 位');}
    }
  }
  return {project:validateProject(next),changes};
}
function patch(b,p) {
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!['title','body','label','items','style','alt'].includes(k))) throw Error('AI 修改字段无效。');
  for(const [k,v] of Object.entries(p)) {
    if(k==='style') {if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!Object.hasOwn(b.style,k))) throw Error('样式字段无效。');Object.assign(b.style,v);}
    else {b[k]=v;if(b.rich)for(const key of Object.keys(b.rich))if(key===k||(k==='items'&&key.startsWith('items.')))delete b.rich[key];}
  }
}
export const pageCSS=`*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#eeedf2;color:#252332;font-family:Inter,"Segoe UI","Microsoft YaHei",sans-serif}main{max-width:1120px;margin:auto;background:white}section{position:relative;padding:var(--pad);background:var(--bg);color:var(--ink);text-align:var(--align);overflow-wrap:anywhere}h1,h2,p{margin:0}h1,h2{font-size:var(--size);line-height:1.22;letter-spacing:-.035em;white-space:pre-wrap}p{font-size:17px;line-height:1.85;white-space:pre-wrap;opacity:.78;margin-top:20px}.eyebrow{color:var(--accent);font-size:12px;font-weight:700;letter-spacing:.2em;margin-bottom:26px;white-space:pre-wrap}.hero{min-height:380px;display:flex;flex-direction:column;justify-content:center}.hero h1{max-width:850px}.cards-grid{display:grid;grid-template-columns:repeat(var(--columns),minmax(0,1fr));gap:16px;margin-top:30px}.card{border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:16px;padding:26px;background:color-mix(in srgb,var(--bg) 94%,var(--ink))}.card h3{font-size:18px;margin:0;white-space:pre-wrap}.card p{font-size:14px;margin-top:12px}.quote h2:before{content:'“';display:block;color:var(--accent);font-size:64px;height:70px}.image-box{margin-top:24px}.image-box img{width:var(--image-width);max-height:700px;object-fit:contain;border-radius:16px}.image-placeholder{padding:70px 20px;background:color-mix(in srgb,var(--bg) 90%,var(--ink));border:1px dashed #aaa3bb;border-radius:16px;text-align:center;opacity:.6;font-size:14px}@media(max-width:600px){section{padding:28px 22px}h1,h2{font-size:min(var(--size),36px)}.cards-grid{grid-template-columns:1fr}.hero{min-height:360px}}`;
export function blockHTML(b, editable=false) {
  const s=b.style, attr=field=>editable?` contenteditable="true" spellcheck="false" data-field="${field}"`:'';
  return `<section class="${b.type}" data-id="${esc(b.id)}" style="--bg:${s.bg};--ink:${s.color};--accent:${s.accent};--size:${s.fontSize}px;--pad:${s.padding}px;--align:${s.align};--columns:${s.columns};--image-width:${s.imageWidth}%">${editable?'<div class="block-tag">'+TYPES[b.type]+'</div>':''}${b.label||editable?`<div class="eyebrow"${attr('label')}>${inlineHTML(b,'label')}</div>`:''}<${b.type==='hero'?'h1':'h2'}${attr('title')}>${inlineHTML(b,'title')}</${b.type==='hero'?'h1':'h2'}><p${attr('body')}>${inlineHTML(b,'body')}</p>${b.type==='cards'?'<div class="cards-grid">'+b.items.map((i,n)=>`<article class="card"><h3${attr('items.'+n+'.title')}>${inlineHTML(b,'items.'+n+'.title')}</h3><p${attr('items.'+n+'.body')}>${inlineHTML(b,'items.'+n+'.body')}</p></article>`).join('')+'</div>':''}${b.type==='image'?'<div class="image-box">'+(b.src?`<img src="${esc(b.src)}" alt="${esc(b.alt)}">`:'<div class="image-placeholder">＋ 选中区块，在右侧添加图片</div>')+'</div>':''}</section>`;
}
export function exportHTML(project,mode='dual') {
  project=validateProject(project);if(!['web','slides','dual'].includes(mode)) throw Error('导出模式无效。');
  const slideCSS=`body.slides main{max-width:1200px}body.slides section{display:none;min-height:calc(100vh - 70px)}body.slides section.active{display:flex;flex-direction:column;justify-content:center}#nav{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:14px;background:#252332;color:#fff;padding:10px 16px;border-radius:30px;box-shadow:0 4px 20px #0002;z-index:10;font:13px system-ui}#nav button{background:#ffffff18;color:inherit;border:0;border-radius:20px;padding:8px 12px;cursor:pointer}body:not(.slides) #prev,body:not(.slides) #next,body:not(.slides) #count{display:none}body.slides{padding-bottom:70px}@media print{#nav{display:none}body.slides section{display:block;break-after:page;min-height:auto}}`;
  const script=`(()=>{const sections=[...document.querySelectorAll('main>section')];let page=0;const count=document.getElementById('count');function show(){sections.forEach((s,i)=>s.classList.toggle('active',i===page));count.textContent=sections.length?(page+1)+' / '+sections.length:'0 / 0';document.getElementById('prev').disabled=page===0;document.getElementById('next').disabled=page>=sections.length-1;}function move(d){page=Math.max(0,Math.min(sections.length-1,page+d));show();window.scrollTo(0,0);}document.getElementById('prev').onclick=()=>move(-1);document.getElementById('next').onclick=()=>move(1);const toggle=document.getElementById('toggle');if(toggle)toggle.onclick=()=>{document.body.classList.toggle('slides');toggle.textContent=document.body.classList.contains('slides')?'滚动阅读':'分页演示';show();window.scrollTo(0,0);};document.addEventListener('keydown',e=>{if(document.body.classList.contains('slides')&&['ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});show();})();`;
  const metadata=JSON.stringify(project).replace(/</g,'\\u003c');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(project.name)}</title><style>${pageCSS}${mode!=='web'?slideCSS:''}</style></head><body${mode==='slides'?' class="slides"':''}><main>${project.blocks.map(b=>blockHTML(b)).join('')}</main>${mode!=='web'?'<nav id="nav" aria-label="演示控制"><button id="prev">←</button><span id="count"></span><button id="next">→</button>'+(mode==='dual'?'<button id="toggle">分页演示</button>':'')+'</nav><script>'+script+'</script>':''}<script id="workbench-project" type="application/json">${metadata}</script></body></html>`;
}
