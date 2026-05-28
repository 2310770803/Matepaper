var K={n:"便签",m:"备忘",t:"待办",d:"日子",r:"阅读",p:"密码"};
var KD={n:"轻量笔记",m:"提醒备忘",t:"任务管理",d:"生活日志",r:"阅读进度",p:"密码管理"};
var KC={n:"var(--note)",m:"var(--memo)",t:"var(--todo)",d:"var(--day)",r:"var(--reading)",p:"var(--pwd)"};
var SK="matepaper.web";
// SVG Icons
var IMG={n:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/></svg>',m:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 1 6 8c0-7 6-7 6-7s6 0 6 7"/><path d="M12.5 22H6a2 2 0 0 1-2-2V8"/><path d="M8 14h8"/><path d="M8 18h5"/></svg>',t:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',d:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="m10 14 2 2 4-4"/></svg>',r:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 19.5z"/><circle cx="10" cy="8" r="2"/><path d="M8 14h6"/></svg>',p:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>'};
var IC_SET='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
var IC_SUN='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
var IC_MOON='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
var IC_PLUS='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>';
var IC_TRASH='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
var IC_X='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
var st,sel=null,aK="n",q="",sg=false,dW=null,_di=null,_od=null;
function ls(){try{var r=localStorage.getItem(SK);if(r){var d=JSON.parse(r);if(d&&d.e)return d}}catch(e){}return{e:[],t:"l",a:"bamboo",an:1,cl:0,fs:100,de:"comfortable",sH:1,hD:84,bg:{}}}
function ss(){localStorage.setItem(SK,JSON.stringify(st))}
function gi(){return crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2,10)}
function nw(){return new Date().toISOString()}
function td(){return nw().slice(0,10)}
function fs1(iso){if(!iso)return"";var d=new Date(iso);if(isNaN(d.getTime()))return iso.slice(0,16).replace("T"," ");var n=new Date(),sd=d.toDateString()===n.toDateString();var t=d.toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false});return sd?"今天 "+t:(d.getMonth()+1)+"月"+d.getDate()+"日 "+t}
function cs(kd){var a=st.e.filter(function(e){return e.k===kd});return{t:a.length,a:a.filter(function(e){return !e.a}).length}}
function ed(kd,ov){return Object.assign({id:gi(),k:kd,t:"",b:"",gs:[],f:0,a:0,ca:nw(),ua:nw()},ov||{})}
function fi(){var l=st.e.filter(function(e){return e.k===aK});if(q.trim()){var s=q.toLowerCase();l=l.filter(function(e){return(e.t||"").toLowerCase().includes(s)||(e.b||"").toLowerCase().includes(s)})}return l.sort(function(a,b){return b.ua.localeCompare(a.ua)})}
function esc(s){if(!s)return"";return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function bm(entries,days){var map={},n=new Date();entries.forEach(function(e){var d=e.ca?e.ca.slice(0,10):null;if(d)map[d]=(map[d]||0)+1});var r=[];for(var i=days-1;i>=0;i--){var d=new Date(n);d.setDate(d.getDate()-i);var ds=d.toISOString().slice(0,10),c=map[ds]||0;r.push({date:ds,count:c,level:c===0?0:c<=1?1:c<=3?2:c<=6?3:4})}return r}
function cddCls(){if(_od){var el=document.getElementById("cdd_"+_od);if(el)el.classList.remove("open");_od=null}}
document.addEventListener("mousedown",function(e){if(!e.target.closest(".cdd"))cddCls()});
function mkTog(label,hint,state,fn){var on=state?"on":"";return'<div class="set-row"><div><label>'+label+'</label>'+(hint?'<div class="sh">'+hint+'</div>':"")+'</div><div class="toggle '+on+'" onclick="'+fn+';event.stopPropagation()"></div></div>';}
function mkSel(label,hint,html){return'<div class="set-row"><div><label>'+label+'</label>'+(hint?'<div class="sh">'+hint+'</div>':"")+'</div>'+html+'</div>';}
function mkSlider(label,min,max,val,key){var unit=key==="bl"?"px":"%";return'<div class="set-row"><div><label>'+label+'</label></div><div class="range-wrap"><input type="range" min="'+min+'" max="'+max+'" value="'+val+'" oninput="srUpdate(\x27'+key+'\x27,this)" onchange="srEnd(\x27'+key+'\x27,this)"/><span id="sr_'+key+'">'+val+unit+'</span></div></div>';}
function dd(id,opts,cur,fn){var cl="";for(var i=0;i<opts.length;i++){if(opts[i].v===cur){cl=opts[i].l;break}}if(!cl&&opts.length>0)cl=opts[0].l;var o=opts.map(function(o){return'<button class="cdd-o'+(o.v===cur?" sel":"")+'" data-v="'+o.v+'" onclick="sCDD(\x27'+id+'\x27,\x27'+o.v+'\x27,\x27'+fn+'\x27);event.stopPropagation()">'+o.l+'</button>';}).join("");return'<div class="cdd" id="cdd_'+id+'"><button class="cdd-t" onclick="tCDD(\x27'+id+'\x27);event.stopPropagation()"><span class="cdd-l">'+cl+'</span><svg class="cdd-a" width="8" height="5" viewBox="0 0 8 5"><path d="M1 1l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg></button><div class="cdd-m">'+o+'</div></div>';}
window.tCDD=function(id){cddCls();var el=document.getElementById("cdd_"+id);if(el&&el.classList.contains("open")){el.classList.remove("open");_od=null}else{if(el){el.classList.add("open");_od=id}}};
window.sCDD=function(id,v,fn){var el=document.getElementById("cdd_"+id);if(!el)return;var lb=el.querySelector('[data-v="'+v+'"]');if(lb)el.querySelector(".cdd-l").textContent=lb.textContent;cddCls();if(window[fn])window[fn](v)};
window.tt=function(){st.t=st.t==="d"?"l":"d";ss();rd()};
window.ts=function(){sg=!sg;rd()};
window.sa_a=function(v){st.a=v;ss();rd()};
window.sa_de=function(v){st.de=v;ss();rd()};
window.sa_fs=function(v){st.fs=+v;ss();rd()};
window.sa_hD=function(v){st.hD=+v;ss();rd()};
window.sbg=function(k,v){st.bg=st.bg||{};st.bg[k]=v;rd()};
window.cb=function(){st.bg={};ss();rd()};
window.lb=function(inp){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){st.bg=st.bg||{};st.bg.url=r.result;ss();rd()};r.readAsDataURL(f)};
window.pickImage=function(){var i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=function(){lb(i)};i.click()};
window.tglAnim=function(){var v=st.an?0:1;st.an=v;ss();rd()};
window.tglCl=function(){st.cl=!st.cl;ss();rd()};
window.tglSH=function(){st.sH=st.sH===false?true:false;ss();rd()};
window.clearAllData=function(){if(confirm("清除数据？")){localStorage.removeItem(SK);st={e:[],t:"l",a:"bamboo",an:1,cl:0,fs:100,de:"comfortable",sH:1,hD:84,bg:{}};rd()}};
window.sk=function(k){aK=k;q="";sel=null;sg=false;rd()};
window.sq=function(v){q=v;rd()};
window.sele=function(id){sel=id;sg=false;rd()};
window.del=function(id){if(!confirm("确定删除？"))return;st.e=st.e.filter(function(e){return e.id!==id});if(sel===id)sel=null;ss();rd()};
window.uf=function(id,f,v){st.e=st.e.map(function(e){return e.id===id?Object.assign({},e,{[f]:v,ua:nw()}):e});ss();rd()};
window.uf_t=function(id,el){uf(id,"t",el.value)};
window.uf_b=function(id,el){uf(id,"b",el.value)};
window.sa_sc=function(v){st.sc=v;ss();rd()};
window.sa_sk=function(v){st.sk=v;ss();rd()};
window.om=function(){alert("新建")};
window.srUpdate=function(k,el){var v=el.value,unit=k==="bl"?"px":"%";var s=document.getElementById("sr_"+k);if(s)s.textContent=v+unit;st.bg=st.bg||{};st.bg[k]=+v};
window.srEnd=function(k,el){st.bg=st.bg||{};st.bg[k]=+el.value;ss();rd()};

