// @ts-nocheck
/* Segunda leva de desenhos por código, no mesmo estilo de characters.ts: peças recortadas com
   sombra, brilho e contorno. Todos virados para a direita, pés na origem (0,0), y negativo para cima.
   Assinatura: draw(ctx, tempoEmSegundos, opções). */
import { OUT, TAU, el, cap, poly, cel, ln, dot, glow, ik, seg2, drawQueixada } from './characters';

var EYE='#ffe0f0',EYEG='#ff3d8a';
function cl(v){return v==null?0:Math.max(0,Math.min(1,v))}
function lp(a,b,k){return a+(b-a)*k}
/* traço grosso com contorno (cipós, galhos, barras) */
function rope(c,fn,col,lw,out){c.beginPath();fn(c);c.lineCap='round';c.lineJoin='round';c.strokeStyle=out||OUT;c.lineWidth=lw+2.2;c.stroke();c.strokeStyle=col;c.lineWidth=lw;c.stroke()}

/* ---------------- urutau ---------------- */
/* o.hidden 0..1 (1 = camuflado no toco, olhos em fenda; 0 = revelado, olhos enormes)
   o.fly    fase em radianos: desenha em voo, asas batendo
   o.stump  false para não desenhar o toco em que ele pousa */
function drawUrutau(c,t,o){o=o||{};var fly=o.fly!=null,h=fly?0:cl(o.hidden),r=1-h,
    G='#7a726b',G2='#5e5753',DK='#3b3534',BK='#6b655f',YE='#ffd23f',YEG='#ff9d00',i;
  c.save();c.scale(.92,.92);
  function head(hx,hy,R,rot,open,gape){c.save();c.translate(hx,hy);c.rotate(rot);
    /* penas arrepiadas do cocuruto */
    [-2.75,-2.3,-1.85].forEach(function(a,n){var q=R*(1.1+open*(.26+(n%2)*.14));cel(c,function(c){poly(c,[Math.cos(a-.3)*R*.8,Math.sin(a-.3)*R*.8,Math.cos(a-.1)*q,Math.sin(a-.1)*q,Math.cos(a+.3)*R*.8,Math.sin(a+.3)*R*.8])},G2,{k:.6,lw:1.6})});
    /* camuflado, a testa vira a ponta lascada do galho */
    if(open<.7){var hq=1-open/.7;[[-.95,1.5],[-.5,1.36]].forEach(function(q){cel(c,function(c){poly(c,[Math.cos(q[0]-.3)*R*.8,Math.sin(q[0]-.3)*R*.8,Math.cos(q[0]+.06)*R*(1+(q[1]-1)*hq),Math.sin(q[0]+.06)*R*(1+(q[1]-1)*hq),Math.cos(q[0]+.3)*R*.8,Math.sin(q[0]+.3)*R*.8])},G2,{k:.6,lw:1.6})})}
    /* mandíbula: a boca do urutau é enorme */
    if(gape>0){cel(c,function(c){c.moveTo(-R*.5,R*.3);c.quadraticCurveTo(R*.1,R*(.75+gape*.75),R*(1.05+gape*.1),R*(.5+gape*.7));c.lineTo(R*.8,R*.15);c.closePath()},G2,{k:.8,lw:1.7,inn:function(c){c.beginPath();c.moveTo(-R*.4,R*.3);c.quadraticCurveTo(R*.2,R*(.6+gape*.55),R*(.95+gape*.1),R*(.42+gape*.6));c.lineTo(R*.8,R*.1);c.closePath();c.fillStyle='#2a1218';c.fill()}})}
    cel(c,function(c){el(c,0,0,R,R*.94)},G,{k:1.9,inn:function(c){
      [[-.55,-.7,-.75,-.1],[-.2,-.92,-.35,-.5],[.2,-.93,.1,-.62],[-.8,.05,-.6,.5]].forEach(function(q){ln(c,[q[0]*R,q[1]*R,q[2]*R,q[3]*R],'rgba(35,28,30,.42)',1)});
      c.fillStyle='rgba(235,225,205,.14)';c.beginPath();c.ellipse(R*.25,R*.5,R*.6,R*.3,0,0,TAU);c.fill()}});
    /* boca larga e bico curto em gancho */
    c.beginPath();c.moveTo(R*.95,R*.3);c.quadraticCurveTo(R*.2,R*.72,-R*.5,R*.36);c.strokeStyle=DK;c.lineWidth=1.3;c.lineCap='round';c.stroke();
    cel(c,function(c){c.moveTo(R*.66,-R*.02);c.quadraticCurveTo(R*1.22,-R*.02,R*1.42,R*.46);c.quadraticCurveTo(R*1.05,R*.36,R*.7,R*.42);c.closePath()},DK,{k:.7,lw:1.6,hi:'rgba(255,238,190,.3)'});
    /* olhos: o resto de cor */
    [[R*.36,-R*.16,R*.45],[-R*.47,-R*.12,R*.38]].forEach(function(e){var ex=e[0],ey=e[1],er=e[2];
      if(open>.12){dot(c,ex,ey,er+1.2,'#2a2222');glow(c,ex,ey,er,er*open,YE,YEG,5+open*9);
        c.beginPath();c.ellipse(ex,ey,er*.82,er*.82*open,0,0,TAU);c.strokeStyle='rgba(214,120,0,.7)';c.lineWidth=.9;c.stroke();
        c.beginPath();c.ellipse(ex+er*.12,ey,er*.46,er*.46*Math.min(1,open*1.2),0,0,TAU);c.fillStyle='#1c0f0a';c.fill();
        dot(c,ex-er*.22,ey-er*.4*open,er*.2,'#fff')}
      else{c.beginPath();c.moveTo(ex-er*.75,ey+.1);c.quadraticCurveTo(ex,ey+2.1,ex+er*.75,ey+.1);c.strokeStyle='#241c1c';c.lineWidth=1.5;c.lineCap='round';c.stroke();dot(c,ex,ey+1,.45,'rgba(255,210,63,.5)')}});
    if(open>.5){ln(c,[R*.02,-R*.5,R*.82,-R*.74],DK,1.9);ln(c,[-R*.88,-R*.62,-R*.2,-R*.44],DK,1.9)}
    c.restore()}

  if(fly){var f=o.fly,by=-25+Math.cos(f)*1.6;
    function wing(k,col,col2){var L=27,q=Math.abs(k)<.16?(k<0?-.16:.16):k;c.save();c.translate(-1,by-3);c.rotate(-.3);
      cel(c,function(c){c.moveTo(6,0);c.quadraticCurveTo(9,-L*.6*q,2.5,-L*q);[[-1.5,-.88],[-3.2,-.9],[-5,-.72],[-7.2,-.74],[-8.2,-.52],[-10.6,-.52],[-10.2,-.3],[-12.4,-.26],[-8.5,0]].forEach(function(p){c.lineTo(p[0],p[1]*L*q)});c.closePath()},col,{k:1.5,lw:2,inn:function(c){
        [[3,-.9],[-.5,-.8],[-3.6,-.64],[-6.6,-.44]].forEach(function(p){ln(c,[p[0]*.4+1,-L*q*.12,p[0],p[1]*L*q],'rgba(35,28,30,.45)',1)});
        ln(c,[5.5,-L*q*.3,-9,-L*q*.2],col2,2.2)}});
      c.restore()}
    wing(Math.cos(f-.5),G2,'rgba(149,140,129,.5)');
    /* cauda */
    cel(c,function(c){poly(c,[-8,by-3.5,-24,by-5,-26.5,by-.5,-23.5,by+1,-25,by+4.5,-9,by+4])},DK,{k:1.1,lw:1.9,inn:function(c){ln(c,[-20.5,by-6,-21.5,by+6],'rgba(149,140,129,.6)',1.6);ln(c,[-15.5,by-6,-16.2,by+6],'rgba(149,140,129,.45)',1.4)}});
    /* pés recolhidos */
    ln(c,[-3,by+5.5,-5.5,by+8.6],OUT,3);ln(c,[-3,by+5.5,-5.5,by+8.6],DK,1.4);ln(c,[1,by+6,-1.2,by+9],OUT,3);ln(c,[1,by+6,-1.2,by+9],DK,1.4);
    cel(c,function(c){el(c,0,by,11.5,7,-.12)},G,{k:2,inn:function(c){
      c.fillStyle='rgba(235,225,205,.16)';c.beginPath();c.ellipse(2,by+4,8,2.6,-.1,0,TAU);c.fill();
      for(i=0;i<7;i++)ln(c,[-8+i*2.8,by-2.5+(i%2)*3.4,-6.8+i*2.8,by-.4+(i%2)*3.4],'rgba(35,28,30,.45)',1)}});
    head(10.5,by-5.5,8.8,.12,1,.75+Math.sin(f)*.2);
    wing(Math.cos(f),G,'rgba(170,160,148,.55)');
    c.restore();return}

  var bq=Math.sin(t*2.2)*.5*r,wd=7+r*2.4;
  /* toco */
  if(o.stump!==false){
    [[-7.5,-1.6,3.4],[7.6,-1.4,3.2]].forEach(function(q){cel(c,function(c){el(c,q[0],q[1],q[2],1.9)},'#57514d',{k:.7,lw:1.8})});
    cel(c,function(c){c.moveTo(-7.6,0);c.bezierCurveTo(-6,-5,-6.6,-10,-6.2,-15.5);c.lineTo(-3,-13);c.lineTo(0,-16.5);c.lineTo(3.2,-13.4);c.lineTo(6.2,-16);c.bezierCurveTo(6.4,-10,6.4,-5,8.4,0);c.closePath()},BK,{k:1.8,lw:2.2,inn:function(c){
      [-3.6,0,3.8].forEach(function(x){c.beginPath();c.moveTo(x,-15);c.bezierCurveTo(x+1.2,-10,x-1.2,-6,x+.5,-.5);c.strokeStyle='rgba(30,22,22,.45)';c.lineWidth=1;c.stroke()});
      c.fillStyle='rgba(88,112,84,.9)';c.beginPath();c.ellipse(-6,-3,4,3,0,0,TAU);c.fill();
      c.beginPath();c.ellipse(4,-6,1.5,2,0,0,TAU);c.strokeStyle='rgba(30,22,22,.55)';c.lineWidth=1;c.stroke()}})}
  /* cauda pendurada ao longo do toco */
  cel(c,function(c){poly(c,[-6,-18,-9.2-r*1.5,-5,-6.6-r,-2.6,-4.8,-5,-2.6-r*.5,-3.4,-1.4,-17])},DK,{k:1,lw:1.9,inn:function(c){ln(c,[-10,-9.5,-1,-8.5],'rgba(149,140,129,.5)',1.5);ln(c,[-10,-13.5,-1,-12.5],'rgba(149,140,129,.35)',1.3)}});
  /* corpo esguio com textura de casca */
  cel(c,function(c){c.moveTo(-wd*.72,-12.5);c.bezierCurveTo(-wd*1.12,-20,-wd*1.04,-30,-wd*.9,-38.5);c.lineTo(wd*.9,-38.5);c.bezierCurveTo(wd*1.14,-30,wd*1.16,-20,wd*.68,-12.5);c.closePath()},G,{k:2.1,inn:function(c){
    c.fillStyle='rgba(235,225,205,.15)';c.beginPath();c.ellipse(wd*.38,-22,wd*.42,8,0,0,TAU);c.fill();
    for(i=0;i<5;i++){var x=-wd+1.6+i*(2*wd-3.2)/4;c.beginPath();c.moveTo(x,-38);c.bezierCurveTo(x+1.6,-30,x-1.6,-21,x+.6,-12);c.strokeStyle='rgba(35,28,30,.42)';c.lineWidth=1;c.stroke()}
    [[.2,-28],[.55,-19.5],[.1,-16]].forEach(function(q){ln(c,[q[0]*wd-1.6,q[1]-1.2,q[0]*wd,q[1],q[0]*wd+1.6,q[1]-1.2],'rgba(35,28,30,.5)',1)});
    dot(c,-wd*.2,-24,.9,'rgba(235,225,205,.3)');dot(c,wd*.6,-31,.8,'rgba(235,225,205,.3)')}});
  /* asa dobrada */
  cel(c,function(c){c.moveTo(-wd*.05,-35);c.bezierCurveTo(-wd*1.3-r*2.5,-33,-wd*1.24-r*3.5,-22,-wd*.62-r*2.5,-13.6);c.bezierCurveTo(-wd*.1,-18,wd*.36,-27,-wd*.05,-35);c.closePath()},G2,{k:1.5,lw:2,inn:function(c){
    [[-.75,-29,-.85,-21],[-.4,-30,-.55,-19],[-.05,-29,-.3,-18]].forEach(function(q){ln(c,[q[0]*wd-r*1.5,q[1],q[2]*wd-r*2,q[3]],'rgba(30,24,26,.5)',1)});
    ln(c,[-wd*1.1-r*2.5,-25.5,wd*.1,-23.5],'rgba(149,140,129,.55)',1.6)}});
  /* dedos agarrados ao toco */
  if(o.stump!==false)[[-1.6,-12.6],[1,-12.3],[3.6,-12.6]].forEach(function(q){ln(c,[q[0],q[1]-1.6,q[0]+.3,q[1]+1.4],OUT,2.8);ln(c,[q[0],q[1]-1.6,q[0]+.3,q[1]+1.4],DK,1.3)});
  head(.5+r*1.6,-39.5+r*2+bq,7+r*2.2,-h*1.12,r,0);
  /* camuflado, o pescoço some: cabeça e corpo viram um galho só */
  if(h>.5){c.save();c.globalAlpha=(h-.5)*2;var ng=c.createLinearGradient(0,-39.5,0,-35);ng.addColorStop(0,'rgba(122,114,107,0)');ng.addColorStop(1,G);
    c.fillStyle=ng;c.beginPath();poly(c,[-4.4,-39.5,5.6,-39.5,5.9,-30.6,-.4,-30.6,-2,-33,-4.6,-33.6]);c.fill();
    var ns=c.createLinearGradient(0,-39.5,0,-35);ns.addColorStop(0,'rgba(38,8,30,0)');ns.addColorStop(1,'rgba(38,8,30,.3)');c.fillStyle=ns;c.fillRect(4.2,-39.5,1.7,9);
    ln(c,[-2.4,-39,-1.4,-33.6],'rgba(35,28,30,.42)',1);ln(c,[2,-39,3.4,-31],'rgba(35,28,30,.42)',1);c.restore()}
  c.restore();
}

