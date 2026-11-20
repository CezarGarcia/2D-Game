// @ts-nocheck
/* Ícones desenhados por código, no mesmo estilo recortado dos personagens (contorno escuro quente,
   sombra em meia-lua, brilho do lado da luz). Cada ícone é desenhado numa caixa de 40×40 e
   escalado para `size`; a origem é o canto superior esquerdo do quadrado. */
import { OUT, TAU, el, cap, poly, cel, ln, dot, star } from './characters';

var GOLD='#f2c14e',LE='#96562b',LE2='#7a4424',DK='#3a2014',RED='#cf3b28',CRM='#f0d9a0',STEEL='#ebe6d6',GR='#5fbf5a',GR2='#2f7a3a';
var COLD={sh:'rgba(50,60,90,.4)'},LEAF={sh:'rgba(10,60,30,.4)'};
function rope(c,fn,col,lw,out){c.beginPath();fn(c);c.lineCap='round';c.lineJoin='round';c.strokeStyle=out||OUT;c.lineWidth=lw+2.2;c.stroke();c.strokeStyle=col;c.lineWidth=lw;c.stroke()}
/* brilho de quatro pontas */
function spark(c,x,y,r,col,g){c.save();if(g){c.shadowColor=g;c.shadowBlur=4}c.beginPath();c.moveTo(x,y-r);c.quadraticCurveTo(x,y,x+r,y);c.quadraticCurveTo(x,y,x,y+r);c.quadraticCurveTo(x,y,x-r,y);c.quadraticCurveTo(x,y,x,y-r);c.closePath();c.fillStyle=col;c.fill();c.restore()}
function halo(c,x,y,r,rgb,a){var g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,'rgba('+rgb+','+a+')');g.addColorStop(1,'rgba('+rgb+',0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
function leaf(c,x,y,rot,s,col){c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);cel(c,function(c){c.moveTo(0,0);c.quadraticCurveTo(3,-4.4,9,-.8);c.quadraticCurveTo(4,2.8,0,0);c.closePath()},col||GR,{k:.8,lw:1.5/s,sh:LEAF.sh,inn:function(c){ln(c,[.6,-.1,7.6,-.7],GR2,.8/s)}});c.restore()}

/* armas novas: partes reaproveitadas pelos ícones */
function featherI(c,x,y,ang,L,col,tip){c.save();c.translate(x,y);c.rotate(ang);
  cel(c,function(c){c.moveTo(0,0);c.quadraticCurveTo(L*.4,-L*.34,L,0);c.quadraticCurveTo(L*.4,L*.34,0,0);c.closePath()},col,{k:.7,lw:1.5,inn:function(c){if(tip){c.fillStyle=tip;c.fillRect(L*.66,-L,L,L*2)}ln(c,[.5,0,L*.9,0],'rgba(40,10,10,.5)',.7)}});
  c.restore()}
function knifeI(c,x,y,rot,s){c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);
  cel(c,function(c){c.moveTo(-2.2,-3);c.lineTo(-2.3,-21);c.quadraticCurveTo(-1.8,-26.5,1.6,-30.5);c.quadraticCurveTo(3.4,-22,2.9,-16);c.lineTo(2.7,-3);c.closePath()},STEEL,{k:1.2,lw:1.9/s,sh:COLD.sh,inn:function(c){ln(c,[-.4,-5,-.6,-23],'rgba(110,120,145,.75)',1);ln(c,[2,-15,2.4,-22],'rgba(255,255,255,.7)',.9)}});
  cel(c,function(c){poly(c,[-3.6,-4,3.8,-4,3.8,-.6,-3.6,-.6])},'#d6b25a',{k:0,lw:1.6/s});
  cel(c,function(c){cap(c,0,.8,0,10,2.7)},'#7a4a26',{k:.9,lw:1.8/s,inn:function(c){ln(c,[-2.8,5.4,2.8,5.4],DK,1)}});
  dot(c,0,3,.85,GOLD);dot(c,0,8,.85,GOLD);
  c.restore()}
