'use strict';
// ══════════════════════════════════════════════════
//  RENDERER
// ══════════════════════════════════════════════════
const cv=document.getElementById('canvas');
const ren=new THREE.WebGLRenderer({canvas:cv,antialias:true});
ren.setPixelRatio(Math.min(devicePixelRatio,2));
ren.setSize(innerWidth,innerHeight);
ren.shadowMap.enabled=true; ren.shadowMap.type=THREE.PCFSoftShadowMap;
ren.toneMapping=THREE.ACESFilmicToneMapping; ren.toneMappingExposure=1.3;
ren.physicallyCorrectLights=true;

const scene=new THREE.Scene();
// Himmels-Farbverlauf via Canvas
const skyCanvas=document.createElement('canvas'); skyCanvas.width=2; skyCanvas.height=512;
const skyCtx=skyCanvas.getContext('2d');
const skyGrad=skyCtx.createLinearGradient(0,0,0,512);
skyGrad.addColorStop(0,'#1a6ab8'); skyGrad.addColorStop(0.5,'#5ba8e8');
skyGrad.addColorStop(1,'#c8e8fa');
skyCtx.fillStyle=skyGrad; skyCtx.fillRect(0,0,2,512);
const skyTex=new THREE.CanvasTexture(skyCanvas);
scene.background=skyTex;
scene.fog=new THREE.Fog(0x9ecfee,80,240);

const cam=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.1,300);
cam.position.set(0,25,35); cam.lookAt(0,0,0);
window.addEventListener('resize',()=>{
  ren.setSize(innerWidth,innerHeight);
  cam.aspect=innerWidth/innerHeight; cam.updateProjectionMatrix();
});

// ── Lights ──
const ambLight=new THREE.HemisphereLight(0xb0d8ff,0x3a6614,1.8); scene.add(ambLight);
const sun=new THREE.DirectionalLight(0xfff5d0,6.0);
sun.position.set(-40,60,25); sun.castShadow=true;
sun.shadow.mapSize.set(4096,4096);
sun.shadow.bias=-0.0005;
['left','right','top','bottom'].forEach((s,i)=>{sun.shadow.camera[s]=[-90,90,90,-90][i];});
sun.shadow.camera.far=180; scene.add(sun);
const fill=new THREE.DirectionalLight(0x7799cc,0.9);
fill.position.set(25,15,-35); scene.add(fill);
const backLight=new THREE.DirectionalLight(0xffe8cc,0.6);
backLight.position.set(15,25,45); scene.add(backLight);

// ══════════════════════════════════════════════════
//  MATERIALS
// ══════════════════════════════════════════════════
const lm=(c,e=0)=>new THREE.MeshLambertMaterial({color:c,emissive:e});
const sm=(c,r=0.85,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});

// ── Prozedurale Canvas-Texturen ──
function makeTex(size,fn){
  const c=document.createElement('canvas'); c.width=c.height=size;
  fn(c.getContext('2d'),size);
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
const T_grass=makeTex(512,(ctx,s)=>{
  ctx.fillStyle='#4a8820'; ctx.fillRect(0,0,s,s);
  for(let i=0;i<4000;i++){
    const x=Math.random()*s,y=Math.random()*s,v=(Math.random()-.5)*55;
    ctx.fillStyle=`rgb(${42+v|0},${122+v|0},${18+v|0})`;
    ctx.fillRect(x,y,Math.random()*5+1,Math.random()*5+1);
  }
  for(let i=0;i<600;i++){
    const x=Math.random()*s,y=Math.random()*s;
    ctx.strokeStyle=`rgba(${25+Math.random()*30|0},${90+Math.random()*50|0},10,0.5)`;
    ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,y);
    ctx.lineTo(x+(Math.random()-.5)*4,y-Math.random()*9); ctx.stroke();
  }
});
T_grass.repeat.set(14,14);

const T_dirt=makeTex(256,(ctx,s)=>{
  ctx.fillStyle='#7a5a36'; ctx.fillRect(0,0,s,s);
  for(let i=0;i<2000;i++){
    const x=Math.random()*s,y=Math.random()*s,v=(Math.random()-.5)*40;
    ctx.fillStyle=`rgb(${105+v|0},${82+v|0},${44+v|0})`;
    ctx.beginPath(); ctx.arc(x,y,Math.random()*3+.5,0,Math.PI*2); ctx.fill();
  }
});
T_dirt.repeat.set(6,6);

const T_stone=makeTex(256,(ctx,s)=>{
  ctx.fillStyle='#888070'; ctx.fillRect(0,0,s,s);
  for(let i=0;i<2500;i++){
    const x=Math.random()*s,y=Math.random()*s,v=(Math.random()-.5)*50;
    ctx.fillStyle=`rgb(${118+v|0},${108+v|0},${88+v|0})`;
    ctx.fillRect(x,y,Math.random()*4+1,Math.random()*4+1);
  }
  for(let i=0;i<10;i++){
    ctx.strokeStyle='rgba(55,50,40,0.35)'; ctx.lineWidth=Math.random()*1.5+.4;
    ctx.beginPath(); let cx=Math.random()*s,cy=Math.random()*s; ctx.moveTo(cx,cy);
    for(let j=0;j<5;j++){cx+=(Math.random()-.5)*38;cy+=(Math.random()-.5)*38;ctx.lineTo(cx,cy);}
    ctx.stroke();
  }
});
T_stone.repeat.set(3,3);

const T_bark=makeTex(128,(ctx,s)=>{
  ctx.fillStyle='#5a3820'; ctx.fillRect(0,0,s,s);
  for(let x=0;x<s;x+=2){
    const v=(Math.random()-.5)*30;
    ctx.fillStyle=`rgba(${78+v|0},${48+v|0},${20+v|0},0.7)`;
    ctx.fillRect(x,0,Math.random()*2+1,s);
  }
  for(let i=0;i<4;i++){
    ctx.strokeStyle='rgba(35,20,8,0.45)'; ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.ellipse(Math.random()*s,Math.random()*s,9,5,Math.random()*Math.PI,0,Math.PI*2);
    ctx.stroke();
  }
});
T_bark.repeat.set(1,4);

const T_leaves=makeTex(256,(ctx,s)=>{
  ctx.fillStyle='#387020'; ctx.fillRect(0,0,s,s);
  for(let i=0;i<800;i++){
    const x=Math.random()*s,y=Math.random()*s,v=(Math.random()-.5)*45;
    ctx.fillStyle=`rgb(${35+v|0},${105+v|0},${14+v|0})`;
    ctx.beginPath();
    ctx.ellipse(x,y,Math.random()*6+2,Math.random()*4+1,Math.random()*Math.PI,0,Math.PI*2);
    ctx.fill();
  }
});
T_leaves.repeat.set(3,3);

const T_water=makeTex(256,(ctx,s)=>{
  ctx.fillStyle='#1a5a8a'; ctx.fillRect(0,0,s,s);
  // deep water variation
  for(let i=0;i<800;i++){
    const x=Math.random()*s,y=Math.random()*s,v=(Math.random()-.5)*22;
    ctx.fillStyle=`rgba(${20+v|0},${90+v|0},${140+v|0},0.4)`;
    ctx.fillRect(x,y,Math.random()*8+2,Math.random()*3+1);
  }
  // wave ripple lines
  for(let i=0;i<28;i++){
    const a=Math.random()*0.22+0.06;
    ctx.strokeStyle=`rgba(120,210,255,${a})`;
    ctx.lineWidth=Math.random()*2+0.4;
    ctx.beginPath();
    const y0=Math.random()*s;
    ctx.moveTo(0,y0);
    ctx.bezierCurveTo(s*0.3,y0+(Math.random()-.5)*18,s*0.65,y0+(Math.random()-.5)*18,s,y0+(Math.random()-.5)*8);
    ctx.stroke();
  }
  // small sparkle highlights
  for(let i=0;i<80;i++){
    ctx.fillStyle=`rgba(200,240,255,${Math.random()*0.35+0.1})`;
    ctx.beginPath();
    ctx.arc(Math.random()*s,Math.random()*s,Math.random()*2+0.5,0,Math.PI*2);
    ctx.fill();
  }
});
T_water.repeat.set(5,5);

const MAT={
  grass:new THREE.MeshStandardMaterial({map:T_grass,roughness:0.90,metalness:0}),
  grass2:new THREE.MeshStandardMaterial({map:T_grass,roughness:0.88,metalness:0,color:0xccffaa}),
  dirt:new THREE.MeshStandardMaterial({map:T_dirt,roughness:0.97,metalness:0}),
  snow:sm(0xeef8ff,0.62,0.0), sand:sm(0xcaba74,0.93), moss:sm(0x50882e,0.88), gravel:sm(0x848472,0.95,0.05),
  stone:new THREE.MeshStandardMaterial({map:T_stone,roughness:0.88,metalness:0.06}),
  dstone:new THREE.MeshStandardMaterial({map:T_stone,roughness:0.92,metalness:0.06,color:0x888888}),
  wood:sm(0x8c6640,0.93),
  bark:new THREE.MeshStandardMaterial({map:T_bark,roughness:0.96,metalness:0}),
  leaves:new THREE.MeshStandardMaterial({map:T_leaves,roughness:0.84,metalness:0,side:THREE.DoubleSide}),
  leaves2:new THREE.MeshStandardMaterial({map:T_leaves,roughness:0.84,metalness:0,color:0xbbffbb,side:THREE.DoubleSide}),
  ore:sm(0x7a7a8c,0.65,0.45), gold_ore:sm(0xd4a820,0.45,0.75),
  roof:lm(0x1a1a30), flag_r:lm(0xcc2222), flag_b:lm(0x2244cc),
  water:new THREE.MeshStandardMaterial({map:T_water,color:0x1a8aaa,roughness:0.08,metalness:0.28,transparent:true,opacity:0.78}),
  // units
  knight:lm(0x5566aa), knight_helm:lm(0x778899), knight_armor:lm(0x8899cc),
  archer:lm(0x4a3a25), archer_hat:lm(0x3a2a15),
  spear:lm(0x3a5a3a), spear_helm:lm(0x4a6a4a),
  cavalry:lm(0x6633aa), horse:lm(0x7a5530),
  mage:lm(0x1a1a5a), mage_robe:lm(0x2a2a8a), magic_glow:lm(0x4040ff,0x2020aa),
  enemy:lm(0x8b1a1a), enemy2:lm(0x6a1414), enemy_helm:lm(0x444444),
  merchant:lm(0x7a4a20), merchant_hat:lm(0x2a1a50),
  cow:lm(0xe8dcc8), sheep:lm(0xe0e0e0),
  catapult:lm(0x5c3d1e), cannon:lm(0x333333),
  arrow:lm(0xc09050), fireball:lm(0xff6600,0x993300), cannonball:lm(0x222222),
  proj:lm(0xff8800,0x552200),
  dragon_body:lm(0x2a6a2a,0x051005), dragon_wing:lm(0x1a4a1a),
  dragon_fire:new THREE.MeshBasicMaterial({color:0xff5500,transparent:true,opacity:0.85}),
  dragon_eye:new THREE.MeshBasicMaterial({color:0xff2200}),
  dragon_belly:lm(0x4a8a3a,0x0a150a),
  dragon_red:lm(0x8b1a00,0x1a0000),
  smithy_stone:sm(0x6a5848,0.93), smithy_anvil:sm(0x282828,0.7,0.6), smithy_fire:lm(0xff6600,0x331100),
  sword_wood:lm(0x7a5020), sword_stone:lm(0x888880), sword_iron:lm(0x9090aa,0x080810),
  sword_diamond:lm(0x50d0ff,0x0a1a20), sword_nether:lm(0xcc2244,0x220010),
  snake_body:lm(0x2d7a14,0x030803), snake_scale:lm(0x1a5208,0),
  snake_tongue:lm(0xcc1111,0), snake_eye:new THREE.MeshBasicMaterial({color:0xff2200}),
};

// ══════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════
const B=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
const CY=(rt,rb,h,s,m)=>new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s),m);
const CN=(r,h,s,m)=>new THREE.Mesh(new THREE.ConeGeometry(r,h,s),m);
const SP=(r,s,m)=>new THREE.Mesh(new THREE.SphereGeometry(r,s,s),m);
function place(mesh,x,y,z,cast=true){
  mesh.position.set(x,y,z); mesh.castShadow=cast; mesh.receiveShadow=true;
  scene.add(mesh); return mesh;
}
function addTo(group,mesh,x,y,z){mesh.position.set(x,y,z);mesh.castShadow=true;group.add(mesh);return mesh;}
function rnd(a,b){return a+Math.random()*(b-a);}
function d2(a,b){const dx=a.x-b.x,dz=(a.z||0)-(b.z||0);return Math.sqrt(dx*dx+dz*dz);}
function lerp(a,b,t){return a+(b-a)*t;}
function spawnChips(x,z,color,count){
  for(let i=0;i<count;i++){
    const chip=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.12),
      new THREE.MeshLambertMaterial({color}));
    chip.position.set(x+rnd(-0.4,0.4),rnd(0.5,1.8),z+rnd(-0.4,0.4));
    scene.add(chip);
    const vx=rnd(-3,3),vy=rnd(4,8),vz=rnd(-3,3);
    let life=0;
    const id=setInterval(()=>{
      life+=0.06;
      chip.position.x+=vx*0.06; chip.position.z+=vz*0.06;
      chip.position.y+=vy*0.06-9.8*life*0.06;
      chip.rotation.x+=0.15; chip.rotation.z+=0.1;
      if(life>1.2||chip.position.y<-0.5){scene.remove(chip);clearInterval(id);}
    },50);
  }
}

// ══════════════════════════════════════════════════
//  WORLD
// ══════════════════════════════════════════════════
// Ground
const gg=new THREE.PlaneGeometry(140,140,70,70);
const gp=gg.attributes.position;
for(let i=0;i<gp.count;i++){
  const x=gp.getX(i),z=gp.getZ(i),d=Math.sqrt(x*x+z*z);
  if(d>10){
    const blend=Math.min(1,(d-10)/28);
    const hills=Math.sin(x*0.09)*2.4+Math.cos(z*0.08)*2.0
               +Math.sin(x*0.21+z*0.15)*0.8+Math.cos(x*0.14-z*0.19)*0.6;
    const noise=(Math.random()-0.5)*0.35;
    const rise=Math.max(0,(d-42)*0.11);
    gp.setY(i,(hills+noise+rise)*blend);
  }
}
gg.computeVertexNormals();
// Vertex colours based on height
const vtxCol=[];
for(let i=0;i<gp.count;i++){
  const y=gp.getY(i);
  let r,g,b;
  if(y<-0.3){r=0.68;g=0.60;b=0.42;}       // sand/shore
  else if(y<1.2){r=0.30;g=0.55;b=0.12;}   // bright grass
  else if(y<2.8){r=0.22;g=0.42;b=0.09;}   // mid grass
  else if(y<4.5){r=0.24;g=0.38;b=0.08;}   // dark grass/scrub
  else if(y<6.5){r=0.58;g=0.52;b=0.42;}   // rocky
  else if(y<8.5){r=0.44;g=0.40;b=0.36;}   // dark rock
  else{r=0.92;g=0.94;b=0.98;}             // snow
  vtxCol.push(r,g,b);
}
gg.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(vtxCol),3));
const terrainMat=new THREE.MeshStandardMaterial({map:T_grass,vertexColors:true,roughness:0.90,metalness:0});
place(new THREE.Mesh(gg,terrainMat),0,0,0,false).rotation.x=-Math.PI/2;

// Dirt base around center
place(new THREE.Mesh(new THREE.CircleGeometry(10,32),MAT.dirt),0,0.01,0,false).rotation.x=-Math.PI/2;

// Path
const pm=new THREE.Mesh(new THREE.PlaneGeometry(3.5,70),MAT.dirt);
pm.rotation.x=-Math.PI/2; pm.position.set(0,0.02,15); scene.add(pm);

// Lake
const waterMesh=place(new THREE.Mesh(new THREE.PlaneGeometry(26,20,8,8),MAT.water),-36,0.08,18,false);
waterMesh.rotation.x=-Math.PI/2;
// Small rocks around lake shore
for(let i=0;i<8;i++){
  const ang=i/8*Math.PI*2, lr=13+rnd(-1,1), lrz=9+rnd(-1,1);
  const rock=new THREE.Mesh(new THREE.SphereGeometry(rnd(0.3,0.7),5,4),MAT.stone);
  rock.position.set(-36+Math.cos(ang)*lr,0.1,18+Math.sin(ang)*lrz);
  rock.scale.y=0.5; scene.add(rock);
}

// Terrain variety patches
[
  [-28,-18,24,18,MAT.sand],
  [32, 34,20,15,MAT.moss],
  [-42, 28,18,22,MAT.gravel],
  [26,-42,22,17,MAT.sand],
  [-16, 42,16,13,MAT.moss],
  [44, -18,14,20,MAT.gravel],
].forEach(([px,pz,pw,ph,pm])=>{
  const tp=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),pm);
  tp.rotation.x=-Math.PI/2; tp.position.set(px,0.03,pz); scene.add(tp);
});

// Clouds
const clouds=[];
const cloudMat=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.88});
function makeCloud(x,y,z){
  const g=new THREE.Group();
  const n=4+Math.floor(Math.random()*4);
  for(let i=0;i<n;i++){
    const r=rnd(4,9);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(r,7,5),cloudMat);
    ball.position.set(rnd(-10,10),rnd(-1.5,1.5),rnd(-6,6));
    ball.scale.y=0.52;
    g.add(ball);
  }
  g.position.set(x,y,z); scene.add(g);
  clouds.push({g,spd:rnd(0.8,2.2)});
}
for(let i=0;i<10;i++) makeCloud(rnd(-120,120),rnd(30,55),rnd(-120,120));


// Stars
const sv=[];
for(let i=0;i<900;i++) sv.push(rnd(-160,160),30+rnd(0,100),rnd(-160,160));
const sg=new THREE.BufferGeometry();
sg.setAttribute('position',new THREE.Float32BufferAttribute(sv,3));
scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:0.22})));


// Fireflies – active at night
const fireflies=[];
for(let i=0;i<18;i++){
  const fl={l:new THREE.PointLight(0x99ff55,0,6),phase:rnd(0,Math.PI*2),dx:rnd(-0.018,0.018),dz:rnd(-0.018,0.018)};
  fl.l.position.set(rnd(-50,50),1.4,rnd(-50,50));
  scene.add(fl.l); fireflies.push(fl);
}

// ══════════════════════════════════════════════════
//  BUILD GRID
// ══════════════════════════════════════════════════
const CELL=2.5;
const cells={};
function gk(x,z){return`${x},${z}`;}
function w2g(wx,wz){return{gx:Math.round(wx/CELL),gz:Math.round(wz/CELL)};}
function g2w(gx,gz){return{wx:gx*CELL,wz:gz*CELL};}
// Mark center
for(let x=-1;x<=1;x++) for(let z=-1;z<=1;z++) cells[gk(x,z)]={type:'center'};

// Ghost grid
for(let x=-60;x<=60;x++) for(let z=-60;z<=60;z++){
  if((x+z)%2) continue;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(CELL-0.1,CELL-0.1),
    new THREE.MeshBasicMaterial({color:0x224411,transparent:true,opacity:0.07}));
  m.rotation.x=-Math.PI/2; m.position.set(x*CELL,0.01,z*CELL); scene.add(m);
}

