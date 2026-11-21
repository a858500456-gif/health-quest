(function(){
'use strict';
var CH=(window.CHAPTERS||[]).slice().sort(function(a,b){return a.order-b.order});
var app=document.getElementById('app'),nav=document.getElementById('chap');
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/* 公式(含 $)不跳脫其中的 $,只跳脫 HTML 字元 */
function chip(c,key){var s=c.sources[key];if(!s)return '';
  return '<a class="chip" href="'+esc(s.url)+'" target="_blank" rel="noopener" title="'+esc(s.title)+'">'+esc(s.publisher.split('(')[0].split(',')[0])+' · '+esc(s.date)+' ↗</a>'}
function navHtml(cur){
  return '<a href="#home"'+(cur==='home'?' aria-current="page"':'')+'>🗺️ 冒險地圖</a>'+CH.map(function(c){
    return '<a href="#'+c.id+'"'+(cur===c.id?' aria-current="page"':'')+'>'+c.emoji+' '+esc(c.title)+'</a>'}).join('')}

function winBox(title,body,cls){return '<section class="win '+(cls||'')+'"><div class="wbar"><span>'+esc(title)+'</span><span class="wb"><i>_</i><i>▢</i><i>✕</i></span></div><div class="wbody">'+body+'</div></section>'}
function consoleWrap(inner,id){return '<div class="console"><div class="shoulder"><i></i><i></i></div><div class="cbody"><div class="dpad" aria-hidden="true"><b></b><b></b></div><div class="screen"'+(id?' id="'+id+'"':'')+'>'+inner+'</div><div class="abtn" aria-hidden="true"><i>A</i><i>B</i></div></div><div class="vents" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>'}
function nextStage(){for(var i=0;i<CH.length;i++){if(unlocked(i)&&stars(CH[i].id)===0)return '#'+CH[i].id}return finalOpen()?'#final/battle':'#home'}
/* ===== 闖關遊戲 ===== */
var SAVE={stars:{},all:false};
try{var raw=localStorage.getItem('hq-save');if(raw)SAVE=Object.assign(SAVE,JSON.parse(raw))}catch(e){}
function persist(){try{localStorage.setItem('hq-save',JSON.stringify(SAVE))}catch(e){}}
var LV=[[0,'見習冒險者'],[50,'健康新手'],[120,'養生學徒'],[200,'衛教達人'],[300,'健康勇者'],[380,'健康大師']];
function stars(id){return SAVE.stars[id]||0}
function xp(){var t=0;Object.keys(SAVE.stars).forEach(function(k){if(SAVE.stars[k]>0)t+=SAVE.stars[k]*10+20});return t}
function level(){var x=xp(),i=0;LV.forEach(function(l,k){if(x>=l[0])i=k});return{i:i,name:LV[i][1],x:x,next:LV[i+1]?LV[i+1][0]:null,base:LV[i][0]}}
function unlocked(i){return SAVE.all||i===0||stars(CH[i-1].id)>0}
function finalOpen(){return SAVE.all||CH.every(function(c){return stars(c.id)>0})}
function starStr(n){return '★'.repeat(n)+'☆'.repeat(3-n)}
var FINAL={id:'final',emoji:'👑',title:'最終關:綜合挑戰',mascot:'tangyuan_thinking.png',boss:{name:'健康迷霧魔王',line:'把七座城的知識全部拿出來!我才不信你都記得。'},story:{title:'魔王的迷霧',text:['湯圓走過七座城,身上帶著滿滿的小知識。魔王揮手,迷霧籠罩了整片大地。','只有把學到的東西一一用出來,才能撥開迷霧!']}};
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}

function pos(){for(var i=0;i<CH.length;i++)if(stars(CH[i].id)===0)return i;return stars('final')>0?CH.length+1:CH.length}
/* 足跡圖:只在通關後出現一下,湯圓走向下一關 */
function tleft(i,n){return (4+i*(92/(n-1)))+'%'}
function trailHtml(from){var n=CH.length+2,h='<div class="trail"><div class="tline"><i class="tfill" style="width:'+tleft(from,n)+'"></i>';
  for(var i=0;i<n;i++){h+='<span class="tdot'+(i<from?' done':'')+'" data-i="'+i+'" style="left:'+tleft(i,n)+'">'+(i<CH.length?CH[i].emoji:(i===CH.length?'👑':'🏁'))+'</span>'}
  return h+'<img class="twalker" src="assets/tangyuan_thinking.png" alt="" style="left:'+tleft(from,n)+'"></div></div>'}
function walkTrail(root,from,to){var n=CH.length+2,w=root.querySelector('.twalker'),f=root.querySelector('.tfill');if(!w)return;
  setTimeout(function(){w.classList.add('walking');w.style.left=tleft(to,n);f.style.width=tleft(to,n);
    root.querySelectorAll('.tdot').forEach(function(d){var i=+d.dataset.i;if(i<to)setTimeout(function(){d.classList.add('done')},400+(i-from)*(1400/Math.max(1,to-from)))});
    setTimeout(function(){w.classList.remove('walking')},1500)},500)}
function playerBar(){var l=level(),total=(CH.length+1)*3,got=0;Object.keys(SAVE.stars).forEach(function(k){got+=SAVE.stars[k]});
  var pct=l.next?Math.round((l.x-l.base)/(l.next-l.base)*100):100;
  return '<div class="pbar"><b>湯圓冒險家</b> <span class="lv">Lv.'+(l.i+1)+' '+l.name+'</span><div class="bar"><i style="width:'+pct+'%"></i></div><small>EXP '+l.x+(l.next?'/'+l.next:' MAX')+' · ⭐ '+got+'/'+total+' · 📚 26 篇來源</small></div>'}
/* ===== 真正的地圖:八個地點分布在蜿蜒的小路上 ===== */
var SPOTS=[[9,72],[24,40],[40,70],[54,36],[66,68],[77,32],[88,62],[92,16]];
var SCENE=['月亮小屋','美食村','清涼湖','登山步道','瞭望森林','心靈花園','迷霧沼澤','魔王城'];
function segPath(i){var P=SPOTS.map(function(q){return [q[0]*10,q[1]*4.6]}),p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];
  var c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
  return 'M'+p1[0]+' '+p1[1]+' C'+c1[0]+' '+c1[1]+' '+c2[0]+' '+c2[1]+' '+p2[0]+' '+p2[1]}