/* ---------------- cogumelo-estouro ---------------- */
/* o.walk  fase da caminhada (opcional)
   o.swell 0..1: incha o chapéu e faz brilhar antes de estourar */
function drawCogumelo(c,t,o){o=o||{};var mv=o.walk!=null,w=o.walk||0,sw=cl(o.swell),
    b=mv?Math.abs(Math.cos(w))*1.3:Math.sin(t*2.6)*.5,pu=sw*(.5+.5*Math.sin(t*24)),
    ST='#aaa29b',ST2='#8a827d',CP='#6d6360',CP2='#544c4d',LM='#c9f24a',LMG='#9dff2e',i,
    CW=15.5*(1+sw*.26)+pu*.9,CH=14*(1+sw*.3)+pu*.9,ry=-19.5-b;
  c.save();if(sw)c.translate(Math.sin(t*47)*sw*.6,0);
  if(sw>0){var g=c.createRadialGradient(0,ry-CH*.4,2,0,ry-CH*.4,CW*1.7);g.addColorStop(0,'rgba(190,255,70,'+(.5*sw)+')');g.addColorStop(1,'rgba(190,255,70,0)');c.save();c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(-CW*1.8,ry-CH*.4-CW*1.8,CW*3.6,CW*3.6);c.restore()}
  /* perninhas */
  function ft(x,ph,dark){var s=mv?Math.sin(w+ph):0,up=mv?Math.max(0,Math.cos(w+ph))*2.2:0,fx=x+s*3.6,fy=-2.3-up;
    cel(c,function(c){cap(c,x,-6-b,fx,fy-1,1.9)},dark?'#5a5354':'#6b6364',{k:.6,lw:1.7});
    cel(c,function(c){c.moveTo(fx-3,fy+2.3);c.quadraticCurveTo(fx-3.4,fy-2,fx,fy-2.2);c.quadraticCurveTo(fx+4.8,fy-1.8,fx+5,fy+2.3);c.closePath()},dark?'#3d3739':'#4b4346',{k:.8,lw:1.7})}
  ft(3.6,3.14,true);ft(-3.6,0,false);
  /* pé do cogumelo, com o rosto */
  cel(c,function(c){c.moveTo(-5.2,ry+1);c.bezierCurveTo(-5.6,ry+7,-9.6,-9-b,-7.6,-5-b);c.quadraticCurveTo(0,-1.4-b,7.6,-5-b);c.bezierCurveTo(9.6,-9-b,5.6,ry+7,5.2,ry+1);c.closePath()},ST,{k:1.9,lw:2.2,inn:function(c){
    [-4.6,-6.6].forEach(function(x){ln(c,[x,ry+6,x-.6,-5-b],'rgba(40,32,36,.28)',.9)});
    c.fillStyle='rgba(60,50,52,.28)';c.beginPath();c.ellipse(0,-3.4-b,8,2,0,0,TAU);c.fill()}});
  glow(c,-.8,-9.4-b,1.8,2.4,EYE,EYEG,8,.15);glow(c,4.6,-9.6-b,1.6,2.3,EYE,EYEG,8,-.1);
  ln(c,[-3.6,-13-b,1,-11.6-b],OUT,1.7);ln(c,[3,-11.8-b,6.8,-13-b],OUT,1.7);
  ln(c,[0,-5.4-b,1.7,-6.3-b,3.2,-5.3-b,4.8,-6.2-b],OUT,1.1);
  /* anel rasgado */
  cel(c,function(c){poly(c,[-6.2,ry+1.6,6.2,ry+1.6,7.4,ry+4.8,5,ry+4,3.4,ry+5.8,1.2,ry+4.2,-1,ry+5.6,-3.2,ry+4,-5.4,ry+5.4,-7.4,ry+4.4])},ST2,{k:.8,lw:1.6});
  /* lamelas: o resto de cor */
  glow(c,0,ry+1.5,CW*.78,2.6,LM,LMG,5+sw*16);
  cel(c,function(c){c.moveTo(-CW*.94,ry);c.quadraticCurveTo(0,ry+6.4+sw*2,CW*.94,ry);c.quadraticCurveTo(0,ry-4,-CW*.94,ry);c.closePath()},sw>.5?'#e2ff6a':LM,{k:1.1,lw:1.8,sh:'rgba(40,90,10,.36)',hi:'rgba(255,255,220,.3)',inn:function(c){
    for(i=-6;i<=6;i++)ln(c,[i*1,ry-2,i*CW*.165,ry+7],'#5c8a1e',.9)}});
  /* chapéu */
  cel(c,function(c){c.moveTo(-CW,ry+.5);c.bezierCurveTo(-CW*1.05,ry-CH*.62,-CW*.6,ry-CH,0,ry-CH);c.bezierCurveTo(CW*.6,ry-CH,CW*1.05,ry-CH*.62,CW,ry+.5);c.quadraticCurveTo(0,ry-4.6,-CW,ry+.5);c.closePath()},CP,{k:2.6,inn:function(c){
    var u=CW/15.5;
    [[-7,-.56,3.5,2.7],[3.4,-.74,4.1,3],[9.6,-.4,2.7,2.2],[-11.6,-.26,2,1.6],[-1.4,-.3,2.3,1.7],[-3.6,-.88,1.8,1.2]].forEach(function(q){
      c.beginPath();c.ellipse(q[0]*u,ry+q[1]*CH,q[2]*u,q[3]*u,-.1,0,TAU);c.fillStyle='#928a85';c.fill();c.beginPath();c.ellipse(q[0]*u,ry+q[1]*CH,q[2]*u,q[3]*u,-.1,.3,2.6);c.strokeStyle='rgba(35,28,34,.5)';c.lineWidth=.9;c.stroke()});
    c.beginPath();c.moveTo(-CW*.96,ry-.6);c.quadraticCurveTo(0,ry-6,CW*.96,ry-.6);c.strokeStyle='rgba(35,28,34,.45)';c.lineWidth=1.6;c.stroke();
    if(sw>0){var g2=c.createRadialGradient(0,ry-CH*.35,1,0,ry-CH*.35,CW*1.05);g2.addColorStop(0,'rgba(210,255,90,'+(.7*sw)+')');g2.addColorStop(1,'rgba(210,255,90,0)');c.fillStyle=g2;c.fillRect(-CW*1.2,ry-CH*1.2,CW*2.4,CH*1.5);
      c.save();c.globalAlpha=sw;c.shadowColor=LMG;c.shadowBlur=6;
      [[-4,-.98,-6.5,-.7,-3.4,-.52,-5.6,-.28],[6,-.94,8.4,-.66,6.4,-.5,9.6,-.26],[1,-.6,.2,-.42,2.4,-.3]].forEach(function(q){var p=[];for(var j=0;j<q.length;j+=2)p.push(q[j]*u,ry+q[j+1]*CH);ln(c,p,'#ecff9a',1.3)});c.restore()}}});
  /* broto no alto do chapéu */
  var bx=-CW*.5,byy=ry-CH*.83;ln(c,[bx+.6,byy+1.5,bx-.6,byy-2.4],OUT,3.2);ln(c,[bx+.6,byy+1.5,bx-.6,byy-2.4],ST2,1.5);
  cel(c,function(c){el(c,bx-.9,byy-3.4,3.2,2.1,-.35)},CP2,{k:.8,lw:1.6});
  /* esporos */
  var n=5+Math.round(sw*4);for(i=0;i<n;i++){var u2=(t*.35+i*.37)%1,sx=Math.sin(i*2.3+u2*4)*CW*(.55+.5*u2),sy=ry+5-u2*(20+sw*10),sr=.9+sw*.5+(i%2)*.3;c.save();c.globalAlpha=(1-u2)*(.6+.4*sw);glow(c,sx,sy,sr,sr,LM,LMG,5);c.restore()}
  c.restore();
}

