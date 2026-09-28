/* NEBULA ENGINE: общий движок. Игры добавляются через NG.games.push({...}) */
const NG={games:[],keys:{},offs:[],parts:[],sh:0,paused:false,muted:false,
r:n=>Math.floor(Math.random()*n),
save(k,v){try{localStorage.setItem('ng_'+k,v)}catch(e){}},
load(k){try{return+localStorage.getItem('ng_'+k)||0}catch(e){return 0}},
beep(f,d=.08,t='square',v=.04){if(NG.muted)return;try{const a=NG.ac||(NG.ac=new(window.AudioContext||window.webkitAudioContext)()),o=a.createOscillator(),g=a.createGain();o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d)}catch(e){}},
on(t,e,f,o){t.addEventListener(e,f,o);NG.offs.push(()=>t.removeEventListener(e,f,o))},
cleanup(){NG.offs.forEach(f=>f());NG.offs=[];NG.ctrl&&NG.ctrl.stop();NG.ctrl=null;NG.open=false},
canvas(w,h){const c=document.createElement('canvas'),k=window.devicePixelRatio||1;c.width=w*k;c.height=h*k;c.style.width=`min(100%,${w}px,${(68*w/h).toFixed(1)}vh)`;c.style.aspectRatio=w+'/'+h;const g=c.getContext('2d');g.scale(k,k);c.pt=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*w/r.width,y:(e.clientY-r.top)*h/r.height}};return[c,g]},
/* игровой цикл: физика с фиксированным шагом 1/60 c, одинаково на любом мониторе */
run(step,draw){let last=performance.now(),acc=0,raf,on=true;const f=t=>{if(!on)return;raf=requestAnimationFrame(f);acc+=Math.min(.1,(t-last)/1e3);last=t;while(acc>=1/60){if(!NG.paused)step(1/60);acc-=1/60}draw()};raf=requestAnimationFrame(f);NG.ctrl={stop(){on=false;cancelAnimationFrame(raf)}}},
blk(g,x,y,s,c,a=1){g.globalAlpha=a;g.fillStyle=c;g.shadowColor=c;g.shadowBlur=a<1?0:8;g.beginPath();g.roundRect(x+1,y+1,s-2,s-2,s/5);g.fill();g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x+4,y+3,s-8,3);g.globalAlpha=1},
burst(x,y,c,n=12,s=3){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=Math.random()*s+.5;NG.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,c})}},
tick(dt){NG.parts.forEach(p=>{p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;p.vx*=.96;p.vy*=.96;p.l-=dt*1.8});NG.parts=NG.parts.filter(p=>p.l>0);NG.sh*=.88},
begin(g){g.save();if(NG.sh>.3)g.translate((Math.random()-.5)*NG.sh,(Math.random()-.5)*NG.sh)},
end(g){NG.parts.forEach(p=>{g.globalAlpha=Math.max(0,p.l);g.fillStyle=p.c;g.fillRect(p.x-2,p.y-2,4,4)});g.globalAlpha=1;g.restore()},
/* экранные кнопки для телефона: эмулируют клавиши */
pad(area,items){const d=document.createElement('div');d.className='pad';items.forEach(([t,code,rep])=>{const b=document.createElement('button');b.textContent=t;let iv,to;const fire=ty=>window.dispatchEvent(new KeyboardEvent(ty,{code})),up=()=>{clearTimeout(to);clearInterval(iv);fire('keyup')};b.addEventListener('pointerdown',e=>{e.preventDefault();fire('keydown');if(rep)to=setTimeout(()=>iv=setInterval(()=>fire('keydown'),80),240)});['pointerup','pointerleave','pointercancel'].forEach(v=>b.addEventListener(v,up));d.appendChild(b)});area.appendChild(d)}};
addEventListener('keydown',e=>{NG.keys[e.code]=true;if(NG.open&&/^(Arrow|Space)/.test(e.code))e.preventDefault()});
addEventListener('keyup',e=>{NG.keys[e.code]=false});
addEventListener('blur',()=>NG.keys={});

