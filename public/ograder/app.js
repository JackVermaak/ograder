(function(){
'use strict';
var FR=['4','5a','5b','5c','6a','6a+','6b','6b+','6c','6c+','7a','7a+','7b','7b+','7c','7c+','8a','8a+','8b','8b+','8c','8c+','9a','9a+','9b','9b+','9c','9c+'];
var YDS={'4':'5.5','5a':'5.7','5b':'5.8','5c':'5.9','6a':'5.10a','6a+':'5.10b','6b':'5.10c','6b+':'5.10d','6c':'5.11b','6c+':'5.11c','7a':'5.11d','7a+':'5.12a','7b':'5.12b','7b+':'5.12c','7c':'5.12d','7c+':'5.13a','8a':'5.13b','8a+':'5.13c','8b':'5.13d','8b+':'5.14a','8c':'5.14b','8c+':'5.14c','9a':'5.14d','9a+':'5.15a','9b':'5.15b','9b+':'5.15c','9c':'5.15d','9c+':'5.16a'};
var FONT=['5','6A','6A+','6B','6B+','6C','6C+','7A','7A+','7B','7B+','7C','7C+','8A','8A+','8B','8B+','8C','8C+','9A','9A+'];
var VG={'5':'V2','6A':'V3','6A+':'V3','6B':'V4','6B+':'V4','6C':'V5','6C+':'V5','7A':'V6','7A+':'V7','7B':'V8','7B+':'V8','7C':'V9','7C+':'V10','8A':'V11','8A+':'V12','8B':'V13','8B+':'V14','8C':'V15','8C+':'V16','9A':'V17','9A+':'V18'};
var EG=['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10','E11','E12'];
var SCALES={S:FR,B:FONT,T:EG};
/* 8a.nu scorecard statistics, all time: [grade, total, onsight, flash, redpoint] */
var STATS=[['8a',352,243,37,72],['8a+',339,236,17,86],['8b',306,167,21,118],['8b+',225,108,6,111],['8c',204,73,1,130],['8c+',176,23,3,150],['9a',135,4,2,129],['9a+',51,0,1,50],['9b',24,0,0,24],['9b+',4,0,0,4],['9c',1,0,0,1]];

/* Model tables. first(i) = O-grade when he does it first try; p(i) = share of sends done first try;
   rp(i) = [typical, low, high, suffix] sessions when it takes a redpoint. */
var MODEL={
 S:{
  first:function(i){return i<=5?[-3,'']:i<=9?[-3,'+']:i<=11?[-2,'-']:i<=13?[-2,'']:i==14?[-2,'+']:i==15?[-1,'-']:i==16?[-1,'']:i==17?[-1,'+']:i<=19?[0,'-']:i==20?[0,'']:[0,'+'];},
  p:function(i){return i<=15?0.97:[0.80,0.75,0.61,0.51,0.36,0.15,0.04,0.02,0,0,0,0][i-16];},
  rp:function(i){return i<=20?[1,1,1,'']:i==21?[1,1,2,'']:i==22?[1,1,3,'']:i==23?[2,1,5,'']:i==24?[7,4,10,'']:i==25?[30,20,45,'']:i==26?[60,60,60,'']:null;}
 },
 B:{
  first:function(i){return i<=6?[-3,'']:i<=10?[-2,'']:i<=12?[-1,'-']:i==13?[-1,'']:i==14?[0,'-']:i==15?[0,'']:[0,'+'];},
  p:function(i){return i<=10?0.8:i==11?0.6:i==12?0.5:i==13?0.4:i<=15?0.3:i==16?0.12:i==17?0.15:0;},
  rp:function(i){return i<=15?[1,1,1,'']:i==16?[1,1,3,'']:i==17?[2,1,4,'']:i==18?[11,5,11,'']:i==19?[5,4,5,'']:i==20?[8,4,15,'']:null;}
 },
 T:{
  first:function(i){return i<=4?[-2,'']:i==5?[-1,'-']:i==6?[-1,'']:i==7?[0,'-']:i==8?[0,'']:[0,'+'];},
  p:function(i){return i<=7?0.8:i==8?0.5:i<=10?0.3:0;},
  rp:function(i){return i<=8?[1,1,1,'']:i==9?[1,1,2,'']:i==10?[2,1,3,'']:i==11?[3,3,25,'']:null;}
 }
};
/* O-grades Ondra gave himself. */
var STATED={silence:[60,''],laduradura:[42,'+'],bonvoyage:[3,''],dna:[-2,'-'],bourinator:[-1,''],marroncita:[0,'-'],mindcontrol:[0,''],lasensaciondelbloque:[1,'+'],ildomani:[0,'+'],supercrackinette:[0,'+'],justdoit:[0,'+']};
/* Codes corrected by hand from the ascent notes. */
var FIX={golpedeestado:'t29',vasilvasil:'r20-25',crs:'d3',corona:'t8',hades:'t9',thedawnwall:'r25-30',neanderthal:'w'};

function norm(s){return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function fmt(n,mod){return 'O'+n+(mod||'');}
function tierOf(n){return n<0?'easy':n===0?'focus':n<10?'project':'siege';}
function tierName(n,mod){
  var side=mod=='+'?', hard end':mod=='-'?', easy end':'';
  if(n<=-3)return 'Approach scramble'+side;
  if(n==-2)return 'Easy warm-up'+side;
  if(n==-1)return 'Regular warm-up'+side;
  if(n===0)return mod=='+'?'First try, a muerte':mod=='-'?'First try, awake':'First try, focused';
  if(n==1)return mod=='-'?'Second go or so':mod=='+'?'One long session':'One session';
  if(n<=3)return 'A short project';
  if(n<10)return 'A real project';
  if(n<40)return 'A siege';
  return 'A multi-year project';
}
function gradeLabel(type,g){
  if(type=='S')return g+(YDS[g]?' ('+YDS[g]+')':'');
  if(type=='B')return g+(VG[g]?' ('+VG[g]+')':'');
  return g;
}
var TYPE={S:'Sport',B:'Boulder',T:'Trad'};

/* ---------- data ---------- */
var raw=window.OG_DATA.split('\n'),sec='',crags=[],climbs=[],hooks=[];
raw.forEach(function(l){
  if(!l)return;
  if(l.charAt(0)=='#'){sec=l;return;}
  if(sec=='#CRAGS'){crags.push(l);return;}
  var p=l.split('|');
  climbs.push({n:p[0],crag:p[1]===''?'':crags[+p[1]],type:sec.charAt(1),g:p[2],yy:p[3],k:p[4]||''});
});
climbs.push({n:'DNA',crag:'Kalymnos, Greece',type:'S',g:'7a',yy:'',k:'o'});
climbs.forEach(function(c){
  c.key=norm(c.n);
  c.fa=/!$/.test(c.k); c.k=c.k.replace('!','');
  if(FIX[c.key]&&c.type!='B')c.k=FIX[c.key];
  c.gi=SCALES[c.type].indexOf(c.g);
  c.hay=c.key+' '+norm(c.crag);
});

/* ---------- grading ---------- */
function mix(type,i){
  var M=MODEL[type],max=SCALES[type].length-1;
  if(i>max||!M.rp(i))return {none:true};
  return {p:M.p(i),first:M.first(i),rp:M.rp(i)};
}
function rpText(r){return r[1]==r[2]?fmt(r[0],r[3]):fmt(r[0],r[3])+' (range O'+r[1]+' to O'+r[2]+')';}
function grade(c){
  var st=STATED[c.key],m=mix(c.type,c.gi),k=c.k,mm,n;
  var year=c.yy?' in 20'+c.yy:'',age=c.yy?2000+ +c.yy-1993:99,kid=age<16?' He was about '+age+' then, so read this as how the grade sits for him now.':'';
  if(st&&!(c.key=='bonvoyage'&&false))
    return {n:st[0],mod:st[1],conf:'stated',why:'He graded this one himself.'+(k=='o'?' Onsighted'+year+'.':k=='f'?' Flashed'+year+'.':(mm=/^s(\d+)/.exec(k))?' '+mm[1]+' sessions on record.':'')};
  if(k=='o'||k=='f'||k=='co'||k=='cf'){
    var f=m.first; n={n:f[0],mod:f[1]};
    n.conf=k.length==1?'recorded':'comment';
    n.why=(k.charAt(k.length-1)=='o'?'Onsighted':'Flashed')+year+(k.length==1?(c.fresh?', per climbing-history.org.':', per his 8a.nu logbook.'):', going by his logbook comment.')+' The suffix follows his own scale for a first-try '+c.g+'.'+kid;
    return n;
  }
  if((mm=/^s(\d+)/.exec(k)))return {n:+mm[1],mod:'',num:+mm[1],conf:'recorded',why:mm[1]+(mm[1]=='1'?' session':' sessions')+' on record'+year+'.'};
  if((mm=/^d(\d+)/.exec(k)))return {n:+mm[1],mod:'',num:+mm[1],conf:'comment',why:mm[1]+(mm[1]=='1'?' day':' days')+' on the route, going by his logbook comment.'};
  if((mm=/^r(\d+)-(\d+)/.exec(k)))return {n:+mm[1],mod:'',head:'O'+mm[1]+'–'+mm[2],num:(+mm[1]+ +mm[2])/2,conf:c.key=='thedawnwall'?'estimated':'recorded',why:c.key=='thedawnwall'?'About three weeks of work plus an eight-day push.':'He put it at '+mm[1]+' to '+mm[2]+' days.'};
  if((mm=/^g(\d+)/.exec(k))){
    var g=+mm[1];
    if(g==1)return {n:0,mod:'+',conf:'recorded',why:'First go, after inspecting the holds on a rope. Not a clean flash, so it sits at the top of O0.'};
    return {n:1,mod:g==2?'-':g==3?'':'+',num:1,conf:'recorded',why:'Sent on his '+['','','second','third','fourth','fifth','sixth'][Math.min(g,6)]+' go'+year+', so one session.'+kid};
  }
  if((mm=/^t(\d+)/.exec(k))){
    var t=+mm[1];
    if(t<=5)return {n:1,mod:t>=4?'+':'',num:1,conf:'recorded',why:t+' tries in total. Counted as one session.'};
    var lo=Math.ceil(t/6),hi=Math.ceil(t/3),ty=Math.ceil(t/4);
    return {n:ty,mod:'',head:'O'+ty,num:ty,conf:'estimated',why:t+' tries on record. Sessions are not, so this assumes about four tries a session (range O'+lo+' to O'+hi+').'};
  }
  if(m.none)return {n:99,mod:'',head:'O?',conf:'estimated',why:'No model for this grade.'};
  if(k=='w'){
    var r=m.rp;
    return {n:r[0],mod:r[3],conf:'estimated',why:(c.fa?'His first ascent'+year+'. ':'Redpointed'+year+'. ')+'It was not a second-go send and the session count is not public, so this is his typical '+c.g+' redpoint: '+rpText(r)+'.'+(age<16?' He was about '+age+' then, so it may well have taken longer.':'')};
  }
  /* style unknown */
  var a=m.first,b=m.rp,p=m.p;
  var o=p>=0.5?{n:a[0],mod:a[1]}:{n:b[0],mod:b[3]};
  o.conf='estimated';
  o.split={p:p,a:fmt(a[0],a[1]),b:rpText(b)};
  o.why=(c.yy?'He logged the send'+year+', but not the style. ':'')+(p>0?'He climbs '+Math.round(p*100)+'% of his '+c.g+' sends first try.':'He has never done a '+c.g+' first try.');
  return o;
}

/* ---------- render ---------- */
var BADGE={stated:'Ondra-stated',recorded:'Recorded',comment:'Logbook comment',estimated:'Estimated'};
function card(title,meta,r,bare){
  var head=r.head?esc(r.head):'O'+r.n+(r.mod?'<span class="sfx">'+r.mod+'</span>':''),h='<div class="card t-'+tierOf(r.n)+'">';
  h+='<div class="climb"><span class="name">'+title+'</span>'+meta+'</div>';
  h+='<div class="grade num">'+head+'</div>';
  h+='<div class="tier">'+(r.n==99?'Nobody knows':tierName(r.n,r.mod))+'</div>';
  if(bare)return h+'</div>';
  h+='<div class="why"><p><span class="badge b-'+r.conf+'">'+BADGE[r.conf]+'</span></p><p>'+esc(r.why)+'</p>';
  if(r.split&&r.split.p>0){
    var pc=Math.round(r.split.p*100);
    h+='<div class="split"><div class="bar" role="img" aria-label="'+pc+'% first try, '+(100-pc)+'% redpoint"><i class="a" style="width:'+pc+'%"></i><i class="b" style="width:'+(100-pc)+'%"></i></div>';
    h+='<div class="legend"><span><span class="dot" style="background:var(--focus)"></span>First try '+pc+'%: <b>'+esc(r.split.a)+'</b></span><span><span class="dot" style="background:var(--project)"></span>Redpoint '+(100-pc)+'%: <b>'+esc(r.split.b)+'</b></span></div></div>';
  }
  return h+'</div></div>';
}
function show(c,quiet){
  if(!quiet&&c.key&&!/^(settings|sidebar|customize|upgrade|downloads)$/.test(c.key)){try{history.replaceState(null,'','#'+c.key);}catch(e){}}
  var meta='<span class="chip">'+esc(gradeLabel(c.type,c.g))+'</span><span class="muted">'+TYPE[c.type]+(c.crag?' · '+esc(c.crag):'')+(c.fa?' · first ascent':'')+(c.fresh?' · new, via climbing-history.org':'')+'</span>';
  document.getElementById('result').innerHTML=card(esc(c.n),meta,grade(c));
}

if(document.getElementById('q')){
/* ---------- search ---------- */
var q=document.getElementById('q'),sug=document.getElementById('sug'),hits=[],sel=-1;
function find(s){
  var t=norm(s),out=[];
  if(t.length<2)return out;
  for(var i=0;i<climbs.length;i++){
    var c=climbs[i],at=c.key.indexOf(t),sc=at===0?(c.key.length==t.length?0:1):at>0?2:c.hay.indexOf(t)>=0?3:9;
    if(sc<9)out.push([sc*100-c.gi,c]);
  }
  out.sort(function(x,y){return x[0]-y[0];});
  return out.slice(0,9).map(function(x){return x[1];});
}
function paint(){
  if(!hits.length){sug.hidden=true;q.setAttribute('aria-expanded','false');return;}
  sug.innerHTML=hits.map(function(c,i){
    return '<li role="option" id="s'+i+'" data-i="'+i+'" aria-selected="'+(i==sel)+'"><span class="n">'+esc(c.n)+'</span><span class="chip">'+esc(c.g)+'</span><span class="c">'+esc(c.crag||TYPE[c.type])+'</span></li>';
  }).join('');
  sug.hidden=false;q.setAttribute('aria-expanded','true');
}
function pick(c){q.value=c.n;hits=[];sel=-1;paint();show(c);}
q.addEventListener('input',function(){hits=find(q.value);sel=hits.length?0:-1;paint();});
q.addEventListener('keydown',function(e){
  if(e.key=='ArrowDown'&&hits.length){sel=(sel+1)%hits.length;paint();e.preventDefault();}
  else if(e.key=='ArrowUp'&&hits.length){sel=(sel+hits.length-1)%hits.length;paint();e.preventDefault();}
  else if(e.key=='Enter'){
    if(hits[sel])pick(hits[sel]);
    else if(q.value.trim())document.getElementById('result').innerHTML='<div class="card"><p><b>'+esc(q.value)+'</b> is not in his logbook, or is logged under another name.</p><p class="muted"><a href="estimate">Estimate it from its grade</a> instead.</p></div>';
  }
  else if(e.key=='Escape'){hits=[];paint();}
});
sug.addEventListener('mousedown',function(e){var li=e.target.closest('li');if(li){e.preventDefault();pick(hits[+li.dataset.i]);}});
q.addEventListener('blur',function(){setTimeout(function(){hits=[];paint();},120);});
var named=climbs.filter(function(c){return c.k&&c.n!='N.N.';});
/* Random pick weighted toward harder climbs: each grade step is 1.5x as likely. Boulder and trad grades are shifted onto the sport scale. */
var OFF={S:0,B:7,T:11},wsum=0,wts=named.map(function(c){var w=Math.pow(1.5,c.gi+OFF[c.type]-16);wsum+=w;return w;});
function lucky(){var r=Math.random()*wsum,i=0;while(i<wts.length-1&&(r-=wts[i])>0)i++;return named[i];}
document.getElementById('rand').addEventListener('click',function(){pick(lucky());});

function fromHash(){var k=location.hash.slice(1),c=k&&climbs.filter(function(x){return x.key==k;})[0];if(c){q.value=c.n;show(c);}return !!c;}
window.addEventListener('hashchange',function(){if(fromHash())document.getElementById('result').scrollIntoView({block:'center',behavior:'smooth'});});
var hashOk=fromHash();if(!hashOk)show(lucky(),true);
hooks.push(function(){if(!hashOk&&location.hash.length>1)hashOk=fromHash();});
}
if(document.getElementById('e-type')){
/* ---------- estimator ---------- */
var eT=document.getElementById('e-type'),eG=document.getElementById('e-grade'),eS=document.getElementById('e-style');
function fillGrades(){
  var t=eT.value,sc=SCALES[t],def={S:'8b+',B:'8A',T:'E9'}[t];
  eG.innerHTML=sc.map(function(g){return '<option'+(g==def?' selected':'')+'>'+esc(gradeLabel(t,g))+'</option>';}).join('');
  eS.querySelector('[value="5"]').disabled=t=='B';
  if(t=='B'&&eS.value=='5')eS.value='0';
}
function estimate(){
  var t=eT.value,sc=SCALES[t],i=eG.selectedIndex,sh=+eS.value,j=Math.max(0,i+sh),g=sc[i];
  var meta='<span class="chip">'+esc(gradeLabel(t,g))+'</span><span class="muted">'+TYPE[t]+' · '+esc(eS.options[eS.selectedIndex].text)+'</span>';
  var r,over=j>sc.length-1||mix(t,j).none;
  if(over)r={n:99,mod:'',head:'O∞',conf:'estimated',why:sh>0&&i<sc.length-1?'With that terrain it lands past anything he has climbed. Ask again in a few years.':'Nobody has climbed this grade, him included. Ask again in a few years.'};
  else{
    r=grade({key:'',type:t,gi:j,g:sc[j],yy:'',k:''});
    if(j!=i)r.why=(sh<0?'His wheelhouse makes ':'That terrain makes ')+g+' feel like '+sc[j]+' for him, so these are his '+sc[j]+' numbers. '+r.why;
    if(t=='T')r.why+=' The trad model rests on nine ascents.';
  }
  document.getElementById('est').innerHTML=card('Any '+esc(g),meta,r,true);
}
eT.addEventListener('change',function(){fillGrades();estimate();});
eG.addEventListener('change',estimate);eS.addEventListener('change',estimate);

fillGrades();estimate();
}
/* ---------- static tables ---------- */
function link(name){return '<a class="linkish" href="./#'+esc(norm(name))+'">'+esc(name)+'</a>';}
function fill(id,html){var el=document.getElementById(id);if(el)el.innerHTML=html;}
var LADDER=[
 ['O-3','easy','A scramble. The approach.',[]],
 ['O-2','easy','An easy warm-up.',[['DNA','7a, O-2-']]],
 ['O-1','easy','A regular warm-up.',[['Bourinator','8a']]],
 ['O0','focus','A climb where he has to be focused. Minus if casual.',[['Marroncita','8b, O-0-'],['Mind Control','8c']]],
 ['O0+','focus','He has to fight “a muerte” on his first try.',[['Il Domani','9a onsight'],['Super Crackinette','9a+ flash'],['Just Do it','8c+']]],
 ['O1','project','Done within one session.',[['La Sensacion del Bloque','9a, O1+']]],
 ['O3','project','Three sessions.',[['Bon Voyage','9a']]],
 ['O42+','siege','Forty-two sessions and a big fight.',[['La Dura dura','9b+']]],
 ['O60','siege','Sixty sessions.',[['Silence','9c']]]
];
fill('scale',LADDER.map(function(r){
  return '<tr><td class="g num" style="color:var(--'+r[1]+')">'+r[0]+'</td><td>'+esc(r[2])+'</td><td>'+(r[3].map(function(x){return link(x[0])+' <span class="muted">'+esc(x[1])+'</span>';}).join('<br>')||'<span class="muted">The walk-in</span>')+'</td></tr>';
}).join(''));
function renderTop(){
var ranked=climbs.map(function(c){return [c,grade(c)];}).filter(function(x){return x[1].num&&x[1].conf!='estimated'||x[1].conf=='stated'&&x[1].n>0;});
ranked.forEach(function(x){if(!x[1].num)x[1].num=x[1].n;});
var seen={};
ranked=ranked.filter(function(x){var k=x[0].key;if(seen[k])return false;seen[k]=1;return true;});
ranked.sort(function(a,b){return b[1].num-a[1].num;});
fill('top',ranked.slice(0,14).map(function(x){
  var c=x[0],r=x[1];
  return '<tr><td class="g num" style="color:var(--'+tierOf(r.n)+')">'+esc(r.head||fmt(r.n,r.mod))+'</td><td>'+link(c.n)+'<br><span class="muted small">'+esc(c.crag||TYPE[c.type])+'</span></td><td>'+esc(c.g)+'</td><td class="small">'+BADGE[r.conf]+'</td></tr>';
}).join(''));
}
renderTop();
fill('rate',STATS.map(function(s){
  var i=FR.indexOf(s[0]),m=mix('S',i),p=(s[2]+s[3])/s[1],typ=p>=0.5?fmt(m.first[0],m.first[1]):fmt(m.rp[0],m.rp[3]);
  return '<tr><td><b>'+s[0]+'</b></td><td class="r">'+s[1]+'</td><td class="r">'+s[2]+'</td><td class="r">'+s[3]+'</td><td class="r">'+s[4]+'</td><td class="r">'+Math.round(p*100)+'%</td><td>'+typ+'</td></tr>';
}).join(''));
function renderCount(){
var doc=climbs.filter(function(c){return c.k;}).length;
var cnt=document.getElementById('count');if(cnt)cnt.textContent=climbs.length.toLocaleString('en')+' of his logged ascents: sport routes from 7a to 9c, boulders from 6C to 9A, and trad. '+doc+' have a documented style.';
var st=document.getElementById('stat');if(st)st.textContent=climbs.length.toLocaleString('en')+' ascents, '+doc+' with a documented style';
}
renderCount();
/* ---------- new ascents, served by the Worker at latest.json ---------- */
function addLatest(list){
  var have={},added=0;
  climbs.forEach(function(c){have[c.type+c.key]=1;});
  list.forEach(function(a){
    var sc=SCALES[a.t];if(!sc||!a.n)return;
    var gi=sc.indexOf(a.g),key=norm(a.n);
    if(gi<0||!key||have[a.t+key])return;
    have[a.t+key]=1;added++;
    climbs.push({n:a.n,crag:'',type:a.t,g:a.g,yy:a.y||'',k:a.k||'w',fa:!!a.fa,key:key,gi:gi,hay:key,fresh:true});
  });
  if(added){renderTop();renderCount();hooks.forEach(function(f){f();});}
}
/* Pure functions, exposed for the unit tests in test/. */
window.OGRADER={grade:grade,mix:mix,norm:norm,gradeLabel:gradeLabel,tierName:tierName,climbs:climbs,SCALES:SCALES};
if(/^https?:$/.test(location.protocol)){
  fetch('latest.json').then(function(r){return r.ok?r.json():null;}).then(function(j){if(j&&j.ascents)addLatest(j.ascents);}).catch(function(){});
}
})();