// ══════════════════════════════════════════════════
//  NATURE
// ══════════════════════════════════════════════════
const trees=[],ores=[],obstacles=[],snakes=[],rocks=[];
function makeTree(x,z){
  const h=rnd(4,7);
  const g=new THREE.Group();
  // Stamm mit leichter Neigung
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.28,h,10),MAT.bark);
  tr.position.y=h/2; tr.rotation.z=rnd(-0.05,0.05); g.add(tr);
  // Organische Krone aus mehreren überlappenden Kugeln
  const cr=rnd(1.8,2.8);
  const n=5+Math.floor(Math.random()*4);
  for(let i=0;i<n;i++){
    const r=cr*rnd(0.55,0.88);
    const lmat=Math.random()>0.45?MAT.leaves:MAT.leaves2;
    const ball=new THREE.Mesh(new THREE.SphereGeometry(r,9,7),lmat);
    ball.position.set(rnd(-cr*.5,cr*.5),h+cr*.4+rnd(-.3,.9),rnd(-cr*.5,cr*.5));
    ball.castShadow=true; g.add(ball);
  }
  g.position.set(x,0,z); g.castShadow=true; scene.add(g);
  trees.push({g,x,z,hp:3,wobble:rnd(0,Math.PI*2)});
}
function makeOre(x,z,type){
  const s=rnd(0.6,1.0);
  const mat=type==='metal'?MAT.ore:type==='gold_ore'?MAT.gold_ore:MAT.stone;
  const g=new THREE.Group();
  const m1=SP(s,5,mat); m1.position.y=s*0.5; g.add(m1);
  const m2=SP(s*0.68,5,mat); m2.position.set(rnd(-0.4,0.4),s*0.28,rnd(-0.4,0.4)); g.add(m2);
  g.position.set(x,0,z); scene.add(g);
  ores.push({g,x,z,type,hp:2});
}

function makeSnake(x,z){
  const g=new THREE.Group();
  const segs=7;
  for(let i=0;i<segs;i++){
    const t=i/(segs-1);
    const ox=Math.sin(t*Math.PI*1.6)*0.45;
    const mat=i%2===0?MAT.snake_body:MAT.snake_scale;
    const seg=B(0.22-t*0.03,0.1,0.26,mat);
    seg.position.set(ox,0.06,i*-0.3); g.add(seg);
  }
  // Head
  const hd=B(0.28,0.13,0.3,MAT.snake_body); hd.position.set(0,0.07,0.25); g.add(hd);
  // Eyes
  [-0.1,0.1].forEach(ex=>{
    const eye=SP(0.045,4,MAT.snake_eye.clone()); eye.position.set(ex,0.14,0.37); g.add(eye);
  });
  // Tongue
  const tongue=B(0.03,0.02,0.14,MAT.snake_tongue); tongue.position.set(0,0.07,0.52); g.add(tongue);
  g.position.set(x,0,z); scene.add(g);
  snakes.push({g,x,z,dir:rnd(0,Math.PI*2),timer:rnd(1,3),wobble:0,cooldown:0,hp:1});
}

function makeRockCluster(x,z,size){
  size=size||1;
  const g=new THREE.Group();
  const n=3+Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){
    const s=size*rnd(0.5,1.1);
    const rx=rnd(-size*0.7,size*0.7), rz2=rnd(-size*0.7,size*0.7);
    // Organische Form durch Vertex-Verzerrung
    const geo=new THREE.SphereGeometry(s,7,6);
    const pos=geo.attributes.position;
    for(let v=0;v<pos.count;v++){
      pos.setX(v,pos.getX(v)*(1+(Math.random()-.5)*.45));
      pos.setY(v,pos.getY(v)*(1+(Math.random()-.5)*.45));
      pos.setZ(v,pos.getZ(v)*(1+(Math.random()-.5)*.45));
    }
    geo.computeVertexNormals();
    const rock=new THREE.Mesh(geo,Math.random()>0.45?MAT.stone:MAT.dstone);
    rock.position.set(rx,s*0.55,rz2);
    rock.scale.set(rnd(0.8,1.3),rnd(0.5,0.85),rnd(0.8,1.3));
    rock.castShadow=true; g.add(rock);
  }
  g.position.set(x,0,z); scene.add(g);
  obstacles.push({x,z,r:size*1.45});
  rocks.push({g,x,z,hp:3+Math.floor(size),maxHp:3+Math.floor(size),size});
}

function makeMountain(x,z,h,r){
  h=h||9; r=r||5;
  const g=new THREE.Group();
  addTo(g,CN(r,     h*0.6, 8,MAT.stone), 0,h*0.30,0);
  addTo(g,CN(r*0.58,h*0.55,7,MAT.dstone),0,h*0.77,0);
  addTo(g,CN(r*0.24,h*0.32,6,MAT.snow),  0,h*1.08,0);
  for(let i=0;i<5;i++){
    const ang=i/5*Math.PI*2, br=rnd(r*0.5,r*0.85);
    const rock=SP(rnd(0.5,1.0),5,MAT.stone);
    rock.position.set(Math.cos(ang)*br,0.35,Math.sin(ang)*br);
    rock.castShadow=true; g.add(rock);
  }
  g.position.set(x,0,z); scene.add(g);
  obstacles.push({x,z,r:r*0.88});
}

for(let i=0;i<65;i++){
  let x,z,t=0;
  do{x=rnd(-60,60);z=rnd(-60,60);t++;}
  while((Math.abs(x)<14&&Math.abs(z)<14)||t>30);
  makeTree(x,z);
}
for(let i=0;i<18;i++){let x,z,t=0;do{x=rnd(-55,55);z=rnd(-55,55);t++;}while((Math.abs(x)<16&&Math.abs(z)<16)||t>25);makeOre(x,z,'metal');}
for(let i=0;i<10;i++){let x,z,t=0;do{x=rnd(-55,55);z=rnd(-55,55);t++;}while(t>20);makeOre(x,z,'stone_ore');}
for(let i=0;i<6;i++){let x,z,t=0;do{x=rnd(-50,50);z=rnd(-50,50);t++;}while(t>20);makeOre(x,z,'gold_ore');}

// Rock clusters – scattered in the outer world
for(let i=0;i<30;i++){
  let x,z,t=0;
  do{x=rnd(-62,62);z=rnd(-62,62);t++;}
  while((Math.abs(x)<16&&Math.abs(z)<16)||t>40);
  makeRockCluster(x,z,rnd(0.7,2.2));
}

// Mountains – corners + cardinal edges
[[-52,-52],[-52,52],[52,-52],[52,52],
 [-58,2],[58,-2],[3,-58],[-4,58],
 [-40,-50],[42,48],[-48,38],[40,-46]
].forEach(([mx,mz])=>{
  makeMountain(mx,mz,rnd(8,15),rnd(4.5,7.5));
});

// ══════════════════════════════════════════════════
//  ANIMALS & MERCHANTS
// ══════════════════════════════════════════════════
const animals=[],mercs=[];
function makeCow(x,z){
  const g=new THREE.Group();
  const bd=B(1.4,0.9,0.72,MAT.cow); bd.position.y=0.82; g.add(bd);
  const hd=B(0.55,0.56,0.66,MAT.cow); hd.position.set(0.76,1.22,0); g.add(hd);
  [[-0.35,-0.28],[-0.35,0.28],[0.35,-0.28],[0.35,0.28]].forEach(([lx,lz])=>{
    const l=B(0.2,0.56,0.2,MAT.cow); l.position.set(lx,0.29,lz); g.add(l);
  });
  g.position.set(x,0,z); scene.add(g);
  animals.push({g,x,z,type:'cow',dir:rnd(0,Math.PI*2),timer:rnd(2,5),gold:8,wobble:0});
}
function makeSheep(x,z){
  const g=new THREE.Group();
  const bd=B(1.1,0.85,0.7,MAT.sheep); bd.position.y=0.75; g.add(bd);
  const hd=B(0.4,0.4,0.4,MAT.cow); hd.position.set(0.65,1.1,0); g.add(hd);
  [[-0.28,-0.2],[-0.28,0.2],[0.28,-0.2],[0.28,0.2]].forEach(([lx,lz])=>{
    const l=B(0.18,0.5,0.18,MAT.cow); l.position.set(lx,0.26,lz); g.add(l);
  });
  g.position.set(x,0,z); scene.add(g);
  animals.push({g,x,z,type:'sheep',dir:rnd(0,Math.PI*2),timer:rnd(2,5),gold:5,wobble:0});
}
function makeMerchant(x,z,flavor){
  const g=new THREE.Group();
  const body=CY(0.32,0.38,1.7,8,MAT.merchant); body.position.y=0.85; g.add(body);
  const head=SP(0.32,7,lm(0xc8a07a)); head.position.y=1.98; g.add(head);
  const hat=CY(0.13,0.4,0.58,8,MAT.merchant_hat); hat.position.y=2.42; g.add(hat);
  const brim=CY(0.52,0.52,0.08,8,MAT.merchant_hat); brim.position.y=2.19; g.add(brim);
  const cart=B(1.9,0.65,1.1,lm(0x8a5a20)); cart.position.set(1.5,0.42,0); g.add(cart);
  const goods=[['🍎',0.2],['⚙️',-0.4]];
  g.position.set(x,0,z); scene.add(g);
  const lp=new THREE.PointLight(0xffaa44,1.6,7); lp.position.set(x,3.5,z); scene.add(lp);
  mercs.push({g,x,z,lp,flavor,bob:0});
}
for(let i=0;i<6;i++) makeCow(rnd(-45,45),rnd(-45,45));
for(let i=0;i<8;i++) makeSheep(rnd(-45,45),rnd(-45,45));
for(let i=0;i<14;i++){
  let x,z,t=0;
  do{x=rnd(-56,56);z=rnd(-56,56);t++;}
  while((Math.abs(x)<18&&Math.abs(z)<18)||t>30);
  makeSnake(x,z);
}
makeMerchant(20,6,"\"Willkommen, Ritter! Beste Preise!\"");
makeMerchant(-22,-14,"\"Seltene Waren aus aller Welt!\"");
makeMerchant(10,-28,"\"Ein gutes Geschäft für uns beide!\"");

// ══════════════════════════════════════════════════
//  PLAYER
// ══════════════════════════════════════════════════
function makePlayer(){
  const g=new THREE.Group();
  const body=B(0.65,0.95,0.55,MAT.knight); body.position.y=0.8; g.add(body);
  // Armor plates
  const chest=B(0.68,0.5,0.58,MAT.knight_armor); chest.position.y=0.95; g.add(chest);
  const head=SP(0.32,8,MAT.knight_helm); head.position.y=1.65; g.add(head);
  const visor=B(0.33,0.18,0.36,lm(0x222233)); visor.position.set(0,1.64,0.16); g.add(visor);
  [[-0.18,0],[0.18,0]].forEach(([lx])=>{
    const l=B(0.24,0.55,0.26,MAT.knight); l.position.set(lx,0.29,0); g.add(l);
  });
  // Cape
  const cape=B(0.6,0.7,0.1,MAT.flag_r); cape.position.set(0,0.85,-0.25); g.add(cape);
  // Sword
  const blade=B(0.07,0.9,0.07,lm(0xbbbbcc)); blade.position.set(0.45,1.1,0); g.add(blade);
  const guard=B(0.35,0.08,0.08,lm(0xc8a020)); guard.position.set(0.45,0.7,0); g.add(guard);
  // Shield
  const shield=B(0.08,0.55,0.45,lm(0x334488)); shield.position.set(-0.42,0.9,0); g.add(shield);
  g.position.set(0,0,8); scene.add(g);
  return {g,x:0,z:8,speed:0.26,keys:{w:0,s:0,a:0,d:0},swordSwing:0,poisoned:0,atkCool:0,atk:25,hp:100,maxHp:100,damageCool:0,hunger:100,maxHunger:100};
}
const player=makePlayer();

// ══════════════════════════════════════════════════
//  PLAYER UNITS
// ══════════════════════════════════════════════════
const playerUnits=[];
let selectedUnit=null;

const UNIT_DEFS={
  knight:{name:'Ritter',icon:'⚔️',hp:300,atk:15,atkMin:10,atkMax:20,spd:0.09,range:2.5,color:0x5566aa,mat:MAT.knight,cost:{gold:15,food:2}},
  archer:{name:'Bogenschütze',icon:'🏹',hp:150,atk:25,atkMin:20,atkMax:30,spd:0.055,range:18,color:0x4a3a25,mat:MAT.archer,cost:{gold:20,food:3}},
  spear:{name:'Speerkämpfer',icon:'🗡️',hp:90,atk:20,spd:0.06,range:3,color:0x3a5a3a,mat:MAT.spear,cost:{gold:25,food:4}},
  cavalry:{name:'Kavallerist',icon:'🐴',hp:150,atk:35,spd:0.12,range:2.5,color:0x6633aa,mat:MAT.cavalry,cost:{gold:50,food:8}},
  mage:{name:'Magier',icon:'🧙',hp:500,atk:500,atkMin:450,atkMax:550,spd:0.05,range:14,color:0x2a2a8a,mat:MAT.mage,cost:{gold:80,food:6}},
};

const EQUIP={
  sword:{name:'Stahlschwert',bonus:{atk:10},cost:25,icon:'⚔️',for:['knight','spear']},
  bow:{name:'Langbogen',bonus:{range:5,atk:8},cost:20,icon:'🏹',for:['archer']},
  spear_up:{name:'Eisenspeer',bonus:{atk:12},cost:22,icon:'🗡️',for:['spear']},
  armor:{name:'Plattenpanzer',bonus:{hp:40},cost:35,icon:'🛡️',for:['knight','cavalry','spear']},
  robe:{name:'Magiermantel',bonus:{atk:20},cost:45,icon:'✨',for:['mage']},
  horse_armor:{name:'Pferdepanzer',bonus:{hp:60},cost:40,icon:'🐴',for:['cavalry']},
};

function makeUnitMesh(type){
  const g=new THREE.Group();
  const def=UNIT_DEFS[type];
  if(type==='knight'){
    addTo(g,B(0.6,0.9,0.55,MAT.knight),0,0.8,0);
    addTo(g,B(0.62,0.5,0.58,MAT.knight_armor),0,0.95,0);
    addTo(g,SP(0.3,8,MAT.knight_helm),0,1.6,0);
    addTo(g,B(0.07,0.8,0.07,lm(0xbbbbcc)),0.42,1.05,0);
    addTo(g,B(0.08,0.52,0.4,lm(0x334488)),-0.38,0.88,0);
    [[-.16,0],[.16,0]].forEach(([lx])=>{addTo(g,B(0.22,0.52,0.24,MAT.knight),lx,0.28,0);});
  } else if(type==='archer'){
    addTo(g,B(0.55,0.85,0.5,MAT.archer),0,0.77,0);
    addTo(g,SP(0.28,7,lm(0xc8a07a)),0,1.56,0);
    addTo(g,B(0.52,0.22,0.52,MAT.archer_hat),0,1.82,0);
    addTo(g,B(0.05,0.75,0.05,lm(0x5c3d1e)),0.4,1.18,0.15); // bow
    addTo(g,CY(0.02,0.02,0.65,4,MAT.arrow),0.4,0.95,-0.05);
    [[-.15,0],[.15,0]].forEach(([lx])=>{addTo(g,B(0.2,0.5,0.22,MAT.archer),lx,0.27,0);});
  } else if(type==='spear'){
    addTo(g,B(0.58,0.9,0.52,MAT.spear),0,0.8,0);
    addTo(g,SP(0.29,8,MAT.spear_helm),0,1.62,0);
    addTo(g,B(0.06,1.4,0.06,lm(0x5c3d1e)),0.44,1.3,0); // spear shaft
    addTo(g,CN(0.08,0.35,4,lm(0xaaaacc)),0.44,2.05,0); // spear tip
    [[-.16,0],[.16,0]].forEach(([lx])=>{addTo(g,B(0.22,0.52,0.24,MAT.spear),lx,0.28,0);});
  } else if(type==='cavalry'){
    // Horse
    addTo(g,B(1.5,0.95,0.7,MAT.horse),0,0.88,0);
    addTo(g,B(0.55,0.6,0.66,MAT.horse),0.85,1.3,0);
    [[-.45,-.28],[-.45,.28],[.45,-.28],[.45,.28]].forEach(([lx,lz])=>{addTo(g,B(0.22,0.9,0.22,MAT.horse),lx,0.46,lz);});
    // Rider
    addTo(g,B(0.55,0.8,0.5,MAT.cavalry),0,2.05,0);
    addTo(g,SP(0.28,7,MAT.knight_helm),0,2.78,0);
    addTo(g,B(0.06,0.85,0.06,lm(0xbbbbcc)),0.42,2.2,0);
  } else if(type==='mage'){
    addTo(g,CY(0.3,0.36,1.5,8,MAT.mage_robe),0,0.75,0);
    addTo(g,SP(0.3,8,lm(0x8a7aaa)),0,1.62,0);
    addTo(g,CY(0.12,0.36,0.55,8,MAT.mage_robe),0,2.08,0); // hat
    addTo(g,B(0.05,1.1,0.05,lm(0x6a5a3a)),0.42,1.25,0); // staff
    const orb=SP(0.14,6,MAT.magic_glow); orb.position.set(0.42,1.85,0); g.add(orb);
    const gl=new THREE.PointLight(0x4444ff,1.2,4); gl.position.set(0.42,1.85,0); g.add(gl);
  }
  return g;
}

function recruitUnit(type){
  const def=UNIT_DEFS[type];
  if(res.gold<def.cost.gold){notify('Nicht genug Gold!');return;}
  if(res.food<def.cost.food){notify('Nicht genug Nahrung!');return;}
  res.gold-=def.cost.gold; res.food-=def.cost.food;
  updateHUD();

  const g=makeUnitMesh(type);
  // Spawn near player
  const angle=Math.random()*Math.PI*2, r=3+Math.random()*2;
  const ux=player.x+Math.cos(angle)*r;
  const uz=player.z+Math.sin(angle)*r;
  g.position.set(ux,0,uz);
  scene.add(g);

  const unit={
    g,type,x:ux,z:uz,
    hp:def.hp,maxHp:def.hp,atk:def.atk,spd:def.spd,range:def.range,
    name:def.name,icon:def.icon,
    state:'ruhig', target:null, cooldown:0, wobble:Math.random()*Math.PI*2,
    equip:[],
  };
  playerUnits.push(unit);
  notify(`${def.icon} ${def.name} wurde erfolgreich rekrutiert!`);
  updateUnitList();
  closeModal('modal-recruit');
}
window.recruitUnit=recruitUnit;

function updateUnitList(){
  const el=document.getElementById('unit-list');
  el.innerHTML='';
  playerUnits.forEach((u,i)=>{
    if(u.dead) return;
    const d=document.createElement('div');
    d.className='unit-chip'+(selectedUnit===u?' selected':'');
    d.innerHTML=`${u.icon} ${u.name} <span class="uhp">HP:${Math.floor(u.hp)}</span>`;
    d.onclick=()=>{selectedUnit=(selectedUnit===u)?null:u; updateUnitList();};
    el.appendChild(d);
  });
}