/* ============ ТЕТРИС ============ */
NG.games.push({id:'tetris',title:'Тетрис',cat:'Аркады',emoji:'🧱',grad:'linear-gradient(135deg,#312e81,#0ea5e9)',desc:'Призрак фигуры, запас, каскады линий и тряска экрана.',
init(a){const[c,g]=NG.canvas(380,560),C=28,W=10,H=20;a.append(c);
const SH={I:[[1,1,1,1]],J:[[1,0,0],[1,1,1]],L:[[0,0,1],[1,1,1]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0]],T:[[0,1,0],[1,1,1]],Z:[[1,1,0],[0,1,1]]},CL={I:'#22d3ee',J:'#6366f1',L:'#fb923c',O:'#facc15',S:'#4ade80',T:'#c084fc',Z:'#f87171'};
let b,p,nx,hd,ch,sc,ln,lv,gt,bag,dead;
const take=()=>{if(!bag.length)bag=Object.keys(SH).sort(()=>Math.random()-.5);return bag.pop()},
mk=t=>({t,m:SH[t].map(r=>[...r]),x:W/2-Math.ceil(SH[t][0].length/2),y:0}),
hit=(m,x,y)=>m.some((r,j)=>r.some((v,i)=>v&&(x+i<0||x+i>=W||y+j>=H||(y+j>=0&&b[y+j][x+i])))),
spawn=()=>{p=mk(nx||take());nx=take();ch=1;if(hit(p.m,p.x,p.y)){dead=1;NG.sh=12;NG.beep(110,.6,'sawtooth');NG.over()}},
lock=()=>{p.m.forEach((r,j)=>r.forEach((v,i)=>{if(v&&p.y+j>=0)b[p.y+j][p.x+i]=p.t}));let n=0;
 for(let y=H-1;y>=0;y--)if(b[y].every(v=>v)){b[y].forEach((t,x)=>NG.burst(x*C+14,y*C+14,CL[t],2,4));b.splice(y,1);b.unshift(Array(W).fill(0));n++;y++}
 if(n){ln+=n;sc+=[0,100,300,500,800][n]*lv;lv=1+(ln/10|0);NG.sh=4+n*4;NG.beep(500+n*120,.18,'triangle');NG.score(sc)}else NG.beep(180,.05);spawn()},
mv=d=>{if(!hit(p.m,p.x+d,p.y)){p.x+=d;NG.beep(300,.02)}},
rot=()=>{const m=p.m[0].map((_,i)=>p.m.map(r=>r[i]).reverse());for(const k of[0,-1,1,-2,2])if(!hit(m,p.x+k,p.y)){p.m=m;p.x+=k;NG.beep(520,.03);return}},
hard=()=>{while(!hit(p.m,p.x,p.y+1)){p.y++;sc+=2}NG.score(sc);NG.sh=5;lock()},
swap=()=>{if(!ch)return;const t=p.t;if(hd)p=mk(hd);else{p=mk(nx);nx=take()}hd=t;ch=0;NG.beep(420,.05)},
mini=(t,x,y)=>t&&SH[t].forEach((r,j)=>r.forEach((v,i)=>v&&NG.blk(g,x+i*17,y+j*17,17,CL[t])));
b=Array.from({length:H},()=>Array(W).fill(0));sc=ln=gt=0;lv=1;bag=[];hd=null;nx=0;dead=0;spawn();NG.score(0);
NG.on(window,'keydown',e=>{if(dead||NG.paused)return;const k=e.code,f=!e.repeat;
 if(k=='ArrowLeft'||k=='KeyA')mv(-1);else if(k=='ArrowRight'||k=='KeyD')mv(1);
 else if(f&&(k=='ArrowUp'||k=='KeyW'||k=='KeyX'))rot();else if(f&&k=='Space')hard();else if(f&&(k=='KeyC'||k=='ShiftLeft'))swap()});
NG.pad(a,[['⬅','ArrowLeft',1],['🔄','ArrowUp'],['➡','ArrowRight',1],['⬇','ArrowDown'],['⤓','Space'],['📦','KeyC']]);
a.append(Object.assign(document.createElement('div'),{className:'hint',textContent:'← → двигать, ↑ поворот, ↓ ускорить, пробел сбросить, C запас'}));
NG.run(dt=>{NG.tick(dt);if(dead)return;const dn=NG.keys.ArrowDown||NG.keys.KeyS,iv=Math.max(.05,.8*Math.pow(.85,lv-1));gt+=dt;if(gt>=(dn?Math.min(.04,iv):iv)){gt=0;hit(p.m,p.x,p.y+1)?lock():p.y++}},()=>{
 NG.begin(g);g.fillStyle='#08080f';g.fillRect(-20,-20,420,600);g.fillStyle='#0f0f1c';g.fillRect(0,0,W*C,H*C);
 g.strokeStyle='rgba(139,92,246,.07)';for(let i=1;i<W;i++){g.beginPath();g.moveTo(i*C,0);g.lineTo(i*C,H*C);g.stroke()}
 b.forEach((r,y)=>r.forEach((t,x)=>t&&NG.blk(g,x*C,y*C,C,CL[t])));
 if(!dead){let gy=p.y;while(!hit(p.m,p.x,gy+1))gy++;p.m.forEach((r,j)=>r.forEach((v,i)=>{if(v){NG.blk(g,(p.x+i)*C,(gy+j)*C,C,CL[p.t],.22);NG.blk(g,(p.x+i)*C,(p.y+j)*C,C,CL[p.t])}}))}
 g.fillStyle='#8f8ba8';g.font='13px system-ui';g.textAlign='left';g.fillText('Дальше',296,24);g.fillText('Запас',296,132);g.fillText('Уровень '+lv,296,250);g.fillText('Линии '+ln,296,272);
 mini(nx,296,36);mini(hd,296,144);NG.end(g)})}});