/* gema lapidada com o símbolo do elemento dentro */
var GEMS={natureza:['#6fbf5a','rgba(10,60,30,.45)'],agua:['#3fa7e0','rgba(14,40,120,.45)'],tempestade:['#ffd23f','rgba(150,90,0,.45)'],fogo:['#ff7a2a','rgba(130,30,0,.45)'],terra:['#c99a5a','rgba(80,40,10,.45)'],sombra:['#9a6aff','rgba(40,10,90,.5)'],encanto:['#ff7ad9','rgba(110,10,80,.45)']};
function gemSymbol(c,el,x,y){var W='rgba(255,255,255,.62)';c.save();c.fillStyle=W;c.strokeStyle=W;c.lineWidth=1.4;c.lineCap='round';c.lineJoin='round';c.beginPath();
  if(el==='natureza'){c.moveTo(x-4,y+4);c.quadraticCurveTo(x-4.6,y-3.6,x+4.4,y-4.4);c.quadraticCurveTo(x+4,y+4.4,x-4,y+4);c.fill();c.beginPath();c.moveTo(x-4,y+4);c.lineTo(x+2,y-2);c.strokeStyle='rgba(20,70,30,.5)';c.lineWidth=.8;c.stroke()}
  else if(el==='agua'){c.moveTo(x,y-5.4);c.bezierCurveTo(x+1,y-2.4,x+4,y-.6,x+4,y+1.8);c.bezierCurveTo(x+4,y+4.4,x+2,y+5.2,x,y+5.2);c.bezierCurveTo(x-2,y+5.2,x-4,y+4.4,x-4,y+1.8);c.bezierCurveTo(x-4,y-.6,x-1,y-2.4,x,y-5.4);c.fill()}
  else if(el==='tempestade'){poly(c,[x+1,y-6,x-3.6,y+.6,x-.4,y+.6,x-1.8,y+6,x+3.8,y-1,x+.6,y-1,x+2.2,y-6]);c.fillStyle='rgba(255,255,255,.8)';c.fill()}
  else if(el==='fogo'){c.moveTo(x,y-6);c.bezierCurveTo(x+1,y-3,x+4.4,y-1.4,x+3.8,y+2.2);c.bezierCurveTo(x+3.4,y+5,x+1.4,y+5.6,x,y+5.6);c.bezierCurveTo(x-2.4,y+5.6,x-4.2,y+4,x-4,y+1.4);c.bezierCurveTo(x-3.8,y-.6,x-2.4,y-1.6,x-2,y-3.2);c.bezierCurveTo(x-1.2,y-1.8,x-.6,y-1.6,x-.2,y-2);c.bezierCurveTo(x-.8,y-3.8,x-.4,y-5,x,y-6);c.fill()}
  else if(el==='terra'){poly(c,[x-5.6,y+4.4,x-1.4,y-4.4,x+.8,y-.6,x+2.4,y-2.6,x+5.6,y+4.4]);c.fill();c.beginPath();c.moveTo(x-2.6,y-2);c.lineTo(x-1.4,y-4.4);c.lineTo(x,y-1.8);c.fillStyle='rgba(255,255,255,.9)';c.fill()}
  else if(el==='sombra'){c.arc(x,y,5,.9,-.9+TAU,false);c.arc(x+2.6,y-1,4,-1.25+TAU,1.35,true);c.closePath();c.fill()}
  else{c.arc(x+.3,y,1.2,0,TAU);c.moveTo(x+4.6,y);for(var i=0;i<=26;i++){var a=i*.42,r=4.6-i*.15;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.stroke()}
  c.restore()}
function gemIcon(c,el){var G=GEMS[el];
  cel(c,function(c){poly(c,[13,7.6,27,7.6,34.4,15.4,20,35.6,5.6,15.4])},G[0],{k:2,lw:2.2,sh:G[1],hi:'rgba(255,255,255,.4)',inn:function(c){
    c.fillStyle='rgba(255,255,255,.28)';c.beginPath();poly(c,[13,7.6,20,7.6,16.6,15.4,5.6,15.4]);c.fill();
    c.fillStyle='rgba(0,0,0,.14)';c.beginPath();poly(c,[23.4,15.4,34.4,15.4,20,35.6]);c.fill();
    ln(c,[5.6,15.4,34.4,15.4],'rgba(0,0,0,.28)',1);ln(c,[13,7.6,16.6,15.4,20,7.6,23.4,15.4,27,7.6],'rgba(0,0,0,.22)',.9);
    ln(c,[16.6,15.4,20,35.6,23.4,15.4],'rgba(255,255,255,.3)',.9);
    gemSymbol(c,el,20,22.4)}});
  spark(c,9,7.4,3.4,'#ffffff');spark(c,32.4,27.4,2.2,'#ffffff')}

var ITEM={
  facao:function(c){c.save();c.translate(11.2,27.2);c.rotate(.8);
    cel(c,function(c){c.moveTo(-3.3,-2);c.lineTo(-4.4,-20);c.quadraticCurveTo(-2.4,-28,2.6,-31.5);c.quadraticCurveTo(8.4,-25,6.4,-18);c.lineTo(3.6,-2);c.closePath()},STEEL,{k:1.5,lw:2,sh:COLD.sh,inn:function(c){ln(c,[-1,-4,-1.6,-21],'rgba(110,120,145,.7)',1.1);ln(c,[4.4,-17,5.6,-24],'rgba(255,255,255,.6)',1)}});
    cel(c,function(c){poly(c,[-6.6,-3.8,7,-3.8,7,-.6,-6.6,-.6])},GOLD,{k:.6,lw:1.7});
    cel(c,function(c){cap(c,0,.6,0,7.4,2.9)},'#5a3218',{k:1,lw:1.9});dot(c,0,2.2,.9,GOLD);dot(c,0,6,.9,GOLD);
    c.restore()},
  arco:function(c){c.save();c.translate(19.5,20.5);c.rotate(-.62);
    ln(c,[-7,-16.4,-7,16.4],OUT,2.1);ln(c,[-7,-16.4,-7,16.4],'#f3ead0',1);
    ln(c,[-7,0,13,0],OUT,3);ln(c,[-7,0,13,0],'#d9b77a',1.4);
    cel(c,function(c){poly(c,[12,-3,19,0,12,3])},'#c9c5bb',{k:.6,lw:1.5,sh:COLD.sh});
    cel(c,function(c){poly(c,[-6,0,-8,-3,-2.6,-3,-.6,0,-2.6,3,-8,3])},RED,{k:.6,lw:1.3});
    function limbs(c){c.moveTo(-7,-16.4);c.quadraticCurveTo(-1,-16.4,3,-10.4);c.quadraticCurveTo(8.6,0,3,10.4);c.quadraticCurveTo(-1,16.4,-7,16.4)}
    c.beginPath();limbs(c);c.lineCap='round';c.lineJoin='round';c.strokeStyle=OUT;c.lineWidth=5.8;c.stroke();c.strokeStyle='#a5652e';c.lineWidth=3.4;c.stroke();
    c.save();c.translate(-.8,-.2);c.beginPath();limbs(c);c.strokeStyle='rgba(255,220,160,.5)';c.lineWidth=.9;c.stroke();c.restore();
    ln(c,[-5,-17.6,-4,-14.8],GOLD,1.5);ln(c,[-5,17.6,-4,14.8],GOLD,1.5);
    cel(c,function(c){cap(c,5.4,-3.4,5.4,3.4,2.5)},'#5a3218',{k:.8,lw:1.7});dot(c,5.4,-1.8,.8,GOLD);dot(c,5.4,1.8,.8,GOLD);
    c.restore()},
  borduna:function(c){c.save();c.translate(11.2,26.4);c.rotate(.76);c.scale(.92,.92);
    cel(c,function(c){c.moveTo(-2.4,6);c.lineTo(-2.8,-10);c.quadraticCurveTo(-6.8,-17,-6.4,-25);c.quadraticCurveTo(-5.6,-33.4,0,-34.6);c.quadraticCurveTo(5.6,-33.4,6.4,-25);c.quadraticCurveTo(6.8,-17,2.8,-10);c.lineTo(2.4,6);c.closePath()},'#4a2a1c',{k:1.8,lw:2.2,sh:'rgba(16,4,8,.45)',hi:'rgba(255,214,170,.22)',inn:function(c){
      ln(c,[-4,-13.4,4,-13.4],'#c0392a',2.2);
      ln(c,[-4.6,-17,4.4,-19.8,-4.8,-22.8,4.6,-25.8,-4.6,-28.8,3.8,-31.6],'#b07a4c',1.3);
      for(var i=0;i<4;i++)ln(c,[-2.6,4-i*3,2.6,1.6-i*3],CRM,1.1)}});
    cel(c,function(c){el(c,0,6.6,3.4,2.7)},'#2e1a10',{k:.6,lw:1.8});
    c.restore();
    featherI(c,7,30.6,1.1,10.4,'#e8452c','#2a1a40');featherI(c,7,30.6,.62,11,'#ffd23f','#3f7fd0');featherI(c,7,30.6,.15,10,'#3f7fd0','#ffd23f')},
  peixeiras:function(c){knifeI(c,10.8,30.4,.6,.98);knifeI(c,29.2,30.4,-.6,.98)},
  zagaia:function(c){c.save();c.translate(20,20);c.rotate(-.785);
    cel(c,function(c){cap(c,-25,0,13,0,1.8)},'#a0703e',{k:.7,lw:1.9,inn:function(c){ln(c,[-23,-.8,11,-.8],'rgba(255,224,170,.5)',.7)}});
    cel(c,function(c){cap(c,-26,0,-23,0,2.4)},DK,{k:0,lw:1.6});
    cel(c,function(c){poly(c,[10.6,-2.6,15.4,-2.2,15.4,2.2,10.6,2.6])},'#5f5a52',{k:.5,lw:1.6});
    cel(c,function(c){c.moveTo(15,-2.1);c.quadraticCurveTo(19.6,-6.4,27.4,0);c.quadraticCurveTo(19.6,6.4,15,2.1);c.closePath()},'#d4d1c8',{k:1.2,lw:2,sh:COLD.sh,inn:function(c){ln(c,[16,.2,25.4,.1],'rgba(80,90,110,.6)',1);ln(c,[17.6,-2.2,22,-2],'rgba(255,255,255,.75)',.9)}});
    c.restore();
    rope(c,function(c){c.moveTo(26.4,13.6);c.quadraticCurveTo(21.4,16.6,20.4,22.6)},'#cf3b28',2.4);rope(c,function(c){c.moveTo(26.4,13.6);c.quadraticCurveTo(27.4,19.4,24.4,24.6)},'#e04a32',2);
    cel(c,function(c){el(c,26.4,13.6,2.4,2.4)},'#e04a32',{k:.5,lw:1.5})},
  cajado:function(c){
    function sh(c){c.moveTo(7,38);c.quadraticCurveTo(11,30,11.4,25);c.quadraticCurveTo(12,19,16.4,15.4);c.quadraticCurveTo(20,12.4,21.6,9.6)}
    c.beginPath();sh(c);c.lineCap='round';c.lineJoin='round';c.strokeStyle=OUT;c.lineWidth=6;c.stroke();c.strokeStyle='#7e4e2a';c.lineWidth=3.8;c.stroke();
    c.save();c.translate(-.8,-.4);c.beginPath();sh(c);c.strokeStyle='rgba(255,214,160,.45)';c.lineWidth=.9;c.stroke();c.restore();
    [[-1,0],[1,0]].forEach(function(q){c.beginPath();c.moveTo(21.6,9.6);c.quadraticCurveTo(q[0]<0?16.6:26.6,q[0]<0?8:12.6,q[0]<0?19:30.4,q[0]<0?2.2:5.2);c.strokeStyle=OUT;c.lineWidth=4.4;c.stroke();c.strokeStyle='#7e4e2a';c.lineWidth=2.3;c.stroke()});
    c.save();c.globalCompositeOperation='lighter';halo(c,25.4,5.6,10,'255,236,150',.55);c.restore();
    cel(c,function(c){poly(c,[25.4,.4,29.6,4.4,28.2,9.2,22.6,9.2,21.2,4.4])},'#fff4bf',{k:.9,lw:1.7,sh:'rgba(150,110,20,.35)',hi:'rgba(255,255,255,.6)'});
    featherI(c,17,15,2,10,'#e8452c','#2a1a40');featherI(c,17,15,2.7,9,'#3f8fc0','#ffd23f');
    ln(c,[17,15,15.6,18.6],DK,1.2);
    cel(c,function(c){el(c,15.4,20.4,2.4,2.4);el(c,15.6,26,4.6,4.8)},'#c9963f',{k:1,lw:1.8,inn:function(c){ln(c,[11,25.4,20.2,25.4],'#6b3a1e',1.1);dot(c,13.8,23.6,.9,'#fff0c0')}});
    spark(c,34,13.6,2.6,'#fff6cf');spark(c,33,2.6,1.8,'#fff6cf')},
  escudo:function(c){
    cel(c,function(c){el(c,20,20,13.6,16)},'#b9773c',{k:2.4,lw:2.2,inn:function(c){c.beginPath();c.ellipse(20,20,10.4,12.8,0,0,TAU);c.strokeStyle='#6b3a1e';c.lineWidth=2;c.stroke();for(var i=0;i<8;i++)dot(c,20+Math.cos(i*.785+.39)*8,20+Math.sin(i*.785+.39)*10.2,1.25,GOLD)}});
    cel(c,function(c){el(c,20,20,5,5)},'#5a2f18',{k:.9,lw:1.5});star(c,20,20,4,GOLD)},
  aljava:function(c){c.save();c.translate(19,22.5);c.rotate(.42);
    rope(c,function(c){c.moveTo(-6,-5);c.quadraticCurveTo(-14,6,-3,13.5)},DK,1.6);
    cel(c,function(c){c.moveTo(-6.6,-7);c.lineTo(-5,12);c.quadraticCurveTo(0,16.4,5,12);c.lineTo(6.6,-7);c.closePath()},LE,{k:1.8,lw:2.1,inn:function(c){c.fillStyle=GOLD;c.fillRect(-8,-4.4,16,2.6);c.fillStyle=DK;c.fillRect(-8,7.4,16,2.2);ln(c,[-2.6,1,-2.2,6],CRM,.9,[1.5,1.7]);dot(c,2.6,3.4,1.2,RED);for(var i=0;i<6;i++)dot(c,2.6+Math.cos(i*1.047)*2.3,3.4+Math.sin(i*1.047)*2.3,.8,CRM)}});
    cel(c,function(c){el(c,0,-7,6.6,2.3)},DK,{k:0,lw:1.9});
    [[-3.4,-16.5,RED],[.4,-20,CRM],[3.8,-15.5,RED]].forEach(function(q){ln(c,[q[0],-7,q[0],q[1]],OUT,2.8);ln(c,[q[0],-7,q[0],q[1]],'#d9b77a',1.3);
      cel(c,function(c){poly(c,[q[0]-2.8,q[1]+1.4,q[0],q[1]-1.6,q[0]+2.8,q[1]+1.4,q[0]+2.8,q[1]+7,q[0],q[1]+5,q[0]-2.8,q[1]+7])},q[2],{k:.6,lw:1.4})});
    c.restore()},
  chapeu:function(c){
    cel(c,function(c){c.moveTo(2.6,29.6);c.quadraticCurveTo(20,-13.5,37.4,29.6);c.quadraticCurveTo(20,19.6,2.6,29.6);c.closePath()},'#8f5028',{k:2.2,lw:2.2,inn:function(c){
      c.beginPath();c.moveTo(5,27.2);c.quadraticCurveTo(20,-9,35,27.2);c.strokeStyle=CRM;c.lineWidth=1;c.setLineDash([1.9,1.9]);c.stroke();c.setLineDash([]);
      c.beginPath();c.moveTo(4,29);c.quadraticCurveTo(20,18.2,36,29);c.strokeStyle='#5a2f18';c.lineWidth=3;c.stroke()}});
    star(c,20,15.4,4.6,GOLD);
    [[10.6,20.6],[29.4,20.6]].forEach(function(q){dot(c,q[0],q[1],2.5,GOLD);c.strokeStyle=OUT;c.lineWidth=.9;c.beginPath();c.arc(q[0],q[1],2.5,0,TAU);c.stroke();dot(c,q[0]-.7,q[1]-.7,.8,'#fff3c4')});
    [[6.2,25.6],[14.8,17.6],[25.2,17.6],[33.8,25.6]].forEach(function(q){dot(c,q[0],q[1],1.1,GOLD)})},
  gibao:function(c){
    cel(c,function(c){c.moveTo(13,6.4);c.quadraticCurveTo(20,10.4,27,6.4);c.lineTo(35.4,11.6);c.lineTo(32.6,19.8);c.lineTo(28.4,17.6);c.quadraticCurveTo(27.6,26,29.6,34.6);c.lineTo(10.4,34.6);c.quadraticCurveTo(12.4,26,11.6,17.6);c.lineTo(7.4,19.8);c.lineTo(4.6,11.6);c.closePath()},LE,{k:2.2,lw:2.2,inn:function(c){
      c.fillStyle='#b46c36';c.beginPath();c.moveTo(20,9);c.lineTo(26,6.4);c.lineTo(21,16.6);c.closePath();c.fill();c.beginPath();c.moveTo(20,9);c.lineTo(14,6.4);c.lineTo(19.6,16);c.closePath();c.fill();
      ln(c,[20.6,16.4,20.6,34],DK,1.3);ln(c,[11,32.4,29,32.4],CRM,1,[1.7,1.7]);ln(c,[22.6,18,22.6,27],CRM,.9,[1.5,1.9]);
      ln(c,[11.6,17.6,12.6,12.4],'rgba(58,32,20,.6)',1.1);ln(c,[28.4,17.6,27.4,12.4],'rgba(58,32,20,.6)',1.1);
      c.beginPath();c.moveTo(11,6);c.lineTo(15.4,5);c.lineTo(31,24.6);c.lineTo(28,27.6);c.closePath();c.fillStyle='#4a2614';c.fill();
      for(var i=0;i<4;i++){c.fillStyle=GOLD;c.fillRect(15+i*3.5,9.6+i*4.4,2,3.2)}
      c.fillStyle=DK;c.fillRect(8,25.4,24,4);c.fillStyle=GOLD;c.fillRect(18,24.6,5,5.6);c.fillStyle=DK;c.fillRect(19.6,26,1.9,2.8)}})},
  couraca:function(c){
    [[-1,LE2],[1,LE]].forEach(function(q){cel(c,function(c){poly(c,[20+q[0]*6,7.4,20+q[0]*10.4,7.4,20+q[0]*11.4,2.6,20+q[0]*7.6,2.6])},q[1],{k:.7,lw:1.7})});
    cel(c,function(c){c.moveTo(12,6);c.quadraticCurveTo(20,11.4,28,6);c.lineTo(32.4,9.4);c.quadraticCurveTo(29.4,14.6,33,20);c.quadraticCurveTo(32,31,20,36);c.quadraticCurveTo(8,31,7,20);c.quadraticCurveTo(10.6,14.6,7.6,9.4);c.closePath()},'#a9a49c',{k:2.4,lw:2.2,sh:COLD.sh,inn:function(c){
      ln(c,[20,10.4,20,35],'rgba(40,44,60,.55)',1.3);
      c.beginPath();c.moveTo(9.4,20.6);c.quadraticCurveTo(15,24.4,20,20.6);c.quadraticCurveTo(25,24.4,30.6,20.6);c.strokeStyle='rgba(40,44,60,.5)';c.lineWidth=1.2;c.stroke();
      c.beginPath();c.moveTo(11.4,27.4);c.quadraticCurveTo(20,31.6,28.6,27.4);c.stroke();
      c.beginPath();c.moveTo(12.6,7.4);c.quadraticCurveTo(20,12.8,27.4,7.4);c.strokeStyle=GOLD;c.lineWidth=1.8;c.stroke();
      c.fillStyle='rgba(255,255,255,.3)';c.beginPath();c.ellipse(13.6,15,2.6,4.4,.3,0,TAU);c.fill();
      [[10.6,11.4],[29.4,11.4],[10.4,22.6],[29.6,22.6],[14.6,31],[25.4,31]].forEach(function(q){dot(c,q[0],q[1],1.2,GOLD)})}})},
  manto:function(c){
    cel(c,function(c){c.moveTo(13,7);c.quadraticCurveTo(20,3.4,27,7);c.quadraticCurveTo(34.4,19,35.6,33);c.quadraticCurveTo(31.6,31,28.2,34.4);c.quadraticCurveTo(24,31.4,20,34.8);c.quadraticCurveTo(16,31.4,11.8,34.4);c.quadraticCurveTo(8.4,31,4.4,33);c.quadraticCurveTo(5.6,19,13,7);c.closePath()},'#3f7f8c',{k:2.4,lw:2.2,sh:'rgba(14,30,60,.4)',inn:function(c){
      [[15.4,11,11.6,33],[20,12,20,34],[24.6,11,28.4,33]].forEach(function(q){ln(c,q,'rgba(16,48,60,.55)',1.2)});
      c.beginPath();c.moveTo(5,27.4);c.quadraticCurveTo(20,23.4,35,27.4);c.strokeStyle=CRM;c.lineWidth=1.5;c.stroke();
      c.beginPath();c.moveTo(4.6,30.2);c.quadraticCurveTo(20,26.2,35.4,30.2);c.strokeStyle=CRM;c.lineWidth=.9;c.setLineDash([1.6,1.8]);c.stroke();c.setLineDash([])}});
    cel(c,function(c){c.moveTo(11.6,5.4);c.quadraticCurveTo(20,11.4,28.4,5.4);c.lineTo(27.6,9.8);c.quadraticCurveTo(20,15,12.4,9.8);c.closePath()},RED,{k:.9,lw:1.8});
    dot(c,20,11.6,2.6,GOLD);c.strokeStyle=OUT;c.lineWidth=1;c.beginPath();c.arc(20,11.6,2.6,0,TAU);c.stroke();dot(c,19.3,10.9,.8,'#fff3c4')},
  luvas:function(c){
    cel(c,function(c){c.moveTo(10.6,24.6);c.lineTo(10.6,11.4);c.quadraticCurveTo(10.6,4.8,17.2,4.8);c.quadraticCurveTo(23.8,4.8,23.8,11.4);c.lineTo(23.8,15.6);c.quadraticCurveTo(26.6,11.8,29.8,13.6);c.quadraticCurveTo(32,15.6,29.6,18.8);c.lineTo(25,24.6);c.closePath()},LE,{k:2,lw:2.2,inn:function(c){
      ln(c,[15,6,15,13.4],'rgba(58,32,20,.6)',1.2);ln(c,[19.4,6,19.4,13.4],'rgba(58,32,20,.6)',1.2);ln(c,[23.8,15.6,22,19.6],'rgba(58,32,20,.6)',1.2);
      ln(c,[12.4,21.6,24,21.6],CRM,.9,[1.6,1.7])}});
    cel(c,function(c){poly(c,[9.4,24.4,26.4,24.4,28.2,34.6,7.6,34.6])},LE2,{k:1.4,lw:2.1,inn:function(c){ln(c,[8.6,31.6,27.6,31.6],CRM,.9,[1.6,1.7]);[12.6,17.9,23.2].forEach(function(x){dot(c,x,27.8,1.3,GOLD)})}})},
  alpercatas:function(c){
    function sandal(x,y,rot,dark){c.save();c.translate(x,y);c.rotate(rot);
      cel(c,function(c){c.moveTo(-5.4,13);c.quadraticCurveTo(-6.8,2,-5.8,-7);c.quadraticCurveTo(-4.6,-14.6,1,-14.6);c.quadraticCurveTo(6.6,-14.6,6.4,-6);c.quadraticCurveTo(5.8,3,5.4,13);c.quadraticCurveTo(0,16.6,-5.4,13);c.closePath()},dark?'#6a3c20':LE2,{k:1.2,lw:2.1,inn:function(c){
        c.beginPath();c.moveTo(-3.4,11.6);c.quadraticCurveTo(-4.6,2,-3.8,-6.6);c.quadraticCurveTo(-2.8,-12.4,1,-12.4);c.quadraticCurveTo(4.6,-12.4,4.4,-6);c.quadraticCurveTo(3.8,3,3.4,11.6);c.quadraticCurveTo(0,14,-3.4,11.6);c.closePath();c.fillStyle=dark?'#a8834f':'#c39a62';c.fill()}});
      rope(c,function(c){c.moveTo(.4,-8);c.lineTo(.2,.4)},LE,1.5);
      rope(c,function(c){c.moveTo(-5.8,-4.4);c.quadraticCurveTo(.4,-9.6,6.2,-4.4)},LE,2);
      rope(c,function(c){c.moveTo(-5.9,5.4);c.quadraticCurveTo(0,-1.4,5.7,5.4)},LE,2);
      dot(c,.3,-7.4,1.4,GOLD);dot(c,0,1.6,1.2,GOLD);
      c.restore()}
    sandal(26.6,19.4,.24,true);sandal(13.6,20.6,-.2,false)},
  anel:function(c){
    cel(c,function(c){el(c,20,24.4,11,10.2);c.moveTo(26.8,24.4);c.ellipse(20,24.4,6.8,6.2,0,0,TAU,true)},GOLD,{k:1.5,lw:2.1,sh:'rgba(120,60,0,.45)',inn:function(c){c.beginPath();c.ellipse(20,24.4,8.9,8.2,0,.3,2.2);c.strokeStyle='rgba(120,60,0,.45)';c.lineWidth=1;c.stroke();dot(c,12.6,20,1.1,'#fff6cf')}});
    cel(c,function(c){poly(c,[14.2,13.6,25.8,13.6,24.2,17.4,15.8,17.4])},'#d9a53a',{k:.6,lw:1.7});
    cel(c,function(c){poly(c,[20,3.6,26.6,9.4,20,15.6,13.4,9.4])},'#e0344c',{k:1.3,lw:1.9,sh:'rgba(80,0,40,.45)',hi:'rgba(255,220,220,.45)',inn:function(c){ln(c,[13.4,9.4,26.6,9.4],'rgba(90,0,30,.5)',.9);ln(c,[20,3.6,17.4,9.4,20,15.6],'rgba(255,255,255,.35)',.9)}});
    spark(c,29.6,6.4,3,'#fff6cf')},
  amuleto:function(c){
    rope(c,function(c){c.moveTo(6.6,3.6);c.quadraticCurveTo(11,15,20,19);c.quadraticCurveTo(29,15,33.4,3.6)},LE2,1.5);
    [[10.4,11.6,RED],[29.6,11.6,RED],[14.4,15.6,CRM],[25.6,15.6,CRM]].forEach(function(q){dot(c,q[0],q[1],2.1,OUT);dot(c,q[0],q[1],1.3,q[2])});
    cel(c,function(c){c.moveTo(20,17.6);c.quadraticCurveTo(28.4,21.4,27,29.6);c.quadraticCurveTo(25,36.4,20,36.8);c.quadraticCurveTo(15,36.4,13,29.6);c.quadraticCurveTo(11.6,21.4,20,17.6);c.closePath()},'#3fb46e',{k:1.9,lw:2.1,sh:'rgba(0,60,50,.45)',hi:'rgba(220,255,230,.4)',inn:function(c){
      dot(c,17.2,26,1.4,'#17603c');dot(c,22.8,26,1.4,'#17603c');
      c.beginPath();c.moveTo(16.4,30.4);c.quadraticCurveTo(20,33.4,23.6,30.4);c.strokeStyle='#17603c';c.lineWidth=1.3;c.lineCap='round';c.stroke();
      ln(c,[20,22,20,24],'#17603c',1.1)}});
    cel(c,function(c){el(c,20,18.8,3.8,2.4)},GOLD,{k:.6,lw:1.6})}
};

var MISC={
  ouro:function(c){
    function coin(x,y){cel(c,function(c){c.moveTo(x+9,y);c.ellipse(x,y,9,3.6,0,0,Math.PI);c.lineTo(x-9,y+3);c.ellipse(x,y+3,9,3.6,0,Math.PI,0,true);c.closePath()},'#c98f2a',{k:.9,lw:1.9,inn:function(c){for(var i=-3;i<4;i++)ln(c,[x+i*2.5,y+2.4,x+i*2.5,y+7],'rgba(110,60,0,.4)',.8)}});
      cel(c,function(c){el(c,x,y,9,3.6)},GOLD,{k:.9,lw:1.9,inn:function(c){c.beginPath();c.ellipse(x,y,6.2,2.1,0,0,TAU);c.strokeStyle='rgba(140,80,0,.5)';c.lineWidth=.9;c.stroke()}})}
    coin(15.4,29.6);coin(16.6,24.6);coin(14.8,19.6);
    cel(c,function(c){el(c,27.6,23,8.4,8.8)},GOLD,{k:1.7,lw:2.1,sh:'rgba(120,60,0,.45)',inn:function(c){c.beginPath();c.arc(27.6,23,6,0,TAU);c.strokeStyle='rgba(140,80,0,.55)';c.lineWidth=1.1;c.stroke()}});
    star(c,27.6,23,3.9,'#fff0b0');
    spark(c,9.4,9.4,3.4,'#fff6cf');spark(c,31.6,8.6,2.2,'#fff6cf')},
  material:function(c){
    cel(c,function(c){poly(c,[5.4,26.4,11.4,12,26.4,6.4,34.6,12.4,30.6,27,15.4,34])},'#b07a44',{k:2,lw:2.2,inn:function(c){
      c.beginPath();c.moveTo(5.4,26.4);c.lineTo(11.4,12);c.lineTo(15.4,13.4);c.lineTo(10,29.4);c.closePath();c.fillStyle='#5e3c22';c.fill();
      [[16,15.4,13,30],[20.6,12,18,31.4],[26,10,24.4,22],[30.6,12.6,28.4,26]].forEach(function(q){ln(c,q,'rgba(70,40,18,.5)',1.1)});
      c.beginPath();c.ellipse(22.6,14.6,2,2.8,.2,0,TAU);c.strokeStyle='rgba(70,40,18,.55)';c.lineWidth=1;c.stroke()}});
    cel(c,function(c){c.moveTo(24.6,17.6);c.quadraticCurveTo(31.6,24.4,29,30.4);c.quadraticCurveTo(24.6,35,20.6,30.4);c.quadraticCurveTo(18.4,24.4,24.6,17.6);c.closePath()},'#f5a732',{k:1.4,lw:1.9,sh:'rgba(150,50,0,.4)',hi:'rgba(255,250,200,.5)',inn:function(c){c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.ellipse(22.8,26.4,1.1,2.2,.3,0,TAU);c.fill()}});
    leaf(c,9.6,10.6,-1,.95);leaf(c,9.6,10.6,-2.3,.7,'#4fa64e')},
  po:function(c){
    cel(c,function(c){c.moveTo(4.6,31);c.quadraticCurveTo(7.4,25,12.6,23.4);c.quadraticCurveTo(16.6,15.4,21,14.8);c.quadraticCurveTo(25.4,15.6,28.4,22.6);c.quadraticCurveTo(33.4,25,35.4,31);c.quadraticCurveTo(20,36.4,4.6,31);c.closePath()},'#9c98a5',{k:2.1,lw:2.2,inn:function(c){
      [[12,28,1],[17,23,1.1],[24,26,1.2],[28.6,29.6,1],[20.6,30.6,1],[21.6,19.6,.9],[9,30.6,.8],[15.6,31.4,.8]].forEach(function(q,n){dot(c,q[0],q[1],q[2],n%2?'rgba(50,44,60,.45)':'rgba(255,255,255,.5)')});
      c.beginPath();c.moveTo(13,23.6);c.quadraticCurveTo(18,26,22,21.6);c.strokeStyle='rgba(50,44,60,.35)';c.lineWidth=1;c.stroke()}});
    spark(c,21.6,8.6,4.4,'#fff','#ff8fc0');spark(c,9.6,16.6,2.8,'#ffe0f0','#ff8fc0');spark(c,31.6,15.4,3.2,'#ffe0f0','#ff8fc0');
    dot(c,15.4,10.6,.9,'#ffe0f0');dot(c,28,8.4,.8,'#ffe0f0');dot(c,26.6,19.6,1,'#fff')},
  lagrima:function(c){
    c.save();c.globalCompositeOperation='lighter';halo(c,20,23,20,'110,220,255',.5);c.restore();
    cel(c,function(c){c.moveTo(20,4);c.bezierCurveTo(21,12,31.4,18.6,31.4,26);c.bezierCurveTo(31.4,32.6,26.4,36.6,20,36.6);c.bezierCurveTo(13.6,36.6,8.6,32.6,8.6,26);c.bezierCurveTo(8.6,18.6,19,12,20,4);c.closePath()},'#74dff2',{k:2.2,lw:2.1,out:'#17304f',sh:'rgba(20,60,150,.42)',hi:'rgba(255,255,255,.55)',inn:function(c){
      var g=c.createRadialGradient(18,27,1,18,27,11);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(6,14,28,24);
      c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.ellipse(14.6,23.6,1.6,3.6,.45,0,TAU);c.fill();dot(c,16.4,18.4,1,'rgba(255,255,255,.9)')}});
    spark(c,31.6,9.6,3.2,'#eaffff','#6fe0ff');spark(c,7.6,13.4,2.2,'#eaffff','#6fe0ff')},
  pocao:function(c){
    cel(c,function(c){c.moveTo(16,12.6);c.lineTo(16,17.4);c.quadraticCurveTo(7.6,21,7.6,28);c.quadraticCurveTo(7.6,36.6,20,36.6);c.quadraticCurveTo(32.4,36.6,32.4,28);c.quadraticCurveTo(32.4,21,24,17.4);c.lineTo(24,12.6);c.closePath()},'#d5e6df',{k:1.9,lw:2.2,sh:'rgba(60,10,30,.35)',hi:'rgba(255,255,255,.4)',inn:function(c){
      c.fillStyle='#d8323f';c.fillRect(4,23.4,32,16);c.fillStyle='#f0787a';c.beginPath();c.ellipse(20,23.4,12,2,0,0,TAU);c.fill();
      dot(c,24.6,29,1.3,'rgba(255,200,200,.7)');dot(c,21,32.4,.9,'rgba(255,200,200,.7)');dot(c,26.6,25.6,.8,'rgba(255,200,200,.7)');
      c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.ellipse(12.6,27.6,1.5,4.2,.35,0,TAU);c.fill();c.fillRect(17.2,13.6,1.4,3.4)}});
    cel(c,function(c){poly(c,[14.2,10.2,25.8,10.2,25.8,13.6,14.2,13.6])},'#b6c9c2',{k:.7,lw:1.8});
    cel(c,function(c){poly(c,[16.2,4,23.8,4,23.2,10.2,16.8,10.2])},'#b9945e',{k:.9,lw:1.8,inn:function(c){ln(c,[17,6.4,23,6.4],'rgba(70,40,18,.5)',.9)}})},
  xp:function(c){
    c.save();c.globalCompositeOperation='lighter';halo(c,20,21,20,'255,220,120',.4);c.restore();
    cel(c,function(c){for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,q=i%2?7.4:16;c[i?'lineTo':'moveTo'](20+Math.cos(a)*q,21.4+Math.sin(a)*q)}c.closePath()},GOLD,{k:2.2,lw:2.2,sh:'rgba(150,70,0,.42)',hi:'rgba(255,255,220,.5)',inn:function(c){
      c.beginPath();for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,q=i%2?3.4:7.6;c[i?'lineTo':'moveTo'](20+Math.cos(a)*q,21.4+Math.sin(a)*q)}c.closePath();c.fillStyle='#fff3c4';c.fill()}});
    spark(c,32.6,8.6,3,'#fff6cf');spark(c,7.4,30.6,2.2,'#fff6cf')},
  dardo:function(c){
    [[4.6,22.6,10.6,16.6],[8.6,31.6,13,27.2],[4.4,29.4,7.4,26.4]].forEach(function(q){ln(c,q,'rgba(190,240,120,.85)',1.7)});
    cel(c,function(c){c.moveTo(35,4.6);c.quadraticCurveTo(22,11.6,10.4,24.4);c.quadraticCurveTo(7.6,28.6,10.6,31.4);c.quadraticCurveTo(14.4,33.4,17.6,29.6);c.quadraticCurveTo(29.4,17.6,35,4.6);c.closePath()},'#7dbb46',{k:1.8,lw:2.2,sh:LEAF.sh,hi:'rgba(240,255,190,.4)',inn:function(c){
      c.beginPath();c.moveTo(35,4.6);c.lineTo(25.4,11.4);c.lineTo(30,16.6);c.closePath();c.fillStyle='#8a3d22';c.fill();
      ln(c,[12.6,28,27,14],'rgba(30,80,30,.55)',1.1);
      c.beginPath();c.ellipse(12.4,28.6,2.2,1.5,-.8,0,TAU);c.fillStyle='#d9efa4';c.fill()}});
    [[16.4,19.6,-2.5],[22.6,21.4,.9]].forEach(function(q){c.save();c.translate(q[0],q[1]);c.rotate(q[2]);cel(c,function(c){poly(c,[-1.6,0,0,-4.6,1.6,0])},'#7dbb46',{k:.5,lw:1.5,sh:LEAF.sh});c.restore()})},
  sementes:function(c){
    [[13.4,26.6,.55,10],[23.4,15.6,.4,8],[29.6,28.6,.7,9]].forEach(function(q){
      var dx=-Math.sin(q[2]),dy=-Math.cos(q[2]);
      ln(c,[q[0]+dx*6,q[1]+dy*6,q[0]+dx*(6+q[3]),q[1]+dy*(6+q[3])],'rgba(170,235,100,.9)',1.8);ln(c,[q[0]+dx*5-2.6,q[1]+dy*5+1,q[0]+dx*(3+q[3])-2.6,q[1]+dy*(3+q[3])+1],'rgba(170,235,100,.55)',1.2);
      c.save();c.translate(q[0],q[1]);c.rotate(-q[2]);
      cel(c,function(c){c.moveTo(0,-6);c.bezierCurveTo(5.4,-3,4.6,5.6,0,6.4);c.bezierCurveTo(-4.6,5.6,-5.4,-3,0,-6);c.closePath()},'#b07a44',{k:1.2,lw:1.9,inn:function(c){ln(c,[0,-4.4,0,5],'rgba(70,40,18,.55)',1);c.fillStyle='rgba(255,240,200,.45)';c.beginPath();c.ellipse(-1.8,-1,1,2.4,0,0,TAU);c.fill()}});
      c.restore()});
    leaf(c,23.4,9,-2.2,.6)},
  cipo:function(c){
    function lp1(c){c.moveTo(12.4,22.6);c.bezierCurveTo(6,10,22,2.6,31,9);c.bezierCurveTo(38.6,15.4,27,27.6,12.4,22.6)}
    function tail(c){c.moveTo(12.4,22.6);c.bezierCurveTo(5,27,9.6,35.4,18,33);c.bezierCurveTo(24,31.2,30.6,35.6,32.6,31.4);c.bezierCurveTo(33.6,28.4,29.6,27.4,29.2,30)}
    [lp1,tail].forEach(function(f){rope(c,f,'#62a84c',3.2);c.beginPath();f(c);c.lineCap='butt';c.setLineDash([.9,3.4]);c.strokeStyle='rgba(40,96,40,.6)';c.lineWidth=3.2;c.stroke();c.setLineDash([]);
      c.save();c.translate(-.7,-.8);c.beginPath();f(c);c.strokeStyle='rgba(235,255,180,.4)';c.lineWidth=.9;c.stroke();c.restore()});
    cel(c,function(c){el(c,12.4,22.6,3.7,3.2,.5)},'#4f9440',{k:.9,lw:1.9,sh:LEAF.sh,inn:function(c){ln(c,[10.6,21,14,24.4],'#2f6a2c',1)}});
    leaf(c,30.6,8.6,-.9,.9);leaf(c,20.6,32.4,.9,.8);leaf(c,8.6,13,-2.6,.8,'#4fa64e');leaf(c,22,5.6,-1.9,.7,'#4fa64e')},
  casca:function(c){
    cel(c,function(c){c.moveTo(7.6,8.4);c.quadraticCurveTo(13,5.6,16.4,7.4);c.lineTo(20,4.6);c.lineTo(23.6,7.4);c.quadraticCurveTo(27,5.6,32.4,8.4);c.lineTo(32.6,21);c.quadraticCurveTo(31.4,31.4,20,36.6);c.quadraticCurveTo(8.6,31.4,7.4,21);c.closePath()},'#946238',{k:2.4,lw:2.3,inn:function(c){
      [[11.6,7,12.6,18,10.6,27],[16.4,7.6,15,20,17,33],[23,7.6,24.6,19,22.6,34],[28.4,7,27.4,17,29.4,27]].forEach(function(q){c.beginPath();c.moveTo(q[0],q[1]);c.quadraticCurveTo(q[2],q[3],q[4],q[5]);c.strokeStyle='rgba(50,26,12,.55)';c.lineWidth=1.3;c.stroke()});
      [[13.6,12,14,20],[20,14,19.6,26],[26,11,25.6,22]].forEach(function(q){ln(c,q,'rgba(255,214,160,.3)',1.4)});
      c.beginPath();c.ellipse(20,19.6,2.6,3.6,0,0,TAU);c.fillStyle='rgba(50,26,12,.55)';c.fill();c.beginPath();c.ellipse(20,19.6,4.4,5.6,0,0,TAU);c.strokeStyle='rgba(50,26,12,.5)';c.lineWidth=1;c.stroke();
      c.fillStyle='#6a9a4a';c.beginPath();c.ellipse(10.4,10,5,3.6,.3,0,TAU);c.fill();c.beginPath();c.ellipse(28,29.6,4.4,3.2,-.5,0,TAU);c.fill();c.fillStyle='rgba(220,255,170,.35)';c.beginPath();c.ellipse(9.4,9,2.6,1.4,.3,0,TAU);c.fill()}});
    leaf(c,29.6,8.4,-.7,.8)},
  gema_natureza:function(c){gemIcon(c,'natureza')},
  gema_agua:function(c){gemIcon(c,'agua')},
  gema_tempestade:function(c){gemIcon(c,'tempestade')},
  gema_fogo:function(c){gemIcon(c,'fogo')},
  gema_terra:function(c){gemIcon(c,'terra')},
  gema_sombra:function(c){gemIcon(c,'sombra')},
  gema_encanto:function(c){gemIcon(c,'encanto')},
  broto:function(c){
    c.save();c.globalCompositeOperation='lighter';halo(c,20,17,19,'150,255,130',.5);c.restore();
    cel(c,function(c){c.moveTo(7.6,33);c.quadraticCurveTo(12,27,20,27);c.quadraticCurveTo(28,27,32.4,33);c.quadraticCurveTo(20,37.4,7.6,33);c.closePath()},'#6a4423',{k:1.3,lw:2.1,inn:function(c){dot(c,14,31.6,1,'rgba(30,14,6,.5)');dot(c,25,32,1.1,'rgba(30,14,6,.5)');dot(c,19.6,33.6,.8,'rgba(255,220,170,.4)')}});
    rope(c,function(c){c.moveTo(20,28.6);c.quadraticCurveTo(18.6,22,20.4,15.6)},'#4f9a45',2);
    cel(c,function(c){c.moveTo(20.4,17);c.quadraticCurveTo(9.6,18,6.4,8.4);c.quadraticCurveTo(17.4,5.6,20.4,17);c.closePath()},GR,{k:1.5,lw:2,sh:LEAF.sh,hi:'rgba(240,255,190,.45)',inn:function(c){ln(c,[19.4,15.6,9,9.6],GR2,1)}});
    cel(c,function(c){c.moveTo(20.4,16);c.quadraticCurveTo(22,3.6,33.6,4.4);c.quadraticCurveTo(33.4,15.6,20.4,16);c.closePath()},'#74d466',{k:1.6,lw:2,sh:LEAF.sh,hi:'rgba(240,255,190,.45)',inn:function(c){ln(c,[21.4,14.6,31,6.4],GR2,1)}});
    [[31.6,22.6,3],[8.4,23.4,2.3]].forEach(function(q){c.save();c.shadowColor='#7dff6a';c.shadowBlur=4;ln(c,[q[0]-q[2],q[1],q[0]+q[2],q[1]],'#eaffd6',1.9);ln(c,[q[0],q[1]-q[2],q[0],q[1]+q[2]],'#eaffd6',1.9);c.restore()});
    spark(c,26.6,19.4,1.8,'#eaffd6','#7dff6a')}
};