/* ---------------- onça (filhote, companheiro) ---------------- */
/* o.walk   fase da caminhada (opcional)
   o.pounce 0..1: bote, corpo esticado e patas da frente para a frente */
function drawOnca(c,t,o){o=o||{};var mv=o.walk!=null,w=o.walk||0,p=cl(o.pounce),b=Math.sin(t*2.6)*.6*(1-p)+(mv?Math.abs(Math.cos(w))*.7:0),
    B='#eaa63c',D='#cf8a2c',D2='#a9661f',CR='#f9e7be',RS='#35190e',RC='#c77a22',RED='#cf3b28',i,sw=Math.sin(t*3)*2,fl=Math.sin(t*5+w)*1.2;
  function ros(x,y,r,a0){dot(c,x,y,r*.5,RC);for(var j=0;j<3;j++){c.beginPath();c.arc(x,y,r,a0+j*2.09,a0+j*2.09+1.3);c.strokeStyle=RS;c.lineWidth=1.3;c.lineCap='round';c.stroke()}}
  c.save();
  if(p){c.translate(p*3,-14-p*5);c.rotate(-p*.2);c.scale(1+p*.13,1-p*.07);c.translate(0,14)}
  function leg(x,ph,dark,front){var s=mv?Math.sin(w+ph):0,up=mv?Math.max(0,Math.cos(w+ph))*1.8:0,
      fx=x+s*3.4+(front?p*12.5:-p*10.5),fy=-2.8-up+(front?-p*6.5:-p*1.5),hy=-9+b*.5;
    cel(c,function(c){cap(c,x,hy,fx,fy,3)},dark?D2:D,{k:.9,lw:1.9,inn:function(c){dot(c,lp(x,fx,.45)-1,lp(hy,fy,.45),.8,RS);dot(c,lp(x,fx,.7)+1,lp(hy,fy,.7),.7,RS)}});
    var px=fx+1+(front?p*1.5:-p),py=fy+.4;
    if(front&&p>.4)[-.9,.6,2.1].forEach(function(d){ln(c,[px+2.4,py+d*.9-.4,px+5.2,py+d*.9+.3],'#fff6e0',1)});
    cel(c,function(c){el(c,px,py,3.9,2.7,front?-p*.4:p*.4)},dark?'#b87526':'#e09c36',{k:.8,lw:1.8,inn:function(c){ln(c,[px+1,py-.6,px+1.4,py+2],'rgba(70,35,12,.6)',.8);ln(c,[px+2.6,py-.4,px+2.8,py+1.8],'rgba(70,35,12,.6)',.8)}})}
  leg(-8,3.14,true,false);leg(11,0,true,true);
  /* rabo comprido, com anéis e ponta escura */
  var T1=[-25,lp(-12,-17,p)+b],T2=[lp(-30,-29,p),lp(-24,-17,p)+b],T3=[lp(-23,-34,p)+sw*(1-p),lp(-33,-20.5,p)+b];
  function tp(c){c.moveTo(-14,-15+b);c.bezierCurveTo(T1[0],T1[1],T2[0],T2[1],T3[0],T3[1])}
  c.lineCap='round';c.beginPath();tp(c);c.strokeStyle=OUT;c.lineWidth=6.6;c.stroke();c.strokeStyle=B;c.lineWidth=4.2;c.stroke();
  c.lineCap='butt';c.setLineDash([1.7,3.7]);c.lineDashOffset=-5;c.strokeStyle=RS;c.lineWidth=4.2;c.beginPath();tp(c);c.stroke();c.setLineDash([]);c.lineDashOffset=0;
  dot(c,T3[0],T3[1],2.1,RS);
  /* corpo */
  cel(c,function(c){c.moveTo(-16.5,-12+b);c.bezierCurveTo(-18,-23+b,-5,-26+b,5,-22.5+b);c.bezierCurveTo(12,-20.5+b,15,-14+b,13.5,-7.5+b);c.bezierCurveTo(4,-2.6+b,-11,-2.6+b,-16.5,-12+b);c.closePath()},B,{k:2.3,inn:function(c){
    c.fillStyle='rgba(176,92,20,.28)';c.beginPath();c.ellipse(-4,-23.6+b,13,3.6,-.05,0,TAU);c.fill();
    c.fillStyle='rgba(249,231,190,.92)';c.beginPath();c.ellipse(-1,-4.4+b,12,3.4,0,0,TAU);c.fill();
    [[-11,-17.5,2.6,.3],[-4.6,-20,2.4,1.2],[-4,-12.6,2.7,2],[2.6,-17.4,2.5,.7],[3.6,-10.6,2.1,2.6],[-11.4,-10.6,2.1,1.5],[8.6,-13.6,2,.2]].forEach(function(q){ros(q[0],q[1]+b,q[2],q[3])});
    [[-7.6,-23.4],[-.6,-23.6],[-14.6,-14],[-.4,-16.2],[8,-18.6],[-7.6,-8.2],[.2,-7.4]].forEach(function(q){dot(c,q[0],q[1]+b,.85,RS)})}});
  leg(-12,0,false,false);leg(8,3.14,false,true);
  /* cabeça grande de filhote */
  c.save();c.translate(p*1.5,b+p*2);c.translate(12,-18);c.rotate(p*.16);c.translate(-12,18);
  cel(c,function(c){el(c,23.2,-32,3.3,3.6,.25)},'#4a2412',{k:.7,lw:1.7,inn:function(c){dot(c,23.5,-31.5,1.7,'#f1c8a0')}});
  cel(c,function(c){el(c,17.5,-23.5,10.8,9.6)},B,{k:2.1,inn:function(c){
    c.fillStyle=CR;c.beginPath();c.ellipse(24.2,-19.4,6.2,4.8,0,0,TAU);c.fill();
    c.fillStyle='rgba(249,231,190,.75)';c.beginPath();c.ellipse(16.6,-27.6,2.6,1.3,-.2,0,TAU);c.fill();c.beginPath();c.ellipse(24.2,-28,2,1.1,.1,0,TAU);c.fill();
    [[13,-30.4,.9],[16.4,-31.6,.9],[19.9,-31.4,.85],[10.6,-27.4,.85],[14.4,-28.9,.7],[22.8,-30.6,.7],[8.8,-23.6,.9],[9.6,-20,.9],[12,-17,.9],[12.6,-21.6,.7]].forEach(function(q){dot(c,q[0],q[1],q[2],RS)});
    dot(c,18.6,-19.2,2.5,'rgba(214,80,60,.28)')}});
  cel(c,function(c){el(c,11.6,-31.4,3.9,4.1,-.3)},'#4a2412',{k:.8,lw:1.8,inn:function(c){c.beginPath();c.ellipse(12.1,-30.7,2.2,2.5,-.3,0,TAU);c.fillStyle='#f6d3ad';c.fill()}});
  [[16.6,-24.4,2,2.7],[24,-24.8,1.6,2.4]].forEach(function(e){c.beginPath();c.ellipse(e[0],e[1],e[2],e[3],0,0,TAU);c.fillStyle='#1c0f0a';c.fill();dot(c,e[0]+.6,e[1]-1.1,.8,'#fff')});
  /* bocarra do bote */
  if(p>.3){c.beginPath();c.moveTo(22.6,-18.2);c.quadraticCurveTo(25.6,-12.2-p*2,29,-18.6);c.closePath();c.fillStyle='#6a1420';c.fill();c.strokeStyle=OUT;c.lineWidth=1.1;c.lineJoin='round';c.stroke();dot(c,25.8,-16.2,1.2,'#e87a7a');
    [[23.6,-18.2],[27.6,-18.5]].forEach(function(q){c.beginPath();c.moveTo(q[0]-.8,q[1]);c.lineTo(q[0],q[1]+2.2);c.lineTo(q[0]+.8,q[1]);c.closePath();c.fillStyle='#fff';c.fill()})}
  cel(c,function(c){c.moveTo(24.5,-22.7);c.quadraticCurveTo(26.1,-23.5,27.7,-22.7);c.quadraticCurveTo(26.8,-20.7,26.1,-20.5);c.quadraticCurveTo(25.4,-20.7,24.5,-22.7);c.closePath()},'#8a3d38',{k:.4,lw:1.2});
  c.beginPath();c.moveTo(26.1,-20.5);c.lineTo(26.1,-19.2);c.quadraticCurveTo(24.7,-17.5,22.9,-18.4);c.moveTo(26.1,-19.2);c.quadraticCurveTo(27.4,-17.6,28.9,-18.7);c.strokeStyle=OUT;c.lineWidth=1.1;c.lineCap='round';c.stroke();
  [[23,-20.2],[22.2,-19],[29.2,-20.2]].forEach(function(q){dot(c,q[0],q[1],.45,RS)});
  ln(c,[28.9,-20.6,33,-22.2],'#fff6e0',.7);ln(c,[29,-19.6,33.2,-19.2],'#fff6e0',.7);
  c.restore();
  /* lenço vermelho, igual ao da capivara */
  cel(c,function(c){poly(c,[9.4,-10.8+b,13.4,-6+b+fl*.5,9,-6.6+b])},RED,{k:.6,lw:1.5});
  cel(c,function(c){c.moveTo(4.5,-21.5+b);c.quadraticCurveTo(8.2,-13.6+b,12.8,-11.6+b);c.lineTo(9.6,-8.8+b);c.quadraticCurveTo(4.4,-12.4+b,2.6,-19.6+b);c.closePath()},RED,{k:.8,lw:1.5});
  c.restore();
}

