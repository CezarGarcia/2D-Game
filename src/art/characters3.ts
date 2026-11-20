// @ts-nocheck
/* Terceira leva de desenhos por código: Capítulo 2, "Rios do Norte" (Amazônia, água).
   Mesmo estilo de characters.ts: peças recortadas com sombra, brilho e contorno. Todos virados para a
   direita, pés/base na origem (0,0), y negativo para cima. Assinatura: draw(ctx, tempoEmSegundos, opções).
   As oscilações usam múltiplos de W0, então um ciclo fecha em t = TAU / W0 (≈ 2,618 s). */
import { OUT, TAU, el, cap, poly, cel, ln, dot, glow, star, ik } from './characters';

var EYE='#ffe0f0',EYEG='#ff3d8a',PI=Math.PI,W0=2.4,FOAM='rgba(228,244,250,';
function cl(v){return v==null?0:Math.max(0,Math.min(1,v))}
function lp(a,b,k){return a+(b-a)*k}
function sm(k){return k*k*(3-2*k)}
/* traço grosso com contorno (cipós, antenas, bordas) */
function rope(c,fn,col,lw,out){c.beginPath();fn(c);c.lineCap='round';c.lineJoin='round';c.strokeStyle=out||OUT;c.lineWidth=lw+2.2;c.stroke();c.strokeStyle=col;c.lineWidth=lw;c.stroke()}
/* amostra uma Bézier cúbica em n trechos; cada ponto leva o raio do tubo naquele lugar */
function bz(x0,y0,x1,y1,x2,y2,x3,y3,n,r0,r1){var P=[],i,u,v;for(i=0;i<=n;i++){u=i/n;v=1-u;P.push([v*v*v*x0+3*v*v*u*x1+3*v*u*u*x2+u*u*u*x3,v*v*v*y0+3*v*v*u*y1+3*v*u*u*y2+u*u*u*y3,r0+(r1-r0)*u])}return P}
/* tubo de espessura variável ao longo de uma linha de pontos [x,y,raio]: caudas, rabos, cachos */
function tube(P){return function(c){var n=P.length,i,S=[];
  for(i=0;i<n;i++){var a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)];S.push(Math.atan2(b[1]-a[1],b[0]-a[0]))}
  for(i=0;i<n;i++)c[i?'lineTo':'moveTo'](P[i][0]-Math.sin(S[i])*P[i][2],P[i][1]+Math.cos(S[i])*P[i][2]);
  c.arc(P[n-1][0],P[n-1][1],P[n-1][2],S[n-1]+PI/2,S[n-1]-PI/2,true);
  for(i=n-1;i>=0;i--)c.lineTo(P[i][0]+Math.sin(S[i])*P[i][2],P[i][1]-Math.cos(S[i])*P[i][2]);
  c.arc(P[0][0],P[0][1],P[0][2],S[0]-PI/2,S[0]+PI/2,true);c.closePath()}}
function tooth(c,x,y,w,h){c.beginPath();c.moveTo(x-w,y);c.lineTo(x,y+h);c.lineTo(x+w,y);c.closePath();c.fillStyle='#f4efe2';c.fill();c.strokeStyle=OUT;c.lineWidth=.8;c.lineJoin='round';c.stroke()}
/* meia marola: arco de elipse claro (atrás = metade de cima, na frente = metade de baixo) */
function wave(c,x,y,rx,ry,front,al,lw){if(al<=0)return;c.beginPath();c.ellipse(x,y,rx,ry,0,front?.12:PI+.12,front?PI-.12:TAU-.12);c.strokeStyle=FOAM+al+')';c.lineWidth=lw||1.3;c.lineCap='round';c.stroke()}
function drop(c,x,y,r,al,col){c.save();c.globalAlpha=Math.max(0,Math.min(1,al));c.beginPath();c.moveTo(x,y-r*1.7);c.quadraticCurveTo(x+r*1.2,y,x,y+r);c.quadraticCurveTo(x-r*1.2,y,x,y-r*1.7);c.fillStyle=col||'#e4f4fa';c.fill();c.strokeStyle='rgba(34,40,60,.55)';c.lineWidth=.7;c.stroke();c.restore()}
/* fileiras de escamas (para usar dentro do recorte de uma peça) */
function scales(c,x0,x1,y0,y1,col,s){s=s||1;c.strokeStyle=col;c.lineWidth=.8;c.lineCap='round';var r=0,x,y;for(y=y0;y<=y1;y+=3.1*s,r++)for(x=x0+(r%2)*2.2*s;x<=x1;x+=4.4*s){c.beginPath();c.arc(x,y,2.3*s,.2,PI-.2);c.stroke()}}
/* braço de dois segmentos: escolhe a dobra com o cotovelo mais baixo; no empate, o lado `pref` */
function arm2(c,sx,sy,hx,hy,l1,l2,pref,r1,r2,c1,c2,op){var k1=ik(sx,sy,hx,hy,l1,l2,1),k2=ik(sx,sy,hx,hy,l1,l2,-1),k=Math.abs(k1[1]-k2[1])<3?((k1[0]-k2[0])*pref>0?k1:k2):(k1[1]>k2[1]?k1:k2);
  cel(c,function(c){cap(c,sx,sy,k[0],k[1],r1)},c1,op);cel(c,function(c){cap(c,k[0],k[1],hx,hy,r2)},c2,op);return k}

/* ---------------- piranha-cinza ---------------- */
/* o.leap 0..1: 0 = se debatendo no raso, 1 = esticada no bote, boca escancarada */
function drawPiranha(c,t,o){o=o||{};var L=cl(o.leap),G='#767b89',FN='#4c5061',BL='#b1b4bd',i,
    wg=Math.sin(t*W0*4),ch=.5+.5*Math.sin(t*W0*2),fl=Math.sin(t*W0*2+1)*(1-L),ja=.14+ch*.2*(1-L)+L*1;
  function rays(a){return function(c){a.forEach(function(q){ln(c,q,'rgba(20,22,36,.5)',.8)})}}
  wave(c,1,-1.8,13+ch*2.5,3,false,(1-L)*.6);
  c.save();c.translate(L*2,-10.6-L*5+fl*.7);c.rotate(-L*.3+fl*.06);c.scale(1+L*.13,1-L*.07);
  /* rabo em forquilha */
  c.save();c.translate(-9.5,0);c.rotate(wg*.2*(1-L*.6));c.scale(1-Math.abs(wg)*.16,1);
  cel(c,function(c){c.moveTo(1.5,-2.2);c.lineTo(-7.8,-7.4);c.quadraticCurveTo(-5,0,-7.8,7.4);c.lineTo(1.5,2.2);c.closePath()},FN,{k:.9,lw:1.8,inn:rays([[0,-1,-6.5,-5.4],[0,0,-5.4,0],[0,1,-6.5,5.4]])});
  c.restore();
  /* nadadeiras dorsal, adiposa e anal */
  cel(c,function(c){c.moveTo(-6.5,-6.6);c.quadraticCurveTo(-5,-13.8,2.6,-13);c.lineTo(4.6,-8.4);c.closePath()},FN,{k:.8,lw:1.7,inn:rays([[-3.6,-8,-3,-12.6],[-.8,-8.6,0,-12.8],[2,-8.8,2.4,-12]])});
  cel(c,function(c){poly(c,[-9.6,-3.4,-8.6,-6.4,-6.6,-4.6])},FN,{k:0,lw:1.4});
  cel(c,function(c){c.moveTo(-8,3.6);c.lineTo(-6.6,9.8);c.quadraticCurveTo(-1,10.4,1.2,6.8);c.closePath()},FN,{k:.8,lw:1.7,inn:rays([[-5.6,5,-5,9],[-2.8,6,-2.4,9.4]])});
  /* boca por dentro e mandíbula de baixo, bem saliente */
  c.beginPath();c.moveTo(5.6,1);c.lineTo(13.2,-.8);c.lineTo(6.2+Math.cos(ja)*9,1.2+Math.sin(ja)*9);c.closePath();c.fillStyle='#8a1f45';c.fill();c.beginPath();c.ellipse(7.4,1.6,2.6,1+L*3,ja*.5,0,TAU);c.fillStyle='#4a1026';c.fill();
  c.save();c.translate(6.2,1.2);c.rotate(ja);
  for(i=0;i<4;i++)tooth(c,2.6+i*1.75,-.4,.85,-3.1+(i%2)*.5);
  cel(c,function(c){c.moveTo(-3.6,-.5);c.lineTo(8.2,-.9);c.quadraticCurveTo(9.8,1.2,6.4,3.1);c.quadraticCurveTo(1,5.6,-4.2,3.6);c.closePath()},BL,{k:.8,lw:1.8,inn:function(c){c.fillStyle='rgba(196,74,92,.34)';c.beginPath();c.ellipse(1,3.6,5,1.8,.1,0,TAU);c.fill()}});
  c.restore();
  /* corpo alto e redondo */
  cel(c,function(c){c.moveTo(-10.5,-2.4);c.bezierCurveTo(-6,-9.6,5,-10.9,10.2,-6.1);c.quadraticCurveTo(13.8,-3.6,13.2,-.5);c.lineTo(6.4,1.2);c.bezierCurveTo(5,6.6,-4,10.2,-10.5,2.4);c.closePath()},G,{k:2,lw:2.2,inn:function(c){
    c.fillStyle='rgba(38,40,60,.36)';c.beginPath();c.ellipse(-1,-9.4,11.5,3.2,-.04,0,TAU);c.fill();
    c.fillStyle='rgba(214,216,222,.5)';c.beginPath();c.ellipse(-2,6.6,8.6,3.4,.12,0,TAU);c.fill();
    /* a barriga vermelha é o resto de cor */
    c.fillStyle='rgba(196,74,92,.42)';c.beginPath();c.ellipse(1.6,5.6,5.4,2.3,.2,0,TAU);c.fill();
    c.beginPath();c.arc(1.6,-1.6,6,-1.05,1.25);c.strokeStyle='rgba(20,22,36,.55)';c.lineWidth=1.1;c.stroke();
    [[-6.6,-3],[-3.2,-5.4],[-3.6,-.6],[-7,1.4],[-.4,-3.2],[-4.2,3]].forEach(function(q){c.beginPath();c.arc(q[0],q[1],1.5,-.9,.9);c.strokeStyle='rgba(20,22,36,.4)';c.lineWidth=.8;c.stroke()})}});
  /* dentes de cima */
  for(i=0;i<4;i++){var tx=7.8+i*1.5;tooth(c,tx,1-(tx-6.4)*.25,.8,2.7-(i%2)*.4)}
  /* nadadeira peitoral */
  cel(c,function(c){c.moveTo(2.6,2.4);c.quadraticCurveTo(-1,3.6,-3.8,7.6);c.quadraticCurveTo(1.4,7.2,3.8,4.4);c.closePath()},FN,{k:.6,lw:1.5});
  /* olho */
  dot(c,7.4,-4.8,3,'#262232');glow(c,7.5,-4.7,2.1,2.1,EYE,EYEG,9);ln(c,[4.4,-7.9,10.2,-6.5],OUT,1.9);
  dot(c,11.9,-3.4,.5,OUT);
  c.restore();
  /* marola e respingos */
  wave(c,1,-1.4,13+ch*2.5,3,true,(1-L)*.75);wave(c,1,-1.2,7+ch*2,1.6,true,(1-L)*.45,1);
  if(L<1)[[-12,-5,1],[14.5,-4,.8],[-6,-3,.7]].forEach(function(q,n){drop(c,q[0],q[1]-ch*3*(n%2?1:.4),q[2],(1-L)*(.5+ch*.4))});
  if(L>0)[[-12,-4,1.2],[-17,-1.4,1],[-8.6,-.6,.9],[-21,1.6,.8]].forEach(function(q){drop(c,q[0],q[1],q[2],L)});
}

