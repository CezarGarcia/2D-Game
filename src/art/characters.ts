// @ts-nocheck
/* Desenho dos personagens por código: peças recortadas com sombra, brilho e contorno.
   Portado da referência de arte (docs/arte/referencia-capitulo-1.html). Cada função desenha
   o personagem virado para a direita, com os pés na origem (0,0) e y negativo para cima.
   Assinatura: draw(ctx, tempoEmSegundos, opções). */
var OUT='#22100a',TAU=6.2832;
function el(c,x,y,rx,ry,r){r=r||0;c.moveTo(x+rx*Math.cos(r),y+rx*Math.sin(r));c.ellipse(x,y,rx,ry,r,0,TAU)}
function cap(c,x1,y1,x2,y2,r){var th=Math.atan2(y2-y1,x2-x1),a=th+Math.PI/2,b=th-Math.PI/2;
  c.moveTo(x1+Math.cos(a)*r,y1+Math.sin(a)*r);c.lineTo(x2+Math.cos(a)*r,y2+Math.sin(a)*r);c.arc(x2,y2,r,a,b,true);
  c.lineTo(x1+Math.cos(b)*r,y1+Math.sin(b)*r);c.arc(x1,y1,r,b,a,true);c.closePath()}
function poly(c,p){c.moveTo(p[0],p[1]);for(var i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath()}
/* cel: preenche, aplica meia-lua de sombra (baixo/direita) e de brilho (cima/esquerda), detalhes internos e contorno */
function cel(c,fn,base,o){o=o||{};var k=o.k==null?2.4:o.k,lw=o.lw==null?2.4:o.lw;
  c.save();c.beginPath();fn(c);c.fillStyle=base;c.fill();c.clip();
  if(k){c.beginPath();c.rect(-3000,-3000,6000,6000);c.save();c.translate(-k,-k*1.15);fn(c);c.restore();c.fillStyle=o.sh||'rgba(38,8,30,.32)';c.fill('evenodd');
    c.beginPath();c.rect(-3000,-3000,6000,6000);c.save();c.translate(k*.75,k*.9);fn(c);c.restore();c.fillStyle=o.hi||'rgba(255,238,190,.24)';c.fill('evenodd')}
  if(o.inn)o.inn(c);
  c.restore();
  if(lw){c.beginPath();fn(c);c.strokeStyle=o.out||OUT;c.lineWidth=lw;c.lineJoin='round';c.stroke()}}
function ln(c,p,col,lw,dash){c.beginPath();c.moveTo(p[0],p[1]);for(var i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.lineJoin='round';if(dash)c.setLineDash(dash);c.stroke();if(dash)c.setLineDash([])}
function dot(c,x,y,r,col){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=col;c.fill()}
function glow(c,x,y,rx,ry,col,g,blur,rot){c.save();c.shadowColor=g;c.shadowBlur=blur;c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,TAU);c.fillStyle=col;c.fill();c.restore()}
function star(c,x,y,r,col){c.beginPath();for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;c[i?'lineTo':'moveTo'](x+Math.cos(a)*q,y+Math.sin(a)*q)}c.closePath();c.fillStyle=col;c.fill();c.strokeStyle=OUT;c.lineWidth=.8;c.stroke()}
function ik(ax,ay,bx,by,l1,l2,dir){var dx=bx-ax,dy=by-ay,d=Math.max(.01,Math.min(Math.hypot(dx,dy),l1+l2-.01)),a=Math.atan2(dy,dx),q=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));return [ax+Math.cos(a+q*dir)*l1,ay+Math.sin(a+q*dir)*l1]}
function seg2(c,ax,ay,bx,by,l1,l2,dir,r1,r2,c1,c2,o){var k=ik(ax,ay,bx,by,l1,l2,dir);cel(c,function(c){cap(c,ax,ay,k[0],k[1],r1)},c1,o);cel(c,function(c){cap(c,k[0],k[1],bx,by,r2)},c2,o);return k}
var EYE='#ffe0f0',EYEG='#ff3d8a';