/* ---------------- caipora (elite, montada numa queixada) ---------------- */
/* o.walk  fase da corrida, repassada à montaria (opcional)
   o.raise 0..1: ergue a lança */
function drawCaipora(c,t,o){o=o||{};var mv=o.walk!=null,w=o.walk||0,qb=mv?Math.abs(Math.cos(w))*1.4:Math.sin(t*2)*.5,rs=cl(o.raise),
    b=-qb+(mv?Math.sin(w*2+.6)*.5:Math.sin(t*2.3+1)*.4),S1='#8b9486',S2='#737c70',LF='#6f7d6c',LF2='#59665a',PT='#4a5248',HR='#8f1f1c',HR3='#bd3a28',i,
    hx=-1.5,hy=-58+b,sway=Math.sin(t*3.2)*1.2+(mv?Math.sin(w)*1.4:0);
  drawQueixada(c,t,{walk:o.walk});
  /* rédea de cipó presa à presa da montaria */
  rope(c,function(c){c.moveTo(7.5,-41+b);c.quadraticCurveTo(17,-18-qb,31,-13.5-qb)},'#5d7257',1.2);
  /* cabelo desgrenhado: o resto de cor */
  function hair(out){for(i=0;i<9;i++){var a=-.85-i*.4,l=8+((i*5)%4)*2.2+(i>3?3.5:0),a2=a-.22-sway*.035,bw=.5,R0=7.5,q=R0+l;
      c.beginPath();c.moveTo(hx+Math.cos(a+bw)*R0,hy+Math.sin(a+bw)*R0);
      c.quadraticCurveTo(hx+Math.cos(a+.16)*(R0+l*.6),hy+Math.sin(a+.16)*(R0+l*.6),hx+Math.cos(a2)*q,hy+Math.sin(a2)*q);
      c.quadraticCurveTo(hx+Math.cos(a-bw*.7)*(R0+l*.4),hy+Math.sin(a-bw*.7)*(R0+l*.4),hx+Math.cos(a-bw)*R0,hy+Math.sin(a-bw)*R0);c.closePath();
      if(out){c.strokeStyle=OUT;c.lineWidth=3.6;c.lineJoin='round';c.stroke()}else{c.fillStyle=HR;c.fill()}}}
  hair(true);hair(false);
  for(i=1;i<9;i+=2){var a=-.85-i*.4,l=8+((i*5)%4)*2.2+(i>3?3.5:0);ln(c,[hx+Math.cos(a)*8,hy+Math.sin(a)*8,hx+Math.cos(a-.12)*(7.5+l*.7),hy+Math.sin(a-.12)*(7.5+l*.7)],HR3,1.1)}
  /* osso preso no cabelo */
  cel(c,function(c){cap(c,hx-15,hy-7,hx-8.5,hy-12.5,1.2)},'#e9e2d8',{k:.5,lw:1.4});dot(c,hx-15.4,hy-6.6,1.5,'#e9e2d8');dot(c,hx-8.1,hy-12.9,1.5,'#e9e2d8');
  /* braço de trás segura a rédea */
  seg2(c,3,-49+b,7.5,-41+b,6.2,6.2,1,2.8,2.6,S2,S2,{k:1,lw:1.9});
  cel(c,function(c){el(c,7.5,-41+b,2.8,2.8)},S2,{k:.7,lw:1.7});
  /* perna da frente, escarranchada na montaria */
  var fx=2,fy=-22.5+b,kn=ik(-5,-35.5+b,fx,fy,8,8,-1);
  cel(c,function(c){cap(c,-5,-35.5+b,kn[0],kn[1],3.5)},S1,{k:1.1,lw:2});
  cel(c,function(c){cap(c,kn[0],kn[1],fx,fy,3)},S1,{k:1,lw:2});
  cel(c,function(c){c.moveTo(fx-3.2,fy+3);c.lineTo(fx-3.2,fy-1.4);c.quadraticCurveTo(fx+2,fy-3.4,fx+6.6,fy+.2);c.quadraticCurveTo(fx+8,fy+3,fx+5.6,fy+3);c.closePath()},S1,{k:.8,lw:1.9,inn:function(c){[2.4,4.2].forEach(function(d){ln(c,[fx+d,fy,fx+d+.5,fy+2.6],'rgba(30,36,30,.6)',.8)})}});
  ln(c,[fx-3,fy-2.6,fx+2.6,fy-3.4],'#4f6a4a',1.7);
  /* tronco, pintura e tanga de folhas */
  cel(c,function(c){el(c,-4,-44.5+b,7.3,8.3)},S1,{k:1.9,inn:function(c){c.beginPath();c.arc(-4.6,-44+b,4.2,.5,2.6);c.strokeStyle=PT;c.lineWidth=1.5;c.stroke();dot(c,.4,-42.4+b,.9,PT);dot(c,-8.6,-41.4+b,.9,PT)}});
  for(i=0;i<5;i++)(function(i){var x=-11.4+i*3.5,l=8+(i%2)*3,y0=-38.6+b;cel(c,function(c){c.moveTo(x-3,y0);c.quadraticCurveTo(x-4.2,y0+l*.6,x,y0+l);c.quadraticCurveTo(x+4.2,y0+l*.6,x+3,y0);c.closePath()},i%2?LF:LF2,{k:.9,lw:1.6,inn:function(c){ln(c,[x,y0+1,x,y0+l-1.5],'rgba(30,40,30,.5)',.8)}})})(i);
  ln(c,[-13,-38.6+b,4,-38.6+b],'#4f6a4a',2.1);
  for(i=0;i<6;i++){var an=.55+i*.38;dot(c,-3.6+Math.cos(an)*-6.6,-51.6+b+Math.sin(an)*3.8,1.25,i%2?'#e9e2d8':'#c9bfae')}
  /* orelhas e cabeça */
  cel(c,function(c){poly(c,[hx+8.5,hy-2.5,hx+17.5,hy-8.5,hx+10,hy+4])},S1,{k:.8,lw:1.8});
  cel(c,function(c){el(c,hx,hy,10.2,9.6)},S1,{k:2.2,inn:function(c){ln(c,[hx+4.2,hy+4.4,hx+9.4,hy+2.8],PT,1.6);ln(c,[hx-8,hy+3.4,hx-3.6,hy+5.2],PT,1.6);ln(c,[hx-7.4,hy+6.2,hx-3.4,hy+7.6],PT,1.4)}});
  cel(c,function(c){poly(c,[hx-9,hy-2,hx-17,hy-8,hx-10,hy+4.4])},S2,{k:.8,lw:1.8});
  /* franja */
  cel(c,function(c){poly(c,[hx-10,hy-.5,hx-10.4,hy-6,hx-6,hy-10.6,hx,hy-12,hx+6,hy-10.4,hx+10.2,hy-5.6,hx+9.4,hy-1.6,hx+7.2,hy-5.6,hx+5.6,hy-1.8,hx+3,hy-6.4,hx+1,hy-2.6,hx-1.8,hy-6.4,hx-4.2,hy-1.6,hx-6.6,hy-5.4])},HR,{k:1.1,lw:1.8,inn:function(c){ln(c,[hx-5,hy-10,hx-6.2,hy-5.6],HR3,1);ln(c,[hx+.6,hy-11,hx-1.4,hy-6.6],HR3,1);ln(c,[hx+5.2,hy-9.6,hx+3.2,hy-6.6],HR3,1)}});
  /* olhos, sobrancelhas, rosnado */
  glow(c,hx+5.6,hy+.9,2.6,1.9,EYE,EYEG,10,.22);glow(c,hx-1.2,hy+1.1,2.4,1.8,EYE,EYEG,10,-.18);
  ln(c,[hx+2.8,hy-.2,hx+8.8,hy-2.4],'#2a302a',2.1);ln(c,[hx-4.4,hy-1.8,hx+.8,hy-.1],'#2a302a',2.1);
  c.beginPath();c.moveTo(hx+1.4,hy+6);c.quadraticCurveTo(hx+5,hy+4.6,hx+8.6,hy+6);c.strokeStyle='#2a302a';c.lineWidth=1.5;c.lineCap='round';c.stroke();
  [[hx+3.4,hy+5.5],[hx+6.8,hy+5.5]].forEach(function(q){c.beginPath();c.moveTo(q[0]-1,q[1]);c.lineTo(q[0],q[1]+2.5);c.lineTo(q[0]+1,q[1]);c.closePath();c.fillStyle='#fff';c.fill()});
  c.beginPath();c.arc(hx+9.5,hy+2.6,1.2,-1.2,1.4);c.strokeStyle=PT;c.lineWidth=1.1;c.stroke();
  /* lança curta e braço da frente */
  var shy=-49-rs*2.5+b,ru=1-rs,hxx=ru*ru*5+2*ru*rs*11-rs*rs*11,hyy=-ru*ru*42-2*ru*rs*54-rs*rs*67.5+b,A=lp(-.8,.16,rs);
  c.save();c.translate(hxx,hyy);c.rotate(A);
  cel(c,function(c){cap(c,-12,0,21,0,1.4)},'#6b5a48',{k:.6,lw:1.6});
  cel(c,function(c){poly(c,[19.6,-3.6,31,0,19.6,3.6,22,0])},'#8d8a84',{k:1,lw:1.7,inn:function(c){ln(c,[22.5,-.8,29,-.2],'rgba(255,255,255,.4)',.9)}});
  ln(c,[18.4,-2,18.4,2],'#4f6a4a',1.9);ln(c,[16,-2,16,2],'#4f6a4a',1.9);
  c.restore();
  /* penacho amarrado perto da ponta, sempre pendurado para baixo */
  var px=hxx+Math.cos(A)*17.4,py=hyy+Math.sin(A)*17.4,pl=lp(8.5,5,rs),ps=sway*.5;
  cel(c,function(c){c.moveTo(px,py+.8);c.quadraticCurveTo(px-3+ps,py+pl*.6,px-.6+ps*1.6,py+pl+1);c.quadraticCurveTo(px+2.8+ps,py+pl*.5,px,py+.8);c.closePath()},HR,{k:.6,lw:1.4});
  seg2(c,-9.5,shy,hxx,hyy,8,8.4,1,3,2.7,S1,S1,{k:1.1,lw:2});
  cel(c,function(c){el(c,hxx,hyy,3.1,3.1)},S1,{k:.8,lw:1.8});
}