function rd(){
  document.documentElement.setAttribute("data-theme",st.t==="d"?"dark":"");
  var entries=fi(),se=st.e.find(function(e){return e.id===sel})||null,bg=st.bg||{};
  var tA=st.e.filter(function(e){return !e.a}).length;
  var tF=st.e.filter(function(e){return e.f&&!e.a}).length;
  var sd=dW!==null?'style="width:'+dW+'px"':"";
  var hm="";
  if(st.sH!==false){
    var hd=st.hD||84,hd2=bm(st.e,hd),ht=0,ha=0;
    hd2.forEach(function(x){ht+=x.count;if(x.count>0)ha++});
    var hg=hd2.map(function(x){return'<span class="heatmap-cell" data-lv="'+x.level+'" title="'+x.date+" - "+x.count+'"></span>';}).join("");
    hm='<div style="margin-top:4px"><div class="heatmap-grid">'+hg+'</div><div class="heatmap-summary"><span>'+hd+"天</span><span>"+ha+"活跃</span><span>"+ht+"次</span></div></div>";
  }
  
  var sh="";
  if(sg){
    sh='<div class="set-pane"><div class="set-pane-hdr"><h3>设置</h3><button class="tbtn" onclick="ts()">'+IC_X+'</button></div><div class="set-pane-body">';
    sh+='<h4>外观</h4>';
    sh+=mkTog("深色模式","",st.t==="d","tt()");
    sh+=mkSel("强调色","",dd("ac",[{v:"bamboo",l:"竹绿"},{v:"indigo",l:"靛蓝"},{v:"rose",l:"玫瑰"}],st.a||"bamboo","sa_a"));
    sh+=mkTog("动画效果","",st.an!==0,"tglAnim()");
    sh+=mkTog("紧凑列表","",st.cl,"tglCl()");
    sh+=mkSel("密度","",dd("de",[{v:"comfortable",l:"舒适"},{v:"focused",l:"专注"},{v:"compact",l:"紧凑"}],st.de||"comfortable","sa_de"));
    sh+=mkSel("字体","",dd("fs",[{v:"80",l:"80%"},{v:"90",l:"90%"},{v:"100",l:"100%"},{v:"110",l:"110%"},{v:"120",l:"120%"},{v:"140",l:"140%"}],""+(st.fs||100),"sa_fs"));
    sh+='<h4>背景</h4>';
    if(bg.url){sh+='<div class="bg-preview" style="background-image:url('+esc(bg.url)+')"><button class="bg-clear" onclick="cb()">X</button></div>';}
    sh+='<div class="set-row"><div><label>上传</label></div><button class="btn btn-ghost btn-small" onclick="pickImage()">选择</button></div>';
    sh+=mkSlider("不透明度",5,70,bg.op||25,"op");
    sh+=mkSlider("模糊",0,20,bg.bl||0,"bl");
    sh+=mkSlider("遮罩",10,80,bg.ms||48,"ms");
    sh+=mkSlider("暗角",0,50,bg.vn||22,"vn");
    sh+='<h4>热力图</h4>';
    sh+=mkTog("显示","",st.sH!==false,"tglSH()");
    sh+=mkSel("范围","",dd("hd",[{v:"28",l:"28天"},{v:"84",l:"84天"},{v:"168",l:"168天"}],""+(st.hD||84),"sa_hD"));
    sh+='<h4>数据</h4>';
    sh+='<div class="set-row"><div><label>恢复示例</label></div><button class="btn btn-ghost btn-small" onclick="lsm()">加载</button></div>';
    sh+='<div class="set-row"><div><label>清除</label><div class="sh">不可撤销</div></div><button class="btn btn-ghost btn-small" onclick="clearAllData()">清除</button></div>';
    sh+='</div></div>';
  }
  
  var itemHTML=entries.length===0?'<div class="empty-st">暂无</div>':entries.map(function(e){return '<button class="entry-card'+(e.id===sel?" selected":"")+'" onclick="sele(\x27'+e.id+'\x27)"><div class="entry-ttl">'+esc(e.t||"无题")+'</div><div class="entry-pv">'+esc(e.b?e.b.replace(/\s+/g," ").slice(0,68):"")+'</div><div class="entry-mt">'+fs1(e.ua)+'</div></button>';}).join("");
  var navHTML=Object.keys(K).map(function(k){var s=cs(k);return '<button class="module-btn'+(k===aK?" active":"")+'" onclick="sk(\x27'+k+'\x27)"><span class="module-icon" style="color:'+KC[k]+'">'+IMG[k]+'</span><span><div class="ml">'+K[k]+'</div><div class="md">'+KD[k]+'</div></span><span class="module-cnt">'+s.a+'</span></button>';}).join("");
  
  document.getElementById("app").innerHTML='<div class="app-shell"><header class="titlebar"><div class="brand-text">Matepaper<span style="font-weight:400;font-size:12px;color:var(--ink-faint);margin-left:8px"> - 记下生活的诗意</span></div><div class="title-actions"><button class="tbtn'+(sg?" active":"")+'" onclick="ts()" title="设置">'+IC_SET+'</button><button class="tbtn" onclick="tt()" title="主题">'+(st.t==="d"?IC_MOON:IC_SUN)+'</button></div></header><div class="workspace"><aside class="sidebar"><div class="ws-card"><div class="ws-title">个人工具箱</div><div class="ws-stats"><div class="ws-stat"><strong>'+tA+'</strong>记录</div><div class="ws-stat"><strong>'+tF+'</strong>收藏</div></div></div><nav class="module-nav">'+navHTML+'</nav>'+hm+'</aside><div class="entry-list-wrap" '+sd+'><div class="entry-list" id="lc"><div class="list-header"><div class="list-header-left"><h2>'+K[aK]+'</h2><span>'+entries.length+'</span></div></div><div class="entries-scroll">'+itemHTML+'</div></div><div class="resize-handle" id="rH"></div></div>'+sh+'</div></div>';
  var rh=document.getElementById("rH");if(rh)rh.onmousedown=function(e){e.preventDefault();_di={sX:e.clientX,sW:document.getElementById("lc").offsetWidth};rh.classList.add("active");document.body.style.cursor="col-resize";document.body.style.userSelect="none"};
}
document.addEventListener("mousemove",function(e){if(!_di)return;var d=e.clientX-_di.sX,n=Math.max(160,Math.min(600,_di.sW+d));dW=n;var l=document.getElementById("lc");if(l)l.style.width=n+"px"});
document.addEventListener("mouseup",function(){_di=null;var h=document.getElementById("rH");if(h)h.classList.remove("active");document.body.style.cursor="";document.body.style.userSelect="";dW=null});
st=ls();if(st.e.length===0){var sa=[{k:"n",t:"欢迎",b:"个人工具箱",gs:["置顶"]},{k:"n",t:"笔记"},{k:"m",t:"备忘"},{k:"t",t:"待办"},{k:"d",t:td(),b:"今日"},{k:"r",t:"阅读"},{k:"p",t:"密码"}];sa.forEach(function(x,i){var e=ed(x.k);Object.assign(e,x);e.ca=new Date(Date.now()-(sa.length-i)*3600000).toISOString();e.ua=e.ca;e.f=i===0;st.e.push(e)});sel=st.e[0]?.id||null;ss()}rd();