// ══════════════════════════════════════════════════
//  BUILDINGS
// ══════════════════════════════════════════════════
const COSTS={
  wall:{wood:5,stone:10}, tower:{wood:15,metal:12,stone:8},
  gate:{wood:12,stone:10,metal:8}, keep:{wood:30,metal:20,stone:20},
  barracks:{wood:18,metal:12,stone:5}, farm:{wood:10,stone:4},
  market:{wood:20,metal:10,stone:8},
  catapult:{wood:18,metal:15}, cannon:{wood:10,metal:25},
  smithy:{wood:15,metal:20,stone:10}, crossbow:{wood:14,metal:16,stone:8},
  werkbank:{wood:12,metal:8},
};

// ══════════════════════════════════════════════════
//  INVENTAR & CRAFTING
// ══════════════════════════════════════════════════
let inventory=[];   // [{id,name,icon,type,count,atk,hp,heal,hunger}]
const equippedSlots={weapon:null,shield:null,helmet:null};

const CRAFT_RECIPES=[
  // WAFFEN
  {id:'holzbogen',  name:'Holzbogen',   icon:'🏹',type:'weapon',atk:14, cost:{wood:12,metal:3},        desc:'Leichter Bogen. +14 ATK'},
  {id:'armbrust',   name:'Armbrust',    icon:'🎯',type:'weapon',atk:26, cost:{wood:8,metal:18,stone:5}, desc:'Präzise Armbrust. +26 ATK'},
  {id:'kurzschwert',name:'Kurzschwert', icon:'🗡️',type:'weapon',atk:16, cost:{wood:6,metal:5},          desc:'Schnelles Schwert. +16 ATK'},
  {id:'langschwert',name:'Langschwert', icon:'⚔️',type:'weapon',atk:30, cost:{wood:3,metal:14},         desc:'Mächtiges Schwert. +30 ATK'},
  {id:'streitaxt',  name:'Streitaxt',   icon:'🪓',type:'weapon',atk:24, cost:{wood:12,metal:8},         desc:'Wuchtige Axt. +24 ATK'},
  // RÜSTUNG
  {id:'holzschild', name:'Holzschild',  icon:'🛡️',type:'shield',hp:20,  cost:{wood:10},                 desc:'Einfacher Schild. +20 MaxHP'},
  {id:'eisenschild',name:'Eisenschild', icon:'🔰',type:'shield',hp:45,  cost:{wood:4,metal:16},         desc:'Starker Schild. +45 MaxHP'},
  {id:'lederhelm',  name:'Lederhelm',   icon:'⛑️',type:'helmet',hp:15,  cost:{wood:8},                  desc:'Leichter Helm. +15 MaxHP'},
  {id:'eisenhelm',  name:'Eisenhelm',   icon:'🪖',type:'helmet',hp:35,  cost:{metal:10,stone:4},        desc:'Robuster Helm. +35 MaxHP'},
  // TRÄNKE
  {id:'heiltrank',  name:'Heiltrank',   icon:'🧪',type:'consumable',heal:60, cost:{food:12,gold:8},     desc:'Stellt 60 HP wieder her'},
  {id:'wegzehrung', name:'Wegzehrung',  icon:'🍖',type:'consumable',hunger:45,cost:{food:8},            desc:'Füllt 45 Hunger auf'},
  {id:'staerketrank',name:'Stärketrank',icon:'💪',type:'consumable',atkBuff:10,cost:{food:10,gold:15},  desc:'+10 ATK für 60 Sek.'},
];

function addToInventory(id,count=1){
  const recipe=CRAFT_RECIPES.find(r=>r.id===id);
  if(!recipe) return;
  const existing=inventory.find(i=>i.id===id);
  if(existing) existing.count+=count;
  else inventory.push({...recipe,count});
}

function craftItem(id){
  const r=CRAFT_RECIPES.find(x=>x.id===id);
  if(!r) return;
  for(const[k,v] of Object.entries(r.cost)){
    if((res[k]||0)<v){notify(`❌ Nicht genug ${k==='wood'?'🪵 Holz':k==='metal'?'⚙️ Metall':k==='stone'?'🪨 Stein':k==='food'?'🌾 Nahrung':'💰 Gold'}!`);return;}
  }
  for(const[k,v] of Object.entries(r.cost)) res[k]-=v;
  addToInventory(id);
  updateHUD();
  notify(`✅ ${r.icon} ${r.name} hergestellt! Im Inventar (🎒).`);
  renderWbBody();
}

function invEquip(invIdx){
  const item=inventory[invIdx];
  if(!item) return;
  const slot=item.type==='weapon'?'weapon':item.type==='shield'?'shield':item.type==='helmet'?'helmet':null;
  if(!slot){invUseConsumable(invIdx);return;}
  // Altes Item ausrüsten rückgängig
  if(equippedSlots[slot]){
    const old=equippedSlots[slot];
    if(old.type==='weapon')  player.atk-=old.atk;
    if(old.type==='shield'||old.type==='helmet'){ player.maxHp-=old.hp; player.hp=Math.min(player.hp,player.maxHp);}
  }
  // Neues Item ausrüsten
  equippedSlots[slot]=item;
  if(item.type==='weapon')  {player.atk+=item.atk; notify(`⚔️ ${item.icon} ${item.name} angelegt! +${item.atk} ATK`);}
  if(item.type==='shield'||item.type==='helmet'){player.maxHp+=item.hp; player.hp=Math.min(player.hp+item.hp,player.maxHp); notify(`🛡️ ${item.icon} ${item.name} angelegt! +${item.hp} MaxHP`);}
  updatePlayerHP();
  renderInventarModal();
}

function invUnequip(slot){
  const item=equippedSlots[slot];
  if(!item) return;
  if(item.type==='weapon')  player.atk-=item.atk;
  if(item.type==='shield'||item.type==='helmet'){ player.maxHp-=item.hp; player.hp=Math.min(player.hp,player.maxHp);}
  equippedSlots[slot]=null;
  notify(`📦 ${item.icon} ${item.name} abgelegt.`);
  updatePlayerHP();
  renderInventarModal();
}

function invUseConsumable(invIdx){
  const item=inventory[invIdx];
  if(!item||item.type!=='consumable') return;
  if(item.heal)   {player.hp=Math.min(player.maxHp,player.hp+item.heal);   notify(`🧪 ${item.name} getrunken! +${item.heal} HP`,2000);}
  if(item.hunger) {player.hunger=Math.min(player.maxHunger,player.hunger+item.hunger); notify(`🍖 ${item.name} gegessen! +${item.hunger} Hunger`,2000);}
  if(item.atkBuff){
    player.atk+=item.atkBuff;
    notify(`💪 Stärketrank! +${item.atkBuff} ATK für 60 Sek.`,2500);
    setTimeout(()=>{player.atk-=item.atkBuff;notify('💪 Stärketrank-Effekt vorbei.',2000);},60000);
  }
  item.count--;
  if(item.count<=0) inventory.splice(invIdx,1);
  updatePlayerHP(); updateHUD(); renderInventarModal();
}

let wbActiveTab='waffen';
window.wbTab=function(tab){
  wbActiveTab=tab;
  ['waffen','ruestung','traenke'].forEach(t=>{
    document.getElementById('wbt-'+t).style.background=t===tab?'rgba(200,160,70,0.35)':'';
  });
  renderWbBody();
};

function renderWbBody(){
  const body=document.getElementById('wb-body');
  if(!body) return;
  const typeMap={waffen:['weapon'],ruestung:['shield','helmet'],traenke:['consumable']};
  const types=typeMap[wbActiveTab]||['weapon'];
  const recipes=CRAFT_RECIPES.filter(r=>types.includes(r.type));
  body.innerHTML='';
  recipes.forEach(r=>{
    const costStr=Object.entries(r.cost).map(([k,v])=>`${v}${k==='wood'?'🪵':k==='metal'?'⚙️':k==='stone'?'🪨':k==='food'?'🌾':'💰'}`).join(' ');
    const canCraft=Object.entries(r.cost).every(([k,v])=>(res[k]||0)>=v);
    const div=document.createElement('div');
    div.className='modal-item';
    div.innerHTML=`
      <div class="mi-info">
        <div class="mi-name">${r.icon} ${r.name}</div>
        <div class="mi-cost">${costStr}</div>
        <div class="mi-stat">${r.desc}</div>
      </div>
      <button class="mi-btn" onclick="craftItem('${r.id}')" ${canCraft?'':'disabled style="opacity:0.4;cursor:not-allowed;"'}>HERSTELLEN</button>`;
    body.appendChild(div);
  });
}

function openWerkbankModal(){
  wbActiveTab='waffen';
  document.getElementById('modal-werkbank').classList.add('show');
  ['waffen','ruestung','traenke'].forEach(t=>{
    document.getElementById('wbt-'+t).style.background=t==='waffen'?'rgba(200,160,70,0.35)':'';
  });
  renderWbBody();
}

function renderInventarModal(){
  // Ausgerüstete Slots
  const eqDiv=document.getElementById('inv-equipped');
  if(!eqDiv) return;
  eqDiv.innerHTML='';
  [['weapon','⚔️ Waffe'],['shield','🛡️ Schild'],['helmet','⛑️ Helm']].forEach(([slot,label])=>{
    const item=equippedSlots[slot];
    const div=document.createElement('div');
    div.className='inv-equip-box'+(item?' filled':'');
    div.innerHTML=`<div class="ieb-label">${label}</div>
      <div class="ieb-icon">${item?item.icon:'—'}</div>
      <div class="ieb-name">${item?item.name:'Leer'}</div>`;
    if(item) div.onclick=()=>invUnequip(slot);
    if(item) div.title='Klicken zum Ablegen';
    eqDiv.appendChild(div);
  });
  // Rucksack
  const grid=document.getElementById('inv-grid');
  grid.innerHTML='';
  const totalSlots=20;
  for(let i=0;i<totalSlots;i++){
    const item=inventory[i];
    const div=document.createElement('div');
    if(item){
      const isEq=Object.values(equippedSlots).includes(item);
      div.className='inv-slot'+(isEq?' equipped':'');
      div.innerHTML=`${isEq?'<span class="seq">AN</span>':''}<span class="si">${item.icon}</span><span class="sn">${item.name.length>8?item.name.slice(0,8)+'…':item.name}</span>${item.count>1?`<span class="sc">×${item.count}</span>`:''}`;
      if(!isEq) div.onclick=()=>invEquip(i);
      div.title=item.desc+(item.type!=='consumable'?' (Klicken zum Anlegen)':' (Klicken zum Benutzen)');
    } else {
      div.className='inv-slot empty';
      div.innerHTML='<span class="si">·</span>';
    }
    grid.appendChild(div);
  }
}

window.openInventar=function(){
  renderInventarModal();
  document.getElementById('modal-inventar').classList.add('show');
};

const workbenches=[];

function canAfford(type){
  const c=COSTS[type];
  return c && Object.entries(c).every(([k,v])=>res[k]>=v);
}
function spend(type){
  Object.entries(COSTS[type]).forEach(([k,v])=>res[k]-=v);
  updateHUD();
}

function buildAt(gx,gz,skipCost=false){
  if(!buildMode||buildMode==='move') return;
  const key=gk(gx,gz);
  if(cells[key]){if(!skipCost)notify('Dieses Feld ist bereits belegt!');return;}
  if(!skipCost){
    if(!canAfford(buildMode)){
      const c=COSTS[buildMode];
      const missing=Object.entries(c).filter(([k,v])=>res[k]<v)
        .map(([k,v])=>`${v-res[k]} ${k==='wood'?'🪵':k==='metal'?'⚙️':k==='stone'?'🪨':k==='food'?'🌾':'💰'} ${k==='wood'?'Holz':k==='metal'?'Metall':k==='stone'?'Stein':k==='food'?'Nahrung':'Gold'}`).join(', ');
      notify('❌ Fehlt: '+missing,3000);return;
    }
    spend(buildMode);
  }
  const{wx,wz}=g2w(gx,gz);
  const meshes=[];
  const C=CELL;

  if(buildMode==='wall'){
    meshes.push(place(B(C,2.6,C,MAT.stone),wx,1.3,wz));
    [-0.75,0,0.75].forEach(off=>{
      meshes.push(place(B(0.55,0.7,0.55,MAT.dstone),wx+off,2.95,wz));
      meshes.push(place(B(0.55,0.7,0.55,MAT.dstone),wx,2.95,wz+off));
    });
  } else if(buildMode==='tower'){
    meshes.push(place(B(C+0.2,7,C+0.2,MAT.stone),wx,3.5,wz));
    meshes.push(place(B(C+0.6,0.6,C+0.6,MAT.dstone),wx,7.3,wz));
    meshes.push(place(CN(C*0.82,2.4,8,MAT.roof),wx,8.7,wz));
    [-0.85,0,0.85].forEach(off=>{
      meshes.push(place(B(0.6,0.75,0.6,MAT.dstone),wx+off,7.85,wz+C*0.5));
      meshes.push(place(B(0.6,0.75,0.6,MAT.dstone),wx+off,7.85,wz-C*0.5));
    });
    // Archer in tower
    const ab=B(0.48,0.9,0.45,MAT.archer); ab.position.set(wx,8.1,wz); ab.castShadow=true; scene.add(ab);
    meshes.push(ab);
    archerTowers.push({wx,wz,cooldown:0});
  } else if(buildMode==='gate'){
    meshes.push(place(B(C*0.8,3.5,C,MAT.stone),wx-C*0.6,1.75,wz));
    meshes.push(place(B(C*0.8,3.5,C,MAT.stone),wx+C*0.6,1.75,wz));
    meshes.push(place(B(C*2.2,0.7,C,MAT.dstone),wx,3.7,wz));
    const portcullis=B(C*0.85,2.8,0.2,lm(0x2a1e0e,0)); portcullis.position.set(wx,1.55,wz); scene.add(portcullis); meshes.push(portcullis);
  } else if(buildMode==='keep'){
    meshes.push(place(B(C*1.6,9,C*1.6,MAT.stone),wx,4.5,wz));
    meshes.push(place(B(C*2,0.65,C*2,MAT.dstone),wx,9.3,wz));
    meshes.push(place(CN(C*1.1,3.2,8,MAT.roof),wx,11.2,wz));
    [[-1.1,-1.1],[-1.1,1.1],[1.1,-1.1],[1.1,1.1]].forEach(([ox,oz])=>{
      meshes.push(place(B(0.6,0.9,0.6,MAT.dstone),wx+ox*C,9.85,wz+oz*C));
    });
    const pole=place(CY(0.07,0.07,2.5,4,MAT.bark),wx,12.45,wz,false);
    const flag=place(B(0.9,0.5,0.06,MAT.flag_r),wx+0.5,13.25,wz);
    meshes.push(pole,flag);
    maxHP+=50; castleHP+=50; updateHUD();
  } else if(buildMode==='barracks'){
    meshes.push(place(B(C*1.5,2.8,C*1.5,MAT.wood),wx,1.4,wz));
    meshes.push(place(B(C*1.7,0.25,C*1.7,MAT.bark),wx,2.9,wz));
    meshes.push(place(CN(C*0.9,1.8,4,MAT.bark),wx,3.9,wz));
    const sign=place(B(0.7,0.4,0.08,lm(0x5c3d1e)),wx,2.5,wz+C*0.77);
    meshes.push(sign);
    barracks.push({wx,wz});
  } else if(buildMode==='farm'){
    meshes.push(place(B(C*1.8,0.12,C*1.8,lm(0x4a6a1e)),wx,0.06,wz,false));
    meshes.push(place(B(C*0.3,1.8,C*0.3,MAT.bark),wx-C*0.5,0.9,wz+C*0.5));
    meshes.push(place(CN(C*0.2,0.5,4,lm(0xdd4422)),wx-C*0.5,1.95,wz+C*0.5)); // farmhouse roof
    farms.push({wx,wz,timer:0});
    // Wheat rows
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){
      if((i+j)%2) continue;
      const w=place(CY(0.04,0.04,0.55,4,lm(0xccaa20)),wx+i*0.6,0.28,wz+j*0.6,false);
      meshes.push(w);
    }
  } else if(buildMode==='market'){
    meshes.push(place(B(C*1.6,2.2,C*1.4,lm(0x7a5a30)),wx,1.1,wz));
    meshes.push(place(B(C*1.85,0.2,C*1.65,lm(0xcc4422)),wx,2.3,wz)); // red roof
    meshes.push(place(CN(C*0.3,0.8,4,lm(0xcc4422)),wx,2.8,wz));
    // Stalls
    [-0.8,0.8].forEach(ox=>{
      meshes.push(place(B(0.55,0.8,C*0.7,lm(0x8a6030)),wx+ox,0.6,wz));
    });
    markets.push({wx,wz,timer:0});
  } else if(buildMode==='catapult'){
    const cg=new THREE.Group();
    addTo(cg,B(1.2,0.3,0.6,MAT.catapult),0,0.3,0);  // base
    addTo(cg,CY(0.1,0.1,1.8,6,MAT.catapult),0,1.2,0); // arm
    addTo(cg,SP(0.28,6,lm(0x5c3d1e)),0,2.2,0); // sling
    addTo(cg,B(0.25,0.25,0.25,lm(0x333333)),0,2.2,0); // rock
    cg.position.set(wx,0,wz); scene.add(cg); meshes.push(cg);
    catapults.push({g:cg,wx,wz,cooldown:0,rotY:0});
  } else if(buildMode==='cannon'){
    const cg=new THREE.Group();
    addTo(cg,B(1.0,0.35,0.5,MAT.dstone),0,0.28,0);
    addTo(cg,CY(0.22,0.28,1.3,8,MAT.cannon),-0.2,0.72,0).rotation.z=Math.PI/2.2;
    addTo(cg,CY(0.15,0.15,0.22,8,MAT.cannon),-0.78,0.65,0);
    addTo(cg,B(0.18,0.4,0.5,MAT.wood),-0.1,0.12,-0.3);
    addTo(cg,B(0.18,0.4,0.5,MAT.wood),-0.1,0.12,0.3);
    cg.position.set(wx,0,wz); scene.add(cg); meshes.push(cg);
    cannons.push({g:cg,wx,wz,cooldown:0});
  } else if(buildMode==='crossbow'){
    // Riesenarmbrust — massives Holzgerüst
    const xg=new THREE.Group();
    // Rahmen
    addTo(xg,B(2.2,0.3,1.0,MAT.catapult),0,0.25,0); // Sockel
    addTo(xg,B(0.18,1.8,0.18,MAT.catapult),-0.9,1.15,0); // linker Ständer
    addTo(xg,B(0.18,1.8,0.18,MAT.catapult),0.9,1.15,0);  // rechter Ständer
    addTo(xg,B(0.18,1.8,0.18,MAT.bark),0,1.0,0); // Schiene/Schaft
    // Bogen-Arme
    addTo(xg,B(0.12,0.12,2.4,MAT.bark),0,2.0,0); // Bogenstab quer
    addTo(xg,CY(0.06,0.06,1.2,5,MAT.arrow),0,1.1,0); // Bolzen in Schiene
    // Sehne (zwei schräge Stäbe)
    const s1=addTo(xg,B(0.06,0.06,1.3,lm(0x888888)),0,2.0,0.62);
    s1.rotation.z=0.3;
    const s2=addTo(xg,B(0.06,0.06,1.3,lm(0x888888)),0,2.0,-0.62);
    s2.rotation.z=-0.3;
    // Rad zum Spannen
    addTo(xg,CY(0.35,0.35,0.1,10,MAT.catapult),-0.9,0.55,0).rotation.z=Math.PI/2;
    xg.position.set(wx,0,wz); scene.add(xg); meshes.push(xg);
    crossbows.push({g:xg,wx,wz,cooldown:0,hp:CROSSBOW_HP,maxHp:CROSSBOW_HP,dead:false});
  } else if(buildMode==='smithy'){
    // Forge building
    const sg2=new THREE.Group();
    // Stone base
    const sbase=B(CELL*1.7,2.5,CELL*1.7,MAT.smithy_stone); sbase.position.y=1.25; sg2.add(sbase);
    // Roof  
    const sroof=CN(CELL,2,4,MAT.bark); sroof.position.y=3.6; sg2.add(sroof);
    // Chimney
    const schim=CY(0.25,0.25,2.2,6,MAT.smithy_stone); schim.position.set(0.6,3.2,0.6); sg2.add(schim);
    // Anvil
    const sanvil=B(0.7,0.3,0.4,MAT.smithy_anvil); sanvil.position.set(0.3,2.65,0); sg2.add(sanvil);
    const sanvil2=B(0.4,0.5,0.3,MAT.smithy_anvil); sanvil2.position.set(0.3,2.4,0); sg2.add(sanvil2);
    // Forge fire glow
    const sfire=new THREE.PointLight(0xff6600,2,5); sfire.position.set(-0.4,2.5,0); sg2.add(sfire);
    sg2.position.set(wx,0,wz); scene.add(sg2); meshes.push(sg2);
    smithies.push({wx,wz,light:sfire,g:sg2});
  } else if(buildMode==='werkbank'){
    const wg=new THREE.Group();
    // Tischbeine
    [[-0.55,-0.55],[0.55,-0.55],[-0.55,0.55],[0.55,0.55]].forEach(([ox,oz])=>{
      const leg=B(0.12,1.0,0.12,MAT.wood); leg.position.set(ox,0.5,oz); wg.add(leg);
    });
    // Tischplatte
    const top=B(1.5,0.12,1.1,MAT.bark); top.position.y=1.06; wg.add(top);
    // Holzbretter auf der Platte
    const plank=B(1.2,0.06,0.18,MAT.wood); plank.position.set(0,1.14,-0.2); wg.add(plank);
    // Hammer
    const hndl=B(0.06,0.06,0.5,lm(0x7a5020)); hndl.position.set(0.3,1.16,0.1); hndl.rotation.y=0.5; wg.add(hndl);
    const hhead=B(0.12,0.12,0.14,sm(0x555555,0.6,0.4)); hhead.position.set(0.46,1.16,0.3); hhead.rotation.y=0.5; wg.add(hhead);
    // Bogenstab
    const bow=B(0.05,0.5,0.05,MAT.bark); bow.position.set(-0.3,1.37,0.1); bow.rotation.z=0.3; wg.add(bow);
    // Kleines Schild
    const shld=B(0.06,0.3,0.26,lm(0x334488)); shld.position.set(-0.5,1.25,-0.2); shld.rotation.y=0.2; wg.add(shld);
    // Werkbank-Schild/Label
    const sign=B(0.6,0.28,0.06,lm(0x5c3d1e)); sign.position.set(0,0.7,0.58); wg.add(sign);
    wg.position.set(wx,0,wz); scene.add(wg); meshes.push(wg);
    workbenches.push({wx,wz,g:wg});
  }
  cells[key]={type:buildMode,meshes};
  notify(`✅ ${({'wall':'Mauer','tower':'Turm','gate':'Tor','keep':'Burg','barracks':'Kaserne','farm':'Farm','market':'Markt','catapult':'Katapult','cannon':'Kanone','smithy':'Schmiede','crossbow':'Riesenarmbrust','werkbank':'Werkbank'}[buildMode]||buildMode.toUpperCase())} erfolgreich erbaut!`);
  refreshSidePanel();
}