/* ---------------- altar (cenário) ---------------- */
/* o.lit 0..1: intensidade da chama (padrão 1; 0 = apagado) */
function drawAltar(c,t,o){o=o||{};var lit=o.lit==null?1:cl(o.lit),ST='#8e928b',ST2='#767a76',ST3='#abad9f',MO='#6a9a4a',CRK='rgba(40,36,40,.5)',i,
    fl=Math.sin(t*5.2)*1.1,fh=Math.sin(t*7.3)*.9;
  function moss(x,y,w,h){cel(c,function(c){c.moveTo(x-w,y);c.quadraticCurveTo(x-w*.5,y-h*1.3,x,y-h*.8);c.quadraticCurveTo(x+w*.6,y-h*1.4,x+w,y);c.quadraticCurveTo(x+w*.7,y+h*1.1,x+w*.35,y+h*.3);c.quadraticCurveTo(x,y+h*1.7,x-w*.35,y+h*.4);c.quadraticCurveTo(x-w*.75,y+h*1.1,x-w,y);c.closePath()},MO,{k:.9,lw:1.5,sh:'rgba(10,60,30,.42)',hi:'rgba(230,255,170,.3)'})}
  if(lit){var g=c.createRadialGradient(0,-44,2,0,-44,34);g.addColorStop(0,'rgba(255,214,120,'+(.4*lit)+')');g.addColorStop(1,'rgba(255,214,120,0)');c.save();c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(-36,-80,72,72);c.restore()}
  /* degraus */
  cel(c,function(c){c.moveTo(-23,-1.6);c.lineTo(-21.5,-7.6);c.lineTo(21.5,-7.6);c.lineTo(23,-1.6);c.quadraticCurveTo(0,1.8,-23,-1.6);c.closePath()},ST2,{k:2,inn:function(c){
    ln(c,[-9,-7.6,-10,0],CRK,1);ln(c,[6,-7.6,7,1],CRK,1);ln(c,[15,-5,18.5,-3.4,17.6,-.6],CRK,.9);c.fillStyle='rgba(255,255,255,.1)';c.fillRect(-22,-7.8,44,1.8)}});
  cel(c,function(c){poly(c,[-17.6,-7.6,-16.4,-13.4,16.4,-13.4,17.6,-7.6])},ST,{k:1.8,inn:function(c){ln(c,[-3,-13.4,-3.6,-7.6],CRK,1);ln(c,[10.4,-13.4,10.8,-7.6],CRK,1);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(-17,-13.6,34,1.6)}});
  /* pilar entalhado */
  cel(c,function(c){c.moveTo(-11.4,-13.4);c.bezierCurveTo(-10.2,-19,-10.2,-26,-12.4,-31.4);c.lineTo(12.4,-31.4);c.bezierCurveTo(10.2,-26,10.2,-19,11.4,-13.4);c.closePath()},ST,{k:2.6,inn:function(c){
    ln(c,[-7.6,-31,-6.8,-26.4,-8.2,-23.6],CRK,1);ln(c,[8,-14,7,-17.6,8.4,-20],CRK,1);
    c.beginPath();for(i=0;i<=26;i++){var a=i*.44,q=.5+a*.46;c[i?'lineTo':'moveTo'](Math.cos(a)*q,-22.4+Math.sin(a)*q)}c.strokeStyle='rgba(40,36,40,.62)';c.lineWidth=1.5;c.lineCap='round';c.stroke();
    if(lit){c.save();c.globalAlpha=lit*(.75+fh*.12);c.shadowColor='#ffb347';c.shadowBlur=5;c.strokeStyle='#ffe9a8';c.lineWidth=.8;c.stroke();c.restore()}
    [[-7.4,-17.4],[7.4,-27.4]].forEach(function(p){dot(c,p[0],p[1],1,'rgba(40,36,40,.6)')})}});
  /* cipó subindo o pilar */
  rope(c,function(c){c.moveTo(13.6,-8);c.bezierCurveTo(8,-12,13.6,-18,9.6,-23);c.bezierCurveTo(7.6,-26,11,-29,10,-31.4)},'#5f8a45',1.1);
  [[11.6,-17,.5],[8.6,-25,-2.4]].forEach(function(p){c.save();c.translate(p[0],p[1]);c.rotate(p[2]);cel(c,function(c){c.moveTo(0,0);c.quadraticCurveTo(2.6,-3.2,6,-.6);c.quadraticCurveTo(2.8,1.8,0,0);c.closePath()},'#5fbf5a',{k:.6,lw:1.3,sh:'rgba(10,60,30,.4)'});c.restore()});
  /* mesa */
  cel(c,function(c){c.moveTo(-19.6,-37);c.lineTo(-18.4,-31.4);c.quadraticCurveTo(0,-29.2,18.4,-31.4);c.lineTo(19.6,-37);c.quadraticCurveTo(0,-34.4,-19.6,-37);c.closePath()},ST2,{k:1.8,inn:function(c){ln(c,[-12,-36,-11.6,-30.6],CRK,1);ln(c,[4,-34.6,4.4,-30],CRK,1);ln(c,[13.4,-35.6,13,-31],CRK,.9)}});
  cel(c,function(c){el(c,0,-37,19.6,3.1)},ST3,{k:1.1,lw:2.2,inn:function(c){if(lit){c.fillStyle='rgba(255,224,150,'+(.34*lit)+')';c.beginPath();c.ellipse(0,-37,15,2.6,0,0,TAU);c.fill()}
    c.beginPath();c.ellipse(0,-36.8,8.4,1.7,0,0,TAU);c.fillStyle='#4c4648';c.fill();c.strokeStyle='rgba(34,16,10,.7)';c.lineWidth=1;c.stroke()}});
  moss(-13,-36.6,6.4,2);moss(12.4,-13.2,5.4,1.8);moss(-17,-7.4,5,1.7);
  /* florzinha e pedrinhas ao pé */
  cel(c,function(c){el(c,-21.6,-1.6,2.8,1.9)},ST,{k:.7,lw:1.6});
  ln(c,[19.4,-2,20,-8],OUT,2.4);ln(c,[19.4,-2,20,-8],'#4f8a45',1.1);
  for(i=0;i<5;i++)dot(c,20+Math.cos(i*1.257)*2.1,-9.4+Math.sin(i*1.257)*2.1,1.4,'#ffd23f');dot(c,20,-9.4,1,'#e4572e');
  /* chama suave */
  if(lit){var fy=-37.4,H=(13+fh)*(.45+.55*lit);
    function fla(s,col,blur){c.save();c.shadowColor='#ffab3d';c.shadowBlur=blur;c.beginPath();c.moveTo(-4.8*s,fy);c.bezierCurveTo(-7*s,fy-H*s*.45,-1.6*s+fl*.4,fy-H*s*.62,fl*s,fy-H*s);c.bezierCurveTo(1.6*s+fl*.4,fy-H*s*.62,7*s,fy-H*s*.45,4.8*s,fy);c.quadraticCurveTo(0,fy+2.6*s,-4.8*s,fy);c.closePath();c.fillStyle=col;c.fill();c.restore()}
    c.save();c.globalAlpha=.55+.45*lit;fla(1,'#ffb84a',12);fla(.68,'#ffe08a',0);fla(.38,'#fffbe6',0);
    for(i=0;i<4;i++){var u=(t*.6+i/4)%1;dot(c,Math.sin(u*6+i*2)*5,fy-H*.6-u*14,1.2*(1-u)+.3,'rgba(255,226,140,'+(1-u)+')')}
    c.restore()}
}