/* ============ ЗМЕЙКА ============ */
NG.games.push({id:'snake',title:'Змейка',cat:'Аркады',emoji:'🐍',grad:'linear-gradient(135deg,#064e3b,#0d9488)',desc:'Плавное движение, свайпы и разгон. Сквозь стены можно проходить.',
init(a){const[c,g]=NG.canvas(480,480),N=20,C=24;a.append(c);
let sn,pv,d,q,f,sc,iv,ac,dead;
const put=()=>{let p;do{p={x:NG.r(N),y:NG.r(N)}}while(sn.some(s=>s.x==p.x&&s.y==p.y));return p},
turn=(x,y)=>{const l=q.length?q[q.length-1]:d;if((x==-l.x&&y==-l.y)||(x==l.x&&y==l.y))return;if(q.length<2)q.push({x,y})},
tick=()=>{if(q.length)d=q.shift();const o=sn,h={x:(o[0].x+d.x+N)%N,y:(o[0].y+d.y+N)%N},e=h.x==f.x&&h.y==f.y,body=e?o:o.slice(0,-1);
 if(body.some(s=>s.x==h.x&&s.y==h.y)){dead=1;NG.sh=12;NG.beep(110,.6,'sawtooth');NG.burst(h.x*C+12,h.y*C+12,'#34d399',30,5);NG.over();return}
 sn=[h,...body];pv=sn.map((s,i)=>o[Math.max(0,i-1)]);
 if(e){sc+=10;NG.score(sc);NG.burst(f.x*C+12,f.y*C+12,'#f87171',16,4);NG.beep(700,.08,'triangle');f=put();iv=Math.max(.065,iv-.003)}};
sn=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];pv=sn;d={x:1,y:0};q=[];f=put();sc=0;iv=.14;ac=0;dead=0;NG.score(0);
const K={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]};
NG.on(window,'keydown',e=>{const v=K[e.code];if(v&&!NG.paused&&!dead)turn(...v)});
let s0;NG.on(c,'pointerdown',e=>s0=c.pt(e));NG.on(c,'pointermove',e=>{if(!s0)return;const p=c.pt(e),dx=p.x-s0.x,dy=p.y-s0.y;if(Math.hypot(dx,dy)>26){Math.abs(dx)>Math.abs(dy)?turn(Math.sign(dx),0):turn(0,Math.sign(dy));s0=p}});NG.on(window,'pointerup',()=>s0=0);
NG.pad(a,[['⬅','ArrowLeft'],['⬆','ArrowUp'],['⬇','ArrowDown'],['➡','ArrowRight']]);
a.append(Object.assign(document.createElement('div'),{className:'hint',textContent:'Стрелки или WASD, на телефоне свайп по полю'}));
NG.run(dt=>{NG.tick(dt);if(dead)return;ac+=dt;while(ac>=iv&&!dead){ac-=iv;tick()}},()=>{
 const t=dead?1:Math.min(1,ac/iv),P=(s,r)=>Math.abs(s.x-r.x)>1||Math.abs(s.y-r.y)>1?[s.x,s.y]:[r.x+(s.x-r.x)*t,r.y+(s.y-r.y)*t];
 NG.begin(g);g.fillStyle='#08080f';g.fillRect(-20,-20,520,520);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++)if((x+y)%2){g.fillStyle='rgba(139,92,246,.045)';g.fillRect(x*C,y*C,C,C)}
 const pu=1+Math.sin(performance.now()/180)*.15;g.shadowColor='#f87171';g.shadowBlur=16;g.fillStyle='#f87171';g.beginPath();g.arc(f.x*C+12,f.y*C+12,8*pu,0,7);g.fill();g.shadowBlur=0;
 for(let i=sn.length-1;i>=0;i--){const[x,y]=P(sn[i],pv[i]);g.fillStyle=i?`hsl(${165-i*2},70%,${Math.max(30,54-i)}%)`:'#a7f3d0';g.shadowColor='#34d399';g.shadowBlur=i?0:14;g.beginPath();g.roundRect(x*C+2,y*C+2,C-4,C-4,i?7:9);g.fill();g.shadowBlur=0;
  if(!i){g.fillStyle='#064e3b';for(const s of[-1,1]){g.beginPath();g.arc(x*C+12+d.x*5-d.y*s*5,y*C+12+d.y*5+d.x*s*5,2.4,0,7);g.fill()}}}
 NG.end(g)})}});