/* ---------------- herói ---------------- */
function drawHero(c,t,o){o=o||{};var mv=o.walk!=null,w=o.walk||0,st=mv?Math.sin(w):0,co=mv?Math.cos(w):0,b=(mv?Math.abs(co)*1.3:0)+Math.sin(t*2.4)*.7,sw=o.swing,i;
  var SK='#c88a5a',LE='#96562b',LE2='#7a4424',PA='#b9945e',RED='#cf3b28',GOLD='#f2c14e',DK='#3a2014',HAIR='#2b1710';
  var hx2=17,hy2=-38+b,hy=-63+b,ty=hy-9,fl=Math.sin(t*5+w)*2;
  /* arco: o.swing passa a ser puxar (até 0,5), segurar e soltar a corda */
  var bow=o.weapon==='arco',bsg=bow&&sw!=null,pl=0,tw=0,br=.1+Math.sin(t*2.4)*.03;
  if(bsg){hx2=21.5;hy2=-44.5+b;br=-.05;pl=sw<.5?(1-Math.cos(sw*TAU))/2:sw<.58?1:0;tw=sw<.58?0:Math.sin((sw-.58)*55)*Math.exp(-(sw-.58)*9)*1.6}
  /* manta enrolada nas costas */
  cel(c,function(c){cap(c,-13,-49+b,-13,-33+b,5.2)},'#3f7f8c',{k:1.6,lw:2,inn:function(c){[-47,-42,-37,-32].forEach(function(y){ln(c,[-19,y+b,-7,y+b],'#f0d9a0',1.3)})}});
  /* pontas do lenço */
  cel(c,function(c){c.moveTo(-8,-51+b);c.quadraticCurveTo(-17,-52+b+fl,-26,-46+b+fl*1.5);c.quadraticCurveTo(-19,-46+b+fl,-14,-44+b);c.quadraticCurveTo(-20,-42+b-fl,-25,-36+b-fl);c.quadraticCurveTo(-14,-41+b,-7,-46+b);c.closePath()},RED,{k:1.2,lw:1.8});
  /* aljava nas costas */
  if(bow){c.save();c.translate(-12.5,-41+b);c.rotate(-.27);
    cel(c,function(c){c.moveTo(-4.3,-11);c.lineTo(-3.4,10);c.quadraticCurveTo(0,13.5,3.4,10);c.lineTo(4.3,-11);c.closePath()},LE2,{k:1.3,lw:2,inn:function(c){c.fillStyle=GOLD;c.fillRect(-5,-8.4,10,2);ln(c,[-1.8,-4,-1.4,9],'#f0d9a0',.8,[1.4,1.8]);c.fillStyle=DK;c.fillRect(-5,5.4,10,1.7)}});
    cel(c,function(c){el(c,0,-11,4.3,1.6)},DK,{k:0,lw:1.6});
    [[-2.3,-19.5,RED],[.2,-22.5,'#f0d9a0'],[2.5,-18.5,RED]].forEach(function(q){ln(c,[q[0],-11,q[0],q[1]],OUT,2.4);ln(c,[q[0],-11,q[0],q[1]],'#d9b77a',1);
      cel(c,function(c){poly(c,[q[0]-2.1,q[1]+1,q[0],q[1]-1.2,q[0]+2.1,q[1]+1,q[0]+2.1,q[1]+5.6,q[0],q[1]+3.9,q[0]-2.1,q[1]+5.6])},q[2],{k:.5,lw:1.2})});
    c.restore()}
  /* braço de trás */
  seg2(c,9,-47+b,hx2,hy2,8,8,1,3.6,3.2,LE2,SK,{k:1.2,lw:2});
  /* pernas */
  function leg(hx,f,dark){var kn=ik(hx,-25+b,f[0],f[1]-4,11.5,11.5,-1);
    cel(c,function(c){cap(c,hx,-25+b,kn[0],kn[1],4.5)},dark?'#9a7a4c':PA,{k:1.4,lw:2});
    cel(c,function(c){cap(c,kn[0],kn[1],f[0],f[1]-4,3.9)},dark?'#653820':LE2,{k:1.3,lw:2,inn:function(c){ln(c,[kn[0]-5,kn[1]+3.5,kn[0]+6,kn[1]+3.5],GOLD,1);ln(c,[f[0]-5,f[1]-7,f[0]+6,f[1]-7],GOLD,1)}});
    cel(c,function(c){c.moveTo(f[0]-4.5,f[1]);c.lineTo(f[0]-4.5,f[1]-5);c.quadraticCurveTo(f[0]+1,f[1]-7,f[0]+8,f[1]-3);c.quadraticCurveTo(f[0]+9.5,f[1],f[0]+7,f[1]);c.closePath()},dark?'#2e1a10':DK,{k:1,lw:2})}
  leg(3,[5-st*7,-Math.max(0,-co)*3],true);leg(-3,[-5+st*7,-Math.max(0,co)*3],false);
  /* gibão */
  cel(c,function(c){c.moveTo(-11,-49+b);c.quadraticCurveTo(0,-54+b,11,-49+b);c.bezierCurveTo(13,-40+b,9,-30+b,11.5,-20+b);c.lineTo(-11.5,-20+b);c.bezierCurveTo(-9,-30+b,-13,-40+b,-11,-49+b);c.closePath()},LE,{k:2.6,inn:function(c){
    c.fillStyle='#b46c36';c.beginPath();c.moveTo(1,-52+b);c.lineTo(7.5,-44+b);c.lineTo(2,-37+b);c.closePath();c.fill();c.beginPath();c.moveTo(1,-52+b);c.lineTo(-5.5,-44+b);c.lineTo(1,-38+b);c.closePath();c.fill();
    ln(c,[1.5,-38+b,1.5,-20+b],DK,1.2);ln(c,[-10,-22.6+b,10,-22.6+b],'#f0d9a0',.9,[1.6,1.6]);ln(c,[3.4,-36+b,3.4,-25+b],'#f0d9a0',.8,[1.4,1.8]);
    c.beginPath();c.moveTo(-12,-50+b);c.lineTo(-7,-52.5+b);c.lineTo(12.5,-29+b);c.lineTo(8.5,-25.5+b);c.closePath();c.fillStyle='#4a2614';c.fill();
    for(i=0;i<5;i++){c.fillStyle=GOLD;c.fillRect(-7.2+i*3.9,-47.4+b+i*4.6,2,3.2)}
    c.fillStyle=DK;c.fillRect(-13,-31+b,26,4.4);c.fillStyle=GOLD;c.fillRect(-1.2,-31.7+b,5,5.8);c.fillStyle=DK;c.fillRect(.4,-30.2+b,1.9,2.8);
    for(i=0;i<6;i++)dot(c,-5.6+Math.cos(i*1.047)*2,-42+b+Math.sin(i*1.047)*2,1,'#f0d9a0');dot(c,-5.6,-42+b,.95,RED)}});
  /* bornal */
  cel(c,function(c){poly(c,[-17.5,-31+b,-9.5,-31+b,-9,-21+b,-18,-21+b])},'#7a4424',{k:1.2,lw:1.8,inn:function(c){ln(c,[-18,-27.4+b,-9,-27.4+b],DK,1)}});dot(c,-13.5,-25.6+b,.9,GOLD);
  /* nó do lenço */
  cel(c,function(c){c.moveTo(-9,-52+b);c.quadraticCurveTo(1,-45.5+b,11,-52+b);c.lineTo(9,-55.5+b);c.quadraticCurveTo(1,-51+b,-7,-55.5+b);c.closePath()},RED,{k:1,lw:1.8});
  /* cabelo, cabeça, orelha */
  cel(c,function(c){c.moveTo(-9,hy-8);c.quadraticCurveTo(-15.5,hy,-10,hy+10);c.lineTo(-4,hy+8);c.lineTo(-4,hy-8);c.closePath()},HAIR,{k:1,lw:2});
  cel(c,function(c){el(c,2,hy,12.3,11.8)},SK,{k:2.3,inn:function(c){dot(c,9.6,hy+4.6,2.8,'rgba(214,80,60,.3)')}});
  cel(c,function(c){el(c,-8.2,hy+1,2.4,3.4)},SK,{k:.8,lw:1.8});
  c.fillStyle=HAIR;c.beginPath();c.moveTo(-8.5,hy-6);c.lineTo(-3.4,hy-7.5);c.lineTo(-4.6,hy+1.5);c.lineTo(-8,hy-2);c.closePath();c.fill();
  [[7.7,2.1],[1.1,1.9]].forEach(function(e){c.beginPath();c.ellipse(e[0],hy-.4,e[1],3.1,0,0,TAU);c.fillStyle='#1c0f0a';c.fill();dot(c,e[0]+.7,hy-1.6,.8,'#fff')});
  ln(c,[4.7,hy-5.7,10.7,hy-4.4],HAIR,1.8);ln(c,[-1.8,hy-4.6,3,hy-5.7],HAIR,1.8);
  c.beginPath();c.arc(12.5,hy+2.2,1.5,-1.2,1.4);c.strokeStyle='#8a5632';c.lineWidth=1.2;c.stroke();
  ln(c,[4.8,hy+7.1,9.2,hy+6.2],'#5a2f1a',1.4);ln(c,[10.6,hy-3.2,12.2,hy+.6],'#ecb690',1);
  /* chapéu de couro em meia-lua */
  cel(c,function(c){c.moveTo(-20,ty+3);c.quadraticCurveTo(2,ty-30,24,ty+3);c.quadraticCurveTo(2,ty-9,-20,ty+3);c.closePath()},'#8f5028',{k:2,inn:function(c){
    c.beginPath();c.moveTo(-17,ty+1);c.quadraticCurveTo(2,ty-25.5,21,ty+1);c.strokeStyle='#f0d9a0';c.lineWidth=.9;c.setLineDash([1.8,1.8]);c.stroke();c.setLineDash([]);
    c.beginPath();c.moveTo(-18,ty+2.5);c.quadraticCurveTo(2,ty-10.5,22,ty+2.5);c.strokeStyle='#5a2f18';c.lineWidth=2.6;c.stroke()}});
  star(c,2,ty-8.6,3.7,GOLD);
  [[-9,ty-5.6],[13,ty-5.6]].forEach(function(q){dot(c,q[0],q[1],2.2,GOLD);c.strokeStyle=OUT;c.lineWidth=.8;c.beginPath();c.arc(q[0],q[1],2.2,0,TAU);c.stroke();dot(c,q[0]-.6,q[1]-.6,.7,'#fff3c4')});
  [[-15,ty-1.9],[-3.7,ty-7.8],[7.7,ty-7.8],[19,ty-1.9]].forEach(function(q){dot(c,q[0],q[1],1,GOLD)});
  c.beginPath();c.moveTo(-7,hy-8);c.quadraticCurveTo(-3,hy+13,4.5,hy+12.4);c.strokeStyle=DK;c.lineWidth=1;c.stroke();
  if(bow){
    /* arco na mão que vai à frente; a outra puxa a corda */
    var tx=-4-pl*2.2,tyy=17-pl*1.6,sx=tx-pl*12.5+tw,nhx=7,nhy=-32.5+b;
    c.save();c.translate(hx2,hy2);c.rotate(br);
    ln(c,[tx,-tyy,sx,0,tx,tyy],OUT,1.9);ln(c,[tx,-tyy,sx,0,tx,tyy],'#f3ead0',.9);
    if(bsg&&sw<.58){ln(c,[sx,0,sx+25,0],OUT,2.6);ln(c,[sx,0,sx+25,0],'#d9b77a',1.2);
      cel(c,function(c){poly(c,[sx+24,-2.4,sx+30.5,0,sx+24,2.4])},'#c9c5bb',{k:.5,lw:1.4});
      cel(c,function(c){poly(c,[sx+1,0,sx-1,-2.7,sx+5,-2.7,sx+7,0,sx+5,2.7,sx-1,2.7])},RED,{k:.5,lw:1.2})}
    function limbs(c){c.moveTo(tx,-tyy);c.quadraticCurveTo(4.8,-tyy*.62,2.2,0);c.quadraticCurveTo(4.8,tyy*.62,tx,tyy)}
    c.beginPath();limbs(c);c.lineCap='round';c.strokeStyle=OUT;c.lineWidth=5;c.stroke();c.strokeStyle='#a5652e';c.lineWidth=2.8;c.stroke();
    c.save();c.translate(-.7,0);c.beginPath();limbs(c);c.strokeStyle='rgba(255,220,160,.45)';c.lineWidth=.8;c.stroke();c.restore();
    [-1,1].forEach(function(s){ln(c,[tx+.9,s*(tyy-2.6),tx+2.2,s*(tyy-3.4)],GOLD,1.4)});
    cel(c,function(c){cap(c,2.5,-3.4,2.5,3.4,2.2)},'#5a3218',{k:.8,lw:1.6});dot(c,2.5,-1.8,.7,GOLD);dot(c,2.5,1.8,.7,GOLD);
    c.restore();
    cel(c,function(c){el(c,hx2+1.6,hy2,3.3,3.3)},SK,{k:.9,lw:1.8});
    if(bsg){var ax=hx2+Math.cos(br)*-18.7,ay=hy2+Math.sin(br)*-18.7,rl=sw<.58?0:Math.min(1,(sw-.58)/.42);rl=rl*rl;
      nhx=sw<.58?hx2+Math.cos(br)*sx:ax+(nhx-ax)*rl;nhy=sw<.58?hy2+Math.sin(br)*sx:ay+(nhy-ay)*rl}
    seg2(c,-8,-47+b,nhx,nhy,9,9,1,3.9,3.4,LE,SK,{k:1.3,lw:2});
    cel(c,function(c){el(c,nhx,nhy,3.6,3.6)},SK,{k:.9,lw:1.8});
    return}
  /* escudo */
  cel(c,function(c){el(c,20.5,hy2+1,10.5,13)},'#b9773c',{k:2.2,inn:function(c){c.beginPath();c.ellipse(20.5,hy2+1,8,10.4,0,0,TAU);c.strokeStyle='#6b3a1e';c.lineWidth=1.6;c.stroke();for(i=0;i<8;i++)dot(c,20.5+Math.cos(i*.785)*6.2,hy2+1+Math.sin(i*.785)*8.2,.95,GOLD)}});
  dot(c,20.5,hy2+1,3.7,'#5a2f18');star(c,20.5,hy2+1,3.1,GOLD);
  /* facão e braço da frente */
  var sg=sw!=null,a=sg?-1.1+sw*3.2:.55+Math.sin(t*2.4)*.05,hx=sg?8+Math.sin(sw*Math.PI)*9:9,hyy=(sg?-36-Math.sin(sw*Math.PI)*6:-33)+b;
  c.save();c.translate(hx,hyy);c.rotate(a);
  cel(c,function(c){c.moveTo(-2.3,-2);c.lineTo(-2.9,-23);c.quadraticCurveTo(-1,-31,1.5,-34);c.quadraticCurveTo(5.4,-28,3.9,-22);c.lineTo(2.3,-2);c.closePath()},'#ebe6d6',{k:1.1,lw:1.8,sh:'rgba(50,60,90,.4)',inn:function(c){ln(c,[-.7,-4,-1,-24],'rgba(110,120,145,.7)',.9)}});
  cel(c,function(c){poly(c,[-4.8,-3.6,4.8,-3.6,4.8,-1,-4.8,-1])},GOLD,{k:0,lw:1.5});
  cel(c,function(c){cap(c,0,0,0,6.5,2.1)},'#5a3218',{k:.8,lw:1.6});dot(c,0,1.5,.7,GOLD);dot(c,0,4.8,.7,GOLD);
  c.restore();
  seg2(c,-8,-47+b,hx,hyy,9,9,1,3.9,3.4,LE,SK,{k:1.3,lw:2});
  cel(c,function(c){el(c,hx,hyy,3.6,3.6)},SK,{k:.9,lw:1.8});
}

