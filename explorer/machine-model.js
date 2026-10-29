import * as THREE from '../illustrations/vendor/three.module.js';

// Original, photograph-guided interpretation of the visible C&B robot cell.
// Component proportions and all concealed mechanisms are illustrative, not CAD.
export function createMachineModel({ onChange } = {}) {
  const group = new THREE.Group(); group.name = 'CB30RobotCell';
  const nodes = {}, geometries = new Set(), materials = new Set(), textures = new Set();
  const palettes = new Map(), boltBatches = new Map();
  let disposed=false;
  const palette = {
    silver: ['#b8bbba', .56, .31], light: ['#d3d3cf', .33, .34], dark: ['#302e30', .48, .4],
    black: ['#1e1c1e', .2, .48], steel: ['#929b9d', .78, .23], yellow: ['#d6ae32', .25, .36],
    yellowDark: ['#ae861e', .3, .43], hose: ['#303b40', .1, .62], blue: ['#355d73', .2, .46],
    white: ['#e0e4e5', .15, .45], wine: ['#741d35', .1, .53], brandPanel: ['#21191c', .08, .7], copper: ['#9c6646', .5, .45], abrasive: ['#77848a', .12, .83]
  };
  function mat(name, node) {
    const key = node.name + ':' + name;
    if (!palettes.has(key)) {
      const [color, metalness, roughness] = palette[name];
      const m = new THREE.MeshStandardMaterial({ color, metalness, roughness });
      materials.add(m); palettes.set(key, m);
    }
    return palettes.get(key);
  }
  function geo(g) { geometries.add(g); return g; }
  function node(name) { const n = new THREE.Group(); n.name = name; n.userData.target = name; nodes[name] = n; group.add(n); return n; }
  const base = node('machine'), grinding = node('grinding'), robot = node('robot'), loading = node('loading'), controls = node('controls');
  function mesh(g, m, parent, p = [0, 0, 0], r = [0, 0, 0]) {
    const o = new THREE.Mesh(g, m); o.position.set(...p); o.rotation.set(...r);
    o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
  }
  function box(parent, size, p, name = 'silver', r) { return mesh(geo(new THREE.BoxGeometry(...size)), mat(name, parent.userData.materialNode || parent), parent, p, r); }
  function cylinder(parent, radius, length, p, name = 'steel', axis = 'y', radiusTop = radius, segments = 32) {
    const rotation = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
    return mesh(geo(new THREE.CylinderGeometry(radiusTop, radius, length, segments)), mat(name, parent.userData.materialNode || parent), parent, p, rotation);
  }
  function beam(parent, a, b, radius, name = 'steel', topRadius = radius) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const o = mesh(geo(new THREE.CylinderGeometry(topRadius, radius, delta.length(), 24)), mat(name, parent.userData.materialNode || parent), parent);
    o.position.copy(start.add(end).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return o;
  }
  function cable(parent, points, radius = .035, name = 'hose') {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(geo(new THREE.TubeGeometry(curve, 40, radius, 7, false)), mat(name, parent.userData.materialNode || parent), parent);
  }
  function bolts(parent, list, axis = 'z', radius = .027) {
    const key = parent.name + ':' + axis + ':' + radius;
    let batch = boltBatches.get(key);
    if (!batch) { batch = { parent, list: [], axis, radius }; boltBatches.set(key, batch); }
    batch.list.push(...list);
  }
  function panelBolts(parent, x, y, z, width, height) {
    bolts(parent, [[x-width/2+.08,y-height/2+.08,z],[x+width/2-.08,y-height/2+.08,z],[x-width/2+.08,y+height/2-.08,z],[x+width/2-.08,y+height/2-.08,z]]);
  }
  // Same explanatory part family as the application illustration: broad flat
  // opposing faces and a simplified inner-tooth profile, not a dimensioned part.
  function ringGeometry(radius, depth) {
    const shape=new THREE.Shape();shape.absarc(0,0,radius,0,Math.PI*2,false);
    const hole=new THREE.Path(), points=[];
    for(let tooth=0;tooth<48;tooth++)for(const [phase,ratio] of [[0,.80],[.2,.80],[.34,.72],[.66,.72],[.8,.80]]) {
      const angle=-(tooth+phase)/48*Math.PI*2;points.push(new THREE.Vector2(Math.cos(angle)*radius*ratio,Math.sin(angle)*radius*ratio));
    }
    hole.setFromPoints(points);hole.closePath();shape.holes.push(hole);
    const g=geo(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.005,bevelThickness:.006,bevelSegments:1,curveSegments:64,steps:1}));
    g.translate(0,0,-depth/2);return g;
  }
  function repeatBars(parent, count, size, start, step, name) {
    const g = geo(new THREE.BoxGeometry(...size));
    const batch = new THREE.InstancedMesh(g, mat(name, parent), count); const matrix = new THREE.Matrix4();
    for (let i=0;i<count;i++) { matrix.makeTranslation(start[0]+step[0]*i,start[1]+step[1]*i,start[2]+step[2]*i); batch.setMatrixAt(i,matrix); }
    batch.castShadow = true; batch.receiveShadow = true; parent.add(batch); return batch;
  }
  // A monochrome lighting treatment of the real C&B mark. The source artwork
  // remains untouched; its white cutouts are removed in the surface shader.
  const logoTexture=new THREE.TextureLoader().load('/cbmachinery-demo-preview/assets/logo.webp',()=>{if(!disposed)onChange?.();});
  logoTexture.colorSpace=THREE.SRGBColorSpace;logoTexture.anisotropy=4;textures.add(logoTexture);
  function brandBadge(parent,width,height,position,rotation) {
    const m=new THREE.MeshBasicMaterial({map:logoTexture,color:'#ff5a1f',transparent:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1});
    m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      #ifdef USE_MAP
        vec4 brandInk=texture2D(map,vMapUv);
        float whiteCutout=smoothstep(.35,.9,dot(brandInk.rgb,vec3(.2126,.7152,.0722)));
        diffuseColor.a*=brandInk.a*(1.-whiteCutout);
      #endif
    `);};
    m.customProgramCacheKey=()=> 'cb-fluorescent-brand-v1';materials.add(m);
    const logo=mesh(geo(new THREE.PlaneGeometry(width,height)),m,parent,position,rotation);
    logo.name='C&B-brand-mark';logo.castShadow=false;logo.receiveShadow=false;logo.userData.excludeEdges=true;
    // The decal has no independent click area: its physical enclosure owns picking.
    logo.userData.noPick=true;logo.raycast=()=>{};
    return logo;
  }
  // Welded bed, leveling feet and the visible service platform.
  box(base,[6.65,.4,2.8],[-.35,.53,-.25],'dark');
  box(base,[6.35,.13,2.6],[-.35,.8,-.25],'steel');
  for (const x of [-3.25,-.65,2.6]) for (const z of [-1.35,.85]) {
    cylinder(base,.19,.18,[x,.1,z],'black'); cylinder(base,.065,.38,[x,.3,z],'steel'); cylinder(base,.105,.07,[x,.47,z],'steel', 'y', .105, 6);
  }
  box(base,[2.2,.15,3.5],[.05,.18,2.65],'dark');
  repeatBars(base,19,[2.1,.075,.045],[-.0,.27,1.0],[0,0,.18],'dark');
  repeatBars(base,12,[.032,.07,3.38],[-1.0,.28,2.65],[.18,0,0],'black');
  // Main grinding enclosure: multiple folded panels, no inferred hidden CAD.
  box(grinding,[2.48,.2,1.92],[-.65,1.0,-.25],'silver');
  box(grinding,[.12,3.4,1.92],[-1.88,2.72,-.25],'light');
  box(grinding,[.12,3.4,1.92],[.58,2.72,-.25],'light');
  box(grinding,[2.48,3.4,.12],[-.65,2.72,-1.2],'silver');
  box(grinding,[2.6,.15,2.04],[-.65,4.46,-.25],'light');
  // The door is an independent node so a schematic section can reveal the center.
  const door = new THREE.Group(); door.name='front-enclosure'; door.userData.materialNode=grinding; grinding.add(door);
  box(door,[.43,3.35,.1],[-1.6,2.72,.75],'light');
  box(door,[.43,3.35,.1],[.3,2.72,.75],'light');
  box(door,[1.48,1.04,.1],[-.65,3.88,.75],'light');
  box(door,[1.48,.76,.1],[-.65,1.43,.75],'light');
  // Broad inspection window with a slim gasket and recessed transparent glass.
  box(door,[1.53,1.7,.025],[-.65,2.69,.81],'dark');
  const glassMat = new THREE.MeshPhysicalMaterial({color:'#6c8791',metalness:.04,roughness:.18,transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide}); materials.add(glassMat);
  mesh(geo(new THREE.PlaneGeometry(1.42,1.58)),glassMat,door,[-.65,2.69,.831]);
  // Gasket is hollow: the central surface itself is dark tinted, with a subtle reflection.
  box(door,[.02,1.58,.012],[-1.36,2.69,.843],'steel'); box(door,[.02,1.58,.012],[.06,2.69,.843],'steel');
  beam(door,[-1.62,1.98,.88],[-1.62,3.39,.88],.045,'steel');
  for(const y of [1.95,3.42]) box(door,[.11,.12,.15],[-1.62,y,.82],'dark');
  repeatBars(grinding,17,[.095,.055,.1],[-1.67,2.06,.92],[0,.073,0],'black');
  // A shallow physical nameplate spans the upper front panels. Keep the real
  // 205:50 wordmark proportions and a dark backing so the orange is legible
  // against the silver enclosure in the opening overview and component zoom.
  box(door,[2.28,.68,.024],[-.65,4.03,.815],'brandPanel');
  brandBadge(door,2.02,2.02*50/205,[-.65,4.03,.83]);
  // Secondary side identification follows the cabinet when the view is rotated.
  // It remains on the frame when the illustrative front-door cutaway is open.
  box(grinding,[.024,.58,1.64],[.653,4.03,-.25],'brandPanel');
  brandBadge(grinding,1.44,1.44*50/205,[.668,4.03,-.25],[0,Math.PI/2,0]);
  panelBolts(door,-.65,2.72,.818,2.32,3.18);
  // A separate extraction stack and cable loop match the source silhouette.
  box(grinding,[1.66,.85,1.35],[-.65,4.94,-.43],'silver');
  box(grinding,[1.18,.52,.92],[-.65,5.62,-.43],'steel');
  cylinder(grinding,.23,.52,[-.65,6.04,-.43],'silver');
  box(grinding,[.98,.67,.86],[-.65,6.43,-.43],'light');
  for(const x of [-1.29,0]) for(const z of [-.94,.08]) cylinder(grinding,.035,.1,[x,4.59,z],'steel','y',.035,6);
  cable(grinding,[[-1.2,5.35,.27],[-1.36,5.6,.37],[-.95,5.76,.45],[-.58,5.45,.39],[-.86,5.02,.28]],.041,'hose');
  // Opposed spindle housings and the yellow guard plates visible in the source.
  for(const side of [-1,1]) {
    const x=-.65+side*2.04;
    cylinder(grinding,.64,1.28,[x,2.57,-.23],'silver','x');
    cylinder(grinding,.69,.13,[x+side*.55,2.57,-.23],'light','x');
    box(grinding,[1.34,.32,1.52],[x,1.7,-.23],'silver');
    box(grinding,[1.16,.68,1.44],[x,3.11,-.23],'light');
    box(grinding,[.14,1.58,1.78],[x+side*.77,2.57,-.23],'yellow');
    cylinder(grinding,.43,.19,[x+side*.9,2.57,-.23],'yellow','x');
    cylinder(grinding,.19,.12,[x+side*1.03,2.57,-.23],'yellowDark','x');
    box(grinding,[.58,1.03,1.05],[x+side*1.22,2.57,-.23],'yellow');
    for(const y of [2.13,3.0]) for(const z of [-.78,.32]) bolts(grinding,[[x+side*.86,y,z]],'x',.034);
    box(grinding,[.11,.4,.09],[x+side*1.53,2.5,.12],'black');
    cylinder(grinding,.23,.68,[x,1.3,.53],'dark');
    cylinder(grinding,.25,.1,[x,1.65,.53],'steel');
    cable(grinding,[[x+side*1.2,2.05,.1],[x+side*1.28,1.55,.2],[x+.12,1.02,.57],[x,.95,.85]],.05,'hose');
  }
  // Rear cabinet and vents give a readable back view without invented mechanisms.
  box(base,[1.1,2.45,1.3],[2.15,2.03,-.75],'silver');
  box(base,[1.04,2.32,.045],[2.15,2.03,-1.43],'light');
  repeatBars(base,10,[.65,.045,.03],[2.15,2.48,-1.46],[0,.08,0],'dark');
  cylinder(base,.08,.06,[2.45,1.8,-1.49],'black','z');
  // Foreground dual rail transfer, actuators and a simple ring presentation nest.
  for(const x of [-.67,.67]) {
    box(loading,[.13,1.28,3.7],[x,.94,2.3],'silver');
    box(loading,[.26,.17,3.82],[x,1.64,2.3],'light');
    box(loading,[.06,.06,3.55],[x,1.76,2.3],'steel');
    for(const z of [.62,2.12,3.95]) { box(loading,[.3,.18,.3],[x,1.53,z],'dark'); panelBolts(loading,x,1.53,z+.16,.24,.14); }
  }
  box(loading,[1.64,.14,1.65],[0,1.56,3.15],'light');
  box(loading,[1.68,.12,1.12],[0,1.73,1.13],'steel');
  box(loading,[1.11,.22,.78],[0,1.9,1.15],'dark');
  cylinder(loading,.5,.12,[0,2.07,1.15],'steel');
  const loadingRingGeo=ringGeometry(.4,.1);
  mesh(loadingRingGeo,mat('steel',loading),loading,[0,2.16,1.15],[Math.PI/2,0,0]);
  for(const x of [-.7,.7]) for(const z of [2.5,3.8]) bolts(loading,[[x,1.65,z]],'y',.031);
  for(const x of [-.47,.47]) { cylinder(loading,.075,1.28,[x,1.92,2.74],'steel','z'); box(loading,[.23,.24,.46],[x,1.92,3.54],'dark'); }
  box(loading,[.53,.36,.41],[.86,1.35,3.75],'dark'); cylinder(loading,.19,.32,[1.15,1.35,3.75],'blue','x');
  box(loading,[.18,.31,2.63],[-.96,1.2,2.72],'dark');
  repeatBars(loading,22,[.21,.04,.1],[-.96,1.37,1.46],[0,0,.117],'black');
  cable(loading,[[.72,1.82,3.7],[.98,1.9,3.32],[1.05,1.46,2.4],[.92,.75,1.1],[.1,.84,.52]],.032,'blue');
  cable(loading,[[-.64,2.04,1.28],[-.8,2.29,1.65],[-.93,2.16,2.1],[-.82,1.6,2.35]],.025,'yellow');
  // Open chute to the left of the transfer station, a visible source feature.
  box(loading,[2.05,.08,.54],[-1.31,1.15,1.93],'black',[0,0,.08]);
  for(const z of [1.66,2.2]) box(loading,[2.05,.21,.04],[-1.31,1.28,z],'dark',[0,0,.08]);
  // Articulated robot: cast links, fork joints, actuator covers and routed cables.
  cylinder(robot,.61,.17,[2.32,.95,1.28],'dark');
  cylinder(robot,.44,.48,[2.32,1.25,1.28],'yellow');
  cylinder(robot,.48,.15,[2.32,1.58,1.28],'black');
  cylinder(robot,.34,.45,[2.32,1.66,1.28],'yellow','z');
  cylinder(robot,.19,.18,[2.32,1.66,1.56],'dark','z');
  const shoulder=[2.32,1.7,1.28], elbow=[2.97,3.25,1.04], wrist=[1.27,3.14,1.17], tool=[.75,2.5,1.42];
  function castLink(a,b,width,depth) {
    const length=new THREE.Vector3(...b).distanceTo(new THREE.Vector3(...a));
    const shape=new THREE.Shape(); const w=width/2;
    shape.moveTo(-w*.64,0);shape.lineTo(w*.64,0);shape.lineTo(w,length*.2);shape.lineTo(w*.76,length*.88);shape.quadraticCurveTo(w*.48,length,w*.28,length);shape.lineTo(-w*.28,length);shape.quadraticCurveTo(-w*.48,length,-w*.76,length*.88);shape.lineTo(-w,length*.2);shape.closePath();
    const g=geo(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,steps:1,curveSegments:6}));g.translate(0,0,-depth/2);
    const o=mesh(g,mat('yellow',robot),robot,a);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize());return o;
  }
  castLink(shoulder,elbow,.57,.36); castLink(elbow,wrist,.43,.37);
  for(const joint of [elbow,wrist]) {
    cylinder(robot,.27,.58,joint,'yellow','z'); cylinder(robot,.18,.12,[joint[0],joint[1],joint[2]+.34],'dark','z');
    cylinder(robot,.1,.13,[joint[0],joint[1],joint[2]+.42],'yellowDark','z');
    for(let i=0;i<6;i++){const a=i*Math.PI/3;bolts(robot,[[joint[0]+Math.cos(a)*.2,joint[1]+Math.sin(a)*.2,joint[2]+.33]],'z',.021);}
  }
  beam(robot,[2.42,1.76,1.05],[3.04,3.18,.82],.085,'dark');
  beam(robot,[2.92,3.36,.84],[1.32,3.27,.96],.067,'black');
  beam(robot,wrist,tool,.15,'yellow',.11);
  cylinder(robot,.17,.19,[.75,2.5,1.42],'steel');
  box(robot,[.48,.18,.3],[.75,2.35,1.42],'dark');
  for(const x of [.57,.93]) {box(robot,[.065,.35,.08],[x,2.13,1.42],'steel'); box(robot,[.14,.065,.08],[x+(x<.75?.035:-.035),1.97,1.42],'dark');}
  box(robot,[.52,.27,.45],[3.0,3.6,1.03],'dark');
  for(const x of [2.85,3.0,3.15]) cylinder(robot,.045,.08,[x,3.78,1.03],'steel');
  cable(robot,[[2.42,1.29,1.64],[2.78,1.62,1.67],[3.12,2.6,1.43],[3.22,3.41,1.18],[2.97,3.79,1.23]],.045,'hose');
  cable(robot,[[3.1,3.78,1.31],[2.77,3.95,1.46],[2.35,3.67,1.56],[1.4,3.37,1.5],[.97,2.85,1.64],[.8,2.4,1.56]],.027,'blue');
  cable(robot,[[2.95,3.78,.79],[2.65,3.92,.75],[2.15,3.55,1.02],[1.28,3.43,1.1],[.83,2.85,1.52]],.028,'yellow');
  // Small solid circles suggest cast-link lightening holes without false mechanics.
  for(const t of [.27,.53,.74]) cylinder(robot,.065,.02,[shoulder[0]+(elbow[0]-shoulder[0])*t,shoulder[1]+(elbow[1]-shoulder[1])*t,shoulder[2]+(elbow[2]-shoulder[2])*t+.23],'yellowDark','z');
  // Operator HMI, its mounting column and rear electrical cabinet.
  box(controls,[1.05,1.7,.9],[4.05,1.25,1.24],'dark');
  box(controls,[.94,1.58,.05],[4.05,1.25,1.72],'black');
  for(const x of [3.61,4.49]) cylinder(controls,.09,.12,[x,.31,1.55],'dark','x');
  cylinder(controls,.11,2.55,[4.18,2.05,.93],'silver');
  beam(controls,[4.18,3.24,.93],[3.93,3.24,1.31],.08,'steel');
  const consoleGroup=new THREE.Group();consoleGroup.name='operator-console';consoleGroup.userData.materialNode=controls;consoleGroup.position.set(3.94,2.95,1.45);consoleGroup.rotation.y=-.2;consoleGroup.rotation.x=-.08;controls.add(consoleGroup);
  box(consoleGroup,[1.45,1.18,.23],[0,0,0],'light');
  box(consoleGroup,[1.24,.76,.035],[0,.14,.137],'black');
  brandBadge(consoleGroup,1.04,.254,[0,.16,.16]);
  box(consoleGroup,[1.23,.2,.045],[0,-.4,.15],'steel');
  for(let i=0;i<7;i++) cylinder(consoleGroup,i===0?.056:.041,.055,[-.5+i*.165,-.4,.196],i===0?'wine':i===4?'blue':'dark','z');
  panelBolts(consoleGroup,0,0,.13,1.34,1.06);
  cable(controls,[[4.0,2.4,1.4],[4.47,2.2,1.15],[4.5,1.4,1.17],[4.15,.7,1.75],[3.7,.72,1.8]],.048,'hose');
  cable(controls,[[3.8,1.85,1.8],[3.65,1.55,1.88],[3.75,.75,1.9],[4.15,.72,1.9],[4.4,1.1,1.88],[4.2,1.72,1.86]],.028,'yellow');
  // Schematic internal grinding relationship, hidden until explicitly requested.
  const internals=new THREE.Group();internals.name='schematic-internals';internals.userData.materialNode=grinding;grinding.add(internals);internals.visible=false;
  for(const side of [-1,1]) {
    cylinder(internals,.73,.28,[-.65+side*.7,2.55,-.18],'abrasive','x');
    cylinder(internals,.7,.04,[-.65+side*.54,2.55,-.18],'blue','x');
    cylinder(internals,.19,.55,[-.65+side*1.1,2.55,-.18],'silver','x');
  }
  const part=mesh(ringGeometry(.51,.13),mat('steel',grinding),internals,[-.65,2.55,-.18],[0,Math.PI/2,0]);
  box(internals,[.15,.16,.92],[-.65,1.96,-.18],'dark');
  // Shared hardware batches keep small details inexpensive.
  for(const {parent,list,axis,radius} of boltBatches.values()) {
    const g=geo(new THREE.CylinderGeometry(radius,radius,.022,6));const m=mat('steel',parent.userData.materialNode||parent);
    const instanced=new THREE.InstancedMesh(g,m,list.length), matrix=new THREE.Matrix4(), q=new THREE.Quaternion();
    if(axis==='x')q.setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2); else if(axis==='z')q.setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
    list.forEach((p,i)=>{matrix.compose(new THREE.Vector3(...p),q,new THREE.Vector3(1,1,1));instanced.setMatrixAt(i,matrix);});instanced.castShadow=true;parent.add(instanced);
  }
  group.traverse(o=>{if(o.isMesh){let p=o;while(p&&!p.userData.target)p=p.parent;if(p)o.userData.target=p.userData.target;}});
  // Low-contrast structural creases, batched by component and visibility branch.
  // Small hardware, tubes and repeated grating are intentionally not outlined.
  const edgeSets=new Map();group.updateMatrixWorld(true);
  group.traverse(object=>{
    if(!object.isMesh||object.isInstancedMesh||object.userData.excludeEdges||object.geometry.type==='TubeGeometry'||object.geometry.type==='PlaneGeometry')return;
    object.geometry.computeBoundingBox();const size=new THREE.Vector3();object.geometry.boundingBox.getSize(size);
    if(Math.max(size.x,size.y,size.z)<.35)return;
    let branch='body';for(let ancestor=object.parent;ancestor&&ancestor!==group;ancestor=ancestor.parent){if(ancestor===door)branch='door';if(ancestor===internals)branch='internal';}
    const key=object.userData.target+':'+branch;
    if(!edgeSets.has(key))edgeSets.set(key,[]);
    const edges=new THREE.EdgesGeometry(object.geometry,32),positions=edges.attributes.position,points=edgeSets.get(key),v=new THREE.Vector3();
    for(let i=0;i<positions.count;i++){v.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);points.push(v.x,v.y,v.z);}edges.dispose();
  });
  const creaseMaterial=new THREE.LineBasicMaterial({color:'#b9aaa1',transparent:true,opacity:.14,depthWrite:false,toneMapped:false});materials.add(creaseMaterial);
  const creaseLayers=[];
  for(const [key,points] of edgeSets){const geometry=geo(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const layer=new THREE.LineSegments(geometry,creaseMaterial);layer.name='structural-creases-'+key;layer.userData.noPick=true;layer.raycast=()=>{};layer.renderOrder=1;group.add(layer);creaseLayers.push({layer,target:key.split(':')[0],branch:key.split(':')[1]});}
  function setState({target='machine',isolate=false,cutaway=false}={}) {
    Object.entries(nodes).forEach(([id,n])=>{n.visible=!isolate||target==='machine'||id===target;});
    door.visible=!cutaway;internals.visible=cutaway;
    creaseLayers.forEach(({layer,target:id,branch})=>{layer.visible=nodes[id].visible&&(branch==='door'?!cutaway:branch==='internal'?cutaway:true);});
    palettes.forEach((m,key)=>{m.emissive.set('#ff5a1f');m.emissiveIntensity=target!=='machine'&&key.startsWith(target+':')?.025:0;});
  }
  function dispose(){disposed=true;geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}

  return {group,nodes,door,internals,part,setState,dispose};
}