// ══════════════════════════════════════════════════
//  BUILDING REGISTRIES
// ══════════════════════════════════════════════════
const archerTowers=[], barracks=[], farms=[], markets=[], catapults=[], cannons=[], smithies=[], crossbows=[];
// Crossbow buildings have HP and can be destroyed
const CROSSBOW_HP = 600;
const playerSwords={}; // unitIndex -> swordType
let hasSmith=false, smithCooldown=0;

// ══════════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════════
const res={wood:100,metal:100,stone:100,food:100,gold:500,seedling:0};
let castleHP=100,maxHP=100;
let dayTime=0.5, dayNum=1, isNight=false;
let waveNum=1, waveActive=false;
const enemies=[], projectiles=[], dragons=[];
let buildMode=null, gameOver=false;
let notifTimer=null;

function updateHUD(){
  ['wood','metal','stone','food','gold','seedling'].forEach(k=>{
    const el=document.getElementById('r-'+k); if(el) el.textContent=res[k];
  });
  document.getElementById('r-pop').textContent=playerUnits.filter(u=>!u.dead).length;
  document.getElementById('r-hp')&&(document.getElementById('r-hp').textContent=Math.max(0,Math.floor(castleHP)));
}

function notify(msg,dur=2300){
  const el=document.getElementById('notif');
  el.textContent=msg; el.style.opacity='1';
  if(notifTimer) clearTimeout(notifTimer);
  notifTimer=setTimeout(()=>el.style.opacity='0',dur);
}

function showBanner(title,sub){
  document.getElementById('banner-title').textContent=title;
  document.getElementById('banner-sub').textContent=sub;
  const b=document.getElementById('banner'); b.classList.add('show');
  setTimeout(()=>b.classList.remove('show'),2800);
}

// ══════════════════════════════════════════════════
//  SIDE PANEL
// ══════════════════════════════════════════════════
let panelOpen=true;
window.toggleSidePanel=function(){
  panelOpen=!panelOpen;
  document.getElementById('side-panel').classList.toggle('collapsed',!panelOpen);
  document.getElementById('bottom-bar').classList.toggle('full',!panelOpen);
};

let activeTab='build';
window.showTab=function(tab){
  activeTab=tab;
  document.querySelectorAll('.ptab').forEach((t,i)=>{
    t.classList.toggle('active',['build','units','info'][i]===tab);
  });
  refreshSidePanel();
};

function refreshSidePanel(){
  const el=document.getElementById('panel-body');
  if(activeTab==='build'){
    const built=Object.values(cells).filter(c=>c.type&&c.type!=='center');
    const farms_n=built.filter(c=>c.type==='farm').length;
    const towers=built.filter(c=>c.type==='tower').length;
    el.innerHTML=`
    <div class="panel-section">
      <h4>KÖNIGREICH STATUS</h4>
      <div class="info-box" id="info-box">
        <h5>ÜBERSICHT</h5>
        <p>
          Burg-HP: <span class="hi">${Math.floor(castleHP)}/${maxHP}</span><br>
          Gebäude: <span class="hi">${built.length}</span><br>
          Türme: <span class="hi">${towers}</span><br>
          Farmen: <span class="hi">${farms_n}</span><br>
          Einheiten: <span class="hi">${playerUnits.filter(u=>!u.dead).length}</span><br>
          Welle: <span class="hi">${waveNum}</span>
        </p>
      </div>
    </div>
    <div class="panel-section">
      <h4>TIPP</h4>
      <p style="font-family:'Crimson Text',serif;font-size:12px;color:var(--text-dim);line-height:1.6;">
        Baue Farmen für Nahrung und Märkte für Gold. Stelle Mauern um deine Burg, Türme in die Ecken. Rekrutiere Ritter und Bogenschützen!
      </p>
    </div>`;
  } else if(activeTab==='units'){
    let html=`<div class="panel-section"><h4>DEINE EINHEITEN</h4>`;
    if(playerUnits.filter(u=>!u.dead).length===0){
      html+=`<p style="font-family:'Crimson Text',serif;font-size:12px;color:var(--text-dim);">Noch keine Einheiten — klicke auf REKRUTIEREN!</p>`;
    }
    playerUnits.filter(u=>!u.dead).forEach((u,i)=>{
      html+=`<div class="card${selectedUnit===u?' active':''}" onclick="selectUnit(${i})">
        <div class="card-head"><span class="card-name">${u.icon} ${u.name}</span><span class="card-icon"></span></div>
        <div class="card-stat">
          <span class="stat-pill">HP ${Math.floor(u.hp)}/${u.maxHp}</span>
          <span class="stat-pill">ATK ${u.atk}</span>
          <span class="stat-pill">${u.state}</span>
        </div>
        <div class="card-cost" style="margin-top:5px;">
          <button class="mi-btn" style="font-size:8px;padding:3px 8px;" onclick="event.stopPropagation();openEquip(${i})">🛡️ AUSRÜSTEN</button>
        </div>
      </div>`;
    });
    html+='</div>';
    el.innerHTML=html;
  } else {
    el.innerHTML=`<div class="panel-section">
      <h4>STEUERUNG</h4>
      <p style="font-family:'Crimson Text',serif;font-size:12px;color:var(--text-dim);line-height:1.9;">
        <span style="color:var(--gold)">WASD / Pfeile</span> → Spieler bewegen<br>
        <span style="color:var(--gold)">Rechts-Ziehen</span> → Kamera drehen<br>
        <span style="color:var(--gold)">Scroll</span> → Zoom<br>
        <span style="color:var(--gold)">E</span> → Interaktion<br>
        <span style="color:var(--gold)">Linksklick Karte</span> → Einheit hinschicken<br>
        <span style="color:var(--gold)">Linksklick</span> → Bauen platzieren
      </p>
    </div>
    <div class="panel-section">
      <h4>GEBÄUDE-EFFEKTE</h4>
      <p style="font-family:'Crimson Text',serif;font-size:11px;color:var(--text-dim);line-height:1.9;">
        🌾 Farm → +3 Nahrung/Tag<br>
        🏪 Markt → +10 Gold/Tag<br>
        🗼 Turm → Bogenschütze drin<br>
        🏰 Burg → +50 Max-HP<br>
        🛡️ Kaserne → Schnellere Rekrutierung
      </p>
    </div>`;
  }
}
refreshSidePanel();

window.selectUnit=function(i){
  selectedUnit=playerUnits[i];
  refreshSidePanel(); updateUnitList();
};

window.openEquip=function(i){
  const u=playerUnits[i];
  if(!u) return;
  const el=document.getElementById('equip-body');
  let html=`<p style="font-family:'Crimson Text',serif;font-size:12px;color:var(--text-dim);margin-bottom:12px;">Einheit: <strong style="color:var(--gold)">${u.icon} ${u.name}</strong></p>`;
  Object.entries(EQUIP).forEach(([key,eq])=>{
    if(!eq.for.includes(u.type)) return;
    const owned=u.equip.includes(key);
    html+=`<div class="modal-item">
      <div class="mi-info">
        <div class="mi-name">${eq.icon} ${eq.name} ${owned?'✅':''}</div>
        <div class="mi-cost">${eq.cost} Gold</div>
        <div class="mi-stat">+${Object.entries(eq.bonus).map(([k,v])=>`${v} ${k==='atk'?'ATK':k==='hp'?'HP':k==='range'?'Reichweite':k}`).join(', ')}</div>
      </div>
      ${owned?'<span style="font-size:10px;color:var(--green)">✅ Ausgerüstet</span>':`<button class="mi-btn" onclick="equipItem(${i},'${key}')">KAUFEN</button>`}
    </div>`;
  });
  el.innerHTML=html;
  document.getElementById('modal-equip').classList.add('show');
};

window.equipItem=function(ui,key){
  const u=playerUnits[ui];
  const eq=EQUIP[key];
  if(!u||!eq) return;
  if(res.gold<eq.cost){notify('Nicht genug Gold!');return;}
  if(u.equip.includes(key)){notify('Diese Ausrüstung trägt die Einheit bereits!'); return;}
  res.gold-=eq.cost; updateHUD();
  u.equip.push(key);
  if(eq.bonus.hp){u.hp+=eq.bonus.hp;u.maxHp+=eq.bonus.hp;}
  if(eq.bonus.atk) u.atk+=eq.bonus.atk;
  if(eq.bonus.range) u.range+=eq.bonus.range;
  notify(`${eq.icon} ${eq.name} ausgerüstet!`);
  openEquip(ui);
};

// ══════════════════════════════════════════════════
//  ENEMIES
// ══════════════════════════════════════════════════
function spawnEnemy(){
  const angle=Math.random()*Math.PI*2;
  const r=50+Math.random()*8;
  const sx=Math.cos(angle)*r, sz=Math.sin(angle)*r;
  const elite=waveNum>3&&Math.random()<0.2;

  const g=new THREE.Group();
  const bmat=elite?lm(0x330033):MAT.enemy;
  addTo(g,B(0.62,0.95,0.56,bmat),0,0.82,0);
  addTo(g,SP(0.3,7,MAT.enemy_helm),0,1.75,0);
  addTo(g,B(0.07,0.85,0.07,lm(0x888888)),0.44,1.15,0);
  if(elite){
    addTo(g,B(0.64,0.5,0.58,lm(0x4a004a)),0,0.95,0);
    addTo(g,B(0.1,1.6,0.08,lm(0xcc2222)),0,2.5,0);// banner
  }
  [[-.17,0],[.17,0]].forEach(([lx])=>{addTo(g,B(0.23,0.53,0.25,bmat),lx,0.28,0);});
  g.position.set(sx,0,sz); g.castShadow=true; scene.add(g);

  const spd=0.045+waveNum*0.004+(elite?0.015:0);
  const hp=1+(waveNum-1)*0.8+(elite?2:0);
  enemies.push({g,x:sx,z:sz,hp,maxHp:hp,speed:spd,dead:false,wobble:Math.random()*Math.PI*2,elite});
}

function killEnemy(en){
  en.dead=true;
  scene.remove(en.g);
  const reward=(en.elite?12:5)+waveNum;
  res.gold+=reward; res.food+=2; updateHUD();
  // Death flash
  const fl=SP(0.8,6,new THREE.MeshBasicMaterial({color:0xff4400,transparent:true,opacity:0.9}));
  fl.position.set(en.x,1.2,en.z); scene.add(fl);
  let lf=0;
  const ti=setInterval(()=>{lf+=0.1;fl.material.opacity=0.9-lf;fl.scale.setScalar(1+lf*3);if(lf>0.9){scene.remove(fl);clearInterval(ti);}},25);
}

window.startWave=function(){
  if(waveActive||gameOver) return;
  waveActive=true;
  const isBossWave=waveNum%5===0;
  const hasDragon=waveNum>=3&&(waveNum%3===0||isBossWave);
  const bannerSub=isBossWave?`👑 BOSS-WELLE! Drache + ${5+waveNum*3} Feinde!`:hasDragon?`🐉 Drache + ${5+waveNum*3} Feinde greifen an!`:`${5+waveNum*3} Feinde greifen an!`;
  showBanner(isBossWave?`👑 BOSS-WELLE ${waveNum}!`:`WELLE ${waveNum} ⚔️`,bannerSub);
  let n=5+waveNum*3,s=0;
  const iv=setInterval(()=>{if(s>=n){clearInterval(iv);return;}spawnEnemy();s++;},480);
  if(hasDragon) setTimeout(()=>spawnDragon(isBossWave),2000+(isBossWave?0:1500));
};

// ══════════════════════════════════════════════════
//  PROJECTILES
// ══════════════════════════════════════════════════
function fireAt(sx,sy,sz,target,type){
  let mesh,speed,splash=0,dmg=1,arc=false,minHeight=0;
  if(type==='arrow'){
    mesh=place(CY(0.035,0.035,0.6,4,MAT.arrow),sx,sy,sz,false);
    speed=0.55; dmg=1; arc=true; minHeight=2.5; // flies over units
  } else if(type==='crossbow'){
    mesh=place(CY(0.04,0.04,0.7,4,lm(0x8a6030)),sx,sy,sz,false);
    speed=0.7; dmg=500; arc=true; minHeight=3.0; // flatter but still over units
  } else if(type==='catapult'){
    mesh=place(SP(0.3,6,lm(0x444444)),sx,sy,sz,false);
    speed=0.28; splash=3; dmg=3; arc=true; minHeight=6; // high lob
  } else if(type==='cannon'){
    mesh=place(SP(0.22,6,MAT.cannonball),sx,sy,sz,false);
    speed=0.65; splash=2; dmg=4; arc=true; minHeight=4; // medium arc
  } else if(type==='magic'){
    mesh=place(SP(0.25,6,MAT.magic_glow),sx,sy,sz,false);
    mesh.add(new THREE.PointLight(0x4444ff,2,3));
    speed=0.38; splash=4; dmg=4; arc=true; minHeight=3;
  } else { return; }
  projectiles.push({mesh,target,speed,splash,dmg,type,done:false,arc,minHeight});
}

// ══════════════════════════════════════════════════
//  CAMERA
// ══════════════════════════════════════════════════
let camTheta=0.2, camPhi=0.52, camRadius=35;
let isDrag=false, lastM={x:0,y:0}, isRightDrag=false;

cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('mousedown',e=>{
  if(e.button===2){isRightDrag=true;lastM={x:e.clientX,y:e.clientY};}
  else if(e.button===0){isDrag=false;lastM={x:e.clientX,y:e.clientY};}
  cv.addEventListener('mousemove',onMM);
  cv.addEventListener('mouseup',onMU);
});
function onMM(e){
  const dx=e.clientX-lastM.x,dy=e.clientY-lastM.y;
  if(isRightDrag||Math.abs(dx)+Math.abs(dy)>5){
    if(!isRightDrag) isDrag=true;
    camTheta-=dx*0.007;
    camPhi=Math.max(0.12,Math.min(1.3,camPhi+dy*0.005));
    lastM={x:e.clientX,y:e.clientY};
  }
}
function onMU(e){
  cv.removeEventListener('mousemove',onMM);
  cv.removeEventListener('mouseup',onMU);
  if(!isDrag&&e.button===0&&!gameOver){
    if(buildMode&&buildMode!=='move'){
      const rect=cv.getBoundingClientRect();
      const mouse=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
      const ray=new THREE.Raycaster(); ray.setFromCamera(mouse,cam);
      const pl=new THREE.Plane(new THREE.Vector3(0,1,0),0);
      const pt=new THREE.Vector3();
      if(ray.ray.intersectPlane(pl,pt)){
        const{gx,gz}=w2g(pt.x,pt.z); buildAt(gx,gz);
      }
    } else if(selectedUnit){
      // Move unit to click
      const rect=cv.getBoundingClientRect();
      const mouse=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
      const ray=new THREE.Raycaster(); ray.setFromCamera(mouse,cam);
      const pl=new THREE.Plane(new THREE.Vector3(0,1,0),0);
      const pt=new THREE.Vector3();
      if(ray.ray.intersectPlane(pl,pt)){
        selectedUnit.target=null; selectedUnit.state='bewegt';
        selectedUnit._dest={x:pt.x,z:pt.z};
      }
    }
  }
  isRightDrag=false;
}
cv.addEventListener('wheel',e=>{camRadius=Math.max(10,Math.min(70,camRadius+e.deltaY*0.04));});