/* ---------------- capivara ---------------- */
function drawCapi(c,t,o){o=o||{};var w=o.walk||0,st=o.walk!=null?Math.sin(w):0,b=Math.sin(t*2.6)*.6,B='#a8743f',D='#7a5028',i;
  [[-8,st],[10,-st]].forEach(function(q){cel(c,function(c){cap(c,q[0]+2,-8,q[0]+2+q[1]*2.6,-2.2,2.7)},'#6a4423',{k:.8,lw:1.8})});
  cel(c,function(c){c.moveTo(-17,-12+b);c.bezierCurveTo(-18,-24+b,-4,-27+b,6,-23+b);c.bezierCurveTo(14,-21+b,16,-14+b,14,-7+b);c.bezierCurveTo(4,-2+b,-12,-2+b,-17,-12+b);c.closePath()},B,{k:2.4,inn:function(c){
    c.fillStyle='rgba(90,52,24,.38)';c.beginPath();c.ellipse(-3,-23.5+b,13,4,-.05,0,TAU);c.fill();
    c.fillStyle='rgba(255,226,170,.3)';c.beginPath();c.ellipse(-1,-5+b,12,3.4,0,0,TAU);c.fill();
    for(i=0;i<9;i++)ln(c,[-13+i*3.1,-17+b+(i%2)*4,-11.6+i*3.1,-14+b+(i%2)*4],'rgba(70,40,18,.55)',.9)}});
  [[-11,-st],[8,st]].forEach(function(q){cel(c,function(c){cap(c,q[0],-7,q[0]+q[1]*2.6,-2.2,2.9)},D,{k:.8,lw:1.8})});
  cel(c,function(c){c.moveTo(8,-25+b);c.bezierCurveTo(16,-31+b,27,-28+b,28.5,-20+b);c.bezierCurveTo(28.5,-14+b,22,-12+b,14,-13+b);c.bezierCurveTo(9,-15+b,6,-20+b,8,-25+b);c.closePath()},B,{k:1.8,inn:function(c){c.fillStyle='rgba(70,40,18,.5)';c.beginPath();c.ellipse(26.5,-19+b,4,5.6,0,0,TAU);c.fill()}});
  dot(c,26.8,-21+b,.8,OUT);ln(c,[23.5,-15.6+b,27,-16+b],OUT,1);
  cel(c,function(c){el(c,11.5,-28.5+b,2.6,3,-.3)},D,{k:.7,lw:1.6});
  dot(c,18.5,-23.5+b,1.8,'#1c0f0a');dot(c,19.1,-24.2+b,.6,'#fff');
  cel(c,function(c){c.moveTo(5,-22+b);c.quadraticCurveTo(9,-14+b,13.5,-12+b);c.lineTo(10,-9.5+b);c.quadraticCurveTo(5,-13+b,3,-20+b);c.closePath()},'#cf3b28',{k:.8,lw:1.5});
  for(i=0;i<5;i++)dot(c,13.5+Math.cos(i*1.257)*2.3,-31.5+b+Math.sin(i*1.257)*2.3,1.5,'#ffd23f');dot(c,13.5,-31.5+b,1.1,'#e4572e');
}