/* ---------------- sapo-cururu ---------------- */
/* o.hop  0..1: salto, pernas esticadas no ar
   o.spit 0..1: papo inflando até cuspir (a boca abre no fim) */
function drawSapo(c,t,o){o=o||{};var hp=sm(cl(o.hop)),sp=cl(o.spit),br=Math.sin(t*W0),G='#7d807c',G2='#646764',D='#4b4d50',BL='#b3b5ac',SAC='#bcc4a6',i,
    pu=(.5+.5*Math.sin(t*W0-.8))*(1-sp)*(1-hp),op=Math.max(0,(sp-.7)/.3);
  c.save();c.translate(hp*1.5,-hp*7);c.rotate(-hp*.2);c.translate(0,-10);c.scale(1+br*.014*(1-hp),1-br*.02*(1-hp));c.translate(0,10);
  function hind(dx,dy,far){var H=[-12+dx,-10+dy],K=[lp(-3.4,-19.5,hp)+dx,lp(-5.4,-5.5,hp)+dy],A=[lp(-11.6,-27,hp)+dx,lp(-2.7,-2.4,hp)+dy],T=[lp(-2.4,-34,hp)+dx,lp(-1.5,1.6,hp)+dy],
      a=Math.atan2(T[1]-A[1],T[0]-A[0]);
    [-.5,0,.5].forEach(function(d){ln(c,[T[0]-Math.cos(a)*3,T[1]-Math.sin(a)*3,T[0]+Math.cos(a+d)*3.4,T[1]+Math.sin(a+d)*3.4],OUT,2.6);ln(c,[T[0]-Math.cos(a)*3,T[1]-Math.sin(a)*3,T[0]+Math.cos(a+d)*3.4,T[1]+Math.sin(a+d)*3.4],far?D:G2,1.2)});
    cel(c,function(c){cap(c,A[0],A[1],T[0],T[1],1.8)},far?D:G2,{k:.6,lw:1.7});
    cel(c,function(c){cap(c,K[0],K[1],A[0],A[1],2.7)},far?D:G2,{k:.9,lw:1.8});
    cel(c,function(c){cap(c,H[0],H[1],K[0],K[1],lp(5,3.8,hp))},far?G2:G,{k:1.3,lw:2,inn:function(c){if(!far){dot(c,lp(H[0],K[0],.4),lp(H[1],K[1],.4)-1.4,1.1,'rgba(40,40,46,.45)');dot(c,lp(H[0],K[0],.75),lp(H[1],K[1],.75)+1,.9,'rgba(40,40,46,.45)')}}})}
  function front(dx,dy,far){var S=[3+dx,-8.6+dy],E=[lp(1.4,9.4,hp)+dx,lp(-4.2,-5.6,hp)+dy],Hd=[lp(5.4,15.6,hp)+dx,lp(-1.6,-3.4,hp)+dy];
    [-.6,0,.6].forEach(function(d){var a=lp(.25,.1,hp)+d;ln(c,[Hd[0]-1,Hd[1],Hd[0]+Math.cos(a)*3.4,Hd[1]+Math.sin(a)*2.2],OUT,2.5);ln(c,[Hd[0]-1,Hd[1],Hd[0]+Math.cos(a)*3.4,Hd[1]+Math.sin(a)*2.2],far?D:G2,1.1)});
    cel(c,function(c){cap(c,E[0],E[1],Hd[0],Hd[1],2.1)},far?D:G2,{k:.7,lw:1.7});
    cel(c,function(c){cap(c,S[0],S[1],E[0],E[1],2.9)},far?D:G2,{k:.9,lw:1.8})}
  hind(3.4,-1.2,true);front(5.6,-.6,true);
  /* papo: fica atrás do queixo e estufa para a frente */
  cel(c,function(c){el(c,14+sp*3.6,-7.4+sp*.8,4.6+sp*6.4+pu*1.2,3.6+sp*4.6+pu*1)},SAC,{k:1.4,lw:2,sh:'rgba(40,50,20,.3)',inn:function(c){
    if(sp>.15)for(i=0;i<4;i++){c.beginPath();c.arc(8+sp*3.6,-7.2,6+i*2.6*sp+2,-.6,.9);c.strokeStyle='rgba(60,70,40,'+(.28*sp)+')';c.lineWidth=.8;c.stroke()}
    c.fillStyle='rgba(255,255,235,.3)';c.beginPath();c.ellipse(15+sp*5,-9-sp*1.6,1.6+sp*2,1+sp*1.2,-.5,0,TAU);c.fill()}});
  /* olho de trás */
  cel(c,function(c){el(c,14.6,-20.6,3.2,3.1)},G2,{k:.8,lw:1.8});glow(c,15.2,-20.8,1.7,1.6,EYE,EYEG,7);
  /* corpo gordo */
  cel(c,function(c){c.moveTo(-17,-8);c.bezierCurveTo(-18.5,-20,-9,-25.6,0,-22.6);c.bezierCurveTo(7,-22.4,16.5,-21.6,19.6,-15.6);c.quadraticCurveTo(21.6,-11.6,18,-9.6);c.bezierCurveTo(14,-5.8,8,-3.4,0,-3);c.bezierCurveTo(-8,-2.6,-16.4,-3,-17,-8);c.closePath()},G,{k:2.6,inn:function(c){
    c.fillStyle='rgba(40,42,48,.3)';c.beginPath();c.ellipse(-5,-21.6,12,3.4,.08,0,TAU);c.fill();
    c.fillStyle='rgba(214,216,204,.5)';c.beginPath();c.ellipse(1,-4.4,13,3.2,-.06,0,TAU);c.fill();
    /* glândula atrás do olho e verrugas */
    c.fillStyle='rgba(40,42,48,.34)';c.beginPath();c.ellipse(2.4,-17.4,4.6,2.4,.25,0,TAU);c.fill();
    [[-11,-16,1.5],[-6,-19.4,1.2],[-12.6,-10.6,1.3],[-6.4,-13.6,1.7],[-1.2,-12.2,1.2],[-9.6,-6.4,1],[-2,-7.6,1.1],[4.6,-12.6,1],[-14.6,-13.8,.9]].forEach(function(q){dot(c,q[0],q[1],q[2],'rgba(40,42,48,.42)');dot(c,q[0]-.4,q[1]-.5,q[2]*.4,'rgba(255,255,240,.3)')})}});
  /* boca larga e emburrada; abre para cuspir */
  if(op>0){c.beginPath();c.moveTo(20.4,-13.6);c.quadraticCurveTo(13,-10.6,5.6,-12);c.quadraticCurveTo(10,-9+op*2.8,19.2,-10+op*2.6);c.closePath();c.fillStyle='#3a1626';c.fill();c.strokeStyle=OUT;c.lineWidth=1.3;c.lineJoin='round';c.stroke();
    c.fillStyle='#9aa583';c.beginPath();c.ellipse(15.6,-11.2+op*1.2,2.6,1.2*op,-.1,0,TAU);c.fill()}
  else{c.beginPath();c.moveTo(20.4,-13.2);c.quadraticCurveTo(13,-9.6,5.4,-11.8);c.lineTo(4.2,-9.8);c.strokeStyle=OUT;c.lineWidth=1.7;c.lineCap='round';c.lineJoin='round';c.stroke()}
  dot(c,18.4,-16.2,.7,OUT);
  hind(0,0,false);front(0,0,false);
  /* olho da frente, saltado */
  cel(c,function(c){el(c,9.2,-21.6,4.4,4.2)},G,{k:1.1,lw:2});
  dot(c,9.6,-21.6,3,'#262232');glow(c,9.7,-21.5,2.4,2.2,EYE,EYEG,9);
  c.beginPath();c.moveTo(5.2,-23.2);c.quadraticCurveTo(9.4,-27,13.6,-22.6);c.strokeStyle=OUT;c.lineWidth=2;c.lineCap='round';c.stroke();
  c.restore();
}

/* ---------------- arraia de rio ---------------- */
/* o.hidden 0..1: 1 = enterrada na areia (só contorno e olhos), 0 = à mostra
   o.sting  0..1: ergue o rabo com o ferrão para atirar */
function drawArraia(c,t,o){o=o||{};var h=cl(o.hidden),st=sm(cl(o.sting)),r=1-h,ph=t*W0,G='#7c8190',G2='#636878',D='#494d5d',i,
    cx=2,cy=-9.8-r*(.8+.6*Math.sin(t*W0)),RX=21,RY=9.4,EY=[[cx+7.4,cy-4.6,1.35],[cx+8.6,cy-.8,1.65]];
  function disc(und){return function(c){for(var j=0;j<=40;j++){var a=j/40*TAU,m=1+und*.07*Math.sin(a*3+ph)+.08*Math.exp(-Math.pow(Math.sin(a/2)*3.4,2));
      c[j?'lineTo':'moveTo'](cx+Math.cos(a)*RX*m,cy+Math.sin(a)*RY*m-und*1.3*Math.abs(Math.cos(a))*Math.sin(ph+Math.cos(a)*2))}c.closePath()}}
  /* rabo: deitado para trás, ou erguido como o de um escorpião */
  if(h<.95){var sw=Math.sin(t*W0*2+1)*1.6*(1-st),bx=cx-RX+6,k=r,
      T=bz(bx,cy,lp(-20,-28,st),lp(cy-.5,-12,st),lp(-25,-32,st),lp(cy+1.5+sw,-32,st),lp(-29.5,-13,st),lp(cy+sw*1.4,-37,st),9,2.7,.9),
      n=T.length-1,th=Math.atan2(T[n][1]-T[n-1][1],T[n][0]-T[n-1][0]);
    for(i=0;i<=n;i++){T[i][0]=lp(bx,T[i][0],k);T[i][1]=lp(cy,T[i][1],k)}
    /* ferrão */
    c.save();c.translate(T[n][0],T[n][1]);c.rotate(th);c.scale(k*lp(.8,1,st),k*lp(.8,1,st));
    if(st>0)glow(c,6,0,2+st*2,1.2+st,'rgba(255,61,138,'+(.5*st)+')',EYEG,10*st);
    cel(c,function(c){poly(c,[-1.5,-1.5,4,-1.9,10.5,0,4,1.9,-1.5,1.5])},'#d8d3cc',{k:.5,lw:1.4,inn:function(c){c.fillStyle=st>.05?'#ff5c9a':'#a9a4a8';c.beginPath();poly(c,[5,-2.4,11,0,5,2.4]);c.fill()}});
    c.restore();
    cel(c,tube(T),D,{k:.9,lw:1.9,inn:function(c){for(i=1;i<n;i+=2)dot(c,T[i][0],T[i][1]-.6,.7,'rgba(210,205,190,.5)')}})}
  if(h<1){
    /* nadadeiras pélvicas, na raiz do rabo */
    [[-3.4,-.3],[3.6,.3]].forEach(function(q){cel(c,function(c){el(c,cx-RX+3.4,cy+q[0],4.6,2.3,q[1])},G2,{k:.7,lw:1.7})});
    /* disco chato, de borda fina e ondulante */
    cel(c,disc(r),G,{k:2,lw:2.2,inn:function(c){
      c.strokeStyle='rgba(214,216,222,.42)';c.lineWidth=2.4;c.beginPath();c.ellipse(cx,cy+.8,RX-2.4,RY-1.8,0,.2,PI-.2);c.stroke();
      c.strokeStyle='rgba(30,32,48,.2)';c.lineWidth=1;c.beginPath();c.ellipse(cx,cy,RX-4.4,RY-2.6,0,0,TAU);c.stroke();
      /* pintas em anel pelas abas: o resto de cor */
      for(var j=0;j<11;j++){var a=j/11*TAU+.42,q=j%2?.74:.6,sx=cx+Math.cos(a)*RX*q,sy=cy+Math.sin(a)*RY*(q+.04),sr=1.25+(j%3)*.3;
        c.beginPath();c.ellipse(sx,sy,sr*1.3,sr*.82,0,0,TAU);c.fillStyle='rgba(206,178,110,.8)';c.fill();c.strokeStyle='rgba(30,30,44,.6)';c.lineWidth=.8;c.stroke();dot(c,sx,sy,sr*.3,'rgba(40,36,44,.6)')}}});
    /* corpo: o calombo no meio do disco, com a espinha */
    cel(c,function(c){c.moveTo(cx-14,cy-.9);c.bezierCurveTo(cx-8,cy-6.4,cx+7,cy-7.4,cx+12.4,cy-2.4);c.bezierCurveTo(cx+8,cy+2.8,cx-8,cy+2.6,cx-14,cy-.9);c.closePath()},G2,{k:1.3,lw:1.5,out:'rgba(34,16,10,.8)',inn:function(c){
      c.beginPath();c.moveTo(cx-12,cy-1.2);c.quadraticCurveTo(cx-2,cy-3,cx+5,cy-2.6);c.strokeStyle='rgba(20,22,36,.45)';c.lineWidth=1;c.stroke();
      for(i=0;i<5;i++)dot(c,cx-9.6+i*3.2,cy-1.7-i*.26,.55,'rgba(214,216,222,.45)')}});
    /* espiráculos e olhos em cima do corpo */
    dot(c,cx+4.6,cy-4.9,.7,'rgba(20,22,36,.75)');dot(c,cx+5.4,cy-.1,.8,'rgba(20,22,36,.75)');
    EY.forEach(function(e){cel(c,function(c){el(c,e[0],e[1],e[2]+1,e[2]+.6)},D,{k:.5,lw:1.4});glow(c,e[0]+.3,e[1]-.1,e[2]*.86,e[2]*.7,EYE,EYEG,8)})}
  if(h>0){
    /* areia por cima */
    c.save();c.globalAlpha=h<1?h*.82:.3;c.beginPath();disc(r)(c);c.fillStyle='#b9a476';c.fill();c.restore();
    c.save();c.globalAlpha=h;
    c.beginPath();disc(r)(c);c.setLineDash([3.2,3]);c.strokeStyle='rgba(44,30,20,.6)';c.lineWidth=1.3;c.stroke();c.setLineDash([]);
    c.beginPath();c.ellipse(cx,cy,RX-1.6,RY-1.4,0,PI+.3,TAU-.5);c.strokeStyle='rgba(255,244,210,.4)';c.lineWidth=1.4;c.stroke();
    c.beginPath();c.ellipse(cx,cy+.8,RX+.6,RY+.4,0,.25,PI-.25);c.strokeStyle='rgba(30,20,12,.3)';c.lineWidth=1.6;c.stroke();
    [[-10,-2],[-4,3.4],[5,-5.6],[12,3.4],[-13,3],[0,-1],[8,5.6],[-7,-5.4],[15,-1]].forEach(function(q,n){dot(c,cx+q[0],cy+q[1],.7+(n%3)*.25,n%2?'rgba(70,52,30,.5)':'rgba(255,244,210,.5)')});
    c.restore();
    /* só os olhos de fora */
    EY.forEach(function(e){dot(c,e[0],e[1],e[2]+.9,'rgba(38,34,50,'+(.7*h)+')');c.save();c.globalAlpha=h;glow(c,e[0],e[1],e[2],e[2]*lp(.75,.45,h),EYE,EYEG,7);c.restore()});
    /* grãos de areia escorrendo enquanto ela se revela */
    if(h<1)for(i=0;i<9;i++){var a=i*.7+.4,q=1+(1-h)*.35;dot(c,cx+Math.cos(a)*RX*q,cy+Math.sin(a)*RY*q+(1-h)*2,.9,'rgba(190,168,118,'+(h*.9)+')')}}
}