// ══════════════════════════════════════════════════
//  KEYBOARD
// ══════════════════════════════════════════════════
const K={};
window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  K[k]=true;
  if(k==='e'||k==='t') doInteract();
  if(k==='escape'){
    const bm=document.getElementById('build-menu');
    if(bm&&bm.style.display!=='none'){bm.style.display='none';}
    else if(buildMode&&buildMode!=='move'){buildMode=null;setMode('move');}
    else togglePause();
  }
});
window.addEventListener('keyup',e=>K[e.key.toLowerCase()]=false);

// ══════════════════════════════════════════════════
//  MODES & UI
// ══════════════════════════════════════════════════
window.toggleBuildMenu=function(){
  const m=document.getElementById('build-menu');
  m.style.display=m.style.display==='none'?'block':'none';
};
window.pickBuild=function(type){
  document.getElementById('build-menu').style.display='none';
  setMode(type);
};
window.setMode=function(m){
  buildMode=(m==='move')?null:m;
  document.querySelectorAll('.tb').forEach(b=>b.classList.remove('active'));
  const btn=document.getElementById('tb-'+m);
  if(btn) btn.classList.add('active');
  if(m==='move') notify('Bewegungsmodus — WASD oder Pfeiltasten zum Bewegen');
};

window.openRecruit=function(){document.getElementById('modal-recruit').classList.add('show');};
window.closeModal=function(id){document.getElementById(id).classList.remove('show');};
window.buyRes=function(type,amount,cost){
  if(res.gold<cost){notify('Nicht genug Gold!');return;}
  res.gold-=cost;
  if(type==='repair'){castleHP=Math.min(maxHP,castleHP+amount);notify(`❤️ Burg um ${amount} LP repariert!`);}
  else{res[type]=(res[type]||0)+amount;notify(`✅ ${amount}× ${type==='wood'?'Holz':type==='metal'?'Metall':type==='stone'?'Stein':type==='food'?'Nahrung':type} gekauft!`);}
  updateHUD();
};

// ══════════════════════════════════════════════════
//  EIGENER DRACHE
// ══════════════════════════════════════════════════
let playerDragon=null, dragonEgg=null, eggTimer=0;
const MAT_pdrag=lm(0x3a9a44,0x051505);
const MAT_pdwing=lm(0x2a7a34);

function makePlayerDragonMesh(){
  const g=new THREE.Group();
  const sc=0.55; // kleiner als feindlicher Drache
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.35*sc,0.5*sc,3.5*sc,8),MAT_pdrag);
  body.rotation.z=Math.PI/2; g.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.2*sc,0.3*sc,1.8*sc,7),MAT_pdrag);
  neck.position.set(1.1*sc,0.3*sc,0); neck.rotation.z=-0.5; g.add(neck);
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.65*sc,0.45*sc,0.5*sc),MAT_pdrag);
  head.position.set(1.8*sc,0.65*sc,0); g.add(head);
  [-0.18*sc,0.18*sc].forEach(ey=>{
    const eye=new THREE.Mesh(new THREE.SphereGeometry(0.08,5,5),
      new THREE.MeshBasicMaterial({color:0x44ff44}));
    eye.position.set(1.85*sc,0.82*sc,ey); g.add(eye);
  });
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(0.05*sc,0.3*sc,2.5*sc,6),MAT_pdrag);
  tail.position.set(-1.5*sc,-0.1*sc,0); tail.rotation.z=0.4; g.add(tail);
  [-1,1].forEach(side=>{
    const wing=new THREE.Mesh(new THREE.ConeGeometry(1.4*sc,2.0*sc,4),MAT_pdwing);
    wing.rotation.z=side*(Math.PI*0.5); wing.position.set(0,0,side*1.2*sc); g.add(wing);
  });
  const light=new THREE.PointLight(0x44ff88,1.2,6); g.add(light);
  return g;
}

function hatchDragon(){
  if(dragonEgg){scene.remove(dragonEgg);dragonEgg=null;}
  const g=makePlayerDragonMesh();
  g.position.set(player.x,8,player.z);
  scene.add(g);
  playerDragon={g,x:player.x,z:player.z,y:8,angle:0,hp:400,maxHp:400,atkCool:0,dead:false};
  document.getElementById('egg-shop-item').style.display='none';
  showBanner('🐉 Dein Drache ist geschlüpft!','Er kämpft jetzt für dich!');
}

window.buyDragonEgg=function(){
  if(playerDragon){notify('Du hast bereits einen Drachen!');return;}
  if(dragonEgg){notify('Das Ei brütet schon!');return;}
  if(res.gold<200){notify('❌ Fehlt: '+(200-res.gold)+' 💰 Gold');return;}
  res.gold-=200; updateHUD();
  // Ei-Mesh
  const eg=new THREE.Mesh(new THREE.SphereGeometry(0.55,8,6),
    new THREE.MeshLambertMaterial({color:0x88cc44,emissive:0x112200}));
  eg.scale.y=1.35;
  eg.position.set(player.x,0.75,player.z);
  scene.add(eg); dragonEgg=eg; eggTimer=40;
  notify('🥚 Drachen-Ei gekauft! Schlüpft in 40 Sekunden…',4000);
  closeModal('modal-shop');
};

// ══════════════════════════════════════════════════
//  INTERACTION
// ══════════════════════════════════════════════════
function doInteract(){
  // ── Spieler-Angriff auf Feinde ──
  if(player.atkCool<=0){
    for(const en of enemies){
      if(en.dead) continue;
      if(d2(player,en)<3.0){
        // Schwertschwung-Animation
        player.swordSwing=1.0;
        // Schaden
        const dmg=player.atk+Math.floor(Math.random()*15);
        en.hp-=dmg;
        // Treffer-Blitz
        const fl=new THREE.Mesh(new THREE.SphereGeometry(0.5,6,6),
          new THREE.MeshBasicMaterial({color:0xffcc00,transparent:true,opacity:0.9}));
        fl.position.set(en.x,1.5,en.z); scene.add(fl);
        let lf=0;
        const ti=setInterval(()=>{lf+=0.15;fl.material.opacity=0.9-lf;fl.scale.setScalar(1+lf*2);
          if(lf>0.9){scene.remove(fl);clearInterval(ti);}},30);
        if(en.hp<=0) killEnemy(en);
        else notify(`⚔️ Treffer! ${dmg} Schaden!`,1200);
        player.atkCool=0.55; return;
      }
    }
  }
  // Snakes – kill with E, +2 Nahrung
  for(const s of snakes){
    if(s.hp<=0) continue;
    if(d2(player,s)<2.2){
      s.hp=0; scene.remove(s.g);
      res.food+=2; player.hunger=Math.min(player.maxHunger,player.hunger+10);
      notify('⚔️ Schlange getötet! +2 Nahrung, +10🍖 Hunger!',2500);
      updateHUD(); return;
    }
  }
  // Animals
  for(const a of animals){
    if(d2(player,a)<4){
      const says = a.type==='cow'
        ? ['Muuuh! Schön, dich zu sehen, Ritter!','Moooh! Was für ein prächtiger Tag!','Muuuh! Möchtet Ihr Milch?'][Math.floor(Math.random()*3)]
        : ['Bääähh! Ich bin das flauschigste Schaf im Land!','Määähh! Streichelt mich, edler Ritter!','Bääähh! Wolle gefällig, Herr?'][Math.floor(Math.random()*3)];
      res.gold += a.gold;
      player.hunger=Math.min(player.maxHunger,player.hunger+20);
      notify(`${a.type==='cow'?'🐄':'🐑'} "${says}" — +${a.gold} Gold, +20🍖 Hunger!`, 3000);
      a.gold = Math.max(1, Math.floor(a.gold * 0.6));
      updateHUD(); return;
    }
  }
  // Merchants
  for(const m of mercs){
    if(d2(player,m)<4.5){
      document.getElementById('shop-flavor').textContent=m.flavor;
      document.getElementById('modal-shop').classList.add('show'); return;
    }
  }
  // Smithy buildings
  for(const s of smithies){
    if(d2(player,{x:s.wx,z:s.wz})<4){ openSmithyModal(); return; }
  }
  // Werkbank
  for(const w of workbenches){
    if(d2(player,{x:w.wx,z:w.wz})<4){ openWerkbankModal(); return; }
  }
  // Trees
  for(const t of trees){
    if(t.hp<=0||t.falling) continue;
    if(d2(player,t)<2.8){
      t.hp--;
      spawnChips(t.x,t.z,0x8c6640,5);
      const py=PICKAXES[pickaxeIdx].yield;
      const wood=(t.hp<=0?3:2)*py; res.wood+=wood;
      if(t.hp<=0){
        t.falling=true;
        t.fallAngle=0;
        t.fallDir=Math.atan2(t.x-player.x, t.z-player.z);
        res.seedling++;
        notify('🪵 +'+wood+' Holz! 🌱 +1 Setzling!'+(py>1?` (⛏️ ×${py})`:''));
      } else {
        notify('🪵 +'+wood+' Holz!'+(py>1?` (⛏️ ×${py})`:''));
        t.g.rotation.z=0.25*(3-t.hp)*((Math.random()<0.5?1:-1));
        setTimeout(()=>{if(t.g) t.g.rotation.z=0;},180);
      }
      updateHUD(); return;
    }
  }
  // Ores
  for(const o of ores){
    if(o.hp<=0) continue;
    if(d2(player,o)<2.5){
      o.hp--;
      spawnChips(o.x,o.z, o.type==='gold_ore'?0xd4a820:0x908878, 4);
      const py2=PICKAXES[pickaxeIdx].yield;
      if(o.type==='metal'){const v=2*py2;res.metal+=v;notify(`⚙️ +${v} Metall!`+(py2>1?` (⛏️ ×${py2})`:'')); }
      else if(o.type==='stone_ore'){const v=2*py2;res.stone+=v;notify(`🪨 +${v} Stein!`+(py2>1?` (⛏️ ×${py2})`:''));}
      else{const v=5*py2;res.gold+=v;notify(`💰 +${v} Gold! Golderz!`+(py2>1?` (⛏️ ×${py2})`:''));}
      if(o.hp<=0){
        o.g.scale.set(0,0,0);
        setTimeout(()=>scene.remove(o.g),300);
      } else {
        o.g.scale.setScalar(0.7+o.hp*0.15);
      }
      updateHUD(); return;
    }
  }
  // Rock clusters – yield stone
  for(const r of rocks){
    if(r.hp<=0) continue;
    if(d2(player,r)<r.size*1.8+1.5){
      if(r.size>=1.5&&pickaxeIdx<3){
        notify('⛏️ Du brauchst eine Eisenspitzhacke für diesen Felsen!'); return;
      }
      r.hp--;
      spawnChips(r.x,r.z,0x908878,5);
      const py3=PICKAXES[pickaxeIdx].yield;
      const yield_=(r.hp<=0?4:2)*py3; res.stone+=yield_;
      notify('🪨 +'+yield_+' Stein!'+(py3>1?` (⛏️ ×${py3})`:''));
      if(r.hp<=0){
        r.g.scale.set(0,0,0);
        setTimeout(()=>scene.remove(r.g),300);
      } else {
        r.g.scale.setScalar(0.6+r.hp/r.maxHp*0.4);
      }
      updateHUD(); return;
    }
  }
  // Setzling pflanzen wenn nichts in der Nähe
  if(res.seedling>0){
    res.seedling--;
    makeTree(player.x+rnd(-0.5,0.5), player.z+rnd(-0.5,0.5));
    notify('🌱 Baum gepflanzt!');
    updateHUD();
  } else {
    notify('Nichts in der Nähe.');
  }
}

// ══════════════════════════════════════════════════
//  MAIN LOOP
// ══════════════════════════════════════════════════
let T=0;
const clock=new THREE.Clock();
let refreshUI=0;


// ══════════════════════════════════════════════════
//  HP BARS (2D canvas overlay)
// ══════════════════════════════════════════════════
const hpCv=document.getElementById('hp-canvas');
const hpCtx=hpCv.getContext('2d');
hpCv.width=window.innerWidth; hpCv.height=window.innerHeight;
window.addEventListener('resize',()=>{hpCv.width=innerWidth;hpCv.height=innerHeight;});

function drawHPBar(worldX,worldY,worldZ,hp,maxHp,label,isEnemy,isBoss){
  const v=new THREE.Vector3(worldX,worldY,worldZ);
  v.project(cam);
  if(v.z>1||v.z<-1) return;
  const sx=(v.x*0.5+0.5)*hpCv.width;
  const sy=(-v.y*0.5+0.5)*hpCv.height;
  const w=isBoss?80:44, h=isBoss?9:5;
  const pct=Math.max(0,hp/maxHp);
  // BG
  hpCtx.fillStyle='rgba(0,0,0,0.6)';
  hpCtx.fillRect(sx-w/2-1,sy-h/2-1,w+2,h+2);
  // Bar BG
  hpCtx.fillStyle='rgba(80,20,20,0.8)';
  hpCtx.fillRect(sx-w/2,sy-h/2,w,h);
  // Bar fill
  const col=isBoss?`hsl(${pct*30},100%,50%)`:(isEnemy?`hsl(${pct*80+10},90%,45%)`:`hsl(${pct*110+10},85%,42%)`);
  hpCtx.fillStyle=col;
  hpCtx.fillRect(sx-w/2,sy-h/2,w*pct,h);
  // Label
  if(label){
    hpCtx.fillStyle=isBoss?'#ffcc44':'rgba(255,255,255,0.85)';
    hpCtx.font=isBoss?'bold 10px Cinzel,serif':'8px Cinzel,serif';
    hpCtx.textAlign='center';
    hpCtx.fillText(label,sx,sy-h/2-3);
  }
}

// ══════════════════════════════════════════════════
//  DRAGONS
// ══════════════════════════════════════════════════
function makeDragonMesh(){
  const g=new THREE.Group();
  // Body
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.9,3.5,8),MAT.dragon_body);
  body.rotation.z=Math.PI/2; body.position.set(0,0,0); body.castShadow=true; g.add(body);
  // Belly
  const belly=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.7,3.3,8),MAT.dragon_belly);
  belly.rotation.z=Math.PI/2; belly.position.set(0,-0.12,0); g.add(belly);
  // Neck
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.5,1.8,7),MAT.dragon_body);
  neck.position.set(2.0,0.5,0); neck.rotation.z=-0.5; g.add(neck);
  // Head
  const head=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.75,0.85),MAT.dragon_body);
  head.position.set(3.1,1.1,0); head.castShadow=true; g.add(head);
  // Snout
  const snout=new THREE.Mesh(new THREE.BoxGeometry(0.65,0.45,0.65),MAT.dragon_body);
  snout.position.set(3.75,0.95,0); g.add(snout);
  // Eyes
  [-0.3,0.3].forEach(ey=>{
    const eye=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6),MAT.dragon_eye);
    eye.position.set(3.2,1.35,ey); g.add(eye);
    const glow=new THREE.PointLight(0xff2200,1.5,3);
    glow.position.set(3.2,1.35,ey); g.add(glow);
  });
  // Horns
  [-0.25,0.25].forEach(hz=>{
    const horn=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.6,5),MAT.dragon_red);
    horn.position.set(3.0,1.8,hz); horn.rotation.z=0.3*(hz>0?1:-1); g.add(horn);
  });
  // Tail
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.5,3,6),MAT.dragon_body);
  tail.position.set(-2.6,-0.2,0); tail.rotation.z=0.4; g.add(tail);
  const tailTip=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.8,4),MAT.dragon_red);
  tailTip.position.set(-4.0,-0.5,0); tailTip.rotation.z=0.4; g.add(tailTip);
  // Wings
  [-1,1].forEach(side=>{
    const wingG=new THREE.Group();
    // Main wing spar
    const spar=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.06,3.5,6),MAT.dragon_dark);
    spar.rotation.z=side*0.5; spar.position.z=side*0.3; wingG.add(spar);
    // Wing membrane (wide flat box)
    const mem=new THREE.Mesh(new THREE.BoxGeometry(3.0,0.08,1.8),MAT.dragon_wing);
    mem.position.set(0,0,side*1.2); mem.rotation.z=side*0.3; wingG.add(mem);
    const mem2=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.06,1.2),MAT.dragon_wing);
    mem2.position.set(-0.5,0.3,side*2.0); mem2.rotation.z=side*0.4; wingG.add(mem2);
    wingG.position.set(0.2,0.6,0);
    g.add(wingG);
  });
  // Legs
  [[-0.8,0.8],[0.8,0.8],[-0.8,-0.8],[0.8,-0.8]].forEach(([lx,lz])=>{
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.14,1.0,6),MAT.dragon_body);
    leg.position.set(lx,-1.1,lz); g.add(leg);
    const claw=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.35,4),MAT.dragon_red);
    claw.position.set(lx,-1.65,lz); g.add(claw);
  });
  return g;
}

function spawnDragon(bossWave){
  const angle=Math.random()*Math.PI*2;
  const r=55+Math.random()*5;
  const sx=Math.cos(angle)*r, sz=Math.sin(angle)*r;
  const g=makeDragonMesh();
  const flyH=12+Math.random()*5;
  g.position.set(sx,flyH,sz);
  g.scale.setScalar(bossWave?2.2:1.4);
  scene.add(g);

  // Fire breath light
  const fireLight=new THREE.PointLight(0xff5500,0,8);
  g.add(fireLight);

  const maxHp=bossWave?2000:1000;
  dragons.push({
    g, x:sx, z:sz, y:flyH,
    hp:maxHp, maxHp,
    speed:bossWave?0.04:0.06,
    atk:bossWave?25:12,
    fireLight,
    state:'fliegt', // flying -> diving -> breathing -> retreating
    cooldown:3+Math.random()*2,
    wingPhase:Math.random()*Math.PI*2,
    dead:false, boss:bossWave,
    fireCooldown:0,
    targetAngle:angle+Math.PI,
  });

  // Show alert
  const al=document.getElementById('dragon-alert');
  document.getElementById('dragon-sub').textContent=bossWave?'🔥 Ein URALTER DRACHE greift an! Alle Waffen in Stellung!':'Ein Drache greift euer Königreich an!';
  al.classList.add('show');
  setTimeout(()=>al.classList.remove('show'),3000);
}

function spawnDragonFire(dx,dy,dz,tdx,tdz){
  const mat=new THREE.MeshBasicMaterial({color:0xff5500,transparent:true,opacity:0.9});
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(0.35,6,6),mat);
  mesh.position.set(dx,dy,dz);
  const glow=new THREE.PointLight(0xff4400,3,6);
  mesh.add(glow);
  scene.add(mesh);
  // Find closest enemy (friendly fire on enemies)
  let tgt=null, nd=9999;
  // Target the castle/player
  const targets=[{x:0,z:0},{x:player.x,z:player.z}];
  targets.forEach(t=>{
    const d=Math.sqrt((dx-t.x)**2+(dz-t.z)**2);
    if(d<nd){nd=d;tgt=t;}
  });
  projectiles.push({mesh,target:null,fireTarget:{x:tdx,z:tdz},speed:0.55,splash:3.5,dmg:8,type:'dragonfire',done:false,arc:false});
}