/* ---------------- saúva ---------------- */
function drawSauva(c,t,o){o=o||{};var w=o.walk!=null?o.walk:t*9,G1='#6f6a76',G2='#847e8c',D='#454050',sw=Math.sin(t*3)*1.5;
  function lg(x,ph,far){var s=Math.sin(w+ph),up=Math.max(0,Math.cos(w+ph))*2.6,dx=x>1?5:x<-1?-5:0;
    c.beginPath();c.moveTo(x,-9);c.lineTo(x+dx*.6+s*1.5,-16);c.lineTo(x+dx+s*4,-up);c.lineCap='round';c.lineJoin='round';c.strokeStyle=OUT;c.lineWidth=3.4;c.stroke();c.strokeStyle=far?D:G1;c.lineWidth=1.7;c.stroke()}
  [[-5,0],[0,2.1],[5,4.2]].forEach(function(q){lg(q[0],q[1]+3.14,true)});
  cel(c,function(c){el(c,-14,-10,9.5,7.6,-.15)},G1,{k:1.9,inn:function(c){ln(c,[-17,-18,-18.5,-3],D,1);ln(c,[-12,-18,-12.8,-2.6],D,1);dot(c,-17,-13,1.8,'rgba(255,255,255,.14)')}});
  cel(c,function(c){el(c,-1,-10,6.2,5.2)},G2,{k:1.2,lw:2.2});
  /* folha: o resto de cor */
  cel(c,function(c){c.moveTo(16,-15);c.quadraticCurveTo(9,-31+sw,24,-38+sw);c.quadraticCurveTo(31,-25+sw,19,-14);c.closePath()},'#5fbf5a',{k:1.3,lw:1.9,sh:'rgba(10,60,30,.4)',inn:function(c){ln(c,[17.5,-15,22.5,-34+sw],'#2f7a3a',1);ln(c,[19,-22+sw*.4,24,-26+sw*.6],'#2f7a3a',.8);ln(c,[18.4,-19,14.6,-25+sw*.5],'#2f7a3a',.8)}});
  cel(c,function(c){el(c,9,-12.5,7.3,6.7)},G2,{k:1.5});
  [[-5,0],[0,2.1],[5,4.2]].forEach(function(q){lg(q[0],q[1],false)});
  [[13,-17,17,-25,22,-24],[9,-18.5,11,-26,16,-27.5]].forEach(function(q){ln(c,q,OUT,2.6);ln(c,q,G1,1.2)});
  [[14,-10.5,20,-13.5,22,-9],[13.5,-8.5,19,-4.5,21.5,-7.5]].forEach(function(q){c.beginPath();c.moveTo(q[0],q[1]);c.quadraticCurveTo(q[2],q[3],q[4],q[5]);c.lineCap='round';c.strokeStyle=OUT;c.lineWidth=3.6;c.stroke();c.strokeStyle='#d9d2c4';c.lineWidth=1.8;c.stroke()});
  glow(c,11.4,-13.8,2.2,2.9,EYE,EYEG,9,.2);
}