/* ============ БРЕЙКАУТ ============ */
NG.games.push({id:'breakout',title:'Брейкаут',cat:'Аркады',emoji:'🧿',grad:'linear-gradient(135deg,#7c2d12,#be185d)',desc:'Отскок зависит от места удара. Бонусы, жизни и растущие уровни.',
init(a){const[c,g]=NG.canvas(480,540),W=480,H=540;a.append(c);
let pd,bl,br,bn,lv,li,sc,ln,wt,dead;
const build=()=>{br=[];for(let r=0;r<4+Math.min(lv,3);r++)for(let i=0;i<8;i++)br.push({x:i*58+8,y:r*24+56,w:52,h:18,hp:r<2?2:1,u:200+r*30})},
ready=()=>{ln=0;bl={x:pd.x,y:504,vx:0,vy:0,tr:[]};bn=[]},
go=()=>{if(ln||dead||NG.paused)return;ln=1;const s=5+lv*.5,an=-Math.PI/2+(Math.random()-.5)*.7;bl.vx=Math.cos(an)*s;bl.vy=Math.sin(an)*s;NG.beep(400,.06)};
pd={x:240,w:88};lv=1;li=3;sc=0;wt=0;dead=0;build();ready();NG.score(0);
NG.on(c,'pointermove',e=>{pd.x=c.pt(e).x});NG.on(c,'pointerdown',go);NG.on(window,'keydown',e=>{if(e.code=='Space')go()});
NG.pad(a,[['⬅','ArrowLeft'],['🚀','Space'],['➡','ArrowRight']]);
a.append(Object.assign(document.createElement('div'),{className:'hint',textContent:'Мышь или палец двигают ракетку, клик или пробел запускают мяч'}));
NG.run(dt=>{NG.tick(dt);if(dead)return;wt=Math.max(0,wt-dt);pd.w+=((wt>0?132:88)-pd.w)*.15;
 if(NG.keys.ArrowLeft||NG.keys.KeyA)pd.x-=8;if(NG.keys.ArrowRight||NG.keys.KeyD)pd.x+=8;pd.x=Math.max(pd.w/2,Math.min(W-pd.w/2,pd.x));
 bn.forEach(b=>{b.y+=2.4;if(b.y>500&&b.y<524&&Math.abs(b.x-pd.x)<pd.w/2+14){b.d=1;if(b.t=='W')wt=10;else li=Math.min(5,li+1);NG.beep(880,.12,'triangle')}});bn=bn.filter(b=>!b.d&&b.y<560);
 if(!ln){bl.x=pd.x;return}
 for(let s=0;s<2;s++){bl.x+=bl.vx/2;bl.y+=bl.vy/2;
  if(bl.x<7){bl.x=7;bl.vx=Math.abs(bl.vx)}if(bl.x>W-7){bl.x=W-7;bl.vx=-Math.abs(bl.vx)}if(bl.y<7){bl.y=7;bl.vy=Math.abs(bl.vy)}
  if(bl.vy>0&&bl.y>=503&&bl.y<518&&Math.abs(bl.x-pd.x)<=pd.w/2+7){const t=Math.max(-1,Math.min(1,(bl.x-pd.x)/(pd.w/2))),sp=Math.min(9,Math.hypot(bl.vx,bl.vy)+.15),an=-Math.PI/2+t*1.05;bl.vx=Math.cos(an)*sp;bl.vy=Math.sin(an)*sp;bl.y=503;NG.beep(300,.05)}
  for(const k of br){const cx=Math.max(k.x,Math.min(k.x+k.w,bl.x)),cy=Math.max(k.y,Math.min(k.y+k.h,bl.y)),dx=bl.x-cx,dy=bl.y-cy;
   if(dx*dx+dy*dy<49){if(Math.abs(dx)>Math.abs(dy))bl.vx=(dx>0?1:-1)*Math.abs(bl.vx);else bl.vy=(dy>0?1:-1)*Math.abs(bl.vy);
    if(--k.hp<=0){k.d=1;sc+=10*lv;NG.score(sc);NG.burst(k.x+26,k.y+9,`hsl(${k.u},80%,60%)`,10,3);NG.sh=3;if(Math.random()<.16)bn.push({x:k.x+26,y:k.y,t:Math.random()<.5?'W':'L'})}
    NG.beep(500+k.hp*100,.04);break}}
  br=br.filter(k=>!k.d)}
 bl.tr.push({x:bl.x,y:bl.y});if(bl.tr.length>9)bl.tr.shift();
 if(!br.length){lv++;NG.beep(900,.3,'triangle');build();ready()}
 else if(bl.y>H+10){li--;NG.sh=8;NG.beep(150,.3,'sawtooth');if(li<=0){dead=1;NG.over()}else ready()}},()=>{
 NG.begin(g);g.fillStyle='#08080f';g.fillRect(-20,-20,520,580);
 br.forEach(k=>{g.fillStyle=`hsl(${k.u},80%,${k.hp>1?48:62}%)`;g.shadowColor=g.fillStyle;g.shadowBlur=8;g.beginPath();g.roundRect(k.x,k.y,k.w,k.h,5);g.fill()});g.shadowBlur=0;
 bn.forEach(b=>{g.fillStyle=b.t=='W'?'#22d3ee':'#f472b6';g.beginPath();g.roundRect(b.x-14,b.y-8,28,16,8);g.fill();g.fillStyle='#08080f';g.font='bold 11px system-ui';g.textAlign='center';g.fillText(b.t=='W'?'W':'♥',b.x,b.y+4)});
 const gr=g.createLinearGradient(pd.x-pd.w/2,0,pd.x+pd.w/2,0);gr.addColorStop(0,'#8b5cf6');gr.addColorStop(1,'#22d3ee');g.fillStyle=gr;g.beginPath();g.roundRect(pd.x-pd.w/2,510,pd.w,12,6);g.fill();
 bl.tr.forEach((t,i)=>{g.globalAlpha=i/20;g.fillStyle='#fff';g.beginPath();g.arc(t.x,t.y,7*i/9,0,7);g.fill()});g.globalAlpha=1;
 g.shadowColor='#fff';g.shadowBlur=12;g.fillStyle='#fff';g.beginPath();g.arc(bl.x,bl.y,7,0,7);g.fill();g.shadowBlur=0;
 g.fillStyle='#8f8ba8';g.font='13px system-ui';g.textAlign='left';g.fillText('♥'.repeat(li),12,24);g.textAlign='right';g.fillText('Уровень '+lv,W-12,24);g.textAlign='center';if(!ln&&!dead)g.fillText('Клик или пробел, чтобы запустить',W/2,470);NG.end(g)})}});