function killDragon(dr){
  if(dr.dead) return;
  dr.dead=true;
  // Epic death: dragon spirals down
  let fallT=0;
  const fallIv=setInterval(()=>{
    fallT+=0.05;
    dr.g.position.y=Math.max(0,dr.g.position.y-0.3);
    dr.g.rotation.z+=0.1;
    dr.g.scale.setScalar(Math.max(0.1,dr.boss?2.2-fallT*0.5:1.4-fallT*0.5));
    if(dr.g.position.y<=0||fallT>3){
      scene.remove(dr.g);
      clearInterval(fallIv);
      // Big explosion
      const ex=SP(3,8,new THREE.MeshBasicMaterial({color:0xff5500,transparent:true,opacity:0.9}));
      ex.position.set(dr.x,1,dr.z); scene.add(ex);
      const exL=new THREE.PointLight(0xff4400,15,20); ex.add(exL);
      let ef=0;
      const eti=setInterval(()=>{ef+=0.06;ex.material.opacity=0.9-ef;ex.scale.setScalar(1+ef*8);if(ef>0.9){scene.remove(ex);clearInterval(eti);}},30);
    }
  },50);
  const reward=dr.boss?400:150;
  res.gold+=reward; updateHUD();
  showBanner(dr.boss?'🏆 URALTER DRACHE BESIEGT!':'🐉 DRACHE BESIEGT!',`+${reward} Gold erbeutet! Großartig, tapferer Ritter!`);
}


// ══════════════════════════════════════════════════
//  SCHMIEDE & SCHWERTER
// ══════════════════════════════════════════════════
const SWORDS = {
  wood:    {name:'Holzschwert',    icon:'🪵', cost:{wood:8},           bonus:{atk:5},  color:0x7a5020, desc:'Einfach, aber besser als nichts'},
  stone:   {name:'Steinschwert',   icon:'🪨', cost:{stone:10,wood:4},  bonus:{atk:12}, color:0x888880, desc:'Solide und günstig'},
  iron:    {name:'Eisenschwert',   icon:'⚙️', cost:{metal:15,wood:5},  bonus:{atk:22}, color:0x9090aa, desc:'Das Schwert eines echten Ritters'},
  diamond: {name:'Diamantschwert', icon:'💎', cost:{stone:8,metal:20,gold:50}, bonus:{atk:40}, color:0x50d0ff, desc:'Unglaublich scharf und selten'},
  nether:  {name:'Roteisenklinge', icon:'🔴', cost:{metal:30,gold:80}, bonus:{atk:60,hp:50}, color:0xcc2244, desc:'Aus dem tiefsten Erz geschmiedet — Legendär!'},
};

const SMITHS = [
  {name:'Grummel der Lehrling', cost:40,  bonus:0,   desc:"Ich lern's noch, aber ich versuch's!"},
  {name:'Thorin der Schmied',   cost:100, bonus:0.15, desc:"20 Jahre am Amboss. Vertraut mir!"},
  {name:'Erika Meisterschmied', cost:200, bonus:0.3,  desc:"Meine Klingen haben Drachen getötet."},
];
let hiredSmith = null;

// Player weapon upgrade chain
const PLAYER_WEAPONS = [
  {key:'none',    name:'Fäuste',          icon:'👊', atk:0,  cost:null},
  {key:'wood',    name:'Holzschwert',     icon:'🪵', atk:15, cost:{wood:8}},
  {key:'stone',   name:'Steinschwert',    icon:'🪨', atk:25, cost:{stone:10,wood:4}},
  {key:'iron',    name:'Eisenschwert',    icon:'⚙️', atk:40, cost:{metal:15,wood:5}},
  {key:'diamond', name:'Diamantschwert',  icon:'💎', atk:70, cost:{metal:20,gold:50}},
  {key:'nether',  name:'Roteisenklinge',  icon:'🔴', atk:110,cost:{metal:30,gold:120}},
];
let playerWeaponIdx = 0; // index into PLAYER_WEAPONS

window.upgradePlayerWeapon = function() {
  if(smithies.length === 0) { notify('Baue zuerst eine Schmiede!'); return; }
  const next = PLAYER_WEAPONS[playerWeaponIdx + 1];
  if(!next) { notify('🔴 Deine Waffe ist bereits auf dem höchsten Level!'); return; }
  for(const [k,v] of Object.entries(next.cost)) {
    if((res[k]||0) < v) { notify(`Nicht genug ${k==='wood'?'Holz':k==='stone'?'Stein':k==='metal'?'Metall':'Gold'}!`); return; }
  }
  for(const [k,v] of Object.entries(next.cost)) res[k] -= v;
  updateHUD();
  const prev = PLAYER_WEAPONS[playerWeaponIdx];
  player.atk += (next.atk - prev.atk);
  playerWeaponIdx++;
  // Update sword mesh color
  const blade = player.g.children[7];
  if(blade) blade.material = lm(next.key==='wood'?0x7a5020:next.key==='stone'?0x888880:next.key==='iron'?0x9090aa:next.key==='diamond'?0x50d0ff:0xcc2244, next.key==='diamond'?0x0a1a20:next.key==='nether'?0x220010:0);
  smithies.forEach(s => { s.light.intensity=14; setTimeout(()=>s.light.intensity=2,700); });
  notify(`⚒️ Waffe aufgerüstet: ${next.icon} ${next.name}! ATK: ${player.atk}`);
  renderSmithyBody();
};

// Spitzhacken-System
const PICKAXES = [
  {key:'none',    name:'Keine',            icon:'✋', yield:1,  cost:null},
  {key:'wood',    name:'Holzspitzhacke',   icon:'🪵', yield:2,  cost:{wood:12}},
  {key:'stone',   name:'Steinspitzhacke',  icon:'🪨', yield:3,  cost:{stone:15,wood:5}},
  {key:'iron',    name:'Eisenspitzhacke',  icon:'⚙️', yield:4,  cost:{metal:18,wood:6}},
  {key:'diamond', name:'Diamantspitzhacke',icon:'💎', yield:6,  cost:{metal:25,gold:60}},
];
let pickaxeIdx=0; // aktuelles Level

window.craftPickaxe=function(){
  if(smithies.length===0){notify('Baue zuerst eine Schmiede!');return;}
  const next=PICKAXES[pickaxeIdx+1];
  if(!next){notify('⛏️ Spitzhacke ist bereits auf dem höchsten Level!');return;}
  for(const [k,v] of Object.entries(next.cost)){
    if((res[k]||0)<v){notify(`Nicht genug ${k==='wood'?'Holz':k==='stone'?'Stein':k==='metal'?'Metall':'Gold'}!`);return;}
  }
  for(const [k,v] of Object.entries(next.cost)) res[k]-=v;
  updateHUD(); pickaxeIdx++;
  smithies.forEach(s=>{s.light.intensity=14;setTimeout(()=>s.light.intensity=2,700);});
  notify(`⛏️ ${next.icon} ${next.name} gecraftet! Abbau-Ertrag: ×${next.yield}`);
  renderSmithyBody();
};

let smithyTabActive = 'schwerter';
window.smithyTab = function(tab) {
  smithyTabActive = tab;
  document.getElementById('stab-schwerter').style.background = tab==='schwerter' ? 'rgba(200,160,70,0.35)' : '';
  document.getElementById('stab-schmied').style.background  = tab==='schmied'  ? 'rgba(200,160,70,0.35)' : '';
  document.getElementById('stab-aufrüsten').style.background= tab==='aufrüsten'? 'rgba(200,160,70,0.35)' : '';
  document.getElementById('stab-werkzeuge').style.background= tab==='werkzeuge'? 'rgba(200,160,70,0.35)' : '';
  renderSmithyBody();
};

function renderSmithyBody() {
  const el = document.getElementById('smithy-body');
  if(!el) return;
  if(smithyTabActive === 'schwerter') {
    let html = '';
    Object.entries(SWORDS).forEach(([key, sw]) => {
      const costStr = Object.entries(sw.cost).map(([k,v])=>`${v}${k==='wood'?'🪵':k==='stone'?'🪨':k==='metal'?'⚙️':'💰'}`).join(' ');
      const bonusStr = Object.entries(sw.bonus).map(([k,v])=>`+${v} ${k==='atk'?'ATK':'HP'}`).join(', ');
      html += `<div class="modal-item">
        <div class="mi-info">
          <div class="mi-name">${sw.icon} ${sw.name}</div>
          <div class="mi-cost">${costStr} | ${bonusStr}</div>
          <div class="mi-stat" style="color:rgba(180,180,180,0.6);font-style:italic;">"${sw.desc}"</div>
        </div>
        <button class="mi-btn" onclick="forgeSword('${key}')">SCHMIEDEN</button>
      </div>`;
    });
    if(hiredSmith) html += `<p style="font-family:'Crimson Text',serif;font-size:11px;color:rgba(100,220,100,0.7);margin-top:8px;">⚒️ ${hiredSmith.name} arbeitet: +${Math.round(hiredSmith.bonus*100)}% Bonus-ATK</p>`;
    el.innerHTML = html;
  } else if(smithyTabActive === 'schmied') {
    let html = '';
    SMITHS.forEach((sm, i) => {
      const owned = hiredSmith && hiredSmith.name === sm.name;
      html += `<div class="modal-item">
        <div class="mi-info">
          <div class="mi-name">👨‍🔧 ${sm.name} ${owned?'✅':''}</div>
          <div class="mi-cost">${sm.cost} Gold/einmalig | +${Math.round(sm.bonus*100)}% Schmied-Bonus</div>
          <div class="mi-stat" style="font-family:'Crimson Text',serif;font-style:italic;color:rgba(180,160,120,0.7);">${sm.desc}</div>
        </div>
        ${owned ? '<span style="font-size:10px;color:var(--green)">✅ Angestellt</span>' : `<button class="mi-btn" onclick="hireSmith(${i})">ANSTELLEN</button>`}
      </div>`;
    });
    el.innerHTML = html;
  } else if(smithyTabActive === 'aufrüsten') {
    const cur = PLAYER_WEAPONS[playerWeaponIdx];
    const next = PLAYER_WEAPONS[playerWeaponIdx + 1];
    let html = `<div style="text-align:center;margin-bottom:10px;">`;
    html += `<div style="font-size:13px;color:var(--gold);margin-bottom:4px;">AKTUELLE WAFFE</div>`;
    html += `<div style="font-size:22px;">${cur.icon} ${cur.name}</div>`;
    html += `<div style="font-size:11px;color:rgba(180,180,180,0.7);">ATK: ${player.atk}</div>`;
    html += `</div>`;
    // Upgrade chain overview
    html += `<div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-bottom:12px;flex-wrap:wrap;">`;
    PLAYER_WEAPONS.forEach((w,i)=>{
      const done = i <= playerWeaponIdx;
      const isCur = i === playerWeaponIdx;
      html += `<span style="font-size:16px;opacity:${done?1:0.3};${isCur?'border-bottom:2px solid gold;':''}">${w.icon}</span>`;
      if(i < PLAYER_WEAPONS.length-1) html += `<span style="opacity:0.4;font-size:10px;">→</span>`;
    });
    html += `</div>`;
    if(next) {
      const costStr = Object.entries(next.cost).map(([k,v])=>`${v}${k==='wood'?'🪵':k==='stone'?'🪨':k==='metal'?'⚙️':'💰'}`).join(' ');
      html += `<div class="modal-item">
        <div class="mi-info">
          <div class="mi-name">${next.icon} Aufrüsten: ${next.name}</div>
          <div class="mi-cost">Kosten: ${costStr} | ATK: ${player.atk} → ${player.atk+(next.atk-cur.atk)}</div>
        </div>
        <button class="mi-btn" onclick="upgradePlayerWeapon()">AUFRÜSTEN</button>
      </div>`;
    } else {
      html += `<div style="text-align:center;font-size:13px;color:rgba(200,100,100,0.8);margin-top:12px;">🔴 Höchstes Level erreicht!</div>`;
    }
    el.innerHTML = html;
  } else if(smithyTabActive === 'werkzeuge') {
    const cur=PICKAXES[pickaxeIdx];
    const next=PICKAXES[pickaxeIdx+1];
    let html=`<div style="text-align:center;margin-bottom:10px;">`;
    html+=`<div style="font-size:13px;color:var(--gold);margin-bottom:4px;">AKTUELLE SPITZHACKE</div>`;
    html+=`<div style="font-size:22px;">${cur.icon} ${cur.name}</div>`;
    html+=`<div style="font-size:11px;color:rgba(180,180,180,0.7);">Abbau-Ertrag: ×${cur.yield}</div>`;
    html+=`</div>`;
    html+=`<div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-bottom:12px;">`;
    PICKAXES.forEach((p,i)=>{
      const done=i<=pickaxeIdx, isCur=i===pickaxeIdx;
      html+=`<span style="font-size:16px;opacity:${done?1:0.3};${isCur?'border-bottom:2px solid gold;':''}">${p.icon}</span>`;
      if(i<PICKAXES.length-1) html+=`<span style="opacity:0.4;font-size:10px;">→</span>`;
    });
    html+=`</div>`;
    if(next){
      const costStr=Object.entries(next.cost).map(([k,v])=>`${v}${k==='wood'?'🪵':k==='stone'?'🪨':k==='metal'?'⚙️':'💰'}`).join(' ');
      html+=`<div class="modal-item">
        <div class="mi-info">
          <div class="mi-name">${next.icon} ${next.name}</div>
          <div class="mi-cost">Kosten: ${costStr} | Ertrag: ×${cur.yield} → ×${next.yield}</div>
        </div>
        <button class="mi-btn" onclick="craftPickaxe()">CRAFTEN</button>
      </div>`;
    } else {
      html+=`<div style="text-align:center;font-size:13px;color:rgba(200,100,100,0.8);margin-top:12px;">💎 Höchste Spitzhacke bereits gecraftet!</div>`;
    }
    el.innerHTML=html;
  }
}

window.forgeSword = function(key) {
  if(smithies.length === 0) { notify('Baue zuerst eine Schmiede!'); return; }
  const sw = SWORDS[key];
  for(const [k,v] of Object.entries(sw.cost)) {
    if((res[k]||0) < v) { notify(`Nicht genug ${k==='wood'?'Holz':k==='stone'?'Stein':k==='metal'?'Metall':'Gold'}!`); return; }
  }
  for(const [k,v] of Object.entries(sw.cost)) res[k] -= v;
  updateHUD();
  // Apply to all knights (and spear/cavalry)
  let buffed = 0;
  const smithBonus = hiredSmith ? hiredSmith.bonus : 0;
  playerUnits.forEach(u => {
    if(['knight','spear','cavalry'].includes(u.type)) {
      const bonus = Math.round(sw.bonus.atk * (1 + smithBonus));
      u.atk += bonus;
      if(sw.bonus.hp) { u.hp += sw.bonus.hp; u.maxHp += sw.bonus.hp; }
      buffed++;
    }
  });
  notify(`⚒️ ${sw.icon} ${sw.name} geschmiedet! +${Math.round(sw.bonus.atk*(1+smithBonus))} Angriff auf ${buffed} Einheiten!`);
  // Forge flash on all smithies
  smithies.forEach(s => {
    s.light.intensity = 12;
    setTimeout(() => s.light.intensity = 2, 600);
  });
};

window.hireSmith = function(i) {
  const sm = SMITHS[i];
  if(res.gold < sm.cost) { notify('Nicht genug Gold!'); return; }
  res.gold -= sm.cost; updateHUD();
  hiredSmith = sm;
  notify(`👨‍🔧 ${sm.name} angestellt! Schmiedebonus: +${Math.round(sm.bonus*100)}%`);
  renderSmithyBody();
};

function openSmithyModal() {
  document.getElementById('smithy-flavor').textContent = smithies.length > 0
    ? '"Was braucht Ihr, Ritter? Bei mir brennt immer das Feuer!"'
    : '"Baut zuerst eine Schmiede, dann kommt zu mir!"';
  smithyTabActive = 'schwerter';
  renderSmithyBody();
  document.getElementById('modal-smithy').classList.add('show');
}


function updatePlayerHP(){
  const pct=Math.max(0,player.hp/player.maxHp*100);
  const fill=document.getElementById('player-hp-fill');
  const txt=document.getElementById('player-hp-text');
  if(fill) fill.style.width=pct+'%';
  if(fill) fill.style.background=pct>50?'linear-gradient(90deg,#228822,#44cc44)':pct>25?'linear-gradient(90deg,#aa6600,#ffaa00)':'linear-gradient(90deg,#cc2222,#ff4444)';
  if(txt) txt.textContent=Math.ceil(player.hp)+'/'+player.maxHp;
  const fpct=Math.max(0,player.hunger/player.maxHunger*100);
  const ffill=document.getElementById('player-food-fill');
  const ftxt=document.getElementById('player-food-text');
  if(ffill) ffill.style.width=fpct+'%';
  if(ffill) ffill.style.background=fpct>40?'linear-gradient(90deg,#a06010,#e08820)':'linear-gradient(90deg,#882200,#cc4400)';
  if(ftxt) ftxt.textContent=Math.ceil(player.hunger)+'/'+player.maxHunger;
}

function respawnPlayer(){
  player.hp=player.maxHp;
  player.hunger=player.maxHunger;
  player.x=0; player.z=8;
  player.g.position.set(0,0,8);
  player.poisoned=0;
  player.damageCool=2;
  document.getElementById('poison-veil').style.opacity='0';
  updatePlayerHP();
  notify('💀 Du bist gestorben! Respawn mit halben HP.',3000);
}