/* ---------------- queixada ---------------- */
function drawQueixada(c,t,o){o=o||{};var mv=o.walk!=null,w=o.walk||0,b=mv?Math.abs(Math.cos(w))*1.4:Math.sin(t*2)*.5,G='#6d6360',D='#4b4346',i;
  function lg(x,ph,dark){var s=mv?Math.sin(w+ph):0;cel(c,function(c){cap(c,x,-10,x+s*5,-3,3.1)},dark?'#463e41':D,{k:.9,lw:1.9});cel(c,function(c){poly(c,[x+s*5-3,-3.4,x+s*5+3.3,-3.4,x+s*5+3.8,0,x+s*5-2.6,0])},'#1f1a1c',{k:0,lw:1.6})}
  lg(-9,3.14,true);lg(13,0,true);
  c.beginPath();c.moveTo(-21,-18-b);c.quadraticCurveTo(-28,-20-b,-26,-13-b);c.lineCap='round';c.strokeStyle=OUT;c.lineWidth=4;c.stroke();c.strokeStyle=D;c.lineWidth=2;c.stroke();
  /* crina eriçada */
  for(i=0;i<9;i++){var x=-17+i*4,h=7+(i%3)*2.2+(i>4?2:0);cel(c,function(c){poly(c,[x-2.6,-29-b,x-3.5,-29-h-b,x+2.6,-30-b])},'#2f2a33',{k:0,lw:1.6})}
  cel(c,function(c){c.moveTo(-22,-14-b);c.bezierCurveTo(-23,-30-b,-6,-34-b,6,-33-b);c.bezierCurveTo(18,-32-b,22,-22-b,20,-10-b);c.bezierCurveTo(8,-3-b,-14,-4-b,-22,-14-b);c.closePath()},G,{k:2.8,inn:function(c){
    c.fillStyle='rgba(255,240,225,.14)';c.beginPath();c.ellipse(-2,-7-b,16,4,0,0,TAU);c.fill();
    for(i=0;i<11;i++)ln(c,[-17+i*3.3,-24-b+(i%2)*5,-15+i*3.3,-20-b+(i%2)*5],'rgba(35,28,34,.5)',1)}});
  lg(-14,0,false);lg(8,3.14,false);
  cel(c,function(c){poly(c,[13,-31-b,17,-40-b,21.5,-31-b])},D,{k:.8,lw:1.9});
  cel(c,function(c){c.moveTo(11,-31-b);c.bezierCurveTo(22,-34-b,33,-27-b,38.5,-18.5-b);c.lineTo(39.5,-12-b);c.bezierCurveTo(32,-7.5-b,20,-7.5-b,12,-12-b);c.closePath()},'#786d6a',{k:2.1,inn:function(c){c.fillStyle='#e9e2d8';c.beginPath();c.ellipse(30,-9.6-b,10,3,-.08,0,TAU);c.fill();ln(c,[24,-12.6-b,38,-12.2-b],'rgba(35,28,34,.6)',1)}});
  cel(c,function(c){el(c,39,-15.4-b,2.8,4.1)},'#9a8486',{k:.8,lw:1.8});dot(c,39.4,-16.6-b,.7,OUT);dot(c,39.4,-14.2-b,.7,OUT);
  [[31,-11.5,35.5,-13.5,33.5,-20.5],[27,-11.5,31,-12.5,29.5,-18]].forEach(function(q){c.beginPath();c.moveTo(q[0],q[1]-b);c.quadraticCurveTo(q[2],q[3]-b,q[4],q[5]-b);c.lineCap='round';c.strokeStyle=OUT;c.lineWidth=4.2;c.stroke();c.strokeStyle='#f1ead8';c.lineWidth=2.2;c.stroke()});
  glow(c,25,-23-b,2.4,2.2,EYE,EYEG,10);ln(c,[21.5,-27.4-b,28.5,-25-b],OUT,2);
}