/* ---------------- caramujo ---------------- */
/* o.aura 0..1: brilho pulsante da concha (rosa de Assombro), que protege os outros
   o.walk  fase do rastejo (opcional) */
function drawCaramujo(c,t,o){o=o||{};var au=cl(o.aura),w=o.walk!=null?o.walk:t*W0,st=Math.sin(w),hs=st*1.4,b=Math.cos(w)*.5,
    SH='#7f798c',SH2='#5c566a',BD='#a1a2ad',BD2='#80818f',i,sx=-4,sy=-19.4+b,R=14.2,sw=Math.sin(w+.8)*1.3;
  if(au>0){var g=c.createRadialGradient(sx,sy,3,sx,sy,34);g.addColorStop(0,'rgba(255,61,138,'+(.5*au)+')');g.addColorStop(.55,'rgba(255,61,138,'+(.2*au)+')');g.addColorStop(1,'rgba(255,61,138,0)');
    c.save();c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(sx-36,sy-36,72,72);c.restore()}
  /* antenas de trás */
  rope(c,function(c){c.moveTo(13.4+hs,-17);c.quadraticCurveTo(12.4+hs,-23,14+hs+sw*.6,-28.4)},BD2,1.7);glow(c,14+hs+sw*.6,-29,1.7,1.7,EYE,EYEG,7);
  /* pé e corpo mole, com a sola ondulando */
  cel(c,function(c){c.moveTo(-22-hs*.6,-1.2);c.quadraticCurveTo(-14,-7,-5,-8);c.lineTo(5,-8.6);c.bezierCurveTo(9,-9,9,-18.4,15.6+hs,-19);c.quadraticCurveTo(22.4+hs,-19,22.8+hs,-12.6);c.quadraticCurveTo(22.6+hs,-7.6,24+hs,-3);c.quadraticCurveTo(24.6+hs,-.4,21+hs,-.3);
    for(var x=18;x>=-20;x-=2)c.lineTo(x+hs*(x>0?x/18:0),-.2-.9*Math.abs(Math.sin(x*.42-w)));c.closePath()},BD,{k:1.8,lw:2.2,inn:function(c){
    c.fillStyle='rgba(60,60,80,.26)';c.beginPath();c.ellipse(0,-1.6,22,2.2,0,0,TAU);c.fill();
    [[-15,-4],[-10,-5.4],[11,-6.4],[14.6,-9.6],[17+hs,-5]].forEach(function(q){dot(c,q[0],q[1],.8,'rgba(60,60,80,.4)')});
    c.fillStyle='rgba(255,255,255,.22)';c.beginPath();c.ellipse(15.6+hs,-15.6,3.4,1.6,-.3,0,TAU);c.fill()}});
  c.beginPath();c.moveTo(18.4+hs,-9.4);c.quadraticCurveTo(20.6+hs,-8,22.6+hs,-9.2);c.strokeStyle=OUT;c.lineWidth=1.2;c.lineCap='round';c.stroke();
  /* tentáculos curtos */
  [[22.4+hs,-12.4,26.6+hs,-11],[22.4+hs,-10.6,25.8+hs,-8]].forEach(function(q){ln(c,q,OUT,3);ln(c,q,BD2,1.3)});
  /* ponta da espira, atrás */
  cel(c,function(c){el(c,sx-10.6,sy-8,5,4.6)},SH2,{k:1.1,lw:2,inn:function(c){c.beginPath();c.arc(sx-10.6,sy-8,2.4,0,TAU);c.strokeStyle='rgba(30,26,40,.5)';c.lineWidth=1;c.stroke()}});
  /* concha em espiral */
  function spiral(c){for(var j=0;j<=64;j++){var a=1+j*.2,q=.6+j*.205;c[j?'lineTo':'moveTo'](sx-.6+Math.cos(a)*q,sy+.4+Math.sin(a)*q*.96)}}
  cel(c,function(c){el(c,sx,sy,R,R*.95,-.2)},SH,{k:2.6,inn:function(c){
    /* faixas ao longo da volta de fora */
    for(i=0;i<12;i++){var a=-2.6+i*.47;ln(c,[sx+Math.cos(a)*(R-5.4),sy+Math.sin(a)*(R-5.4),sx+Math.cos(a+.1)*(R+1),sy+Math.sin(a+.1)*(R+1)],'rgba(30,26,40,.26)',1)}
    c.beginPath();spiral(c);c.strokeStyle='rgba(30,26,40,.62)';c.lineWidth=1.7;c.lineCap='round';c.lineJoin='round';c.stroke();
    c.fillStyle='rgba(255,255,255,.2)';c.beginPath();c.ellipse(sx-5.6,sy-7.6,4.6,2.2,-.7,0,TAU);c.fill();
    if(au>0){c.save();c.globalAlpha=au;c.shadowColor=EYEG;c.shadowBlur=6;c.beginPath();spiral(c);c.strokeStyle='#ff8fbb';c.lineWidth=1.2;c.stroke();c.restore()}}});
  /* lábio da abertura, de onde o corpo sai */
  cel(c,function(c){c.moveTo(sx+8.6,sy+11);c.quadraticCurveTo(sx+15.4,sy+6,sx+13.4,sy-2.6);c.quadraticCurveTo(sx+18.6,sy+5,sx+11.4,sy+12.6);c.closePath()},'#b9b4c2',{k:.7,lw:1.7});
  if(au>0){c.save();c.globalAlpha=au*.8;c.shadowColor=EYEG;c.shadowBlur=8;c.beginPath();c.ellipse(sx,sy,R+2.6+au*1.6,R*.95+2.6+au*1.6,-.2,0,TAU);c.strokeStyle='#ff6fa8';c.lineWidth=1.4;c.stroke();c.restore();
    for(i=0;i<4;i++){var a2=t*W0+i*1.571,q2=R+6;dot(c,sx+Math.cos(a2)*q2,sy+Math.sin(a2)*q2*.9,1.1*au,'rgba(255,200,225,'+au+')')}}
  /* antena da frente com o olho na ponta */
  rope(c,function(c){c.moveTo(17.4+hs,-18);c.quadraticCurveTo(18.6+hs,-24,20.6+hs+sw,-29.4)},BD,2);
  dot(c,20.8+hs+sw,-30.2,2.7,'#262232');glow(c,20.8+hs+sw,-30.2,2,2,EYE,EYEG,9);
}