function mapSvg(p){
  var tree=function(x,y,r){r=r||1;return '<g transform="translate('+x+' '+y+') scale('+r+')"><rect x="-3" y="0" width="6" height="12" fill="#8B5E3C"/><circle cx="0" cy="-4" r="13" fill="#6FB36B"/><circle cx="-7" cy="2" r="9" fill="#5FA35E"/></g>'};
  var h='<svg class="msvg" viewBox="0 0 1000 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE0EE"/><stop offset="1" stop-color="#F6EBD8"/></linearGradient></defs>';
  h+='<rect width="1000" height="460" fill="url(#sky)"/>';
  h+='<g fill="#fff" opacity=".9"><ellipse cx="170" cy="50" rx="50" ry="16"/><ellipse cx="200" cy="40" rx="34" ry="14"/><ellipse cx="560" cy="34" rx="46" ry="14"/><ellipse cx="760" cy="60" rx="52" ry="16"/></g>';
  h+='<ellipse cx="500" cy="470" rx="620" ry="190" fill="#CFE6B2"/><ellipse cx="150" cy="430" rx="260" ry="110" fill="#BEDC9F"/><ellipse cx="800" cy="450" rx="280" ry="120" fill="#B8D898"/>';
  /* 登山步道:山 */
  h+='<polygon points="470,200 545,70 620,200" fill="#A89B94" stroke="#2B2630" stroke-width="3"/><polygon points="520,105 545,70 570,105 556,100 545,112 533,100" fill="#fff"/><polygon points="570,200 625,110 690,200" fill="#B8ABA3" stroke="#2B2630" stroke-width="3"/>';
  /* 清涼湖 */
  h+='<ellipse cx="410" cy="395" rx="95" ry="38" fill="#8FC7DE" stroke="#2B2630" stroke-width="3"/><path d="M350 392q12-8 24 0t24 0M410 405q12-8 24 0t24 0" stroke="#fff" stroke-width="3" fill="none"/>';
  /* 月亮小屋 */
  h+='<g transform="translate(45 255)"><rect x="0" y="26" width="52" height="38" fill="#F6D9A8" stroke="#2B2630" stroke-width="3"/><polygon points="-8,28 26,0 60,28" fill="#E8503F" stroke="#2B2630" stroke-width="3"/><rect x="20" y="42" width="12" height="22" fill="#8B5E3C"/><path d="M80 6a14 14 0 1 0 8 24a11 11 0 1 1-8-24z" fill="#FFD76A" stroke="#2B2630" stroke-width="2"/></g>';
  /* 美食村 */
  h+='<g transform="translate(300 110)"><rect x="0" y="22" width="56" height="40" fill="#FFE3B8" stroke="#2B2630" stroke-width="3"/><polygon points="-8,24 28,0 64,24" fill="#FFB04A" stroke="#2B2630" stroke-width="3"/><rect x="40" y="-6" width="9" height="16" fill="#C97B5A" stroke="#2B2630" stroke-width="2"/><rect x="22" y="40" width="12" height="22" fill="#8B5E3C"/></g>';
  /* 心靈花園 */
  var fl=[[700,88,'#F28AA6'],[724,100,'#FFD76A'],[748,86,'#fff'],[772,102,'#F28AA6'],[796,88,'#FFB04A'],[820,100,'#F28AA6'],[708,118,'#fff'],[760,122,'#FFD76A'],[810,124,'#fff']];
  fl.forEach(function(f){h+='<g><line x1="'+f[0]+'" y1="'+f[1]+'" x2="'+f[0]+'" y2="'+(f[1]+16)+'" stroke="#5FA35E" stroke-width="3"/><circle cx="'+f[0]+'" cy="'+f[1]+'" r="8" fill="'+f[2]+'" stroke="#2B2630" stroke-width="2"/></g>'});
  /* 迷霧沼澤 */
  h+='<ellipse cx="900" cy="300" rx="90" ry="44" fill="#A9B58A" stroke="#2B2630" stroke-width="3"/><g fill="#C9A7D9" stroke="#2B2630" stroke-width="2"><circle cx="870" cy="294" r="9"/><circle cx="905" cy="310" r="6"/><circle cx="930" cy="288" r="7"/></g>';
  /* 魔王城 */
  h+='<g transform="translate(870 20)"><rect x="0" y="34" width="110" height="64" fill="#6C5B7B" stroke="#2B2630" stroke-width="3"/><rect x="-8" y="14" width="30" height="84" fill="#5A4A69" stroke="#2B2630" stroke-width="3"/><rect x="88" y="14" width="30" height="84" fill="#5A4A69" stroke="#2B2630" stroke-width="3"/><polygon points="-12,16 7,-14 26,16" fill="#E8503F" stroke="#2B2630" stroke-width="3"/><polygon points="84,16 103,-14 122,16" fill="#E8503F" stroke="#2B2630" stroke-width="3"/><rect x="42" y="62" width="26" height="36" rx="13" fill="#2B2630"/></g>';
  [[110,200,1],[190,190,.8],[250,330,.9],[330,250,.8],[470,300,1],[600,300,.9],[640,230,.8],[720,380,1],[840,200,.9],[560,420,.8],[160,380,.9],[30,160,.8]].forEach(function(t){h+=tree(t[0],t[1],t[2])});
  /* 小路 */
  for(var i=0;i<SPOTS.length-1;i++){var d=segPath(i),done=i<p;h+='<path d="'+d+'" fill="none" stroke="#2B2630" stroke-width="16" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="'+(done?'#7FB3C8':'#F9EBD2')+'" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+(done?'none':'4 14')+'"/>'}
  return h+'</svg>'}
function mapHtml(){var p=pos(),cur=Math.min(p,7),from=Math.min(SAVE.lastPos||0,7);
  var items=CH.map(function(c,i){return {id:c.id,title:c.title,emoji:c.emoji,i:i,ok:unlocked(i),s:stars(c.id),boss:c.boss.name,q:c.quiz.length,c:c}}).concat([{id:'final',title:'最終關',emoji:'👑',i:7,ok:finalOpen(),s:stars('final'),boss:FINAL.boss.name,q:10,c:FINAL}]);
  var h='<div class="worldmap" id="worldmap">'+mapSvg(p)+items.map(function(m){
    var st=m.s>0?'done':(m.ok?'open':'lock');
    return '<button class="spot '+st+(m.i===cur?' cur':'')+'" data-i="'+m.i+'" style="left:'+SPOTS[m.i][0]+'%;top:'+SPOTS[m.i][1]+'%" aria-label="第'+(m.i+1)+'站 '+esc(m.title)+'"><span class="sb">'+m.emoji+'<em>'+(m.s>0?'✔':(m.ok?(m.i+1):'🔒'))+'</em></span><span class="sl">'+esc(m.title)+'</span>'+(m.s>0?'<span class="ss">'+starStr(m.s)+'</span>':'')+'</button>'}).join('')+
   '<img class="walker" id="walker" src="assets/tangyuan_thinking.png" alt="湯圓" style="left:'+SPOTS[from][0]+'%;top:'+SPOTS[from][1]+'%"></div>'+
   '<div class="mpanel" id="mpanel"></div>';
  window.__items=items;return h}
function fillPanel(i){var m=window.__items[i],c=m.c,isF=m.id==='final';
  var box=document.getElementById('mpanel');if(!box)return;
  box.innerHTML=(isF?'<span class="big-e">👑</span>':'<img src="assets/'+esc(c.mascot)+'" alt="">')+'<div class="mi"><b>第 '+(i+1)+' 站 · '+esc(SCENE[i])+'(' +esc(m.title)+')</b><small>'+(isF?'魔王':'關主')+':'+esc(m.boss)+' · '+m.q+' 題 · '+starStr(m.s)+'</small></div><div class="macts">'+
   (isF?'':'<a class="btn ghost2" href="#'+m.id+'">📖 學習</a>')+(m.ok?'<a class="btn go" href="#'+m.id+(isF?'':'')+'/battle">⚔️ 闖關</a>':'<span class="btn dis">🔒 '+(isF?'七關後開啟':'通過上一關解鎖')+'</span>')+'</div>';
  document.querySelectorAll('.spot').forEach(function(x){x.classList.toggle('sel',+x.dataset.i===i)})}
function initMap(){var wm=document.getElementById('worldmap');if(!wm)return;var cur=Math.min(pos(),7);
  document.querySelectorAll('.spot').forEach(function(b){b.onclick=function(){fillPanel(+b.dataset.i)}});fillPanel(cur);
  var w=document.getElementById('walker');if((SAVE.lastPos||0)!==cur){setTimeout(function(){w.classList.add('walking');w.style.left=SPOTS[cur][0]+'%';w.style.top=SPOTS[cur][1]+'%';setTimeout(function(){w.classList.remove('walking')},1600)},500)}
  SAVE.lastPos=cur;persist()}

/* ===== 開場說明(第一次進站自動出現,也可按「❓ 這是什麼?」重看) ===== */
function showIntro(){
  var old=document.getElementById('intro');if(old)old.remove();
  var P=[
   ['🌱 歡迎來到健康小知識大冒險!','<p>這是把我們整理的 <b>26 篇一般新聞與衛教文章</b>(來自 LLM Wiki)做成的小遊戲:一邊讀、一邊玩,把睡眠、飲食、飲水、運動、用眼、心理健康、傳染病預防七個主題學起來。</p><p>每個數字都附有<b>來源和日期</b>,可以點進去看原文。</p>','tangyuan_thinking.png'],
   ['🍡 認識主角「湯圓」','<p><b>湯圓</b>是一顆頭上長著小芽的小湯圓,也是剛出發的新手冒險家——牠代表正在學習的<b>你</b>。</p><p>沿途每座城住著一位器官好朋友(小腦袋、小胃、小腎…),他們會用小故事帶你進入主題;而擋路的是擬人化的<b>壞習慣關主</b>,例如「熬夜大王」。</p>','tangyuan_thinking.png'],
   ['🎮 怎麼玩','<ol class="how"><li><b>選一座城</b>,先按 📖 學習:看故事、接任務,再一條一條讀線索。</li><li>按 ⚔️ 闖關,打敗關主:<b>答對攻擊、答錯扣愛心</b>(共 3 顆)。</li><li>通關拿星星,湯圓前往下一站;七關都過了,就能挑戰最終魔王 👑。</li></ol>','brain_love.png'],
   ['📌 先說清楚','<ul class="plain"><li>故事和關主都是<b>虛構</b>的,只是讓學習比較好玩。</li><li>數字與建議只出現在「線索」和題目解釋裡,而且都有來源。</li><li>內容是一般衛教資訊,<b>不能取代醫師診斷</b>。</li></ul>','stomach_happy.svg']];
  var i=0,ov=document.createElement('div');ov.id='intro';ov.className='overlay';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  function draw(){ov.innerHTML='<div class="win dlg"><div class="wbar"><span>新手說明 '+(i+1)+' / '+P.length+'</span><span class="wb"><button class="x" id="ix" aria-label="關閉">✕</button></span></div><div class="wbody"><img class="dimg" src="assets/'+P[i][2]+'" alt=""><h2>'+P[i][0]+'</h2>'+P[i][1]+'<div class="center">'+(i>0?'<button class="btn" id="ip">◀ 上一頁</button> ':'')+(i<P.length-1?'<button class="btn go" id="in">下一頁 ▶</button>':'<button class="btn go big" id="ig">⚔️ 開始冒險</button>')+'</div></div></div>';
    var q=function(id,f){var e=document.getElementById(id);if(e)e.onclick=f};
    q('ip',function(){i--;draw()});q('in',function(){i++;draw()});q('ig',close);q('ix',close);var f=ov.querySelector('.go');if(f)f.focus()}
  function close(){ov.remove();SAVE.seen=true;persist()}
  document.body.appendChild(ov);draw()}
function home(){var n=CH.reduce(function(a,c){return a+c.quiz.length},0);
  return consoleWrap('<div class="topline"><img class="titleimg" src="assets/tangyuan_thinking.png" alt=""><div class="tt"><span class="eyebrow">🎮 HEALTH QUEST · '+CH.length+' 個關卡 · '+n+' 道挑戰</span><h1 class="logo3d small">健康小知識大冒險</h1><a class="btn start" href="'+nextStage()+'">LET\'S START ▶</a> <button class="btn ghost2 helpb" id="help">❓ 這是什麼?</button></div>'+playerBar()+'</div><h2 class="mini">🗺️ 冒險地圖 <small>(每關:📖 學習 → ⚔️ 闖關)</small></h2>'+mapHtml()+
   '<details class="rd"><summary>📜 遊戲規則與設定</summary><ol class="rules inline"><li><b>01</b><span>答對攻擊關主,答錯扣 ❤️</span></li><li><b>02</b><span>不失誤通關 ★★★</span></li><li><b>03</b><span>內容只來自 wiki,附來源與日期</span></li><li><b>04</b><span>轉述會標明、無日期標「未標示」</span></li></ol>'+
   '<p class="center tiny"><button class="btn ghost2" id="unl">'+(SAVE.all?'恢復逐關解鎖':'🔓 解鎖全部關卡')+'</button> <button class="btn ghost2" id="rst">清除進度</button></p></details>')}

function marked(txt,gl){var h=esc(txt);gl.forEach(function(g){if(!g.term||g.term.length<2)return;var t=esc(g.term),i=h.indexOf(t);if(i<0)return;
  h=h.slice(0,i)+'<abbr class="term" title="'+esc(g.def)+'">'+t+'</abbr>'+h.slice(i+t.length)});return h}

/* ===== 小插圖:由資料欄位 art 畫出,只重述該線索已有的數字,不新增資料 ===== */
function artHtml(a){if(!a)return '';var h='',i;
  var T=function(x){return esc(x)};
  switch(a.type){
  case 'flow':h='<div class="art flow">'+a.items.map(function(x,k){return (k?'<span class="fa">➜</span>':'')+'<div class="fi"><span class="fe">'+x.e+'</span><b>'+T(x.t)+'</b></div>'}).join('')+'</div>';break;
  case 'chips':h='<div class="art chipsart">'+a.items.map(function(x){return '<div class="ci"><span class="fe">'+x.e+'</span><b>'+T(x.t)+'</b></div>'}).join('')+'</div>';break;
  case 'stats':h='<div class="art stats">'+a.items.map(function(x){return '<div class="si"><span class="fe">'+x.e+'</span><div class="big">'+T(x.big)+'</div><small>'+T(x.t)+'</small></div>'}).join('')+'</div>';break;
  case 'bars':h='<div class="art bars">'+a.rows.map(function(r,k){return '<div class="br"><span>'+T(r.t)+'</span><div class="bt"><i class="bc'+(k%3)+'" style="width:'+Math.max(4,Math.round(r.v/a.max*100))+'%"></i></div><b>'+r.v+' '+T(a.unit)+'</b></div>'}).join('')+'</div>';break;
  case 'ring':h='<div class="art ringart"><div class="ring" style="--p:'+a.pct+'"><b>'+a.pct+'%</b></div><span>'+T(a.t)+'</span></div>';break;
  case 'range':var l=a.from/a.max*100,w=(a.to-a.from)/a.max*100;h='<div class="art rangeart"><div class="rt">'+T(a.t)+'</div><div class="rl"><i style="left:'+l+'%;width:'+w+'%"></i></div><div class="rn"><span>0</span><b style="left:'+l+'%">'+a.from+'</b>'+(a.open?'<b style="left:97%">→</b>':'<b style="left:'+(a.to/a.max*100)+'%">'+a.to+'</b>')+'</div><small>單位:'+T(a.unit)+(a.open?'(超過 '+a.from+' 小時,依年齡不同)':'')+'</small></div>';break;
  case 'versus':h='<div class="art versus"><div class="vc"><span class="fe">'+a.a.e+'</span><b>'+T(a.a.t)+'</b><small>'+T(a.a.s)+'</small></div><div class="vs">'+T(a.sym)+'</div><div class="vc"><span class="fe">'+a.b.e+'</span><b>'+T(a.b.t)+'</b><small>'+T(a.b.s)+'</small></div></div>';break;
  case 'diff':h='<div class="art diff"><div class="dh"><span></span><b>'+T(a.ha)+'</b><span></span><b>'+T(a.hb)+'</b></div>'+a.rows.map(function(r){return '<div class="dr"><span>'+T(r.t)+'</span><em>'+T(r.a)+'</em><span class="fa">➜</span><strong>'+T(r.b)+'</strong></div>'}).join('')+'</div>';break;
  case 'week':h='<div class="art weekart">'+a.rows.map(function(r){var d='';for(i=0;i<7;i++)d+='<i class="'+(i<r.n?'on':'')+'">'+(i<r.n?'✔':'')+'</i>';return '<div class="wr"><span>'+T(r.t)+'</span><div class="wd">'+d+'</div><b>每週至少 '+r.n+' 次</b></div>'}).join('')+'</div>';break;
  case 'plate':var acc=0,cols=['var(--red)','var(--orange)','var(--blue)','var(--yellow)'],st=a.parts.map(function(x,k){var f=acc;acc+=x.pct;return cols[k%4]+' '+f+'% '+acc+'%'}).join(',');
    h='<div class="art plateart"><div class="plate" style="background:conic-gradient('+st+')"><i></i></div><ul>'+a.parts.map(function(x,k){return '<li><span style="background:'+cols[k%4]+'"></span>'+T(x.t)+' '+x.pct+'%</li>'}).join('')+'</ul><small>'+T(a.t)+'</small></div>';break}
  return '<div class="artwrap" role="img" aria-label="示意圖">'+h+'</div>'}
var CURPAGE=0;
function chapter(c){
  var ix=CH.indexOf(c),gl=c.glossary||[],N=c.points.length,pages=[],labels=[];
  var used={};
  pages.push('<div class="vstory"><img class="bimg2" src="assets/'+esc(c.mascot)+'" alt="">'+(c.story?winBox('小故事 · '+c.story.title,c.story.text.map(function(t){return '<p>'+esc(t)+'</p>'}).join('')+'<p class="snote">'+esc(c.story.note||'虛構小故事')+'</p>','story'):'')+'</div>'+(c.story&&c.story.quest?'<div class="quest"><span>🎯 任務</span>'+esc(c.story.quest)+'<small>湯圓會一條一條找線索來解開它,按「下一頁」出發!</small></div>':''));labels.push('故事');
  c.points.forEach(function(p,i){
    var cards=gl.filter(function(g){return g.term&&g.term.length>=2&&p.text.indexOf(g.term)>=0&&!used[g.term]});cards.forEach(function(g){used[g.term]=1});
    pages.push('<div class="cluepage"><div class="clueh"><img src="assets/'+esc(c.mascot)+'" alt=""><span class="cn">線索 '+(i+1)+' / '+N+'</span></div><div class="pt clue big"><p>'+marked(p.text,gl)+'</p><div class="chips">'+chip(c,p.src)+(p.note?'<span class="chip warn">'+esc(p.note)+'</span>':'')+'</div></div>'+artHtml(p.art)+
      (cards.length?'<div class="gl small">'+cards.map(function(g){return '<div><b>🃏 '+esc(g.term)+'</b><span>'+esc(g.def)+'</span></div>'}).join('')+'</div>':'')+'</div>');labels.push('線索 '+(i+1))});
  var rest=gl.filter(function(g){return !used[g.term]});
  if(c.formula){var f=c.formula;pages.push('<div class="formula"><h3>'+esc(f.title)+'</h3><div>'+esc(f.tex)+'</div><div>'+esc(f.example)+'</div><div class="note">'+esc(f.note)+'</div></div>');labels.push('公式')}
  if(rest.length){pages.push('<h2 class="sec">🃏 其他詞卡</h2><div class="gl">'+rest.map(function(g){return '<div><b>'+esc(g.term)+'</b><span>'+esc(g.def)+'</span></div>'}).join('')+'</div>');labels.push('詞卡')}
  pages.push('<h2 class="sec">⚠️ 資料缺口與限制</h2><ul class="plain">'+c.gaps.map(function(g){return '<li>'+esc(g)+'</li>'}).join('')+'</ul><h2 class="sec">📚 來源</h2><div class="srcgrid">'+Object.keys(c.sources).map(function(k){var s=c.sources[k];return '<div class="src"><a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.title)+'</a><small>'+esc(s.publisher)+' · '+esc(s.date)+'</small><small>可信度:'+esc(s.credibility)+'</small></div>'}).join('')+'</div>');labels.push('來源');
  pages.push('<div class="bosscta"><img src="assets/'+esc(c.mascot)+'" alt=""><div><b>線索收集完畢!關主:'+esc(c.boss.name)+'</b><p>「'+esc(c.boss.line)+'」</p><a class="btn go big" href="#'+c.id+'/battle">⚔️ 挑戰關主</a></div></div>');labels.push('闖關');
  return '<div class="chead"><b>第 '+(ix+1)+' 關 · '+c.emoji+' '+esc(c.title)+'</b><span class="st">'+starStr(stars(c.id))+'</span></div><div class="dots" id="dots">'+labels.map(function(l,i){return '<button class="dot" data-i="'+i+'" title="'+esc(l)+'" aria-label="'+esc(l)+'"></button>'}).join('')+'</div>'+
   '<div id="pages">'+pages.map(function(x,i){return '<section class="cpage" data-i="'+i+'" hidden>'+x+'</section>'}).join('')+'</div>'+
   '<div class="pnav"><button class="btn" id="prev">◀ 上一頁</button><button class="nextptr" id="next"><img src="assets/'+esc(c.mascot)+'" alt=""><span><b id="nextlabel">下一頁</b><i class="arr">▼</i></span></button></div>'}
function pager(c){var ps=document.querySelectorAll('.cpage'),ds=document.querySelectorAll('.dot'),pv=document.getElementById('prev'),nx=document.getElementById('next'),lb=document.getElementById('nextlabel'),cur=0;
  function go(i){cur=Math.max(0,Math.min(ps.length-1,i));ps.forEach(function(p,k){p.hidden=k!==cur;if(k===cur){p.classList.remove('flip');void p.offsetWidth;p.classList.add('flip')}});ds.forEach(function(d,k){d.classList.toggle('on',k===cur);d.classList.toggle('past',k<cur)});
    pv.style.visibility=cur===0?'hidden':'visible';nx.style.visibility=cur===ps.length-1?'hidden':'visible';
    lb.textContent=cur===ps.length-2?'去挑戰關主!':(cur===0?'出發找線索!':'下一頁');
    var sc=document.getElementById('scroller');if(sc)sc.scrollTop=0}
  ds.forEach(function(d){d.onclick=function(){go(+d.dataset.i)}});pv.onclick=function(){go(cur-1)};nx.onclick=function(){go(cur+1)};
  document.onkeydown=function(e){if(e.key==='ArrowRight'||e.key==='ArrowDown'&&e.altKey)go(cur+1);if(e.key==='ArrowLeft')go(cur-1)};go(0)}
function battle(c){
  var box=document.getElementById('game'),isF=c.id==='final',L='ABCD';
  var pool=isF?shuffle([].concat.apply([],CH.map(function(x){return x.quiz.map(function(q){return{q:q,c:x}})}))).slice(0,10):shuffle(c.quiz).map(function(q){return{q:q,c:c}});
  var hp,max=pool.length,hearts,idx,wrong,combo,best,missed;
  function intro(){
    box.innerHTML='<section class="arena"><div class="boss"><img src="assets/'+esc(c.mascot)+'" alt=""></div><div class="say"><b>'+esc(c.boss.name)+'</b><p>「'+esc(c.boss.line)+'」</p></div></section>'+
     (c.story?winBox('開場 · '+c.story.title,c.story.text.map(function(t){return '<p>'+esc(t)+'</p>'}).join(''),'story'):'')+
     '<p class="rule">規則:答對攻擊關主;答錯扣 1 顆 ❤️(共 3 顆)。不失誤通關拿 ★★★。每題都附來源。</p><div class="center"><button class="btn go big" id="start">⚔️ 開始戰鬥</button> <a class="btn ghost2" href="#'+(isF?'home':c.id)+'">'+(isF?'回地圖':'📖 先複習章節')+'</a></div>';
    document.getElementById('start').onclick=start}
  function start(){pool=isF?shuffle([].concat.apply([],CH.map(function(x){return x.quiz.map(function(q){return{q:q,c:x}})}))).slice(0,10):shuffle(pool);max=pool.length;hp=max;hearts=3;idx=0;wrong=0;combo=0;best=0;missed=[];ask()}
  function hud(){return '<div class="hud"><div class="hp"><span>'+esc(c.boss.name)+'</span><div class="bar boss-bar"><i style="width:'+Math.round(hp/max*100)+'%"></i></div></div><div class="me"><span class="hearts" aria-label="剩餘生命">'+'❤️'.repeat(hearts)+'🖤'.repeat(3-hearts)+'</span>'+(combo>=2?'<span class="combo">🔥 連擊 ×'+combo+'</span>':'')+'</div></div>'}
  function ask(){
    var it=pool[idx],q=it.q,opts=shuffle(q.options.map(function(o,k){return{o:o,k:k}}));
    box.innerHTML=hud()+'<div class="bgrid"><div class="qcol"><section class="arena small"><div class="boss shake0"><img src="assets/'+esc(c.mascot)+'" alt=""></div><div class="say"><b>第 '+(idx+1)+' 回合 · 關主剩 '+hp+' 點生命'+(isF?' · '+esc(it.c.title):'')+'</b><p class="stem">'+esc(q.q)+'</p></div></section></div><div class="acol"><div class="opts" id="o">'+opts.map(function(x,n){return '<button class="opt" data-k="'+x.k+'"><span class="l">'+L[n]+'</span><span>'+esc(x.o)+'</span></button>'}).join('')+'</div><div class="exp" id="fb" hidden aria-live="polite"></div></div></div>';
    var done=false;
    function pick(b){if(done)return;done=true;var k=+b.dataset.k,ok=k===q.answer,bs=box.querySelectorAll('.opt');
      bs.forEach(function(x){x.disabled=true;if(+x.dataset.k===q.answer)x.classList.add('correct')});
      var fb=document.getElementById('fb');fb.hidden=false;
      if(ok){hp--;combo++;best=Math.max(best,combo);box.querySelector('.boss').classList.add('hit')}else{b.classList.add('wrong');hearts--;wrong++;combo=0;missed.push(it);pool.push(it);box.querySelector('.arena').classList.add('hurt')}
      fb.innerHTML=(ok?'<b>命中!'+(combo>=2?' 連擊 ×'+combo+'!':'')+'</b> ':'<b>被打到了…正確答案是 '+L[opts.map(function(x){return x.k}).indexOf(q.answer)]+'。</b> ')+esc(q.why)+' '+chip(it.c,q.src)+'<div class="center"><button class="btn go" id="nx">'+((hp===0||hearts===0)?'看結果':'下一回合 ▶')+'</button></div>';
      box.querySelector('.hud .boss-bar i').style.width=Math.round(hp/max*100)+'%';
      box.querySelector('.hearts').textContent='❤️'.repeat(hearts)+'🖤'.repeat(3-hearts);
      var nx=document.getElementById('nx');nx.focus();nx.onclick=function(){if(hp===0)win();else if(hearts===0)lose();else{idx++;ask()}}}
    document.getElementById('o').addEventListener('click',function(e){var b=e.target.closest('.opt');if(b)pick(b)});
    box.onkeydown=function(e){var n='1234'.indexOf(e.key);if(n<0)n='abcdABCD'.indexOf(e.key)%4;if(n>=0&&e.key.length===1){var bs=box.querySelectorAll('.opt');if(bs[n])pick(bs[n])}}}
  function review(){return missed.length?'<h3>再複習一下</h3><ul class="plain">'+missed.map(function(it){return '<li>'+esc(it.q.q)+' → '+esc(it.q.options[it.q.answer])+'</li>'}).join('')+'</ul>':''}
  function lose(){box.innerHTML='<section class="result"><div class="big-e">😵</div><h2>挑戰失敗…</h2><p>'+esc(c.boss.name)+'還剩 '+hp+' 點生命。回去看一下重點再來!</p>'+review()+'<div class="center"><button class="btn go big" id="again">再戰一次</button> <a class="btn ghost2" href="#'+(isF?'home':c.id)+'">'+(isF?'回地圖':'📖 複習章節')+'</a></div></section>';document.getElementById('again').onclick=start}
  function win(){var n=wrong===0?3:(wrong===1?2:1),was=stars(c.id),lv0=level().i,p0=pos();if(n>was){SAVE.stars[c.id]=n;persist()}var lv1=level();
    var idxc=CH.indexOf(c),nextC=CH[idxc+1];var p1=pos();
    box.innerHTML='<section class="result win"><div class="confetti" aria-hidden="true">🎉✨🎊⭐🎉✨🎊⭐</div><div class="big-e">'+c.emoji+'</div><h2>擊敗了'+esc(c.boss.name)+'!</h2><div class="starbig">'+starStr(n)+'</div><p>最高連擊 ×'+best+' · 失誤 '+wrong+' 次'+(n>was&&was>0?' · 星數提升!':'')+'</p>'+(lv1.i>lv0?'<p class="lvup">🆙 升級!你現在是「'+lv1.name+'」</p>':'')+(isF?'<p class="lvup">👑 你通關了整座健康世界!</p>':(p1>p0?'<p class="walk">🚶 湯圓出發前往'+(nextC?'「'+esc(nextC.title)+'」':'最終關')+'…</p>'+trailHtml(p0):''))+review()+
     '<div class="center">'+(isF?'':(nextC?'<a class="btn go big" href="#'+nextC.id+'">下一關 ▶</a>':'<a class="btn go big" href="#final/battle">前往最終關 ▶</a>'))+' <button class="btn" id="again">再挑戰(刷星)</button> <a class="btn ghost2" href="#home">🗺️ 回地圖</a></div></section>';
    document.getElementById('again').onclick=start;if(p1>p0)walkTrail(box,p0,p1)}
  intro()}
function render(){
  var parts=(location.hash||'#home').slice(1).split('/'),id=parts[0],mode=parts[1],c=id==='final'?FINAL:CH.filter(function(x){return x.id===id})[0];
  if(!c)id='home';
  document.onkeydown=null;
  nav.innerHTML=navHtml(c&&id!=='final'?id:'home');
  if(c&&mode==='battle'){
    var ix=CH.indexOf(c);
    if(id==='final'&&!finalOpen()||id!=='final'&&!unlocked(ix)){app.innerHTML='<section class="result"><div class="big-e">🔒</div><h2>這一關還沒開啟</h2><p>先通過前面的關卡吧!</p><div class="center"><a class="btn go" href="#home">🗺️ 回地圖</a></div></section>'}
    else{app.innerHTML=consoleWrap('','game');battle(c)}
  }else if(c&&id!=='final'){app.innerHTML=chapter(c);pager(c)}
  else{app.innerHTML=home();initMap();var hb=document.getElementById('help');if(hb)hb.onclick=showIntro;if(!SAVE.seen)showIntro()}
  var u=document.getElementById('unl');if(u){u.onclick=function(){SAVE.all=!SAVE.all;persist();render()};document.getElementById('rst').onclick=function(){if(confirm('確定清除所有進度?')){SAVE={stars:{},all:false};persist();render()}}}
  if(window.renderMathInElement)renderMathInElement(app,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});
  var sc=document.getElementById('scroller');if(sc)sc.scrollTop=0;window.scrollTo(0,0);document.title=(c?c.title+' | ':'')+'健康小知識大冒險'}
window.addEventListener('hashchange',render);
var t=document.getElementById('theme');
try{var sv=localStorage.getItem('theme');if(sv)document.documentElement.dataset.theme=sv}catch(e){}
t.onclick=function(){var r=document.documentElement,n=r.dataset.theme==='dark'?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('theme',n)}catch(e){}};
render();
})();
