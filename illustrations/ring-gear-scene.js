import * as THREE from './vendor/three.module.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { createTechnicalGrid } from '../explorer/technical-stage.js';

/**
 * Original explanatory geometry. Dimensions and tooth count are illustrative,
 * not a CAD model, process recommendation, machine simulation or drawing.
 * Three.js 0.180.0 is locally vendored under its MIT license.
 */
export function createRingScene(container, { onFaceSelect, onProject } = {}) {
  const initial = { step: 'part', face: 'both', metric: 'diameter', process: 'grind' };
  let state = { ...initial }, destroyed = false, raf = 0, inView = true, contextLost = false;
  let renderer, scene, camera, ring, bodyMesh, upperFace, lowerFace, discs, labelOverlay, measurementOverlay;
  let environmentTarget, environment, pmrem, technicalGrid;
  const faceOutlines = {};
  let hoveredFace = null, baseZoom = 1;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const qStart = new THREE.Quaternion(), qGoal = new THREE.Quaternion();
  const pStart = new THREE.Vector3(), pGoal = new THREE.Vector3();
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let animationStart = 0, animationDuration = 700, changing = false;
  let startZoom = 1, goalZoom = 1, startDisc = 0, goalDisc = 0, discAmount = 0;
  let startA = 0, startB = 0, goalA = 1, goalB = 1, aAmount = 0, bAmount = 0;
  let pointerStart = null, dragged = false;
  const accent = '#ff5a1f';
  const neutralFace = new THREE.Color('#bdb7ae');
  const selectedFace = new THREE.Color('#c9b9a9');
  const faceColor = new THREE.Color();
  const canvasLabel = 'Interactive illustration of a ring gear and its opposing faces. Use the labeled controls to explore.';

  const geometry = value => { geometries.add(value); return value; };
  const material = value => { materials.add(value); return value; };

  function fallback() {
    container.dataset.renderMode = 'fallback';
    onProject?.({});
    if (renderer) renderer.domElement.style.visibility = 'hidden';
    container.querySelector('.rg-fallback')?.removeAttribute('hidden');
    const img = container.querySelector('.rg-fallback');
    if (img) { img.style.display = ''; const fragment = state.step === 'process' ? 'process' : state.step === 'requirements' ? ({diameter:'requirements',thickness:'thickness',finish:'finish',production:'production'}[state.metric] || 'requirements') : state.step === 'part' && state.face === 'lower' ? 'lower' : ''; img.src = new URL('./ring-gear-fallback.svg' + (fragment ? '#' + fragment : ''), import.meta.url).href; }
    if (labelOverlay) labelOverlay.style.display = 'none';
    if (measurementOverlay) measurementOverlay.style.display = 'none';
  }
  function markReady() {
    container.dataset.renderMode = 'webgl';
    renderer.domElement.style.visibility = '';
    const img = container.querySelector('.rg-fallback');
    if (img) img.style.display = 'none';
    if (labelOverlay) labelOverlay.style.display = '';
    if (measurementOverlay) measurementOverlay.style.display = ''; 
  }

  // A round body with a deliberately simplified internal-tooth contour.
  function ringShape() {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 2, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    const teeth = 72, points = [];
    for (let t = 0; t < teeth; t++) {
      for (const [phase, radius] of [[0, 1.65], [.20, 1.65], [.34, 1.525], [.66, 1.525], [.80, 1.65]]) {
        const angle = -(t + phase) / teeth * Math.PI * 2;
        points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
      }
    }
    hole.setFromPoints(points); hole.closePath(); shape.holes.push(hole);
    return shape;
  }

  function makeRing() {
    const group = new THREE.Group();
    const bodyGeometry = geometry(new THREE.ExtrudeGeometry(ringShape(), {
      depth: .39, bevelEnabled: true, bevelThickness: .025,
      bevelSize: .012, bevelSegments: 2, curveSegments: 128, steps: 1
    }));
    bodyGeometry.translate(0, 0, -.195); bodyGeometry.rotateX(-Math.PI / 2);
    const capMaterial = material(new THREE.MeshStandardMaterial({ color: '#aaa59d', metalness: .7, roughness: .34 }));
    const sideMaterial = material(new THREE.MeshStandardMaterial({ color: '#696563', metalness: .72, roughness: .32 }));
    const body = new THREE.Mesh(bodyGeometry, [capMaterial, sideMaterial]); bodyMesh = body;
    body.castShadow = true; body.receiveShadow = true; group.add(body);
    const edges = new THREE.LineSegments(geometry(new THREE.EdgesGeometry(bodyGeometry, 32)), material(new THREE.LineBasicMaterial({color:'#a3948c',transparent:true,opacity:.26,depthWrite:false})));
    edges.raycast = () => {}; group.add(edges);
    // Only the broad axial annulus receives a selection color. The teeth remain neutral.
    const faceGeometry = geometry(new THREE.RingGeometry(1.668, 1.977, 180));
    faceGeometry.rotateX(-Math.PI / 2);
    const faceMaterial = () => material(new THREE.MeshStandardMaterial({
      color: neutralFace, metalness: .6, roughness: .36, side: THREE.DoubleSide, emissive:accent, emissiveIntensity:0,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
    }));
    upperFace = new THREE.Mesh(faceGeometry, faceMaterial());
    lowerFace = new THREE.Mesh(faceGeometry, faceMaterial());
    upperFace.position.y = .221; lowerFace.position.y = -.221;
    upperFace.userData.face = 'upper'; lowerFace.userData.face = 'lower';
    upperFace.receiveShadow = true; lowerFace.receiveShadow = true;
    group.add(upperFace, lowerFace);
    // Tight emissive rims identify the axial faces without obscuring the metal.
    for (const [name,y] of [['upper',.236],['lower',-.236]]) {
      const outlines = new THREE.Group(), bright = material(new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:0,toneMapped:false,depthWrite:false}));
      const halo = material(new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:0,toneMapped:false,depthWrite:false,blending:THREE.AdditiveBlending}));
      const innerRims=[];
      for (const radius of [1.672,1.983]) {
        for (const [tube,mat] of [[.019,bright],[.04,halo]]) {
          const rim = new THREE.Mesh(geometry(new THREE.TorusGeometry(radius,tube,8,160)),mat);
          rim.rotation.x=-Math.PI/2; rim.position.y=y; rim.renderOrder=mat===bright?6:5; rim.raycast=()=>{}; outlines.add(rim); if(radius<1.8)innerRims.push(rim);
        }
      }
      faceOutlines[name]={group:outlines,bright,halo,innerRims}; group.add(outlines);
    }
    // Fine concentric machining marks; they describe the material, not UI borders.
    const scratchMaterial = material(new THREE.LineBasicMaterial({ color: '#51473f', transparent: true, opacity: .075, depthWrite: false }));
    for (let radius = 1.689; radius < 1.96; radius += .022) {
      const points = Array.from({ length: 181 }, (_, i) => {
        const a = i / 180 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * radius, .2225, Math.sin(a) * radius);
      });
      const line = new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints(points)), scratchMaterial);
      group.add(line);
    }
    return group;
  }

  function makeDiscs() {
    const group = new THREE.Group();
    const edge = material(new THREE.MeshStandardMaterial({ color: '#90867f', roughness: .83, metalness: .08, transparent: true, opacity: 0, depthWrite: false }));
    const faces = material(new THREE.MeshStandardMaterial({ color: '#b3aaa1', roughness: .9, metalness: 0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    const g = geometry(new THREE.CylinderGeometry(2.08, 2.08, .19, 100, 1));
    for (const direction of [1, -1]) {
      const wheel = new THREE.Mesh(g, [edge, faces, faces]);
      wheel.position.y = direction * 1.22;
      const rimPoints = Array.from({ length: 121 }, (_, i) => {
        const a = i / 120 * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * 2.08, direction * 1.12, Math.sin(a) * 2.08);
      });
      const rimMaterial = material(new THREE.LineBasicMaterial({ color: '#ff5a1f', toneMapped: false, transparent: true, opacity: 0, depthWrite: false }));
      group.add(wheel, new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints(rimPoints)), rimMaterial));
    }
    group.visible = false; return group;
  }

  // Measurement strokes are projected into SVG rather than WebGL lines.
  // WebGL LineBasicMaterial is commonly clamped to one physical pixel, making
  // oblique dimensions disappear on Retina screens. SVG keeps a 2.4 CSS-pixel
  // fluorescent stroke and perpendicular end ticks at every zoom and angle.
  function updateMeasurements() {
    const active=state.step==='requirements' && ['diameter','thickness'].includes(state.metric);
    measurementOverlay.style.visibility=active?'visible':'hidden';
    if(!active){measurementOverlay.replaceChildren();return;}
    const width=container.clientWidth,height=container.clientHeight;
    measurementOverlay.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const project=point=>{
      const p=new THREE.Vector3(...point);ring.localToWorld(p);p.project(camera);
      return [(p.x+1)*width/2,(1-p.y)*height/2];
    };
    const diameter=state.metric==='diameter';
    const ends=(diameter?[[-2,.26,2.32],[2,.26,2.32]]:[[2.4,-.22,.15],[2.4,.22,.15]]).map(project);
    const witnesses=diameter
      ? [[[-2,.26,.05],[-2,.26,2.52]],[[2,.26,.05],[2,.26,2.52]]]
      : [[[1.98,-.22,.15],[2.66,-.22,.15]],[[1.98,.22,.15],[2.66,.22,.15]]];
    const path=points=>points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    const dx=ends[1][0]-ends[0][0],dy=ends[1][1]-ends[0][1],length=Math.hypot(dx,dy)||1;
    const nx=-dy/length*5,ny=dx/length*5;
    const primary=path(ends)+' '+ends.map(([x,y])=>path([[x-nx,y-ny],[x+nx,y+ny]])).join(' ');
    const witnessPath=witnesses.map(points=>path(points.map(project))).join(' ');
    measurementOverlay.innerHTML=`<g fill="none" stroke-linejoin="round" stroke-linecap="round"><path d="${witnessPath}" stroke="#ff895c" stroke-width="1.2" opacity=".65"/><path d="${primary}" stroke="#21191c" stroke-width="5.6" opacity=".9"/><path d="${primary}" stroke="#ff5a1f" stroke-width="2.4"/></g>`;
  }

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor(0xffffff, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-label', canvasLabel); canvas.setAttribute('role', 'img');
    canvas.style.cssText = 'display:block;width:100%;height:100%;position:absolute;inset:0;touch-action:pan-y;cursor:grab;';
    container.append(canvas);
    labelOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    labelOverlay.classList.add('rg-scene-labels'); labelOverlay.setAttribute('aria-hidden', 'true');
    labelOverlay.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
    container.append(labelOverlay);
    measurementOverlay=document.createElementNS('http://www.w3.org/2000/svg','svg');
    measurementOverlay.classList.add('rg-measurements');measurementOverlay.setAttribute('aria-hidden','true');
    measurementOverlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden;';
    container.append(measurementOverlay);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-3.6, 3.6, 2.3, -2.3, .1, 100);
    camera.position.set(5.8, 5.8, 8); camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight('#fff5e9', '#4b3038', 1.55));
    const key = new THREE.DirectionalLight('#fff3e5', 3.1); key.position.set(-3, 7, 5); scene.add(key);
    const fill = new THREE.DirectionalLight('#f1d4c2', 1.15); fill.position.set(6, 2, -3); scene.add(fill);
    pmrem = new THREE.PMREMGenerator(renderer);
    environment = new RoomEnvironment(); environmentTarget = pmrem.fromScene(environment, .06);
    scene.environment = environmentTarget.texture; scene.environmentIntensity = .72;
    environment.dispose(); environment = null; pmrem.dispose(); pmrem = null;
    ring = makeRing(); discs = makeDiscs();
    scene.add(ring, discs);
    technicalGrid=createTechnicalGrid({size:36,spacing:.5,height:-1.5,color:'#6f565b',opacity:.32,fadeRadius:12});
    scene.add(technicalGrid.object);
    // A soft, resolution-independent studio contact shadow, not a drawn machine.
    const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = 128; shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 12, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0,0,0,0.42)'); gradient.addColorStop(.55, 'rgba(0,0,0,0.24)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas); textures.add(shadowTexture);
    const shadow = new THREE.Mesh(geometry(new THREE.PlaneGeometry(6, 6)), material(new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.47; scene.add(shadow);
  } catch (error) {
    fallback();
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    technicalGrid?.dispose(); environmentTarget?.dispose(); environment?.dispose(); pmrem?.dispose();
    renderer?.dispose(); renderer?.domElement.remove(); labelOverlay?.remove(); measurementOverlay?.remove();
    return { setState(next) { state = { ...state, ...next }; fallback(); }, reset() { fallback(); }, zoom() {}, destroy() { destroyed = true; } };
  }

  function targetForState() {
    const process = state.step === 'process';
    let rotation = new THREE.Euler(0, -.14, -.04);
    if (state.step === 'part' && state.face === 'lower') rotation = new THREE.Euler(Math.PI, -.14, -.04);
    if (state.step === 'requirements' && state.metric === 'thickness') rotation = new THREE.Euler(.12, -.4, -.1);
    qStart.copy(ring.quaternion); qGoal.setFromEuler(rotation);
    pStart.copy(ring.position);
    pGoal.set(process && state.process !== 'grind' ? (state.process === 'load' ? -1.8 : 1.8) : 0, 0, 0);
    startZoom = camera.zoom;
    goalZoom = process ? .75 : state.step === 'requirements' && ['diameter', 'thickness'].includes(state.metric) ? .88 : 1;
    baseZoom=goalZoom; hoveredFace=null;
    startDisc = discAmount; goalDisc = process ? 1 : 0;
    startA = aAmount; startB = bAmount;
    const highlight = state.step === 'part';
    goalA = highlight && state.face !== 'lower' ? 1 : 0;
    goalB = highlight && state.face !== 'upper' ? 1 : 0;
    if (process || (state.step === 'requirements' && ['diameter', 'finish', 'thickness'].includes(state.metric))) goalA = goalB = 1;
    animationStart = performance.now(); animationDuration = reduceMotion.matches ? 0 : 700; changing = true;
    requestRender();
  }

  function render(time) {
    raf = 0;
    if (destroyed || contextLost || !inView || document.hidden) return;
    if (changing) {
      const raw = animationDuration ? Math.min(1, (time - animationStart) / animationDuration) : 1;
      const t = 1 - Math.pow(1 - raw, 3);
      ring.quaternion.slerpQuaternions(qStart, qGoal, t); ring.position.lerpVectors(pStart, pGoal, t);
      camera.zoom = THREE.MathUtils.lerp(startZoom, goalZoom, t); camera.updateProjectionMatrix();
      discAmount = THREE.MathUtils.lerp(startDisc, goalDisc, t);
      aAmount = THREE.MathUtils.lerp(startA, goalA, t); bAmount = THREE.MathUtils.lerp(startB, goalB, t);
      changing = raw < 1;
    }
    upperFace.material.color.copy(faceColor.copy(neutralFace).lerp(selectedFace, aAmount));
    lowerFace.material.color.copy(faceColor.copy(neutralFace).lerp(selectedFace, bAmount));
    for (const [name,amount,face] of [['upper',aAmount,upperFace],['lower',bAmount,lowerFace]]) {
      const hover=hoveredFace===name, strength=hover?1:amount;
      const outline=faceOutlines[name];
      outline.bright.opacity=strength; outline.halo.opacity=strength*.12;
      outline.innerRims.forEach(rim=>rim.visible=!(state.step==='requirements'&&state.metric==='diameter'));
      outline.bright.color.set(hover?'#ff763f':accent);
      face.material.emissiveIntensity=strength*.075;
    }
    discs.visible = discAmount > .002;
    discs.traverse(object => {
      if (object.isLine) object.material.opacity = discAmount * .75;
      else if (object.isMesh) object.material.forEach((m, i) => { m.opacity = discAmount * (i === 0 ? .61 : .43); });
    });
    renderer.render(scene, camera); updateMeasurements(); updateLabels(); markReady(); projectAnchors();
    if (changing) requestRender();
  }
  // Normalized anchors remain attached while the illustrative part rotates.
  // Cross-scene links should stay in the UI rather than inventing attachment points.
  function projectAnchors() {
    if (typeof onProject !== 'function') return;
    const points = {};
    const normal = new THREE.Vector3(0, 1, 0).transformDirection(ring.matrixWorld);
    const towardCamera = camera.position.clone().sub(ring.getWorldPosition(new THREE.Vector3())).normalize();
    const upperFacing = normal.dot(towardCamera) > .035;
    const lowerFacing = normal.dot(towardCamera) < -.035;
    const surfaceY = upperFacing ? .221 : -.221;
    function point(id, position, local = true, shown = true) {
      const p = new THREE.Vector3(...position);
      if (local) ring.localToWorld(p);
      p.project(camera);
      const x = (p.x + 1) / 2, y = (1 - p.y) / 2;
      points[id] = { x, y, visible: shown && Number.isFinite(x) && Number.isFinite(y) && p.z >= -1 && p.z <= 1 && x >= 0 && x <= 1 && y >= 0 && y <= 1 };
    }
    point('upper', [.85, .221, 1.61], true, upperFacing);
    point('lower', [-.85, -.221, 1.61], true, lowerFacing);
    point('ring', [.85, surfaceY, 1.61]);
    point('diameter', [2, 0, 0]);
    point('thickness', [1.98, 0, .15]);
    point('finish', [-1.72, surfaceY, .6], true, upperFacing || lowerFacing);
    point('production', [0, surfaceY, -1.82]);
    point('grindUpper', [-1.45, 1.12, -.2], false, discAmount > .25);
    point('grindLower', [1.45, -1.12, .3], false, discAmount > .25);
    onProject(points);
  }
  function updateLabels() {
    const width = container.clientWidth, height = container.clientHeight;
    labelOverlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const labels = [];
    function callout(text, point, local, placement) {
      const p = new THREE.Vector3(...point);
      if (local) ring.localToWorld(p);
      p.project(camera);
      const x = (p.x + 1) * width / 2, y = (1 - p.y) * height / 2;
      const fontSize = width < 440 ? 10 : 11;
      const left = placement === 'left';
      let tx = left ? 20 : width - 20;
      let ty = Math.max(28, Math.min(height - 18, y + (placement === 'bottom' ? 34 : left ? -28 : 20)));
      if (placement === 'bottom') tx = Math.max(85, Math.min(width - 85, x));
      const anchor = placement === 'bottom' ? 'middle' : left ? 'start' : 'end';
      const endX = placement === 'bottom' ? tx : left ? tx + 10 : tx - 10;
      const endY = ty - 7;
      labels.push(`<g><path d="M${x.toFixed(1)},${y.toFixed(1)} L${endX.toFixed(1)},${endY.toFixed(1)}" fill="none" stroke="#92736b" stroke-width=".9"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#ff5a1f"/><text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" fill="#eadfd8" paint-order="stroke" stroke="#21191c" stroke-width="4" stroke-linejoin="round">${text}</text></g>`);
    }
    if (state.step === 'process' && discAmount > .25) {
      callout('Grinding face 1', [-1.45, 1.12, -.2], false, 'left');
      callout('Grinding face 2', [1.45, -1.12, .3], false, 'right');
    } else if (state.step === 'requirements' && state.metric === 'diameter') {
      callout('Outside diameter', [0, .26, 2.32], true, 'bottom');
    } else if (state.step === 'requirements' && state.metric === 'thickness') {
      callout('Finished thickness', [2.4, 0, .15], true, 'right');
    }
    labelOverlay.innerHTML = labels.join('');
  }
  function requestRender() {
    if (!raf && !destroyed && !contextLost && inView && !document.hidden) raf = requestAnimationFrame(render);
  }
  function resize() {
    if (destroyed) return;
    const width = container.clientWidth, height = container.clientHeight;
    if (width < 2 || height < 2) return;
    renderer.setSize(width, height, false);
    const aspect = width / height, vertical = aspect < 1.2 ? 5.8 / aspect : 4.55;
    camera.left = -vertical * aspect / 2; camera.right = vertical * aspect / 2;
    camera.top = vertical / 2; camera.bottom = -vertical / 2; camera.updateProjectionMatrix();
    requestRender();
  }
  function pointerDown(event) {
    if (event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY, q: ring.quaternion.clone(), id: event.pointerId, type: event.pointerType };
    dragged = false;
  }
  function hitFace(event) {
    const r=renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    return raycaster.intersectObjects([bodyMesh,upperFace,lowerFace],false)[0]?.object.userData.face || null;
  }
  function setHoveredFace(face) {
    if(hoveredFace===face)return;
    hoveredFace=face; renderer.domElement.style.cursor=face?'pointer':'grab'; requestRender();
  }
  function pointerMove(event) {
    if (!pointerStart) { if(event.pointerType==='mouse') setHoveredFace(state.step==='part'?hitFace(event):null); return; }
    if (state.step === 'process') return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    if (Math.hypot(dx, dy) > 5) dragged = true;
    if (!dragged) return;
    // Vertical touch gestures remain page scrolling; horizontal gestures rotate.
    if(event.pointerType==='touch' && Math.abs(dy)>Math.abs(dx)*1.25)return;
    changing = false; hoveredFace=null;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(event.pointerType==='touch'?0:dy*.006, dx*.006, 0));
    ring.quaternion.copy(q.multiply(pointerStart.q)); renderer.domElement.style.cursor = 'grabbing'; requestRender();
  }
  function pointerUp(event) {
    if (!pointerStart) return;
    if (!dragged && state.step === 'part') {
      const face=hitFace(event); if(face) onFaceSelect?.(face);
    }
    pointerStart = null; renderer.domElement.style.cursor = hoveredFace?'pointer':'grab';
  }
  const pointerCancel = () => { pointerStart = null; setHoveredFace(null); renderer.domElement.style.cursor = 'grab'; };
  function zoom(delta=0) {
    if(destroyed||contextLost||!Number.isFinite(delta))return;
    changing=false;
    camera.zoom=THREE.MathUtils.clamp(camera.zoom*Math.exp(THREE.MathUtils.clamp(delta,-1,1)*.32),baseZoom*.55,baseZoom*2.2);
    camera.updateProjectionMatrix(); requestRender();
  }
  const lost = event => { event.preventDefault(); contextLost = true; cancelAnimationFrame(raf); raf = 0; fallback(); };
  const restored = () => { contextLost = false; resize(); targetForState(); };
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else requestRender(); };
  const motionChanged = () => { if (reduceMotion.matches && changing) { animationDuration = 0; requestRender(); } };
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointerleave', pointerCancel);
  canvas.addEventListener('pointercancel', pointerCancel);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  document.addEventListener('visibilitychange', visibility);
  reduceMotion.addEventListener('change', motionChanged);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
  const intersection = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) { resize(); requestRender(); } else { cancelAnimationFrame(raf); raf = 0; }
  }); intersection.observe(container);
  resize(); targetForState();

  return {
    setState(next = {}) {
      state = { ...state, ...next };
      container.dataset.sceneStep = state.step;
      if (contextLost) { fallback(); return; }
      targetForState();
    },
    reset() { targetForState(); },
    zoom,
    destroy() {
      destroyed = true; cancelAnimationFrame(raf);
      resizeObserver.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      reduceMotion.removeEventListener('change', motionChanged);
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointerleave', pointerCancel);
      canvas.removeEventListener('pointercancel', pointerCancel); canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
      technicalGrid?.dispose(); environmentTarget?.dispose(); renderer.dispose(); canvas.remove(); labelOverlay.remove(); measurementOverlay.remove(); fallback();
    }
  };
}