function unknown(c){c.font='bold 26px sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.strokeStyle=OUT;c.lineWidth=4;c.strokeText('?',20,21.5);c.fillStyle=CRM;c.fillText('?',20,21.5)}
function icon(c,tbl,key,size){size=size||40;var f=Object.prototype.hasOwnProperty.call(tbl,key)?tbl[key]:unknown;c.save();c.scale(size/40,size/40);c.lineCap='round';c.lineJoin='round';f(c);c.restore()}

/** Ícone de equipamento: 'facao' | 'arco' | 'borduna' | 'peixeiras' | 'zagaia' | 'cajado' | 'escudo' | 'aljava' | 'chapeu' | 'gibao' | 'couraca' | 'manto' | 'luvas' | 'alpercatas' | 'anel' | 'amuleto'. */
export function drawItemIcon(c, type, size) { icon(c, ITEM, type, size); }
/** Ícone de recurso ou feitiço: 'ouro' | 'material' | 'po' | 'lagrima' | 'pocao' | 'xp' | 'dardo' | 'sementes' | 'cipo' | 'casca' | 'broto' | 'gema_natureza' | 'gema_agua' | 'gema_tempestade' | 'gema_fogo' | 'gema_terra' | 'gema_sombra' | 'gema_encanto'. */
export function drawMiscIcon(c, key, size) { icon(c, MISC, key, size); }