/* ---------------- jacaré-açu ---------------- */
/* o.walk fase da caminhada · o.bite 0..1: boca abrindo até o bote · o.tail 0..1: corpo torcendo, rabo armado para a rabada */
function drawJacare(c,t,o){o=o||{};var mv=o.walk!=null,w=o.walk||0,bt=sm(cl(o.bite)),tl=sm(cl(o.tail)),br=Math.sin(t*W0),
    b=mv?Math.abs(Math.cos(w))*.8:br*.4,G='#5f6473',G2='#494d5c',D='#363949',BL='#a8ab9f',i,ua=bt*.56+(mv?0:(br+1)*.012),la=bt*.3;
  function leg(x,ph,far){var s=mv?Math.sin(w+ph):0,up=mv?Math.max(0,Math.cos(w+ph))*2.2:0,kx=x+3.4+s*2,ky=-5.2-b*.3,fx=x+1.4+s*5.6,fy=-2-up;
    cel(c,function(c){cap(c,x,-9.4-b,kx,ky,3.7)},far?D:G2,{k:1,lw:1.9});
    cel(c,function(c){cap(c,kx,ky,fx,fy,2.8)},far?D:G2,{k:.9,lw:1.9});
    [2.6,4.4,6.2].forEach(function(d){ln(c,[fx+d-.6,fy+.4,fx+d+1.3,fy+1.9],OUT,2.2);ln(c,[fx+d-.6,fy+.4,fx+d+1.3,fy+1.9],'#e9e2d8',1)});
    cel(c,function(c){poly(c,[fx-3,fy-1.4,fx+3.6,fy-1.3,fx+6,fy+2,fx-3,fy+2])},far?'#2b2d3b':D,{k:.6,lw:1.7})}
  leg(15,PI,true);leg(-13,0,true);
  /* rabo: cadeia de trechos; enrola para cima e para a frente quando arma a rabada */
  var P=[],x=-18,y=-11.6-b,a,N=10;
  for(i=0;i<=N;i++){P.push([x,y,lp(6.8,1.1,Math.pow(i/N,.8))]);a=PI-.075-i*.012+(mv?Math.sin(w-i*.7)*.07:Math.sin(t*W0-i*.5)*.035)*(1-tl)+tl*(.1+i*.215);x+=Math.cos(a)*4.3;y+=Math.sin(a)*4.3}
  for(i=1;i<N;i++){var q0=P[i-1],q1=P[i+1],th=Math.atan2(q1[1]-q0[1],q1[0]-q0[0]),nx=-Math.sin(th),ny=Math.cos(th),rr=P[i][2];
    (function(px,py,tx,ty,h){cel(c,function(c){poly(c,[px-tx*2.2,py-ty*2.2,px+nx*h-tx*.4,py+ny*h-ty*.4,px+tx*2,py+ty*2])},D,{k:0,lw:1.6})})(P[i][0]+nx*rr*.7,P[i][1]+ny*rr*.7,Math.cos(th),Math.sin(th),lp(4.6,2.4,i/N))}
  cel(c,tube(P),G,{k:1.8,lw:2.2,inn:function(c){for(i=1;i<N;i++){var q0=P[i-1],q1=P[i+1],th=Math.atan2(q1[1]-q0[1],q1[0]-q0[0]),rr=P[i][2];
      ln(c,[P[i][0]-Math.sin(th)*rr,P[i][1]+Math.cos(th)*rr,P[i][0]+Math.sin(th)*rr,P[i][1]-Math.cos(th)*rr],'rgba(22,24,38,.36)',1);
      dot(c,P[i][0]-Math.sin(th)*rr*.62,P[i][1]+Math.cos(th)*rr*.62,rr*.5,'rgba(196,198,186,.4)')}}});
  /* placas do dorso */
  for(i=0;i<9;i++){var sx=-20+i*4.5,sy=-20.6-b+Math.pow((sx+2)/20,2)*2.6;(function(sx,sy,h){cel(c,function(c){poly(c,[sx-2.7,sy+2,sx-.6,sy-h,sx+2.5,sy+2])},D,{k:0,lw:1.6})})(sx,sy,3.4+(i%2)*1.2)}
  /* corpo baixo e comprido */
  cel(c,function(c){c.moveTo(-24,-15-b);c.bezierCurveTo(-14,-21.4-b,5,-22-b,17,-18.6-b);c.lineTo(23,-16.5-b);c.lineTo(23,-6.4-b);c.bezierCurveTo(10,-2.3-b,-12,-2.4-b,-24,-7.4-b);c.closePath()},G,{k:2.6,inn:function(c){
    c.fillStyle='rgba(26,28,42,.34)';c.beginPath();c.ellipse(-3,-20.4-b,22,3.6,-.02,0,TAU);c.fill();
    c.fillStyle='rgba(204,206,192,.55)';c.beginPath();c.ellipse(-1,-4.2-b,22,3,0,0,TAU);c.fill();
    for(i=0;i<10;i++){ln(c,[-20+i*4.5,-18.6-b,-21+i*4.5,-6-b],'rgba(22,24,38,.3)',1)}
    for(i=0;i<9;i++)for(var j=0;j<2;j++)dot(c,-18.4+i*4.5+(j%2)*.8,-15.4-b+j*4.6,1.1,'rgba(22,24,38,.3)')}});
  leg(11,0,false);leg(-17,PI,false);
  /* cabeça: a boca abre nos dois sentidos */
  c.save();c.translate(bt*3.5,-b);c.translate(14,-11);c.rotate(-tl*.16-bt*.04);c.translate(-14,11);
  var HX=20,HY=-11.4;
  c.beginPath();c.moveTo(HX-3,HY-1);c.lineTo(HX+Math.cos(-ua)*25,HY+Math.sin(-ua)*25);c.quadraticCurveTo(HX+7+(1-bt)*12,HY+1.4,HX+Math.cos(la)*24,HY+2.4+Math.sin(la)*24);c.lineTo(HX-3,HY+3);c.closePath();c.fillStyle='#b12c63';c.fill();
  if(bt>.1){c.beginPath();c.ellipse(HX+2,HY+1,5,1.4+bt*3.6,0,0,TAU);c.fillStyle='#5a1035';c.fill()}
  c.save();c.translate(HX,HY);c.rotate(la);
  if(bt>.1)cel(c,function(c){c.moveTo(3,1.4);c.quadraticCurveTo(12,-1.6,20,.9);c.quadraticCurveTo(12,2.6,3,2.4);c.closePath()},'#e87aa0',{k:.5,lw:1.2});
  for(i=0;i<7;i++)tooth(c,5.4+i*2.9,1.2+i*.04,.95,-2.6-(i%2)*.8);
  cel(c,function(c){c.moveTo(-6,0);c.lineTo(24.4,1.2);c.quadraticCurveTo(26.4,3.6,22.6,4.7);c.lineTo(3,7.2);c.quadraticCurveTo(-5,8.2,-7,3);c.closePath()},BL,{k:1.3,lw:2.1,sh:'rgba(26,28,42,.36)',inn:function(c){
    for(i=0;i<6;i++)ln(c,[2+i*3.8,1.6,1.2+i*3.8,7],'rgba(60,62,70,.32)',.9)}});
  c.restore();
  c.save();c.translate(HX,HY);c.rotate(-ua);
  for(i=0;i<8;i++)tooth(c,3.6+i*2.9,.9-i*.07,1,2.5+(i%3==1?1.3:0));
  cel(c,function(c){c.moveTo(-6,-6.4);c.quadraticCurveTo(-1.4,-12.4,4.4,-8);c.lineTo(8,-5.7);c.lineTo(20.6,-4.3);c.quadraticCurveTo(24.4,-6.6,26.6,-3.4);c.quadraticCurveTo(27.8,-.5,24.6,.5);c.lineTo(1,1.7);c.quadraticCurveTo(-5,2.2,-7,-1.6);c.closePath()},G,{k:2,lw:2.2,inn:function(c){
    c.fillStyle='rgba(26,28,42,.3)';c.beginPath();c.ellipse(10,-6,16,1.8,.08,0,TAU);c.fill();
    /* faixas claras da boca do jacaré-açu */
    [5.4,9.6,13.8,18].forEach(function(x){ln(c,[x,-3.6,x+.8,1.2],'rgba(204,206,192,.5)',1.5)});
    ln(c,[2,-1.2,24,-.9],'rgba(22,24,38,.3)',.9);
    [[11,-3.4],[15.6,-3.2],[20,-2.6]].forEach(function(q){dot(c,q[0],q[1],.7,'rgba(22,24,38,.4)')})}});
  dot(c,24.6,-3.9,.8,OUT);
  /* olho no alto da cabeça */
  dot(c,.6,-7.8,3,'#232031');glow(c,.9,-7.8,2.3,1.9,EYE,EYEG,10);ln(c,[-3.6,-11,4.6,-9.3],OUT,2.1);
  c.restore();
  c.restore();
}

/* ---------------- Boto (chefe intermediário) ---------------- */
/* o.cast 0..1: braço erguido conjurando jatos · o.dive 0..1: 0 em pé, 1 quase todo mergulhado (chapéu, nadadeira e respingos)
   o.tired true: curvado, ofegante, chapéu torto */