function animate(){
  requestAnimationFrame(animate);
  if(paused){ren.render(scene,cam);return;}
  const dt=Math.min(clock.getDelta(),0.05);
  T+=dt;

  // ── Day/Night ──
  dayTime+=dt/150;
  if(dayTime>1){
    dayTime=0; dayNum++;
    // Daily income
    res.gold+=5+markets.length*10;
    res.food+=farms.length*3;
    res.food-=Math.ceil(playerUnits.filter(u=>!u.dead).length*0.5);
    res.food=Math.max(0,res.food);
    updateHUD();
    document.getElementById('day-chip').textContent=(dayNum%2===0?'🌙':'☀️')+' TAG '+dayNum;
    notify(dayNum%2===0?`🌙 Nacht ${dayNum} — ${markets.length*10+5} Gold Einnahmen`:`☀️ Guten Morgen! Farmen liefern: +${farms.length*3} Nahrung`);
  }
  const night=dayTime>0.72||dayTime<0.08;
  if(night!==isNight){
    isNight=night;
    sun.intensity=night?0.2:5.0; sun.color.setHex(night?0x223366:0xfffbe8);
    scene.background.setHex(night?0x04020a:0x87bdee);
    scene.fog.color.setHex(night?0x04020a:0x87bdee);
    scene.fog.near=night?15:60; scene.fog.far=night?100:210;
    ambLight.color.setHex(night?0x112244:0x94ccff);
    ambLight.groundColor.setHex(night?0x050a05:0x4a8020);
    ambLight.intensity=night?0.5:2.2;
  }

  // ── Player ──
  let mx=0,mz=0;
  if(K['w']||K['arrowup']) mz-=1;
  if(K['s']||K['arrowdown']) mz+=1;
  if(K['a']||K['arrowleft']) mx-=1;
  if(K['d']||K['arrowright']) mx+=1;
  if(mx||mz){
    const a=camTheta;
    const nx=mx*Math.cos(a)-mz*Math.sin(a);
    const nz=mx*Math.sin(a)+mz*Math.cos(a);
    let npx=Math.max(-58,Math.min(58,player.x+nx*player.speed));
    let npz=Math.max(-58,Math.min(58,player.z+nz*player.speed));
    // Collision with rocks and mountains
    const PR=0.6;
    obstacles.forEach(o=>{
      const odx=npx-o.x, odz=npz-o.z;
      const od=Math.sqrt(odx*odx+odz*odz);
      if(od<PR+o.r&&od>0.01){
        const push=(PR+o.r-od)/od;
        npx+=odx*push; npz+=odz*push;
      }
    });
    player.x=npx; player.z=npz;
    player.g.position.set(player.x,0,player.z);
    player.g.rotation.y=Math.atan2(nx,nz)+Math.PI;
    player.g.children[0].position.y=0.8+Math.sin(T*10)*0.045;
  }
  // Angriffs-Cooldown & Schaden-Cooldown
  player.atkCool=Math.max(0,player.atkCool-dt);
  player.damageCool=Math.max(0,player.damageCool-dt);
  // Hunger sinkt langsam
  player.hunger=Math.max(0,player.hunger-dt*0.2);
  if(player.hunger<=0&&player.damageCool<=0){
    player.hp=Math.max(0,player.hp-dt*3);
    player.damageCool=0; // Dauerschaden wenn verhungert
    if(player.hp<=0) respawnPlayer();
  }
  // HP-Regeneration wenn satt und nicht vergiftet
  if(player.hp<player.maxHp&&player.poisoned<=0&&player.hunger>20){
    player.hp=Math.min(player.maxHp,player.hp+dt*2);
  }
  updatePlayerHP();
  if(player.swordSwing>0){
    player.swordSwing=Math.max(0,player.swordSwing-dt*4);
    // Schwert (child index 7 = blade) schwingt nach vorne
    const blade=player.g.children[7];
    if(blade) blade.rotation.x=-player.swordSwing*1.4;
  }

  // ── Units ──
  playerUnits.forEach(u=>{
    if(u.dead) return;
    u.cooldown=Math.max(0,u.cooldown-dt);

    if(u._dest){
      const dx=u._dest.x-u.x, dz=u._dest.z-u.z;
      const dd=Math.sqrt(dx*dx+dz*dz);
      if(dd>0.5){
        u.x+=dx/dd*u.spd; u.z+=dz/dd*u.spd;
        u.g.position.set(u.x,0,u.z);
        u.g.rotation.y=Math.atan2(dx,dz);
      } else { u._dest=null; u.state='ruhig'; }
    }

    // Find enemy target — Ritter greifen IMMER an, unbegrenzte Reichweite
    if(!u.target||u.target.dead) u.target=null;
    if(!u.target&&u.state!=='bewegt'){
      let nearest=null,nd=9999;
      enemies.forEach(en=>{
        if(en.dead) return;
        const dd=d2(u,en);
        if(dd<nd){nearest=en;nd=dd;}
      });
      // Ritter: keine Reichweitenbeschränkung — greifen immer den nächsten an!
      const maxRange = u.type==='knight' ? 9999
        : (u.type==='archer'||u.type==='mage' ? u.range : u.range+20);
      if(nearest && d2(u,nearest)<maxRange) u.target=nearest;

      // Ritter & Kavallerie greifen auch Drachen an
      if(u.type==='knight'||u.type==='cavalry'){
        dragons.forEach(dr=>{
          if(dr.dead) return;
          const dd=d2(u,dr);
          if(dd<nd){ nearest=null; u._dragonTarget=dr; nd=dd; }
        });
      }
    }

    // Drachen-Angriff für Ritter
    if(u._dragonTarget&&!u._dragonTarget.dead){
      const dd=d2(u,u._dragonTarget);
      if(dd>4){
        const dx=u._dragonTarget.x-u.x, dz=u._dragonTarget.z-u.z;
        const d=Math.sqrt(dx*dx+dz*dz);
        u.x+=dx/d*u.spd; u.z+=dz/d*u.spd;
        u.g.position.set(u.x,0,u.z);
        u.g.rotation.y=Math.atan2(dx,dz);
        u.state='bewegt';
      } else if(u.cooldown<=0){
        u.state='kämpft';
        const dmg=u.atkMin?u.atkMin+Math.random()*(u.atkMax-u.atkMin):u.atk;
        u._dragonTarget.hp-=dmg;
        if(u._dragonTarget.hp<=0) killDragon(u._dragonTarget);
        u.cooldown=0.6;
        u._dragonTarget=null;
      }
    } else if(u.target&&!u.target.dead){
      const dd=d2(u,u.target);
      if(dd>u.range){
        const dx=u.target.x-u.x, dz=u.target.z-u.z;
        const d=Math.sqrt(dx*dx+dz*dz);
        u.x+=dx/d*u.spd; u.z+=dz/d*u.spd;
        u.g.position.set(u.x,0,u.z);
        u.g.rotation.y=Math.atan2(dx,dz);
        u.state='bewegt';
      } else if(u.cooldown<=0){
        u.state='kämpft';
        const ptype=(u.type==='archer'?'arrow':u.type==='mage'?'magic':'arrow');
        if(u.type==='knight'||u.type==='spear'||u.type==='cavalry'){
          // Zufälliger Schaden zwischen atkMin und atkMax
          const dmg=u.atkMin ? u.atkMin+Math.random()*(u.atkMax-u.atkMin) : u.atk;
          u.target.hp-=dmg*dt*2;
          if(u.target.hp<=0) killEnemy(u.target);
          u.cooldown=0.5;
        } else {
          fireAt(u.x,1.8,u.z,u.target,ptype);
          u.cooldown=u.type==='archer'?1.2:1.8;
        }
      }
    } else { u.state='ruhig'; u._dragonTarget=null; }

    // Walking animation
    u.wobble+=dt*4;
    if(u.g.children[0]) u.g.children[0].position.y=(u.state!=='ruhig'?0.8+Math.sin(u.wobble)*0.05:0.8);
  });

  // ── Enemies ──
  let alive=0;
  enemies.forEach(en=>{
    if(en.dead) return; alive++;
    const dx=-en.x, dz=-en.z;
    const d=Math.sqrt(dx*dx+dz*dz);
    // Feind greift Spieler an wenn nah
    const dpx=en.x-player.x, dpz=en.z-player.z;
    const dp=Math.sqrt(dpx*dpx+dpz*dpz);
    if(dp<2.2&&player.damageCool<=0){
      player.hp=Math.max(0,player.hp-en.atk*0.4);
      player.damageCool=1.2;
      updatePlayerHP();
      notify(`💥 Feind trifft dich! -${Math.round(en.atk*0.4)} HP`,1000);
      if(player.hp<=0) respawnPlayer();
    }
    if(d<4.5){
      castleHP-=dt*4;
      updateHUD();
      if(castleHP<=0&&!gameOver){
        gameOver=true; showBanner('🔥 DIE BURG FIEL 🔥','Dein Königreich ist verloren... Lade die Seite neu!');
      }
    } else {
      en.x+=dx/d*en.speed; en.z+=dz/d*en.speed;
      en.g.position.set(en.x,0,en.z);
      en.g.rotation.y=Math.atan2(-dx,-dz);
      // Walk bob
      if(en.g.children[0]) en.g.children[0].position.y=0.82+Math.sin(T*7+en.wobble)*0.06;
      // Wall check
      const{gx,gz}=w2g(en.x,en.z);
      const k=gk(gx,gz);
      if(cells[k]&&cells[k].type!=='center'){
        en.x-=dx/d*en.speed*2.5; en.z-=dz/d*en.speed*2.5;
        en.hp-=dt*1.5;
        if(en.hp<=0) killEnemy(en);
      }
    }
  });
  // Remove dead
  for(let i=enemies.length-1;i>=0;i--) if(enemies[i].dead) enemies.splice(i,1);
  for(let i=playerUnits.length-1;i>=0;i--) if(playerUnits[i].dead) playerUnits.splice(i,1);

  // ── Dragons ──
  dragons.forEach(dr=>{
    if(dr.dead) return;
    dr.wingPhase+=dt*3;
    dr.cooldown=Math.max(0,dr.cooldown-dt);
    dr.fireCooldown=Math.max(0,dr.fireCooldown-dt);

    // Wing flap animation
    dr.g.children.forEach((c,idx)=>{
      if(c.isGroup) c.rotation.x=Math.sin(dr.wingPhase+(idx%2)*Math.PI)*0.4;
    });
    // Body bob in flight
    dr.g.position.y=dr.y+Math.sin(dr.wingPhase*0.5)*0.8;
    dr.g.rotation.z=Math.sin(dr.wingPhase*0.3)*0.05;

    if(dr.state==='fliegt'){
      // Circle around castle, slowly descend to attack
      dr.targetAngle+=dt*0.4*(dr.boss?0.7:1);
      const tr=28+Math.sin(dr.wingPhase*0.2)*5;
      const tx=Math.cos(dr.targetAngle)*tr;
      const tz=Math.sin(dr.targetAngle)*tr;
      dr.x+=(tx-dr.x)*dt*0.6;
      dr.z+=(tz-dr.z)*dt*0.6;
      dr.y=lerp(dr.y,10+Math.sin(dr.wingPhase*0.3)*3,dt*0.5);
      dr.g.position.set(dr.x,dr.g.position.y,dr.z);
      dr.g.rotation.y=dr.targetAngle+Math.PI/2;

      // Fire breath at intervals
      if(dr.fireCooldown<=0){
        // Pick target - castle or player
        const fireX=Math.random()<0.6?0:player.x+rnd(-3,3);
        const fireZ=Math.random()<0.6?0:player.z+rnd(-3,3);
        spawnDragonFire(dr.x,dr.g.position.y-1,dr.z,fireX,fireZ);
        dr.fireLight.intensity=8;
        setTimeout(()=>{if(dr.fireLight) dr.fireLight.intensity=0;},300);
        dr.fireCooldown=dr.boss?1.5:2.5;
      }

      // Units attack dragon
      if(dr.cooldown<=0){
        // Dragon swoops
        dr.state='sturzflug'; dr.cooldown=5;
        dr.diveTarget={x:rnd(-5,5),z:rnd(-5,5)};
      }
    } else if(dr.state==='sturzflug'){
      const tx=dr.diveTarget.x, tz=dr.diveTarget.z;
      dr.x+=(tx-dr.x)*dt*1.5;
      dr.z+=(tz-dr.z)*dt*1.5;
      dr.y=lerp(dr.y,5,dt*2);
      dr.g.position.set(dr.x,dr.g.position.y,dr.z);
      dr.g.rotation.y=Math.atan2(tx-dr.x,tz-dr.z);
      // Claw attack on arrival
      if(Math.abs(dr.x-tx)<2&&Math.abs(dr.z-tz)<2){
        castleHP-=dr.atk; updateHUD();
        playerUnits.forEach(u=>{if(!u.dead&&d2(u,{x:tx,z:tz})<5){u.hp-=dr.atk*0.7;if(u.hp<=0)u.dead=true;}});
        notify(`🐉 Drache schlägt zu! -${dr.atk} HP an der Burg!`);
        dr.state='rückzug'; dr.cooldown=3;
      }
    } else if(dr.state==='rückzug'){
      dr.y=lerp(dr.y,14,dt*1.5);
      dr.g.position.y=dr.y;
      if(dr.cooldown<=0) dr.state='fliegt';
    }

    // Player units attack dragon
    playerUnits.forEach(u=>{
      if(u.dead) return;
      const dd=d2(u,dr);
      if(dd<(u.type==='archer'||u.type==='mage'?u.range+5:6)&&u.cooldown<=0){
        if(u.type==='archer') fireAt(u.x,1.8,u.z,{x:dr.x,z:dr.z,hp:dr.hp,dead:false,isDragon:true,_dr:dr},u.type==='mage'?'magic':'arrow');
        else if(u.type==='knight'||u.type==='spear'||u.type==='cavalry'){
          if(dd<5){dr.hp-=u.atk*dt*1.5;}
        }
        u.cooldown=(u.type==='archer'?1.2:0.8);
      }
    });
    // Towers attack dragon
    archerTowers.forEach(at=>{
      const dd=d2({x:at.wx,z:at.wz},dr);
      at.cooldown-=dt;
      if(dd<20&&at.cooldown<=0){
        const fakeTgt={x:dr.x,z:dr.z,hp:dr.hp,dead:false,isDragon:true,_dr:dr};
        fireAt(at.wx,7.5,at.wz,fakeTgt,'arrow');
        at.cooldown=0.9;
      }
    });
    // Cannon & catapult
    cannons.forEach(c=>{
      if(d2({x:c.wx,z:c.wz},dr)<22&&c.cooldown<=0){
        dr.hp-=15; c.cooldown=2.5;
        const fl=new THREE.PointLight(0xff8800,8,5); fl.position.set(c.wx,1,c.wz); scene.add(fl);
        setTimeout(()=>scene.remove(fl),120);
        if(dr.hp<=0) killDragon(dr);
      }
    });
    catapults.forEach(c=>{
      if(d2({x:c.wx,z:c.wz},dr)>6&&d2({x:c.wx,z:c.wz},dr)<30&&c.cooldown<=0){
        dr.hp-=20; c.cooldown=3;
        if(dr.hp<=0) killDragon(dr);
      }
    });

    if(dr.hp<=0) killDragon(dr);
  });
  for(let i=dragons.length-1;i>=0;i--) if(dragons[i].dead) dragons.splice(i,1);

  // Wave end
  if(waveActive===true&&alive===0&&enemies.length===0&&dragons.filter(d=>!d.dead).length===0){
    waveActive='endet';
    setTimeout(()=>{
      waveActive=false;
      const bonus=20+waveNum*10;
      res.gold+=bonus; updateHUD(); waveNum++;
      showBanner('✅ WELLE ÜBERSTANDEN!',`+${bonus} Gold erbeutet — Weiter bauen und stärker werden!`);
      refreshSidePanel();
    },1500);
  }

  // ── Towers ──
  archerTowers.forEach(at=>{
    at.cooldown-=dt;
    if(at.cooldown>0) return;
    let nearest=null,nd=99;
    enemies.forEach(en=>{
      if(en.dead) return;
      const dd=d2({x:at.wx,z:at.wz},{x:en.x,z:en.z});
      if(dd<16&&dd<nd){nearest=en;nd=dd;}
    });
    if(nearest){fireAt(at.wx,7.5,at.wz,nearest,'arrow');at.cooldown=1.1+Math.random()*0.4;}
  });

  // ── Catapults ──
  catapults.forEach(cat=>{
    cat.cooldown-=dt;
    if(cat.cooldown>0) return;
    let nearest=null,nd=99;
    enemies.forEach(en=>{
      if(en.dead) return;
      const dd=d2({x:cat.wx,z:cat.wz},{x:en.x,z:en.z});
      if(dd>6&&dd<28&&dd<nd){nearest=en;nd=dd;}
    });
    if(nearest){fireAt(cat.wx,1.8,cat.wz,nearest,'catapult');cat.cooldown=3.5;}
    cat.g.rotation.y+=dt*0.5;
  });

  // ── Cannons ──
  cannons.forEach(can=>{
    can.cooldown-=dt;
    if(can.cooldown>0) return;
    let nearest=null,nd=99;
    enemies.forEach(en=>{
      if(en.dead) return;
      const dd=d2({x:can.wx,z:can.wz},{x:en.x,z:en.z});
      if(dd<22&&dd<nd){nearest=en;nd=dd;}
    });
    if(nearest){
      fireAt(can.wx,1.2,can.wz,nearest,'cannon');can.cooldown=2.8;
      const fl=new THREE.PointLight(0xff8800,8,5);
      fl.position.set(can.wx,1,can.wz); scene.add(fl);
      setTimeout(()=>scene.remove(fl),120);
    }
  });

  // ── Riesenarmbrust ──
  crossbows.forEach(cb=>{
    if(cb.dead) return;
    cb.cooldown-=dt;
    // Enemies damage crossbow on contact
    enemies.forEach(en=>{
      if(en.dead) return;
      if(d2({x:cb.wx,z:cb.wz},{x:en.x,z:en.z})<2.5){
        cb.hp-=en.speed*dt*80;
        if(cb.hp<=0&&!cb.dead){
          cb.dead=true;
          scene.remove(cb.g);
          notify('💥 Riesenarmbrust zerstört!');
        }
      }
    });
    if(cb.cooldown>0) return;
    let nearest=null,nd=99;
    // Target enemies AND dragons (pierces through all)
    const allTargets=[...enemies,...dragons.filter(d=>!d.dead).map(d=>({x:d.x,z:d.z,hp:d.hp,dead:d.dead,isDragon:true,_dr:d}))];
    allTargets.forEach(en=>{
      if(en.dead) return;
      const dd=d2({x:cb.wx,z:cb.wz},{x:en.x,z:en.z});
      if(dd<30&&dd<nd){nearest=en;nd=dd;}
    });
    if(nearest){
      // Crossbow points toward target
      cb.g.rotation.y=Math.atan2(nearest.x-cb.wx, nearest.z-cb.wz);
      fireAt(cb.wx,2.2,cb.wz,nearest,'crossbow');
      cb.cooldown=2.0;
      // Recoil flash
      const fl2=new THREE.PointLight(0xffdd88,6,4);
      fl2.position.set(cb.wx,2,cb.wz); scene.add(fl2);
      setTimeout(()=>scene.remove(fl2),100);
    }
  });

  // ── Projectiles ──
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    if(p.done){projectiles.splice(i,1);continue;}
    if(p.type==='dragonfire'){
      // Dragonfire moves toward fireTarget
      const ft=p.fireTarget;
      const dx2=ft.x-p.mesh.position.x, dy2=0-p.mesh.position.y+0.5, dz2=ft.z-p.mesh.position.z;
      const dd2=Math.sqrt(dx2*dx2+dy2*dy2+dz2*dz2);
      if(dd2<1.5){
        // Hit! Damage castle & nearby units
        castleHP-=p.dmg; updateHUD();
        playerUnits.forEach(u=>{if(!u.dead&&d2(u,{x:ft.x,z:ft.z})<p.splash){u.hp-=p.dmg*0.5;if(u.hp<=0)u.dead=true;}});
        if(d2(player,{x:ft.x,z:ft.z})<p.splash*1.5) notify('🔥 Drachenfeuer! Dein Ritter wurde getroffen!');
        const fl=SP(1.2,6,new THREE.MeshBasicMaterial({color:0xff5500,transparent:true,opacity:0.9}));
        fl.position.set(ft.x,1,ft.z); scene.add(fl);
        const flL=new THREE.PointLight(0xff4400,8,10); fl.add(flL);
        let lf3=0;
        const ti3=setInterval(()=>{lf3+=0.08;fl.material.opacity=0.9-lf3;fl.scale.setScalar(1+lf3*5);if(lf3>0.9){scene.remove(fl);clearInterval(ti3);}},30);
        scene.remove(p.mesh); projectiles.splice(i,1);
      } else {
        p.mesh.position.x+=dx2/dd2*p.speed;
        p.mesh.position.y+=dy2/dd2*p.speed*0.3;
        p.mesh.position.z+=dz2/dd2*p.speed;
      }
      continue;
    }
    if(!p.target||p.target.dead){scene.remove(p.mesh);projectiles.splice(i,1);continue;}
    const tx=p.target.x, tz=p.target.z, ty=1.2;
    const dx=tx-p.mesh.position.x, dy=ty-p.mesh.position.y, dz=tz-p.mesh.position.z;
    const dd=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(dd<0.8){
      // Hit!
      if(p.splash>0){
        enemies.forEach(en=>{
          if(en.dead) return;
          if(d2({x:tx,z:tz},{x:en.x,z:en.z})<p.splash) en.hp-=p.dmg;
          if(en.hp<=0) killEnemy(en);
        });
      }
      if(p.target&&p.target.isDragon&&p.target._dr){
        p.target._dr.hp-=p.dmg*2;
        if(p.target._dr.hp<=0) killDragon(p.target._dr);
      } else if(p.target&&!p.target.isDragon&&!p.splash) {
        p.target.hp-=p.dmg;
        if(p.target.hp<=0) killEnemy(p.target);
      }
      // Hit flash
      const fl2=SP(p.splash>0?0.9:0.5,6,new THREE.MeshBasicMaterial({color:p.type==='cannon'?0xffaa00:p.type==='magic'?0x8888ff:0xff6600,transparent:true,opacity:0.85}));
      fl2.position.set(tx,ty,tz); scene.add(fl2);
      let lf2=0;
      const ti2=setInterval(()=>{lf2+=0.12;fl2.material.opacity=0.85-lf2;fl2.scale.setScalar(1+lf2*(p.splash>0?4:2));if(lf2>0.85){scene.remove(fl2);clearInterval(ti2);}},25);
      scene.remove(p.mesh); projectiles.splice(i,1);
    } else {
      // Arc trajectory — all ranged weapons fly over friendly units
      const totalDist = p._totalDist || (()=>{
        const tdx=tx-p.mesh.position.x, tdz=tz-p.mesh.position.z;
        p._totalDist = Math.sqrt(tdx*tdx+tdz*tdz);
        return p._totalDist;
      })();
      // Progress 0→1
      const progress = 1 - dd / (totalDist||1);
      // Parabolic height: peaks at midpoint, ensures minHeight clearance
      const peakH = (p.minHeight||2) + totalDist * 0.18;
      const arcY = Math.sin(progress * Math.PI) * peakH;
      const targetY = 0.5 + arcY; // land at ground level
      p.mesh.position.x += dx/dd * p.speed;
      p.mesh.position.z += dz/dd * p.speed;
      // Smoothly move Y toward arc target
      p.mesh.position.y += (targetY - p.mesh.position.y) * 0.18;
      // Rotate arrow/bolt to follow arc direction
      if(p.type==='arrow'||p.type==='crossbow'){
        p.mesh.lookAt(tx, p.mesh.position.y - (targetY - p.mesh.position.y)*2, tz);
        p.mesh.rotateX(Math.PI/2);
      }
    }
  }

  // ── Animals ──
  animals.forEach(a=>{
    a.timer-=dt;
    if(a.timer<0){a.dir+=(Math.random()-0.5)*1.2;a.timer=rnd(1.5,4);}
    a.x=Math.max(-50,Math.min(50,a.x+Math.cos(a.dir)*0.022));
    a.z=Math.max(-50,Math.min(50,a.z+Math.sin(a.dir)*0.022));
    a.g.position.set(a.x,0,a.z); a.g.rotation.y=a.dir;
    a.wobble+=dt*3;
    a.g.children.slice(2).forEach((c,idx)=>{c.position.y=0.28+Math.sin(a.wobble+idx*Math.PI)*0.06;});
  });

  // ── Snakes ──
  snakes.forEach(s=>{
    if(s.hp<=0) return;
    s.timer-=dt; s.cooldown=Math.max(0,s.cooldown-dt);
    if(s.timer<0){s.dir+=(Math.random()-0.5)*2.8;s.timer=rnd(0.8,2.5);}
    const dp=d2(player,s);
    if(dp<8){
      // Chase player
      const sdx=player.x-s.x, sdz=player.z-s.z;
      const sdd=Math.sqrt(sdx*sdx+sdz*sdz);
      if(sdd>0) s.dir=Math.atan2(sdx,sdz);
      if(dp<1.5&&s.cooldown<=0){
        player.poisoned=Math.max(player.poisoned,10);
        s.cooldown=9;
        notify('🐍 Du wurdest gebissen! VERGIFTET! Drücke E zum Töten!',3500);
      }
    }
    const spd=dp<8?0.055:0.024;
    s.x=Math.max(-58,Math.min(58,s.x+Math.cos(s.dir)*spd));
    s.z=Math.max(-58,Math.min(58,s.z+Math.sin(s.dir)*spd));
    s.wobble+=dt*5;
    s.g.position.set(s.x,0,s.z); s.g.rotation.y=s.dir;
    // Slither wiggle
    for(let i=0;i<7;i++){
      if(s.g.children[i]) s.g.children[i].position.x=Math.sin(s.wobble+i*0.85)*0.3;
    }
  });

  // ── Poison ──
  if(player.poisoned>0){
    player.poisoned-=dt;
    player.hp=Math.max(0,player.hp-dt*4);
    updatePlayerHP();
    updateHUD();
    const veil=document.getElementById('poison-veil');
    if(veil) veil.style.opacity=Math.min(0.45,player.poisoned*0.045).toFixed(3);
    if(player.poisoned<=0){
      player.poisoned=0;
      const veil2=document.getElementById('poison-veil');
      if(veil2) veil2.style.opacity='0';
      notify('✅ Gift überwunden! Deine Kräfte kehren zurück.',2500);
    }
  }

  // ── Water animation ──
  waterMesh.position.y=0.06+Math.sin(T*0.6)*0.04;
  waterMesh.material.roughness=0.04+Math.abs(Math.sin(T*0.9))*0.06;

  // ── Clouds ──
  clouds.forEach(c=>{
    c.g.position.x+=c.spd*dt*0.5;
    c.g.position.z+=c.spd*dt*0.2;
    if(c.g.position.x>130) c.g.position.x=-130;
    if(c.g.position.z>130) c.g.position.z=-130;
    c.g.visible=!isNight;
  });

  // ── Fireflies ──
  fireflies.forEach(f=>{
    f.phase+=dt*2.2;
    f.l.position.x=Math.max(-55,Math.min(55,f.l.position.x+f.dx));
    f.l.position.z=Math.max(-55,Math.min(55,f.l.position.z+f.dz));
    f.l.position.y=1.2+Math.sin(f.phase*0.6)*0.9;
    f.l.intensity=isNight?Math.max(0,Math.sin(f.phase))*1.3:0;
    if(Math.random()<0.005){f.dx=rnd(-0.022,0.022);f.dz=rnd(-0.022,0.022);}
  });

  // ── Drachen-Ei ──
  if(dragonEgg&&eggTimer>0){
    eggTimer-=dt;
    dragonEgg.rotation.y+=dt*1.2;
    dragonEgg.position.y=0.75+Math.sin(T*3)*0.08;
    dragonEgg.material.emissive.setHex(eggTimer<8?0x336600:0x112200);
    if(eggTimer<=0) hatchDragon();
  }

  // ── Eigener Drache ──
  if(playerDragon&&!playerDragon.dead){
    playerDragon.atkCool=Math.max(0,playerDragon.atkCool-dt);
    // Nächsten Feind suchen
    let nearest=null,nearDist=999;
    enemies.forEach(en=>{if(!en.dead){const d=d2(playerDragon,en);if(d<nearDist){nearDist=d;nearest=en;}}});
    if(nearest&&nearDist<4&&playerDragon.atkCool<=0){
      nearest.hp-=18+Math.floor(Math.random()*12);
      if(nearest.hp<=0) killEnemy(nearest);
      playerDragon.atkCool=1.2;
    }
    // Wenn Feind in Sicht → fliege zu ihm, sonst kreise über Spieler
    if(nearest&&nearDist<35){
      const dx=nearest.x-playerDragon.x,dz=nearest.z-playerDragon.z;
      const dd=Math.sqrt(dx*dx+dz*dz)||1;
      playerDragon.x+=dx/dd*dt*7;
      playerDragon.z+=dz/dd*dt*7;
      playerDragon.y+=(6-playerDragon.y)*dt*1.5;
    } else {
      playerDragon.angle+=dt*0.6;
      playerDragon.x+=(player.x+Math.cos(playerDragon.angle)*6-playerDragon.x)*dt*1.2;
      playerDragon.z+=(player.z+Math.sin(playerDragon.angle)*6-playerDragon.z)*dt*1.2;
      playerDragon.y+=(9-playerDragon.y)*dt*1.5;
    }
    playerDragon.g.position.set(playerDragon.x,playerDragon.y,playerDragon.z);
    playerDragon.g.rotation.y=Math.atan2(
      playerDragon.x-(nearest?nearest.x:player.x),
      playerDragon.z-(nearest?nearest.z:player.z));
    // Flügel flattern
    playerDragon.g.children[5]&&(playerDragon.g.children[5].rotation.x=Math.sin(T*5)*0.4);
    playerDragon.g.children[6]&&(playerDragon.g.children[6].rotation.x=Math.sin(T*5+Math.PI)*0.4);
  }

  // ── Smithy flicker ──
  smithies.forEach(s=>{ s.light.intensity=1.8+Math.sin(T*4.5+s.wx)*0.6+Math.sin(T*7.3)*0.3; });
  // ── Merchants ──
  mercs.forEach(m=>{m.bob+=dt;m.g.position.y=Math.sin(m.bob*0.7)*0.04;m.lp.intensity=1.4+Math.sin(T*2)*0.4;});

  // ── Trees ──
  trees.forEach(t=>{
    if(t.falling){
      t.fallAngle+=dt*2.2;
      t.g.rotation.x=Math.min(Math.PI/2, t.fallAngle);
      t.g.rotation.y=t.fallDir;
      if(t.fallAngle>Math.PI/2+0.3){
        scene.remove(t.g);
        t.falling=false; t.hp=-1;
      }
      return;
    }
    if(t.hp<=0) return;
    const sw=Math.sin(T*0.65+t.wobble)*0.025;
    if(t.g.children[1]) t.g.children[1].rotation.z=sw;
    if(t.g.children[2]) t.g.children[2].rotation.z=sw*0.6;
  });

  // ── Camera ──
  const cx=player.x+Math.sin(camTheta)*camRadius*Math.cos(camPhi);
  const cy=Math.sin(camPhi)*camRadius;
  const cz=player.z+Math.cos(camTheta)*camRadius*Math.cos(camPhi);
  cam.position.set(cx,cy,cz);
  cam.lookAt(player.x,2,player.z);

  // ── Periodic UI refresh ──
  refreshUI+=dt;
  if(refreshUI>1){refreshUI=0;refreshSidePanel();updateUnitList();}

  // ── HP Bars ──
  hpCtx.clearRect(0,0,hpCv.width,hpCv.height);
  // Castle HP bar
  drawHPBar(0,8,0,castleHP,maxHP,'🏰 BURG',false,false);
  // Enemy HP bars
  enemies.forEach(en=>{
    if(en.dead) return;
    drawHPBar(en.x,3.5,en.z,en.hp,en.maxHp,null,true,false);
  });
  // Dragon HP bars
  dragons.forEach(dr=>{
    if(dr.dead) return;
    drawHPBar(dr.x,dr.g.position.y+4,dr.z,dr.hp,dr.maxHp,dr.boss?'🐉 URALTER DRACHE':'🐉 Drache',true,true);
  });
  // Crossbow HP bars
  crossbows.forEach(cb=>{
    if(cb.dead) return;
    drawHPBar(cb.wx,3.5,cb.wz,cb.hp,cb.maxHp,'🎯 Armbrust',false,false);
  });
  // Friendly unit HP bars
  playerUnits.forEach(u=>{
    if(u.dead) return;
    drawHPBar(u.x,2.8,u.z,u.hp,u.maxHp,null,false,false);
  });
  // Player HP (always full for simplicity – show as shield)
  ren.render(scene,cam);
}