/* ============ АСТЕРОИДЫ ============ */
NG.games.push({id:'asteroids',title:'Астероиды',cat:'Классика',emoji:'☄️',grad:'linear-gradient(135deg,#1c1917,#6d28d9)',desc:'Настоящая инерция корабля, разлетающиеся обломки и неоновая графика.',
init(a){const[c,g]=NG.canvas(520,520),S=520;a.append(c);
let sh,rk,bu,lv,li,sc,cd,iv,dead;
const rock=(x,y,z)=>({x,y,z,r:[0,14,26,42][z],vx:(Math.random()-.5)*(60+lv*8)*(4-z)/2,vy:(Math.random()-.5)*(60+lv*8)*(4-z)/2,a:0,va:(Math.random()-.5)*2,p:Array.from({length:10},()=>.75+Math.random()*.4)}),
wave=()=>{for(let i=0;i<3+lv;i++){let x,y;do{x=NG.r(S);y=NG.r(S)}while(Math.hypot(x-sh.x,y-sh.y)<150);rk.push(rock(x,y,3))}},
kill=(r,nw)=>{r.d=1;sc+=[0,100,50,20][r.z];NG.score(sc);NG.burst(r.x,r.y,'#a78bfa',r.z*5+4,3);NG.sh=r.z*2;NG.beep(140+r.z*30,.12,'sawtooth');
 if(r.z>1)for(let k=0;k<2;k++){const n=rock(r.x,r.y,r.z-1);n.vx+=r.vx*.5;n.vy+=r.vy*.5;nw.push(n)}};
sh={x:S/2,y:S/2,a:-Math.PI/2,vx:0,vy:0};rk=[];bu=[];lv=1;li=3;sc=0;cd=0;iv=2;dead=0;wave();NG.score(0);
NG.pad(a,[['◀','ArrowLeft'],['▶','ArrowRight'],['🔥','ArrowUp'],['💥','Space']]);
a.append(Object.assign(document.createElement('div'),{className:'hint',textContent:'← → поворот, ↑ тяга, пробел огонь. Корабль скользит по инерции'}));
NG.run(dt=>{NG.tick(dt);if(dead)return;const K=NG.keys,w=v=>(v+S)%S;
 if(K.ArrowLeft||K.KeyA)sh.a-=4.6*dt;if(K.ArrowRight||K.KeyD)sh.a+=4.6*dt;
 if(K.ArrowUp||K.KeyW){const cs=Math.cos(sh.a),sn=Math.sin(sh.a);sh.vx+=cs*230*dt;sh.vy+=sn*230*dt;NG.parts.push({x:sh.x-cs*12,y:sh.y-sn*12,vx:-cs*2+Math.random()-.5,vy:-sn*2+Math.random()-.5,l:.5,c:'#fb923c'})}
 const f=1-.5*dt,sp=Math.hypot(sh.vx,sh.vy);sh.vx*=f;sh.vy*=f;if(sp>340){sh.vx*=340/sp;sh.vy*=340/sp}
 sh.x=w(sh.x+sh.vx*dt);sh.y=w(sh.y+sh.vy*dt);iv=Math.max(0,iv-dt);cd-=dt;
 if(K.Space&&cd<=0){cd=.22;bu.push({x:sh.x+Math.cos(sh.a)*14,y:sh.y+Math.sin(sh.a)*14,vx:Math.cos(sh.a)*520+sh.vx,vy:Math.sin(sh.a)*520+sh.vy,l:.9});NG.beep(880,.05,'square',.02)}
 bu.forEach(b=>{b.x=w(b.x+b.vx*dt);b.y=w(b.y+b.vy*dt);b.l-=dt});bu=bu.filter(b=>b.l>0);
 rk.forEach(r=>{r.x=w(r.x+r.vx*dt);r.y=w(r.y+r.vy*dt);r.a+=r.va*dt});
 const nw=[];bu.forEach(b=>rk.forEach(r=>{if(!r.d&&b.l>0&&Math.hypot(r.x-b.x,r.y-b.y)<r.r){b.l=0;kill(r,nw)}}));
 rk.forEach(r=>{if(!r.d&&!iv&&Math.hypot(r.x-sh.x,r.y-sh.y)<r.r+8){kill(r,nw);li--;iv=2.2;NG.sh=14;NG.burst(sh.x,sh.y,'#22d3ee',26,5);NG.beep(100,.5,'sawtooth');sh.x=sh.y=S/2;sh.vx=sh.vy=0;if(li<=0){dead=1;NG.over()}}});
 rk=rk.filter(r=>!r.d).concat(nw);if(!rk.length){lv++;wave();NG.beep(800,.3,'triangle')}},()=>{
 NG.begin(g);g.fillStyle='#08080f';g.fillRect(-20,-20,560,560);g.lineWidth=2;g.lineJoin='round';
 g.strokeStyle='#a78bfa';g.shadowColor='#8b5cf6';g.shadowBlur=10;
 rk.forEach(r=>{g.save();g.translate(r.x,r.y);g.rotate(r.a);g.beginPath();r.p.forEach((m,i)=>{const t=i/10*6.283;g[i?'lineTo':'moveTo'](Math.cos(t)*r.r*m,Math.sin(t)*r.r*m)});g.closePath();g.stroke();g.restore()});
 g.fillStyle='#fff';bu.forEach(b=>{g.beginPath();g.arc(b.x,b.y,2.4,0,7);g.fill()});
 if(!iv||Math.floor(iv*8)%2){g.save();g.translate(sh.x,sh.y);g.rotate(sh.a);g.strokeStyle='#22d3ee';g.shadowColor='#22d3ee';g.beginPath();g.moveTo(15,0);g.lineTo(-11,-10);g.lineTo(-6,0);g.lineTo(-11,10);g.closePath();g.stroke();g.restore()}
 g.shadowBlur=0;g.fillStyle='#8f8ba8';g.font='13px system-ui';g.textAlign='left';g.fillText('Жизни '+'▲'.repeat(Math.max(0,li)),12,24);g.textAlign='right';g.fillText('Волна '+lv,S-12,24);NG.end(g)})}});