function drawBoto(c,t,o){o=o||{};var cs=sm(cl(o.cast)),dv=cl(o.dive),td=o.tired?1:0,
    br=td?Math.cos(t*W0):Math.sin(t*W0),b=br*(td?1.3:.7),sw=Math.sin(t*W0+1)*1.6,
    SU='#d8d6da',SU2='#b4b2bc',SHT='#f1f0f3',SK='#bd9dab',SK2='#9c8090',SKL='#d8bfc8',TIE='#b65f80',BAND='#8a4862',SHOE='#4b4753',i,
    lean=td?.4+br*.04:Math.sin(t*W0)*.012,PX=0,PY=-28,AO={k:1.2,lw:2};
  function wl(x,y){var dx=x-PX,dy=y-PY,co=Math.cos(lean),sn=Math.sin(lean);return [PX+dx*co+dy*sn,PY-dx*sn+dy*co]}
  var u=(t*W0/TAU)%1;
  /* marola atrás */
  wave(c,1,-.6,15+dv*5+br*.8,3.4+dv*1.2,false,.4+dv*.4);
  if(dv>0){for(i=0;i<2;i++){var q=(u+i*.5)%1;wave(c,1,-.4,18+q*14,4+q*3,false,dv*(1-q)*.6)}}
  c.save();
  if(dv>0){c.beginPath();c.rect(-140,-220,280,220.9);c.clip();c.translate(0,dv*65)}
  /* cauda de boto, saindo por baixo do paletó */
  var TP=bz(-4,-27,-13,-26.6,-17,-20,-18.4+sw*.6,-14,7,4.4,2.3),tn=TP.length-1,tth=Math.atan2(TP[tn][1]-TP[tn-1][1],TP[tn][0]-TP[tn-1][0]);
  c.save();c.translate(TP[tn][0],TP[tn][1]);c.rotate(tth+sw*.06);
  cel(c,function(c){c.moveTo(-2,-2);c.bezierCurveTo(2,-4,5,-9.6,10.5,-10.6);c.quadraticCurveTo(7,-4,7.4,0);c.quadraticCurveTo(7,4,10.5,10.6);c.bezierCurveTo(5,9.6,2,4,-2,2);c.closePath()},SK2,{k:1.1,lw:2,inn:function(c){ln(c,[0,0,6.6,0],'rgba(50,30,44,.4)',.9)}});
  c.restore();
  cel(c,tube(TP),SK,{k:1.3,lw:2,inn:function(c){c.fillStyle='rgba(255,236,240,.25)';c.beginPath();c.ellipse(-15,-17,2,6,.3,0,TAU);c.fill()}});
  /* pernas */
  function leg(hx,fx,far){var kn=ik(hx,-28,fx,-4,12.4,12.1,-1);
    cel(c,function(c){cap(c,hx,-28,kn[0],kn[1],4.3)},far?SU2:SU,{k:1.4,lw:2});
    cel(c,function(c){cap(c,kn[0],kn[1],fx,-4.4,3.5)},far?SU2:SU,{k:1.2,lw:2,inn:function(c){ln(c,[kn[0]+1.6,kn[1]+2,fx+1.4,-6],'rgba(60,54,76,.28)',.9)}});
    cel(c,function(c){c.moveTo(fx-4.4,0);c.lineTo(fx-4.4,-4.6);c.quadraticCurveTo(fx+1,-6.6,fx+8.2,-2.6);c.quadraticCurveTo(fx+9.8,0,fx+7,0);c.closePath()},far?'#3a3742':SHOE,{k:1,lw:2,inn:function(c){c.fillStyle='rgba(240,238,244,.75)';c.beginPath();c.ellipse(fx+5.4,-1.4,2.6,1.3,.2,0,TAU);c.fill()}})}
  leg(3.4,6.5+td*2.5,true);leg(-3,-5.5-td*1.5,false);
  /* daqui para cima tudo inclina junto quando ele cansa */
  c.save();c.translate(PX,PY);c.rotate(lean);c.translate(-PX,-PY);
  /* nadadeira dorsal furando o paletó */
  cel(c,function(c){c.moveTo(-6,-52+b);c.quadraticCurveTo(-15.6,-53+b,-19.6,-43.4+b);c.quadraticCurveTo(-13,-46.6+b,-7,-39+b);c.closePath()},SK,{k:1.3,lw:2,inn:function(c){ln(c,[-8,-47+b,-16.6,-46+b],'rgba(50,30,44,.3)',.9)}});
  /* braço de trás: segura a aba do chapéu; ergue-se para conjurar */
  var s2x=7,s2y=-49+b,fh=td?wl(11,-13):[lp(14.6,21,cs),lp(-64.6+b,-71,cs)],fk=arm2(c,s2x,s2y,fh[0],fh[1],13.4,13.2,1,3.5,3.1,SU2,SU2,AO);
  ln(c,[lp(fk[0],fh[0],.72)-1.6,lp(fk[1],fh[1],.72)-1.4,lp(fk[0],fh[0],.72)+1.8,lp(fk[1],fh[1],.72)+1.2],SHT,1.6);
  cel(c,function(c){el(c,fh[0],fh[1],3,3)},SK2,{k:.8,lw:1.8});
  /* paletó */
  cel(c,function(c){c.moveTo(-9.6,-51+b);c.quadraticCurveTo(0,-55.6+b,10,-51+b);c.bezierCurveTo(12.2,-43+b,9.4,-34,11.4,-24.4);c.quadraticCurveTo(0,-22,-12,-23.6);c.bezierCurveTo(-10,-33,-12.6,-43+b,-9.6,-51+b);c.closePath()},SU,{k:2.6,inn:function(c){
    c.fillStyle=SHT;c.beginPath();poly(c,[1.6,-54+b,9,-52.4+b,6.6,-37.4]);c.fill();
    /* gravata e lenço: o resto de cor */
    c.fillStyle=TIE;c.beginPath();poly(c,[4.4,-52.4+b,6.8,-52.2+b,7.6,-42,6.2,-38.6,4.8,-42]);c.fill();c.strokeStyle='rgba(50,20,36,.6)';c.lineWidth=.8;c.stroke();
    c.fillStyle=BAND;c.fillRect(4.2,-52.6+b,2.9,2.2);
    ln(c,[.8,-54+b,3,-45.6,6.4,-37.2],'rgba(60,54,76,.6)',1.2);ln(c,[9.6,-52+b,8.8,-44.6,6.6,-37.2],'rgba(60,54,76,.6)',1.2);
    ln(c,[6.4,-37.2,7.6,-23.6],'rgba(60,54,76,.5)',1.1);dot(c,6.2,-33.4,.9,'#77738a');dot(c,6.6,-29.2,.9,'#77738a');
    c.fillStyle=TIE;c.beginPath();poly(c,[-4.6,-45.4+b,-.8,-45.8+b,-2.6,-42.6+b]);c.fill();
    ln(c,[-5.2,-44.6+b,-.2,-45+b],'rgba(60,54,76,.5)',.9);
    ln(c,[-10,-31,-3.6,-30.4],'rgba(60,54,76,.4)',.9);
    c.fillStyle='rgba(60,54,76,.14)';c.fillRect(-13,-27,26,4)}});
  /* pescoço, cabeça com o bico de boto */
  c.save();c.translate(2,-52.6+b);c.rotate(td*.24);c.translate(-2,52.6-b);
  var hy=-60+b,mo=Math.max(td*(.5+.5*br)*.3,cs*.16);
  cel(c,function(c){cap(c,1.6,-52+b,2.2,-55+b,3.2)},SK2,{k:.8,lw:1.8});
  ln(c,[-1.6,-52.6+b,5.6,-52.2+b],SHT,2.2);
  /* bico de baixo abre quando ofega ou conjura */
  c.save();c.translate(8,-56.4+b);c.rotate(mo);
  cel(c,function(c){c.moveTo(-3,-.6);c.lineTo(9.4,-.4);c.quadraticCurveTo(10.8,1.2,8.4,1.9);c.quadraticCurveTo(2,3.6,-3.4,2.6);c.closePath()},SKL,{k:.6,lw:1.6});
  c.restore();
  cel(c,function(c){el(c,2.4,hy,8.3,8.5)},SK,{k:2.2,inn:function(c){c.fillStyle='rgba(255,236,240,.3)';c.beginPath();c.ellipse(4.6,hy+5.6,5,2.4,-.1,0,TAU);c.fill();dot(c,-4.6,hy+1.6,1.1,'rgba(50,30,44,.4)')}});
  cel(c,function(c){c.moveTo(7.4,hy-.6);c.quadraticCurveTo(13,hy+.6,18.4,hy+2.4);c.quadraticCurveTo(19.6,hy+3.6,18,hy+4.1);c.lineTo(7.2,hy+4.1);c.closePath()},SK,{k:.8,lw:1.7});
  /* sorriso de boto */
  c.beginPath();c.moveTo(17.6,hy+4);c.lineTo(8,hy+4.1);c.quadraticCurveTo(5,hy+4,3.6,hy+2.2);c.strokeStyle='rgba(50,30,44,.75)';c.lineWidth=1.1;c.lineCap='round';c.stroke();
  /* olhos por baixo da aba */
  glow(c,3.4,hy-1.4,2.3,1.7,EYE,EYEG,10,td?-.1:.18);glow(c,8.4,hy-1.7,1.7,1.5,EYE,EYEG,9,td?-.1:.2);
  if(td){ln(c,[.6,hy-2.6,6,hy-3.4],OUT,1.7);ln(c,[6.6,hy-3.6,10.2,hy-3]  ,OUT,1.6)}else{ln(c,[.6,hy-3.6,6,hy-2.2],OUT,1.7);ln(c,[6.8,hy-2.6,10.4,hy-3.6],OUT,1.6)}
  c.restore();
  /* chapéu branco: cobre o furo no alto da cabeça */
  c.save();c.translate(2.4+td*4.4,-66.2+b+td*1.4);c.rotate(-.1+td*.5);
  cel(c,function(c){el(c,0,0,15,3.7)},SU,{k:1.3,lw:2.2,sh:'rgba(60,40,70,.34)',inn:function(c){c.fillStyle='rgba(60,54,76,.2)';c.beginPath();c.ellipse(1,1.6,13,2,0,0,TAU);c.fill()}});
  cel(c,function(c){c.moveTo(-8.6,-.4);c.bezierCurveTo(-8.6,-5,-7.6,-9,-5,-9.8);c.quadraticCurveTo(-1,-8,1.4,-8.4);c.quadraticCurveTo(5,-10.6,7.6,-8.8);c.bezierCurveTo(9.6,-7,9.6,-3.6,9.4,-.4);c.quadraticCurveTo(.4,2,-8.6,-.4);c.closePath()},SU,{k:1.7,lw:2.2,inn:function(c){
    c.beginPath();c.moveTo(-9,-1.6);c.quadraticCurveTo(.4,.9,9.6,-1.6);c.strokeStyle=BAND;c.lineWidth=3;c.stroke();
    ln(c,[-3.6,-9,-.6,-5.4,3,-8.6],'rgba(60,54,76,.4)',1)}});
  c.restore();
  /* braço da frente: mão no bolso; apoia no joelho quando cansa */
  var nh=td?wl(5,-14.6):[-3.2+cs*1.5,-29.6+b*.4],nk=ik(-7,-49+b,nh[0],nh[1],12,11.6,1);cel(c,function(c){cap(c,-7,-49+b,nk[0],nk[1],3.7)},SU,AO);cel(c,function(c){cap(c,nk[0],nk[1],nh[0],nh[1],3.3)},SU,AO);
  ln(c,[lp(nk[0],nh[0],.74)-1.9,lp(nk[1],nh[1],.74)-.4,lp(nk[0],nh[0],.74)+2,lp(nk[1],nh[1],.74)+.6],SHT,1.6);
  cel(c,function(c){el(c,nh[0],nh[1],3.1,3.1)},SK,{k:.8,lw:1.8});
  if(!td)ln(c,[-6.8,-31.4,.6,-30.6],'rgba(60,54,76,.65)',1.3);
  c.restore();
  c.restore();
  /* suor e bafo */
  if(td){var hw=[15,-56],q2=.5+.5*br;drop(c,hw[0]-12,hw[1]-10+q2*5,1.5,.9-q2*.4);drop(c,hw[0]-16,hw[1]+q2*4,1.2,.5+q2*.4);
    for(i=0;i<2;i++){c.beginPath();c.arc(hw[0]+17+i*4+q2*3,hw[1]+13,2.2+i*1.2,-1,1);c.strokeStyle=FOAM+(.7-i*.25-q2*.3)+')';c.lineWidth=1.3;c.lineCap='round';c.stroke()}}
  /* água conjurada em volta da mão erguida */
  if(cs>0&&!td){var mx=22,my=-79.6+dv*65,g=c.createRadialGradient(mx,my,1,mx,my,20);g.addColorStop(0,'rgba(255,150,195,'+(.55*cs)+')');g.addColorStop(1,'rgba(255,150,195,0)');
    c.save();if(dv>0){c.beginPath();c.rect(-140,-220,280,220.9);c.clip()}
    c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(mx-22,my-22,44,44);c.globalCompositeOperation='source-over';c.globalAlpha=cs;
    for(i=0;i<3;i++){var a0=t*W0*2+i*2.094;rope(c,function(c){c.ellipse(mx,my,5+i*3.4,2.6+i*1.5,-.35,a0,a0+2.5)},i%2?'#f6dbe6':'#d9a9bd',1.2,'rgba(70,34,58,.7)')}
    for(i=0;i<5;i++){var a1=t*W0+i*1.257;drop(c,mx+Math.cos(a1)*(9+i%2*4),my+Math.sin(a1)*7-2,1.1+(i%2)*.4,.9,'#f3d6e2')}
    c.restore()}
  /* onde o corpo corta a água: nadadeira, espuma e respingos */
  if(dv>0){var f=sm(Math.max(0,(dv-.4)/.6));
    if(f>0){c.save();c.beginPath();c.rect(-60,-40,120,40.6);c.clip();
      cel(c,function(c){c.moveTo(-9,2);c.quadraticCurveTo(-14,-12.6*f,-22.6,-12*f+1);c.quadraticCurveTo(-18.6,-5*f,-21.4,2);c.closePath()},SK,{k:1.2,lw:2});c.restore();
      wave(c,-15.6,.2,7.6,1.8,true,.75*f,1.2)}
    var am=Math.min(1,dv*2.4);wave(c,1,.4,14.6+dv*4,3.6,true,.85*am,1.6);wave(c,1,1.6,21+dv*5,5,true,.4*am,1.1);
    for(i=0;i<7;i++){var sa=-2.7+i*.38,hh=Math.sin(Math.min(1,dv*1.25)*PI)*(13+(i%3)*5)+dv*3;drop(c,1+Math.cos(sa)*(13+dv*7+(i%2)*4),-1+Math.sin(sa)*hh*.9-hh*.25,1.2+(i%2)*.5,am*.95)}}
}

/* ---------------- Iara (chefão) ---------------- */
/* o.cast 0..1: braços erguidos · o.sing 0..1: boca aberta, cabeça inclinada, ondas de canto · o.dive 0..1: afundando
   o.gray===false: Iara liberta, colorida · o.down true: postura quebrada, caída sobre a própria cauda */