/* ---------------- gaiola de galhos e cipó (cenário) ---------------- */
/* o.open 0..1: abre a porta */
function drawCage(c,t,o){o=o||{};var op=cl(o.open),W1='#8f5f36',W2='#74492a',WD='#4c301c',VN='#6f9c4c',VN2='#4c7a3a',AY=-34.5,i;
  function fy(x){return -5+3.4*Math.sqrt(Math.max(0,1-x*x/256))}
  function barp(x,y0,y1){return function(c){
    /* galho curvo da base ao topo; y1 corta o começo para a abertura da porta */
    var n=14,first=true;for(var j=0;j<=n;j++){var u=j/n,v=1-u,px=v*v*v*x+3*v*v*u*x*1.09+3*v*u*u*x*1.04,py=v*v*v*y0+3*v*v*u*-14+3*v*u*u*-26+u*u*u*AY;if(y1!=null&&py>y1)continue;c[first?'moveTo':'lineTo'](px,py);first=false}}}
  /* base trançada */
  cel(c,function(c){c.moveTo(16,-5);c.ellipse(0,-5,16,3.4,0,0,Math.PI);c.lineTo(-16,-1.6);c.ellipse(0,-1.6,16,3.4,0,Math.PI,0,true);c.closePath()},W2,{k:1.2,lw:2.2,inn:function(c){for(i=-7;i<8;i++)ln(c,[i*2.3-1,-4+fy(i*2.3)+4,i*2.3+1,-.4+fy(i*2.3)+4],'rgba(34,16,10,.45)',.9)}});
  c.beginPath();c.ellipse(0,-5,16,3.4,0,0,TAU);c.fillStyle='#352015';c.fill();c.strokeStyle=OUT;c.lineWidth=2;c.stroke();
  /* sombra de dentro */
  c.beginPath();c.moveTo(-15.6,-5);c.bezierCurveTo(-17,-14,-16.2,-26,0,AY);c.bezierCurveTo(16.2,-26,17,-14,15.6,-5);c.closePath();c.fillStyle='rgba(24,12,8,.3)';c.fill();
  /* barras de trás */
  [-11,-5.5,0,5.5,11].forEach(function(x){rope(c,barp(x,-5-3.4*Math.sqrt(1-x*x/256)),WD,1.2,'rgba(34,16,10,.75)')});
  rope(c,function(c){c.ellipse(0,-19.6,16,2.4,0,Math.PI,TAU)},VN2,1,'rgba(34,16,10,.75)');
  /* barras da frente; as do vão da porta só existem acima do aro */
  [-15.6,-10,-4,2,15.6].forEach(function(x,n){rope(c,barp(x,fy(x)),n%2?W2:W1,2.1)});
  rope(c,barp(8,fy(8),-19.4),W1,2.1);
  /* aros de cipó */
  rope(c,function(c){c.moveTo(-16.4,-20.4);c.quadraticCurveTo(0,-15.4,16.4,-20.4)},VN,1.9);
  rope(c,function(c){c.moveTo(-12.2,-28.2);c.quadraticCurveTo(0,-24.8,12.2,-28.2)},VN,1.5);
  [[-15.8,-20.2],[-10.2,-18.9],[-4.1,-18],[2,-17.9],[8,-18.6],[15.8,-20.2],[-8.2,-27],[-3.4,-26.5],[1.8,-26.4],[7,-26.9]].forEach(function(q){ln(c,[q[0]-1,q[1]-1.3,q[0]+1,q[1]+1.3],'#b5d98a',1.1)});
  [[-13,-19.6,2.2],[5,-17.8,.9]].forEach(function(p){c.save();c.translate(p[0],p[1]);c.rotate(p[2]);cel(c,function(c){c.moveTo(0,0);c.quadraticCurveTo(2.6,-3.2,6.2,-.6);c.quadraticCurveTo(2.8,1.8,0,0);c.closePath()},'#5fbf5a',{k:.6,lw:1.3,sh:'rgba(10,60,30,.4)'});c.restore()});
  /* nó e alça no topo */
  rope(c,function(c){c.ellipse(0,AY-3.6,2.3,2.7,0,0,TAU)},W1,1.5);
  cel(c,function(c){el(c,0,AY+.4,3.6,2.5)},VN,{k:.8,lw:1.7,inn:function(c){ln(c,[-2,AY-1,-.6,AY+2],VN2,1);ln(c,[.6,AY-1.4,2,AY+1.6],VN2,1)}});
  /* porta: gira em torno da dobradiça à direita */
  var th=op*2.3;c.save();c.transform(Math.cos(th),-Math.sin(th)*.2,0,1,14.2,0);
  var yt=-18.6,yb=-2.4;
  rope(c,function(c){c.moveTo(-3.8,yt);c.lineTo(-3.8,yb);c.moveTo(-7.6,yt);c.lineTo(-7.6,yb)},W2,1.5);
  rope(c,function(c){c.moveTo(-11.4,-10.6);c.lineTo(0,-10.6)},VN,1.2);
  rope(c,function(c){poly(c,[-11.4,yt,0,yt,0,yb,-11.4,yb])},W1,1.9);
  [[-3.8,-10.6],[-7.6,-10.6]].forEach(function(q){ln(c,[q[0]-.9,q[1]-1.1,q[0]+.9,q[1]+1.1],'#b5d98a',1)});
  /* tranca: um toquinho amarrado */
  cel(c,function(c){cap(c,-12.6,-12.6,-10.4,-8.8,1.1)},'#c9a36a',{k:.4,lw:1.3});
  c.restore();
  /* dobradiças de cipó */
  [-15.4,-5.6].forEach(function(y){ln(c,[13.2,y,15.4,y+.4],OUT,3.6);ln(c,[13.2,y,15.4,y+.4],VN,1.8)});
}

export { drawUrutau, drawCogumelo, drawOnca, drawCaipora, drawAltar, drawCage };