/* ---------------- tronco-oco ---------------- */
function drawTronco(c,t,o){o=o||{};var rs=o.raise||0,b=Math.sin(t*1.8)*1,BK='#6b655f',BK2='#57514d',i;
  function arm(sd){var sx=sd*14,sy=-42+b,fx=sd*(25-rs*5)+(sd>0?2:0),fy=-17+b-rs*56,k=seg2(c,sx,sy,fx,fy,15,15,sd,4.6,4.1,BK2,BK2,{k:1.4,lw:2.1});
    ln(c,[k[0],k[1],k[0]+sd*6,k[1]-7],OUT,3);ln(c,[k[0],k[1],k[0]+sd*6,k[1]-7],BK2,1.4);
    cel(c,function(c){el(c,fx,fy,7.6,7)},BK,{k:1.8,inn:function(c){ln(c,[fx-3,fy-3,fx-2.4,fy+4],'rgba(30,22,22,.5)',1);ln(c,[fx+1,fy-4,fx+1.4,fy+4],'rgba(30,22,22,.5)',1)}})}
  [-12,0,12].forEach(function(x,n){cel(c,function(c){el(c,x,-2.5,7.5,4.2)},BK2,{k:1,lw:2})});
  arm(-1);
  cel(c,function(c){c.moveTo(-16,-3);c.bezierCurveTo(-13,-20,-15,-36,-14,-50+b);c.lineTo(-9,-57+b);c.lineTo(-4,-50+b);c.lineTo(2,-60+b);c.lineTo(8,-51+b);c.lineTo(13,-56+b);c.bezierCurveTo(16,-36,13,-20,17,-3);c.closePath()},BK,{k:3.2,inn:function(c){
    [[-11,0],[-7,2],[8,1],[12,3]].forEach(function(q){c.beginPath();c.moveTo(q[0],-52);c.bezierCurveTo(q[0]+2,-40,q[0]-2,-24,q[0]+1,-4);c.strokeStyle='rgba(30,22,22,.45)';c.lineWidth=1.1;c.stroke()});
    c.fillStyle='rgba(88,112,84,.9)';c.beginPath();c.ellipse(-12,-48+b,7,5,.3,0,TAU);c.fill();c.beginPath();c.ellipse(-13,-8,6,5,0,0,TAU);c.fill();c.beginPath();c.ellipse(10,-50+b,5,3.4,0,0,TAU);c.fill();
    c.beginPath();c.ellipse(9.5,-16,2.6,3.4,0,0,TAU);c.strokeStyle='rgba(30,22,22,.6)';c.lineWidth=1.1;c.stroke()}});
  /* o oco é o rosto */
  c.beginPath();c.ellipse(0,-33+b,8.6,10.6,0,0,TAU);c.fillStyle='#130813';c.fill();c.strokeStyle=OUT;c.lineWidth=2.2;c.stroke();
  var g=c.createRadialGradient(0,-35+b,0,0,-35+b,10);g.addColorStop(0,'rgba(255,61,138,.42)');g.addColorStop(1,'rgba(255,61,138,0)');c.fillStyle=g;c.beginPath();c.ellipse(0,-33+b,8,10,0,0,TAU);c.fill();
  glow(c,-3.3,-35.5+b,2,2.5,EYE,EYEG,9,.35);glow(c,3.5,-35.5+b,2,2.5,EYE,EYEG,9,-.35);
  for(i=0;i<4;i++){c.beginPath();c.moveTo(-6+i*3.4,-23.2+b);c.lineTo(-4.4+i*3.4,-28+b);c.lineTo(-2.8+i*3.4,-23.2+b);c.closePath();c.fillStyle=BK;c.fill();c.strokeStyle=OUT;c.lineWidth=1;c.stroke()}
  /* orelhas-de-pau: o resto de cor */
  [[15,-31,5.4],[16.5,-23,4.4],[-15.5,-25,4.8]].forEach(function(q){var s=q[0]>0?1:-1;cel(c,function(c){c.moveTo(q[0]-s*1,q[1]-q[2]*.7);c.quadraticCurveTo(q[0]+s*q[2]*1.6,q[1]-q[2]*.6,q[0]+s*q[2]*1.5,q[1]+1);c.lineTo(q[0]-s*1,q[1]+1.6);c.closePath()},'#e8833a',{k:.9,lw:1.6,inn:function(c){ln(c,[q[0],q[1]+.4,q[0]+s*q[2]*1.4,q[1]+.2],'#ffd9a0',1.2)}})});
  ln(c,[2,-59+b,3,-67+b],OUT,2.6);ln(c,[2,-59+b,3,-67+b],'#4f8a45',1.2);
  [[-1,-.4],[1,.5]].forEach(function(q){cel(c,function(c){c.moveTo(3,-66+b);c.quadraticCurveTo(3+q[0]*7,-74+b,3+q[0]*11,-67+b+q[1]*2);c.quadraticCurveTo(3+q[0]*6,-64+b,3,-66+b);c.closePath()},'#5fbf5a',{k:.8,lw:1.5,sh:'rgba(10,60,30,.4)'})});
  arm(1);
}