function drawIara(c,t,o){o=o||{};var cs=sm(cl(o.cast)),sg=cl(o.sing),dv=cl(o.dive),dn=o.down?1:0,fr=o.gray===false,
    br=dn?Math.cos(t*W0):Math.sin(t*W0),b=br*(dn?.5:.8),fs=Math.sin(t*W0+.8),hs=Math.sin(t*W0+2),u=(t*W0/TAU)%1,i,
    SK='#8d95a6',SK2='#717a8d',TL='#66708b',TL2='#4c556d',FN='#8e98b0',BELLY='#a9b1c2',HR='#222a40',HR2='#56678c',PT='#4a5266',TOP='#5b647a',BD1='#d9d6d2',BD2='#9aa1b2',FE=['#7c8598','#a2a9b8','#5d667b'],SCL='rgba(24,28,48,.42)',
    PX=dn*3,PY=-38+dn*11,LN=dn?1.2+br*.02:Math.sin(t*W0)*.012,HA=dn?.62:-sg*.26+hs*.015,AO={k:1.1,lw:1.9};
  if(fr){SK='#b9784c';SK2='#96592f';TL='#1f9d8e';TL2='#157468';FN='#63d6b8';BELLY='#bfe9c9';HR='#1b1420';HR2='#4a4f86';PT='#cf3b28';TOP='#cf3b28';BD1='#fff4d6';BD2='#f2c14e';FE=['#2b7fd6','#ffd23f','#e4572e'];SCL='rgba(6,52,60,.45)'}
  var coL=Math.cos(LN),siL=Math.sin(LN);
  function Wd(x,y){return [PX+x*coL-y*siL,PY+x*siL+y*coL]}            /* espaço do tronco -> mundo */
  function Ud(x,y){var dx=x-PX,dy=y-PY;return [dx*coL+dy*siL,-dx*siL+dy*coL]} /* mundo -> espaço do tronco */
  var NX=2.4,NY=-27-b,HS=1.26,coH=Math.cos(HA)*HS,siH=Math.sin(HA)*HS;
  function Hd(x,y){return Wd(NX+x*coH-y*siH,NY+x*siH+y*coH)}           /* espaço da cabeça -> mundo */
  function iri(c){if(!fr)return;var g=c.createLinearGradient(-38,-30,24,0);g.addColorStop(0,'rgba(120,255,190,.5)');g.addColorStop(.45,'rgba(70,190,255,.12)');g.addColorStop(.8,'rgba(190,130,255,.4)');g.addColorStop(1,'rgba(255,220,120,.3)');c.fillStyle=g;c.fillRect(-60,-60,120,80)}
  function shine(c,pts){pts.forEach(function(q){dot(c,q[0],q[1],q[2]||.9,fr?'rgba(220,255,240,.75)':'rgba(120,214,206,.38)')})}

  /* marola atrás */
  wave(c,-1,-1.4,28+dv*4+br*.8,4.4+dv,false,.36+dv*.4);
  if(dv>0)for(i=0;i<2;i++){var q=(u+i*.5)%1;wave(c,-1,-.6,30+q*16,5+q*3.4,false,dv*(1-q)*.6)}
  c.save();
  if(dv>0){c.beginPath();c.rect(-160,-260,320,260.9);c.clip();c.translate(0,dv*86)}

  /* volta de trás da cauda enrolada, com a crista */
  var FC=bz(-16,-15,-6,-19.6,9,-19.6,19.4,-15,8,6.2,6.9);
  for(i=1;i<8;i++){(function(p,h){cel(c,function(c){c.moveTo(p[0]-2.6,p[1]-p[2]+1.6);c.quadraticCurveTo(p[0]-1.6,p[1]-p[2]-h,p[0]+1.4,p[1]-p[2]-h+.6);c.lineTo(p[0]+2.4,p[1]-p[2]+1.6);c.closePath()},FN,{k:.5,lw:1.4})})(FC[i],2.6+(i%2)*1.1)}
  cel(c,tube(FC),TL2,{k:1.6,lw:2.2,inn:function(c){scales(c,-24,26,-21,-8,SCL);iri(c)}});
  /* ponta da cauda e a nadadeira em leque */
  var TE=bz(-16,-8.4,-27,-9.4,-35.5,-12+dn*5,-37.5+fs*1.4*(1-dn)+dn*1,-23+dn*12,8,6,2.2),n=TE.length-1,th=Math.atan2(TE[n][1]-TE[n-1][1],TE[n][0]-TE[n-1][0])+fs*.1*(1-dn)-dn*.7;
  c.save();c.translate(TE[n][0],TE[n][1]);c.rotate(th);
  cel(c,function(c){c.moveTo(-2,-2);c.bezierCurveTo(3,-4,8,-12,16.6,-14.6);c.quadraticCurveTo(12.4,-6,12,0);c.quadraticCurveTo(12.4,6,16.6,14.6);c.bezierCurveTo(8,12,3,4,-2,2);c.closePath()},FN,{k:1.4,lw:2.1,inn:function(c){
    [[-11.6,15.4],[-6,12.6],[0,11.6],[6,12.6],[11.6,15.4]].forEach(function(q){ln(c,[0,q[0]*.12,q[1],q[0]],fr?'rgba(10,90,90,.45)':'rgba(30,36,60,.4)',.9)});iri(c)}});
  c.restore();
  cel(c,tube(TE),TL,{k:1.5,lw:2.1,inn:function(c){scales(c,-42,-12,-24,-2,SCL,.85);iri(c)}});
  /* quadril: a pele vira escama e desce para dentro do rolo */
  cel(c,function(c){c.moveTo(PX-5,PY+7);c.quadraticCurveTo(PX-12,PY+10,PX-13.6,PY+17);c.quadraticCurveTo(PX-8,PY+15.6,PX-4.4,PY+14);c.closePath()},FN,{k:.7,lw:1.6,inn:function(c){ln(c,[PX-5.6,PY+10,PX-11.6,PY+15.4],fr?'rgba(10,90,90,.45)':'rgba(30,36,60,.4)',.8)}});
  var HP=bz(PX,PY+1,PX+.6,PY+9,lp(5.6,7,dn),-22+dn*4,8,-12,8,6.9,8.3);
  cel(c,tube(HP),TL,{k:2,lw:2.2,inn:function(c){scales(c,-10,18,PY-2,-6,SCL);
    c.fillStyle=fr?'rgba(190,240,205,.45)':'rgba(190,196,212,.3)';c.beginPath();c.ellipse(PX+7,PY+12,2.6,9,-.25,0,TAU);c.fill();iri(c)}});
  /* volta da frente: é a base */
  var NC=bz(-20.4,-8.4,-8,-6.9,8,-6.9,19.4,-9.4,10,6.7,8.3);
  cel(c,tube(NC),TL,{k:2.4,lw:2.4,inn:function(c){
    c.fillStyle=BELLY;c.globalAlpha=.6;c.beginPath();c.ellipse(0,1.4,26,4,0,0,TAU);c.fill();c.globalAlpha=1;
    for(i=0;i<12;i++)ln(c,[-24+i*4.3,-2.6,-24.6+i*4.3,1],'rgba(40,46,70,.3)',.9);
    scales(c,-28,28,-15.4,-4.4,SCL);iri(c);
    shine(c,[[-14,-11.6],[-5.2,-8.6,1.1],[3.6,-11.6],[12.4,-8.6],[20,-12,1.1],[-21,-8.6]])}});

  /* cabelo comprido escorrendo pelas costas, como água escura */
  var A=Hd(6.8,-15.4),B=Hd(-5,-16.4),C=Hd(-9.6,-8),Nn=Hd(-3.6,1.4),s1=hs*1.3,s2=Math.sin(t*W0+3.2)*1.8,HT;
  function hairBack(c){c.moveTo(A[0],A[1]);var q1=Hd(1,-19.6),q2=Hd(-10.6,-14.6);c.quadraticCurveTo(q1[0],q1[1],B[0],B[1]);c.quadraticCurveTo(q2[0],q2[1],C[0],C[1]);
    if(dn){var x0=C[0]-2;c.bezierCurveTo(C[0]-7,C[1]+10,x0-9+s1,-14,x0-8+s1,-2.6);c.lineTo(x0-4,-7);c.lineTo(x0-1+s2*.4,-1.4);c.lineTo(x0+2.4,-8);c.lineTo(x0+6.4+s2*.4,-2.2);c.lineTo(x0+9,-10);c.lineTo(x0+12.6+s1*.4,-4.4);c.bezierCurveTo(x0+14,-14,A[0]+6,A[1]+10,A[0]+1,A[1]+1);HT=[[x0-8+s1,-2.6],[x0-1,-1.4],[x0+6.4,-2.2],[x0+12.6,-4.4]]}
    else{c.bezierCurveTo(C[0]-6,C[1]+12,-24+s1,-51,-22.6+s1,-39);c.bezierCurveTo(-21.4+s1,-29,-29+s2,-26,-28+s2,-15);c.lineTo(-31+s2,-5.4);c.quadraticCurveTo(-25+s2,-10,-23.6+s2*.8,-3);c.quadraticCurveTo(-20+s2*.6,-9,-17.4+s2*.6,-3.6);c.quadraticCurveTo(-13.4,-11,-11.4,-21);c.bezierCurveTo(-9,-31,-7.6,-41,Nn[0]-2.6,Nn[1]+8);c.lineTo(Nn[0],Nn[1]);HT=[[-31+s2,-5.4],[-23.6+s2*.8,-3],[-17.4+s2*.6,-3.6]]}
    c.closePath()}
  cel(c,hairBack,HR,{k:2,lw:2.2,sh:'rgba(8,6,20,.4)',hi:fr?'rgba(120,130,255,.18)':'rgba(150,190,255,.2)',inn:function(c){
    c.strokeStyle=HR2;c.lineWidth=1.2;c.lineCap='round';
    if(dn){[[-5,0],[0,1.6],[5,.8]].forEach(function(q){c.beginPath();c.moveTo(C[0]+q[0],C[1]+6);c.bezierCurveTo(C[0]+q[0]-3,C[1]+14,C[0]+q[0]+1+s1,-14,C[0]+q[0]-1,-4+q[1]);c.stroke()})}
    else{[[-4.6,0],[-1.4,1.4],[2,.6],[5.4,2.2]].forEach(function(q,n){c.beginPath();c.moveTo(C[0]+q[0]+2,C[1]+5);c.bezierCurveTo(C[0]+q[0]-1,C[1]+16,-18.4+q[0]+s1,-46,-17+q[0]+s1,-36);c.bezierCurveTo(-16+q[0]+s1,-27,-23.6+q[0]+s2,-24.6,-22.6+q[0]*.9+s2,-11-q[1]*2);c.globalAlpha=n%2?.55:.9;c.stroke()});c.globalAlpha=1;
      /* reflexos de água correndo pelo cabelo */
      if(!fr)for(i=0;i<4;i++){var v=(u+i*.25)%1;dot(c,-17.6+s1-v*5.6+Math.sin(v*9)*2.4,-54+v*46,1.2,'rgba(190,220,255,'+(.55*Math.sin(v*PI))+')')}}}});
  if(!fr&&!dn)HT.forEach(function(q,n){var v=(u+n*.5)%1;drop(c,q[0]+.6,q[1]+1+v*4.6,1,.8*(1-v),'#9bb4d9')});

  /* tronco, cabeça e braços: inclinam juntos */
  c.save();c.translate(PX,PY);c.rotate(LN);
  var S1=[-6.6,-19.5-b],S2=[6.2,-19-b],k=1-cs,H1,H2,dd;
  /* mãos (espaço do tronco): descanso, conjurar, cantar, caída */
  H2=[lp(lp(15.4,15.6,sg),14,cs)+fs*.5*(1-cs),lp(lp(-13.2,-17.4,sg),-42.4,cs)+hs*.5];
  H1=[k*k*lp(-7.4,3.4,sg)+2*k*cs*-22+cs*cs*-10.4,k*k*lp(.6,-14.6,sg)+2*k*cs*-22+cs*cs*-43.6-b*.4];
  if(dn){dd=Wd(S2[0],S2[1]);H2=Ud(dd[0]+2.4,dd[1]+23.6);dd=Wd(S1[0],S1[1]);H1=Ud(dd[0]+1.4+br*.3,dd[1]+23.4)}
  function arm(S,Hn,pref,far){var c1=far?SK2:SK,kk=arm2(c,S[0],S[1],Hn[0],Hn[1],12.6,12,pref,3,2.6,c1,c1,AO),ax=lp(S[0],kk[0],.52),ay=lp(S[1],kk[1],.52),a=Math.atan2(kk[1]-S[1],kk[0]-S[0]),nx=-Math.sin(a)*3,ny=Math.cos(a)*3;
    /* braçadeira com peninha e pulseira */
    cel(c,function(c){c.moveTo(ax-nx,ay-ny);c.quadraticCurveTo(ax-nx*2.6+Math.cos(a)*2,ay-ny*2.6+Math.sin(a)*2+2,ax-nx*2.2+Math.cos(a)*5.6,ay-ny*2.2+Math.sin(a)*5.6+3);c.quadraticCurveTo(ax-nx+Math.cos(a)*4,ay-ny+Math.sin(a)*4,ax-nx,ay-ny);c.closePath()},FE[far?1:2],{k:.5,lw:1.3});
    ln(c,[ax-nx,ay-ny,ax+nx,ay+ny],OUT,3.6);ln(c,[ax-nx,ay-ny,ax+nx,ay+ny],BD2,1.9);
    var wx=lp(kk[0],Hn[0],.78),wy=lp(kk[1],Hn[1],.78),a2=Math.atan2(Hn[1]-kk[1],Hn[0]-kk[0]),mx=-Math.sin(a2)*2.5,my=Math.cos(a2)*2.5;ln(c,[wx-mx,wy-my,wx+mx,wy+my],BD1,1.6);
    cel(c,function(c){el(c,Hn[0],Hn[1],2.7,2.6)},c1,{k:.7,lw:1.7});
    /* dedos abertos quando o gesto é para fora */
    if(!dn&&(far||cs>.4))[-.5,.1,.7].forEach(function(d){ln(c,[Hn[0],Hn[1],Hn[0]+Math.cos(a2+d)*4.4,Hn[1]+Math.sin(a2+d)*4.4],OUT,2.5);ln(c,[Hn[0],Hn[1],Hn[0]+Math.cos(a2+d)*4.4,Hn[1]+Math.sin(a2+d)*4.4],c1,1.2)})}
  arm(S2,H2,1,true);
  /* tronco */
  cel(c,function(c){c.moveTo(-6.4,1.6);c.bezierCurveTo(-7.6,-7,-9.3,-14,-8.3,-21-b);c.quadraticCurveTo(0,-26-b,8.5,-21-b);c.bezierCurveTo(10.9,-15-b,7.2,-9,6.7,1.6);c.closePath()},SK,{k:2.2,lw:2.2,inn:function(c){
    /* faixa trançada no peito */
    c.fillStyle=TOP;c.beginPath();c.moveTo(-10,-19.4-b);c.quadraticCurveTo(1,-17.4-b,11,-19.6-b);c.lineTo(11,-12.6-b);c.quadraticCurveTo(1,-10.4-b,-10,-13-b);c.closePath();c.fill();c.strokeStyle='rgba(24,14,24,.6)';c.lineWidth=1;c.stroke();
    for(i=0;i<7;i++){dot(c,-7.4+i*2.6,-16.2-b+Math.abs(i-3.4)*-.22,.85,i%2?BD1:BD2);ln(c,[-6.6+i*2.6,-12-b,-6.8+i*2.6,-9.6-b],i%2?BD2:TOP,1)}
    /* pintura de jenipapo e urucum */
    c.beginPath();c.arc(-2.6,-4.6,4.4,.6,2.5);c.strokeStyle=PT;c.lineWidth=1.3;c.stroke();ln(c,[2.6,-7.6,5.6,-6.4],PT,1.3);ln(c,[2.8,-5.2,5.4,-4.2],PT,1.3);
    dot(c,4.4,-1.6,.7,'rgba(30,16,20,.5)')}});
  /* cinto de contas onde a pele vira cauda */
  c.beginPath();c.moveTo(-7,.6);c.quadraticCurveTo(0,3.4,7.4,.4);c.lineCap='round';c.strokeStyle=OUT;c.lineWidth=4.6;c.stroke();c.strokeStyle=BD2;c.lineWidth=2.6;c.stroke();
  [[-5.2,1.6],[-2.6,2.3],[0,2.6],[2.6,2.4],[5.2,1.6]].forEach(function(q,n){dot(c,q[0],q[1],1,n%2?FE[2]:BD1)});
  cel(c,function(c){poly(c,[1.4,3.4,4.6,3.2,3,7.6])},BD1,{k:.4,lw:1.2});
  /* colar */
  for(i=0;i<7;i++){var ca=.35+i*.4;dot(c,2.2+Math.cos(ca)*-6.6,-22.4-b+Math.sin(ca)*4.6,1.25,OUT);dot(c,2.2+Math.cos(ca)*-6.6,-22.4-b+Math.sin(ca)*4.6,.9,i%2?BD1:FE[2])}
  cel(c,function(c){poly(c,[1.2,-18.2-b,3.6,-18.2-b,2.4,-14.6-b])},BD1,{k:.4,lw:1.2});
  /* pescoço */
  cel(c,function(c){cap(c,1.6,-22.6-b,2.4,-26.6-b,3)},SK2,{k:.8,lw:1.8});
  /* cabeça */
  c.save();c.translate(NX,NY);c.rotate(HA);c.scale(HS,HS);
  /* penas do cocar, atrás da cabeça */
  [[-1.86,11.6,0],[-1.52,13.6,1],[-1.2,11,2],[-2.2,8.6,1]].forEach(function(q){c.save();c.translate(-2.6,-13.4);c.rotate(q[0]+Math.PI/2+hs*.03);
    cel(c,function(c){c.moveTo(0,0);c.quadraticCurveTo(-3.3,-q[1]*.55,0,-q[1]);c.quadraticCurveTo(3.3,-q[1]*.55,0,0);c.closePath()},FE[q[2]],{k:.7,lw:1.5,inn:function(c){ln(c,[0,-1,0,-q[1]+1.4],'rgba(20,20,40,.45)',.8);c.fillStyle=fr?'rgba(20,20,40,.55)':'rgba(40,44,60,.5)';c.fillRect(-4,-q[1],8,2.4)}});c.restore()});
  cel(c,function(c){el(c,.6,-7.6,8.2,8.6)},SK,{k:2.2,lw:2.2,inn:function(c){
    if(fr)dot(c,6,-3.6,2.3,'rgba(214,80,60,.28)');
    ln(c,[2.6,-4.6,5.4,-4],PT,1.3);ln(c,[2.4,-2.8,5,-2.2],PT,1.3)}});
  /* franja reta e mecha da frente */
  cel(c,function(c){c.moveTo(-7.8,-9);c.quadraticCurveTo(-7.4,-16.4,.6,-16.9);c.quadraticCurveTo(7.6,-16.6,9.3,-10.4);c.lineTo(8.4,-9.6);c.quadraticCurveTo(3,-11.6,-2.2,-9.9);c.quadraticCurveTo(-4.6,-5,-5.2,1);c.quadraticCurveTo(-8.6,-3,-7.8,-9);c.closePath()},HR,{k:1.2,lw:1.9,sh:'rgba(8,6,20,.4)',hi:fr?'rgba(120,130,255,.2)':'rgba(150,190,255,.22)',inn:function(c){ln(c,[-4.6,-14.4,-5.6,-8],HR2,1);ln(c,[.6,-15.6,-.6,-11.4],HR2,1);ln(c,[5,-14.6,4.6,-11.6],HR2,1)}});
  /* faixa do cocar */
  rope(c,function(c){c.moveTo(-7.4,-12.2);c.quadraticCurveTo(.6,-14.4,8.9,-12.2)},FE[2],1.5);
  [[-4.6,-13.1],[-1,-13.5],[2.6,-13.5],[6,-12.9]].forEach(function(q,n){dot(c,q[0],q[1],.75,n%2?BD1:FE[1])});
  /* olhos */
  if(fr){[[-.2,-7.2,2.1],[5,-7.4,1.7]].forEach(function(e){c.beginPath();c.ellipse(e[0],e[1],e[2],e[2]*.86,0,0,TAU);c.fillStyle='#fff8ea';c.fill();c.beginPath();c.ellipse(e[0]+.4,e[1]+.1,e[2]*.68,e[2]*.82,0,0,TAU);c.fillStyle='#5a3418';c.fill();dot(c,e[0]+.5,e[1]+.1,e[2]*.34,'#1c0f0a');dot(c,e[0]+.9,e[1]-.6,.55,'#fff');
      c.beginPath();c.moveTo(e[0]-e[2]-.4,e[1]-.2);c.quadraticCurveTo(e[0],e[1]-e[2]*1.25,e[0]+e[2]+.5,e[1]-.5);c.strokeStyle='#1c0f0a';c.lineWidth=1.2;c.lineCap='round';c.stroke()});
    ln(c,[-2.4,-10.2,1.6,-10.4],'#1c0f0a',1.1);ln(c,[3.6,-10.4,6.6,-10.2],'#1c0f0a',1.1)}
  else{glow(c,-.3,-7,2,dn?.8:1.45,EYE,EYEG,7,.14);glow(c,4.9,-7.2,1.6,dn?.7:1.3,EYE,EYEG,7,.2);
    ln(c,[-2.8,-9.4,1.6,-9.9],OUT,1.3);ln(c,[3.4,-10,6.6,-9.5],OUT,1.2)}
  /* nariz e boca */
  c.beginPath();c.arc(8.3,-5,1.1,-1.2,1.3);c.strokeStyle=fr?'#7a4424':'#4a5266';c.lineWidth=1;c.stroke();
  if(sg>.3){c.beginPath();c.ellipse(5.2,-1.9,1.5+sg*.5,1.4+sg*1.5,.1,0,TAU);c.fillStyle='#3a1220';c.fill();c.strokeStyle=fr?'#8a2c2c':'#3c4458';c.lineWidth=1.1;c.stroke()}
  else if(dn){c.beginPath();c.ellipse(5,-2,1.3,.9,0,0,TAU);c.fillStyle='#3a1220';c.fill()}
  else{c.beginPath();c.moveTo(3,-2.3);c.quadraticCurveTo(5,-1.3+cs*-.8,7,-2.5);c.strokeStyle=fr?'#8a2c2c':'#3c4458';c.lineWidth=1.4;c.lineCap='round';c.stroke()}
  /* brinco, e a flor da Iara liberta */
  dot(c,-3.4,-4,1.2,OUT);dot(c,-3.4,-4,.8,BD2);
  cel(c,function(c){c.moveTo(-3.4,-3);c.quadraticCurveTo(-5.4,.4,-3.6,3.4);c.quadraticCurveTo(-1.6,.4,-3.4,-3);c.closePath()},FE[0],{k:.4,lw:1.2});
  if(fr){for(i=0;i<5;i++){(function(a){cel(c,function(c){el(c,-5.6+Math.cos(a)*2.9,-11+Math.sin(a)*2.9,2.4,1.7,a)},'#f6f1e4',{k:.5,lw:1.2,sh:'rgba(214,80,120,.4)'})})(i*1.257+.3)}dot(c,-5.6,-11,1.6,'#ffd23f');dot(c,-5.6,-11,.7,'#e4572e')}
  c.restore();
  /* mecha caída sobre o ombro */
  if(!dn)cel(c,function(c){c.moveTo(-3.6,-27-b);c.bezierCurveTo(-8.6,-23-b,-10,-16,-7,-8.6+hs*.4);c.quadraticCurveTo(-6.4,-5.4,-5.4,-4.6+hs*.5);c.bezierCurveTo(-4.4,-11,-3.4,-18,-.6,-24.6-b);c.closePath()},HR,{k:1,lw:1.8,sh:'rgba(8,6,20,.4)',hi:fr?'rgba(120,130,255,.2)':'rgba(150,190,255,.22)',inn:function(c){ln(c,[-4,-23-b,-6.6,-15,-5.9,-8],HR2,1)}});
  arm(S1,H1,-1,false);
  c.restore();
  c.restore();

  /* estrelinhas de tonta */
  if(dn){var hc=Hd(.6,-7.6);for(i=0;i<3;i++){var a3=t*W0+i*2.094;star(c,hc[0]+3+Math.cos(a3)*11,hc[1]-13+Math.sin(a3)*3.4,2.6-(i%2)*.5,fr?'#ffd23f':'#ffd0e4')}}
  /* ondas do canto, saindo da boca */
  if(sg>.3){var mo=Hd(6,-2),ma=LN+HA-.08,sc=fr?'150,240,228':'255,120,176';mo[1]+=dv*86;c.save();if(dv>0){c.beginPath();c.rect(-160,-260,320,260.9);c.clip()}
    for(i=0;i<4;i++){var rr=7+(i+u)*7.4,al=sg*Math.min(1,(i+u)*.8)*Math.max(0,1-(i+u)/4);c.beginPath();c.arc(mo[0],mo[1],rr,ma-.62,ma+.46);c.strokeStyle='rgba(60,20,50,'+(al*.5)+')';c.lineWidth=3.4;c.lineCap='round';c.stroke();c.strokeStyle='rgba('+sc+','+al+')';c.lineWidth=1.7;c.stroke()}
    for(i=0;i<3;i++){var v2=(u+i*.33)%1;dot(c,mo[0]+Math.cos(ma-.4+i*.36)*(12+v2*22),mo[1]+Math.sin(ma-.4+i*.36)*(12+v2*22),1.3*(1-v2)+.3,'rgba('+sc+','+(sg*(1-v2))+')')}
    c.restore()}
  /* água conjurada entre as mãos */
  if(cs>0&&!dn){var ob=Wd(2.4,-58.6-b),ox=ob[0],oy=ob[1]+dv*86,col=fr?'120,226,240':'255,150,195',g2=c.createRadialGradient(ox,oy,1,ox,oy,22);g2.addColorStop(0,'rgba('+col+','+(.6*cs)+')');g2.addColorStop(1,'rgba('+col+',0)');
    c.save();if(dv>0){c.beginPath();c.rect(-160,-260,320,260.9);c.clip()}
    c.globalCompositeOperation='lighter';c.fillStyle=g2;c.fillRect(ox-24,oy-24,48,48);c.globalCompositeOperation='source-over';c.globalAlpha=cs;
    cel(c,function(c){el(c,ox,oy,4.6+cs*1.6,4.6+cs*1.6)},fr?'#8fdcf0':'#d9a9bd',{k:1,lw:1.6,out:fr?'#1b4a6b':'rgba(70,34,58,.9)',hi:'rgba(255,255,255,.5)'});
    for(i=0;i<3;i++){var a4=t*W0*2+i*2.094;rope(c,function(c){c.ellipse(ox,oy,9+i*3,3.6+i*1.4,-.3+i*.5,a4,a4+2.4)},i%2?'#ffffff':(fr?'#8fdcf0':'#f0c4d6'),1.2,fr?'rgba(20,60,90,.7)':'rgba(70,34,58,.7)')}
    for(i=0;i<6;i++){var a5=t*W0+i*1.047;drop(c,ox+Math.cos(a5)*(12+(i%2)*4),oy+Math.sin(a5)*9-1,1.1+(i%2)*.4,.9,fr?'#c9f2fa':'#f3d6e2')}
    c.restore()}
  /* onde ela corta a água */
  if(dv>0){var f2=sm(Math.max(0,(dv-.55)/.45));
    if(f2>0){c.save();c.beginPath();c.rect(-80,-60,160,60.6);c.clip();c.translate(-24,6-f2*8);c.rotate(-PI/2+fs*.08);
      cel(c,function(c){c.moveTo(-4,-2.4);c.bezierCurveTo(3,-4,8,-12,16.6,-14.6);c.quadraticCurveTo(12.4,-6,12,0);c.quadraticCurveTo(12.4,6,16.6,14.6);c.bezierCurveTo(8,12,3,4,-4,2.4);c.closePath()},FN,{k:1.4,lw:2.1});c.restore();
      wave(c,-24,.2,9,2,true,.75*f2,1.2)}
    var am=Math.min(1,dv*2.4);wave(c,-1,.6,25+dv*4,4.6,true,.85*am,1.7);wave(c,-1,2,33+dv*5,6.4,true,.4*am,1.1);
    for(i=0;i<9;i++){var sa=-2.8+i*.31,hh=Math.sin(Math.min(1,dv*1.2)*PI)*(15+(i%3)*6)+dv*3;drop(c,-1+Math.cos(sa)*(22+dv*8+(i%2)*5),-1+Math.sin(sa)*hh*.9-hh*.25,1.3+(i%2)*.5,am*.95)}}
}