// ══════════════════════════════════════════════════
//  SPEICHERN & LADEN
// ══════════════════════════════════════════════════
let paused=true; // starts paused until main menu button clicked
let activeSlot=1;

function saveKey(slot){ return 'kingdom_save_'+slot; }

function saveGame(){
  const data={
    res:{...res,seedling:res.seedling||0}, dayNum, waveNum,
    playerWeaponIdx, playerAtk:player.atk,
    pickaxeIdx,
    hiredSmith,
    inventory: inventory.map(i=>({id:i.id,count:i.count})),
    equippedSlots: {
      weapon: equippedSlots.weapon?.id||null,
      shield: equippedSlots.shield?.id||null,
      helmet: equippedSlots.helmet?.id||null,
    },
    cells:Object.entries(cells)
      .filter(([,v])=>v.type&&v.type!=='center')
      .map(([k,v])=>{const[gx,gz]=k.split('_').map(Number);return{gx,gz,type:v.type};}),
    units:playerUnits.filter(u=>!u.dead).map(u=>({type:u.type,hp:u.hp,maxHp:u.maxHp,atk:u.atk})),
    savedAt:Date.now(),
  };
  localStorage.setItem(saveKey(activeSlot),JSON.stringify(data));
}

function loadGame(){
  const raw=localStorage.getItem(saveKey(activeSlot));
  if(!raw) return false;
  const data=JSON.parse(raw);
  Object.assign(res,data.res);
  dayNum=data.dayNum||1;
  waveNum=data.waveNum||1;
  updateHUD();
  document.getElementById('day-chip').textContent=`☀️ TAG ${dayNum}`;
  const prevMode=buildMode;
  (data.cells||[]).forEach(({gx,gz,type})=>{buildMode=type;buildAt(gx,gz,true);});
  buildMode=prevMode;
  refreshSidePanel();
  playerWeaponIdx=data.playerWeaponIdx||0;
  player.atk=data.playerAtk||25;
  if(playerWeaponIdx>0){
    const w=PLAYER_WEAPONS[playerWeaponIdx];
    const blade=player.g.children[7];
    if(blade) blade.material=lm(w.key==='wood'?0x7a5020:w.key==='stone'?0x888880:w.key==='iron'?0x9090aa:w.key==='diamond'?0x50d0ff:0xcc2244,w.key==='diamond'?0x0a1a20:w.key==='nether'?0x220010:0);
  }
  pickaxeIdx=data.pickaxeIdx||0;
  hiredSmith=data.hiredSmith||null;
  // Inventar laden
  inventory=[];
  equippedSlots.weapon=null; equippedSlots.shield=null; equippedSlots.helmet=null;
  (data.inventory||[]).forEach(({id,count})=>addToInventory(id,count));
  if(data.equippedSlots){
    ['weapon','shield','helmet'].forEach(slot=>{
      const eid=data.equippedSlots[slot];
      if(eid){
        const invItem=inventory.find(i=>i.id===eid);
        if(invItem){
          equippedSlots[slot]=invItem;
          if(invItem.type==='weapon') player.atk+=invItem.atk;
          if(invItem.type==='shield'||invItem.type==='helmet'){player.maxHp+=invItem.hp; player.hp=Math.min(player.hp+invItem.hp,player.maxHp);}
        }
      }
    });
  }
  (data.units||[]).forEach(u=>{
    const def=UNIT_DEFS[u.type]; if(!def) return;
    const g=makeUnitMesh(u.type);
    const ang=Math.random()*Math.PI*2, r=3+Math.random()*3;
    const ux=Math.cos(ang)*r, uz=Math.sin(ang)*r;
    g.position.set(ux,0,uz); scene.add(g);
    playerUnits.push({g,type:u.type,x:ux,z:uz,hp:u.hp,maxHp:u.maxHp,atk:u.atk,spd:def.spd,range:def.range,name:def.name,icon:def.icon,state:'ruhig',target:null,cooldown:0,wobble:Math.random()*Math.PI*2,equip:[]});
  });
  updateUnitList();
  return true;
}

function renderWorldSlots(){
  const container=document.getElementById('world-slots');
  container.innerHTML='';
  for(let s=1;s<=3;s++){
    const raw=localStorage.getItem(saveKey(s));
    const btn=document.createElement('div');
    btn.style.cssText='display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.07);border:1px solid rgba(212,168,64,0.35);border-radius:10px;padding:12px 16px;cursor:pointer;transition:background 0.15s;';
    btn.onmouseenter=()=>btn.style.background='rgba(212,168,64,0.18)';
    btn.onmouseleave=()=>btn.style.background='rgba(255,255,255,0.07)';
    if(raw){
      const d=JSON.parse(raw);
      const date=d.savedAt?new Date(d.savedAt).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}):'?';
      const buildings=d.cells?d.cells.length:0;
      btn.innerHTML=`<div><div style="color:#d4a840;font-weight:700;font-size:15px;">🌍 Welt ${s}</div><div style="color:#aaa;font-size:11px;">Tag ${d.dayNum||1} · Welle ${d.waveNum||1} · ${buildings} Gebäude</div><div style="color:#666;font-size:10px;">${date}</div></div><div style="display:flex;gap:8px;align-items:center;"><button onclick="event.stopPropagation();deleteSlot(${s})" style="background:rgba(180,40,40,0.7);border:none;color:white;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;">✕</button></div>`;
      btn.onclick=()=>startGame(true,s);
    } else {
      btn.innerHTML=`<div><div style="color:#7a9a6a;font-weight:700;font-size:15px;">🌿 Welt ${s} — Leer</div><div style="color:#666;font-size:11px;">Neues Spiel starten</div></div><div style="color:#4a7a4a;font-size:20px;">＋</div>`;
      btn.onclick=()=>startGame(false,s);
    }
    container.appendChild(btn);
  }
}

window.deleteSlot=function(s){
  if(!confirm(`Welt ${s} wirklich löschen?`)) return;
  localStorage.removeItem(saveKey(s));
  renderWorldSlots();
};

window.togglePause=function(){
  paused=!paused;
  document.getElementById('pause-menu').style.display=paused?'flex':'none';
  if(!paused) document.getElementById('pause-menu').style.display='none';
};
window.resumeGame=function(){ paused=false; document.getElementById('pause-menu').style.display='none'; };
window.exitGame=function(){
  saveGame();
  paused=true;
  document.getElementById('pause-menu').style.display='none';
  renderWorldSlots();
  document.getElementById('main-menu').style.display='flex';
};

window.addEventListener('beforeunload',saveGame);

window.startGame=function(load,slot){
  activeSlot=slot||1;
  document.getElementById('main-menu').style.display='none';
  paused=false;
  if(load){
    loadGame();
    setTimeout(()=>showBanner('💾 SPIELSTAND GELADEN','Willkommen zurück, Ritter!'),500);
  } else {
    setTimeout(()=>showBanner('⚜ BAUE DEIN KÖNIGREICH ⚜','Ressourcen sammeln — Burg errichten — Reich verteidigen!'),500);
  }
};
window.clearSave=function(){localStorage.removeItem(saveKey(activeSlot));notify('💾 Spielstand gelöscht!');};

updateHUD();
updatePlayerHP();
animate();
renderWorldSlots();