/* ---------------- cuspidor ---------------- */
function drawCuspidor(c,t,o){o=o||{};var op=o.open!=null?o.open:(.5+.5*Math.sin(t*2.2))*.6,sw=Math.sin(t*1.5)*3,G='#6f7d6c',G2='#59665a',i;
  [[-1,-.9,G2],[1,-.9,G2],[-1,-.2,G],[1,-.2,G]].forEach(function(q){cel(c,function(c){c.moveTo(0,-3);c.quadraticCurveTo(q[0]*13,-8+q[1]*14,q[0]*25,-2+q[1]*10);c.quadraticCurveTo(q[0]*12,3+q[1]*4,0,-3);c.closePath()},q[2],{k:1.3,lw:2,inn:function(c){ln(c,[0,-3,q[0]*22,-2+q[1]*9],'rgba(30,40,30,.5)',.9)}})});
  var P=[[0,-4],[-7,-16],[4+sw*.5,-28],[2+sw,-39]];
  for(i=0;i<3;i++)(function(i){cel(c,function(c){cap(c,P[i][0],P[i][1],P[i+1][0],P[i+1][1],3.5-i*.3)},G,{k:1.2,lw:2})})(i);
  [[-5,-11],[-3,-21],[5,-33]].forEach(function(q){dot(c,q[0]+sw*.2,q[1],1.1,'#2f3a30')});
  c.save();c.translate(P[3][0]-3,P[3][1]-3);c.rotate(-.3+sw*.02);
  var up=-op*.62,dn=op*.62;
  /* interior: o resto de cor */
  c.beginPath();c.moveTo(-6,0);c.lineTo(Math.cos(up)*22-6,Math.sin(up)*22);c.quadraticCurveTo(22,0,Math.cos(dn)*22-6,Math.sin(dn)*22);c.closePath();c.fillStyle='#b12c63';c.fill();
  c.beginPath();c.ellipse(0,0,6,5*op+1,0,0,TAU);c.fillStyle='#5a1035';c.fill();
  function jaw(sgn,ang){c.save();c.translate(-7,0);c.rotate(ang);
    cel(c,function(c){c.moveTo(0,0);c.bezierCurveTo(1,sgn*-14,24,sgn*-15,29,sgn*-1);c.closePath()},sgn>0?G:G2,{k:1.7,inn:function(c){[[9,-8],[16,-9],[22,-6]].forEach(function(q){dot(c,q[0],sgn*q[1],1.5,'rgba(30,40,30,.5)')});ln(c,[1,sgn*-1.2,28,sgn*-2],'#a9b7a2',1.2)}});
    for(i=0;i<6;i++){c.beginPath();c.moveTo(4+i*4,sgn*-.6);c.lineTo(6+i*4,sgn*4.2);c.lineTo(8+i*4,sgn*-.6);c.closePath();c.fillStyle='#f4efe2';c.fill();c.strokeStyle=OUT;c.lineWidth=.9;c.stroke()}
    c.restore()}
  jaw(-1,dn);jaw(1,up);
  c.save();c.translate(-7,0);c.rotate(up);glow(c,10,-9.5,1.6,1.6,EYE,EYEG,8);glow(c,16,-10.5,1.6,1.6,EYE,EYEG,8);c.restore();
  c.restore();
}