/* ---------------- arara-vermelha (companheira) ---------------- */
/* o.fly   fase em radianos das asas (padrão: sempre em voo, batendo com o tempo)
   o.caged true: pousada, asas fechadas, para a gaiola de resgate */
function drawArara(c,t,o){o=o||{};var RD='#d8362b',RD2='#b0261f',YE='#ffcf3a',BLU='#2b77d1',BLU2='#1d4f9c',WH='#f6efe2',BK='#2a2226',HORN='#efe2c2',i;
  function head(hx,hy,rot){c.save();c.translate(hx,hy);c.rotate(rot);
    /* bico de baixo, cabeça, cara branca, bicão de cima */
    cel(c,function(c){c.moveTo(3.4,1.6);c.quadraticCurveTo(6.4,4.6,8.2,2.4);c.quadraticCurveTo(6.4,1.6,5.6,0);c.closePath()},BK,{k:.5,lw:1.5});
    cel(c,function(c){el(c,0,0,6,5.7)},RD,{k:1.5,lw:2,inn:function(c){c.fillStyle='rgba(255,170,90,.3)';c.beginPath();c.ellipse(-1.6,-3,3.2,1.6,-.4,0,TAU);c.fill()}});
    cel(c,function(c){el(c,2.7,.4,3.5,3.3,.2)},WH,{k:.7,lw:1.4,inn:function(c){ln(c,[.6,1.6,4.6,2.2],'rgba(200,60,50,.55)',.7);ln(c,[.8,2.9,4,3.3],'rgba(200,60,50,.55)',.7)}});
    cel(c,function(c){c.moveTo(4.2,-3.6);c.bezierCurveTo(8.6,-5,12.2,-2,10.6,3.6);c.quadraticCurveTo(9.4,1,5,.6);c.closePath()},HORN,{k:.9,lw:1.7,inn:function(c){c.fillStyle=BK;c.beginPath();c.ellipse(10.6,3,2.2,2.2,0,0,TAU);c.fill()}});
    dot(c,2.2,-.6,1.5,'#fff8d6');dot(c,2.4,-.6,.95,'#1c0f0a');dot(c,2.7,-1,.35,'#fff');
    c.restore()}
  if(o.caged){var bb=Math.sin(t*W0)*.4,tw=Math.sin(t*W0*2)*.04;
    /* rabo comprido encostado no chão */
    [[-15.6,-1,BLU],[-13.6,1.4,RD2],[-16.6,2,RD]].forEach(function(q){cel(c,function(c){c.moveTo(-1.6,-9);c.quadraticCurveTo(q[0]*.5-2,-6+q[1],q[0],-.6+q[1]*.4);c.quadraticCurveTo(q[0]*.5+1,-2+q[1],1.4,-5.6);c.closePath()},q[2],{k:.8,lw:1.6})});
    /* pés agarrados */
    [[-1.4,0],[2.2,0]].forEach(function(q){ln(c,[q[0],-4,q[0]+.6,-.6],OUT,3.2);ln(c,[q[0],-4,q[0]+.6,-.6],'#6b6468',1.6);[-1.6,.4,2.4].forEach(function(d){ln(c,[q[0]+.6,-.8,q[0]+.6+d,0],OUT,2.4);ln(c,[q[0]+.6,-.8,q[0]+.6+d,0],'#6b6468',1)})});
    /* corpo em pé */
    cel(c,function(c){el(c,.6,-11.6+bb,6.4,9,.22)},RD,{k:1.8,lw:2.1,inn:function(c){c.fillStyle='rgba(255,170,90,.26)';c.beginPath();c.ellipse(4,-11,2.4,6,.2,0,TAU);c.fill()}});
    /* asa fechada: vermelho, faixa amarela, ponta azul */
    cel(c,function(c){c.moveTo(-3.4,-17.6+bb);c.bezierCurveTo(2.6,-17+bb,3.6,-9,-.6,-3.4);c.quadraticCurveTo(-4,-1,-6.4,1);c.bezierCurveTo(-8.6,-5,-8,-13,-3.4,-17.6+bb);c.closePath()},BLU,{k:1.3,lw:1.9,inn:function(c){
      c.save();c.translate(-3,-10);c.rotate(.3);c.fillStyle=RD2;c.fillRect(-9,-12,18,8.6);c.fillStyle=YE;c.fillRect(-9,-3.6,18,4.6);c.restore();
      ln(c,[-4.6,-5,-5.6,0],BLU2,1);ln(c,[-2.4,-5.6,-3.6,-1.6],BLU2,1);ln(c,[-5.6,-10.4,-.2,-8.6],'rgba(120,70,0,.4)',.8)}});
    head(3.4,-21.6+bb,tw+.1);
    return}
  var f=o.fly!=null?o.fly:t*W0*4,by=-25+Math.cos(f)*1.5,fl=Math.sin(f-1)*1.6;
  c.save();c.scale(.78,.78);
  function wing(k,far){var L=23,q=Math.abs(k)<.16?(k<0?-.16:.16):k;c.save();c.translate(-1,by-3.4);c.rotate(-.26);
    cel(c,function(c){c.moveTo(6.4,0);c.quadraticCurveTo(9.6,-L*.6*q,3,-L*q);[[-1.4,-.9],[-3.2,-.94],[-5,-.76],[-7.4,-.78],[-8.6,-.56],[-11,-.56],[-10.8,-.33],[-13,-.29],[-9,0]].forEach(function(p){c.lineTo(p[0],p[1]*L*q)});c.closePath()},far?BLU2:BLU,{k:1.5,lw:2,inn:function(c){
      c.fillStyle=far?RD2:RD;c.fillRect(-16,q>0?3:-3,30,-L*q*.36-(q>0?3:-3));c.fillStyle=far?'#d9a520':YE;c.fillRect(-16,-L*q*.34,30,-L*q*.2);
      [[3,-.92],[-.4,-.84],[-3.6,-.68],[-6.8,-.48],[-10,-.3]].forEach(function(p){ln(c,[p[0]*.5+1,-L*q*.54,p[0],p[1]*L*q],far?'rgba(10,20,60,.5)':'rgba(14,34,90,.55)',1)});
      ln(c,[6,-L*q*.34,-11,-L*q*.34],'rgba(120,70,0,.4)',.8)}});
    c.restore()}
  wing(Math.cos(f-.5),true);
  /* rabo comprido */
  [[-28,by+3.4+fl,BLU,2.2],[-25,by+6+fl*.7,RD2,2.4],[-30,by+.6+fl*1.2,RD,2.6]].forEach(function(q){cel(c,function(c){c.moveTo(-6,by-2.6);c.quadraticCurveTo(-18,by-2.6+(q[1]-by)*.3,q[0],q[1]);c.quadraticCurveTo(-18,by+q[3]+(q[1]-by)*.5,-6,by+3.6);c.closePath()},q[2],{k:.9,lw:1.7})});
  /* pés recolhidos */
  ln(c,[-2,by+5,-4.6,by+7.6],OUT,3);ln(c,[-2,by+5,-4.6,by+7.6],'#6b6468',1.4);ln(c,[1.6,by+5.4,-.8,by+8],OUT,3);ln(c,[1.6,by+5.4,-.8,by+8],'#6b6468',1.4);
  cel(c,function(c){el(c,0,by,10.6,6.4,-.14)},RD,{k:2,lw:2.1,inn:function(c){c.fillStyle='rgba(255,170,90,.28)';c.beginPath();c.ellipse(2.6,by+3.6,7,2.2,-.1,0,TAU);c.fill()}});
  head(10,by-4.6,.1+Math.sin(f)*.04);
  wing(Math.cos(f),false);
  c.restore();
}

export { drawPiranha, drawSapo, drawArraia, drawCaramujo, drawJacare, drawBoto, drawIara, drawArara };