/* ---------------- curupira ---------------- */
function drawCurupira(c,t,o){o=o||{};var b=Math.sin(t*2)*1,S1='#8b9486',S2='#737c70',LF='#6f7d6c',LF2='#59665a',i,hy=-68+b;
  /* o.fake: cópia ilusória, pés para a frente · o.cast: mão à boca para o assobio · o.gray===false: libertado, com a cor de volta */
  var fk=o.fake?-1:1,cs=Math.max(0,Math.min(1,o.cast||0)),PT='#4a5248',VN='#4f6a4a',WD='#6b5a48';
  if(o.gray===false){S1='#b58c56';S2='#8f6c3e';LF='#5fa34c';LF2='#3f7f3c';PT='#5e3d22';VN='#3d8f48';WD='#8a6238'}
  /* brilho do cabelo */
  var g=c.createRadialGradient(1,hy-18,2,1,hy-18,46);g.addColorStop(0,'rgba(255,150,40,.5)');g.addColorStop(1,'rgba(255,150,40,0)');c.save();c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(-50,hy-70,102,100);c.restore();
  function lg(hx,fx,dark){var kn=ik(hx,-30+b,fx,-5,13.5,13.5,-1);
    cel(c,function(c){cap(c,hx,-30+b,kn[0],kn[1],4.3)},dark?S2:S1,{k:1.3,lw:2});
    cel(c,function(c){cap(c,kn[0],kn[1],fx,-5,3.6)},dark?S2:S1,{k:1.2,lw:2});
    /* pé virado para trás: dedos apontam para a esquerda */
    cel(c,function(c){c.moveTo(fx+4.5*fk,0);c.lineTo(fx+4.5*fk,-5.5);c.quadraticCurveTo(fx-3*fk,-8.5,fx-10*fk,-4.5);c.quadraticCurveTo(fx-13*fk,-1.5,fx-10.5*fk,0);c.closePath()},dark?S2:S1,{k:1,lw:2,inn:function(c){[-8.5,-6,-3.5].forEach(function(d){ln(c,[fx+d*fk,-4.6,fx+(d-.8)*fk,-.4],'rgba(30,36,30,.6)',.9)})}});
    ln(c,[fx-3*fk,-7.6,fx+4*fk,-7],VN,1.8)}
  lg(5,8,true);lg(-5,-4,false);
  /* braço de trás, mão na cintura */
  if(!cs)seg2(c,9,-52+b,11,-37+b,9,9,1,3.3,3,S2,S2,{k:1.1,lw:2});
  /* saia de folhas */
  for(i=0;i<8;i++)(function(i){var x=-12.5+i*3.6,l=13+(i%2)*4;cel(c,function(c){c.moveTo(x-3.4,-36+b);c.quadraticCurveTo(x-4.6,-36+b+l*.6,x,-36+b+l);c.quadraticCurveTo(x+4.6,-36+b+l*.6,x+3.4,-36+b);c.closePath()},i%2?LF:LF2,{k:1,lw:1.7,inn:function(c){ln(c,[x,-35+b,x,-37+b+l],'rgba(30,40,30,.5)',.8)}})})(i);
  /* tronco e pintura */
  cel(c,function(c){el(c,0,-45+b,10.4,11.6)},S1,{k:2.2,inn:function(c){c.beginPath();c.arc(-1,-44+b,5.5,.5,2.6);c.strokeStyle=PT;c.lineWidth=1.6;c.stroke();c.beginPath();c.arc(-1,-47+b,8,.7,2.4);c.stroke();dot(c,5,-42+b,1,PT);dot(c,-6,-40+b,1,PT)}});
  ln(c,[-11,-36.5+b,11,-36.5+b],VN,2.2);
  for(i=0;i<8;i++){var a=.5+i*.31;dot(c,-.5+Math.cos(a)*-9.5,-55.5+b+Math.sin(a)*5.5,1.4,i%3?'#e9e2d8':'#c9bfae');}
  /* orelhas e cabeça */
  cel(c,function(c){poly(c,[-11,hy-3,-22,hy-10,-12.5,hy+5])},S2,{k:.9,lw:1.9});cel(c,function(c){poly(c,[13,hy-3,24,hy-11,14.5,hy+5])},S1,{k:.9,lw:1.9});
  /* cabelo de fogo, atrás da cabeça */
  function flames(sc,col,out){for(i=0;i<7;i++)(function(i){var bx=-11.5+i*4.1,h=(20+((i*7)%5)*3.2+(i==3?9:0)+Math.sin(t*6+i*1.9)*3)*sc,s=Math.sin(t*4.5+i*1.3)*3.2,by=hy-Math.sqrt(Math.max(0,169-(bx-1)*(bx-1)*.86))+5,wd=5.2*sc+.6;
      c.beginPath();c.moveTo(bx-wd,by);c.quadraticCurveTo(bx-wd-1+s*.5,by-h*.55,bx+s*1.5,by-h);c.quadraticCurveTo(bx+wd+1+s*.5,by-h*.5,bx+wd,by);c.closePath();
      if(out){c.strokeStyle=OUT;c.lineWidth=3.6;c.lineJoin='round';c.stroke()}c.fillStyle=col;c.fill()})(i)}
  flames(1,'#e2401f',true);flames(1,'#e2401f',false);flames(.72,'#ff8a1e',false);flames(.42,'#ffd84a',false);
  cel(c,function(c){el(c,1,hy,14,13)},S1,{k:2.5,inn:function(c){ln(c,[6,hy+5,12,hy+3],PT,1.8);ln(c,[6.5,hy+8,11.5,hy+6.4],PT,1.8);ln(c,[-9,hy+4,-4,hy+6],PT,1.8)}});
  /* olhos, sobrancelhas, sorriso com presas */
  [[8.2,.28],[-.6,.22]].forEach(function(e){glow(c,e[0],hy-.6,3.3,2.2,'#fff4c4','#ffb347',10,e[1]);c.beginPath();c.ellipse(e[0]+.4,hy-.6,.9,2,e[1],0,TAU);c.fillStyle='#1c0f0a';c.fill()});
  ln(c,[4.6,hy-5.4,12,hy-2.6],'#2a302a',2.2);ln(c,[-4.6,hy-2.8,2.4,hy-5.2],'#2a302a',2.2);
  if(cs<.5){
  c.beginPath();c.moveTo(1,hy+7);c.quadraticCurveTo(6,hy+10.5,11,hy+6.4);c.strokeStyle='#2a302a';c.lineWidth=1.5;c.lineCap='round';c.stroke();
  [[4,hy+8.4],[8.6,hy+8]].forEach(function(q){c.beginPath();c.moveTo(q[0]-1,q[1]);c.lineTo(q[0],q[1]+2.6);c.lineTo(q[0]+1,q[1]);c.closePath();c.fillStyle='#fff';c.fill()});
  }else{/* boca em bico, assobiando */c.beginPath();c.ellipse(8.4,hy+8,1.9,2.2,0,0,TAU);c.fillStyle='#2a1a16';c.fill();c.strokeStyle='#2a302a';c.lineWidth=1.2;c.stroke()}
  c.beginPath();c.arc(12.6,hy+2.6,1.3,-1.2,1.4);c.strokeStyle=PT;c.lineWidth=1.1;c.stroke();
  /* brasas */
  for(i=0;i<6;i++){var u=(t*.5+i/6)%1;dot(c,-14+i*6+Math.sin(u*7+i)*4,hy-26-u*34,1.5*(1-u)+.4,'rgba(255,200,80,'+(1-u)+')')}
  /* assobio: o braço livre sobe e a mão vai à boca */
  if(cs){var chx=11+cs*4,chy=-37+b-cs*19.5;seg2(c,9,-52+b,chx,chy,9,9,1,3.3,3,S2,S2,{k:1.1,lw:2});
    if(cs>.5)[[-5.6,-3.6],[-3.4,-5]].forEach(function(q){cel(c,function(c){cap(c,chx-1,chy-1,chx+q[0],chy+q[1],1.25)},S2,{k:.4,lw:1.5})});
    cel(c,function(c){el(c,chx,chy,3.3,3.1)},S2,{k:.8,lw:1.8});
    if(cs>.6)for(i=0;i<3;i++){c.beginPath();c.arc(8,hy+8,13+i*5+((t*8)%5),-.62,.34);c.strokeStyle='rgba(255,244,196,'+((cs-.6)/.4*(.85-i*.24))+')';c.lineWidth=1.5;c.lineCap='round';c.stroke()}}
  /* lança */
  cel(c,function(c){cap(c,17,1,20.5,-96,1.7)},WD,{k:.7,lw:1.7});
  cel(c,function(c){poly(c,[20.6,-112,25,-99,21,-94,16.4,-99])},'#8d8a84',{k:1.2,lw:1.8,inn:function(c){ln(c,[20.6,-110,20.8,-96],'rgba(255,255,255,.4)',.9)}});
  ln(c,[18,-93,23.4,-91],VN,2);ln(c,[17.8,-90,23.2,-88],VN,2);
  cel(c,function(c){c.moveTo(21,-90);c.quadraticCurveTo(30,-90,31,-80);c.quadraticCurveTo(24,-82,21,-90);c.closePath()},LF,{k:.8,lw:1.5});
  /* braço da frente segura a lança */
  var hyy=-45+b;seg2(c,-9,-52+b,18.6,hyy,14.5,14.5,1,3.5,3.1,S1,S1,{k:1.2,lw:2});
  ln(c,[5,-44+b,9,-47+b],VN,2);
  cel(c,function(c){el(c,18.6,hyy,3.7,3.7)},S1,{k:.9,lw:1.8});
}

export { OUT, TAU, el, cap, poly, cel, ln, dot, glow, star, ik, seg2,
  drawHero, drawCapi, drawSauva, drawQueixada, drawTronco, drawCuspidor, drawCurupira };
