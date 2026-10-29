import * as THREE from '../illustrations/vendor/three.module.js';
import { RoomEnvironment } from '../illustrations/vendor/RoomEnvironment.js';
import { createMachineModel } from './machine-model.js';
import { createTechnicalGrid } from './technical-stage.js';
import { createTechnicalContours } from './technical-contours.js';

/** Camera and picking layer for the photo-guided, illustrative robot cell. */
export function createMachineScene(container, { onSelect, onReady, onError, onProject, framingScale = 1 } = {}) {
  const overviewFramingScale=Number.isFinite(framingScale)?THREE.MathUtils.clamp(framingScale,.75,1.25):1;
  let state={target:'machine',isolate:false,cutaway:false};
  let renderer,scene,camera,model,environmentTarget,shadowMaterial,groundGeometry,technicalGrid,contours;
  let hovered=null;
  let destroyed=false,contextLost=false,inView=true,raf=0,changing=false,ready=false;
  let startTime=0,duration=780,height=8,startHeight=8,goalHeight=8,fitHeight=8;
  let theta=.64,phi=1.12,startTheta=theta,goalTheta=theta,startPhi=phi,goalPhi=phi;
  const center=new THREE.Vector3(),startCenter=new THREE.Vector3(),goalCenter=new THREE.Vector3();
  const spherical=new THREE.Spherical(24,phi,theta),offset=new THREE.Vector3();
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let down=null,dragged=false,resizeObserver,intersection;
  const validTargets=new Set(['machine','robot','loading','grinding','controls']);
  const presets={machine:[.58,1.12],robot:[.37,1.1],loading:[.42,.94],grinding:[.16,1.31],controls:[.2,1.22]};
  function fallback(error) {
    container.dataset.renderMode='fallback';
    onProject?.({});
    if(renderer){renderer.domElement.style.visibility='hidden';renderer.domElement.setAttribute('aria-hidden','true');}
    const img=container.querySelector('.mx-machine-fallback');if(img){img.hidden=false;img.style.display='';}
    if(error)onError?.(error);
  }
  function markReady() {
    if(container.dataset.renderMode!=='webgl')container.dataset.renderMode='webgl';
    renderer.domElement.style.visibility='';renderer.domElement.removeAttribute('aria-hidden');
    const img=container.querySelector('.mx-machine-fallback');if(img)img.style.display='none';
    if(!ready){ready=true;onReady?.();}
  }
  try {
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setClearColor(0xffffff,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const canvas=renderer.domElement;canvas.className='mx-machine-canvas';canvas.setAttribute('role','img');
    canvas.setAttribute('aria-label','Illustrative C&B grinding cell. Use the labeled component controls for the same exploration.');
    canvas.style.cssText='position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;';container.append(canvas);
    scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-6,6,4,-4,.1,100);
    scene.add(new THREE.HemisphereLight('#fff8f0','#66545b',1.45));
    const key=new THREE.DirectionalLight('#fffaf2',2.8);key.position.set(-4,15,5);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-8,right:8,top:9,bottom:-7,near:1,far:32});key.shadow.bias=-.0003;key.shadow.normalBias=.03;scene.add(key);
    const fill=new THREE.DirectionalLight('#e4e2e6',1.25);fill.position.set(9,6,-5);scene.add(fill);
    buildEnvironment();
    model=createMachineModel({onChange:requestRender});scene.add(model.group);
    groundGeometry=new THREE.PlaneGeometry(200,200);shadowMaterial=new THREE.ShadowMaterial({color:'#090407',opacity:.42});
    const ground=new THREE.Mesh(groundGeometry,shadowMaterial);ground.rotation.x=-Math.PI/2;ground.position.y=.012;ground.receiveShadow=true;ground.userData.noPick=true;ground.raycast=()=>{};scene.add(ground);
    technicalGrid=createTechnicalGrid({size:80,spacing:.75,fadeRadius:24,opacity:.38});scene.add(technicalGrid.object);
    contours=createTechnicalContours(renderer,scene,camera,model,{excluded:[ground,technicalGrid.object]});
  } catch(error) {
    fallback(error);releaseResources();renderer?.domElement.remove();
    return {setState(next){state={...state,...next};fallback();},reset(){},zoom(){},destroy(){destroyed=true;}};
  }
  function buildEnvironment(){
    environmentTarget?.dispose();
    const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environmentTarget=pmrem.fromScene(room,.04);
    scene.environment=environmentTarget.texture;scene.environmentIntensity=.82;room.dispose();pmrem.dispose();
  }
  function releaseResources(){
    contours?.dispose();technicalGrid?.dispose();model?.dispose();environmentTarget?.dispose();groundGeometry?.dispose();shadowMaterial?.dispose();
    scene?.traverse(object=>{if(object.isLight)object.shadow?.dispose();});renderer?.dispose();
  }
  function selectedBounds() {
    model.group.updateMatrixWorld(true);
    if(state.target==='grinding')return state.cutaway
      ? new THREE.Box3(new THREE.Vector3(-2.12,1.43,-1.05),new THREE.Vector3(.85,3.55,1.0))
      : new THREE.Box3(new THREE.Vector3(-2.2,1.0,-1.22),new THREE.Vector3(.93,4.56,1.03));
    if(state.target==='machine') {
      const b=new THREE.Box3();Object.values(model.nodes).forEach(n=>b.union(new THREE.Box3().setFromObject(n)));return b;
    }
    return new THREE.Box3().setFromObject(model.nodes[state.target]);
  }
  function poseForState(immediate=false) {
    const bounds=selectedBounds();bounds.getCenter(goalCenter);
    [goalTheta,goalPhi]=presets[state.target]||presets.machine;
    if(state.target==='grinding'&&state.cutaway){goalTheta=.22;goalPhi=1.2;}
    const testCamera=new THREE.OrthographicCamera();
    testCamera.position.copy(goalCenter).add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(24,goalPhi,goalTheta)));testCamera.lookAt(goalCenter);testCamera.updateMatrixWorld(true);
    const b=new THREE.Box3();
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])b.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(testCamera.matrixWorldInverse));
    const aspect=Math.max(.35,container.clientWidth/Math.max(1,container.clientHeight));
    fitHeight=Math.max(b.max.y-b.min.y,(b.max.x-b.min.x)/aspect)*1.1*(state.target==='machine'?overviewFramingScale:1);
    goalHeight=fitHeight;
    startCenter.copy(center);startTheta=theta;startPhi=phi;startHeight=height;
    startTime=performance.now();duration=immediate||motion.matches?0:780;changing=true;requestRender();
  }
  function setCamera() {
    const aspect=Math.max(.35,container.clientWidth/Math.max(1,container.clientHeight));
    camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();
    spherical.set(24,phi,theta);offset.setFromSpherical(spherical);camera.position.copy(center).add(offset);camera.lookAt(center);camera.updateMatrixWorld(true);
  }
  // Optional presentation markers use real geometry coordinates, independent of
  // the viewport. Visibility here means clipped/hidden, not an occlusion test.
  function projectAnchors() {
    if(typeof onProject!=='function')return;
    const points={};
    function point(id,node,local,shown=true){
      const p=node.localToWorld(new THREE.Vector3(...local)).project(camera);
      let visible=shown;for(let parent=node;parent;parent=parent.parent)visible=visible&&parent.visible;
      const x=(p.x+1)/2,y=(1-p.y)/2;
      points[id]={x,y,visible:visible&&Number.isFinite(x)&&Number.isFinite(y)&&p.z>=-1&&p.z<=1&&x>=0&&x<=1&&y>=0&&y<=1};
    }
    point('robot',model.nodes.robot,[2.97,3.25,1.38]); // elbow joint face
    point('loading',model.nodes.loading,[0,2.21,1.15]); // part presentation nest
    const consoleNode=model.nodes.controls.getObjectByName('operator-console');
    point('controls',consoleNode||model.nodes.controls,consoleNode?[0,-.4,.23]:[3.94,2.55,1.68]); // controls strip, clear of the C&B screen mark
    if(state.cutaway)point('grinding',model.part,[0,0,0]);
    else point('grinding',model.nodes.grinding,[-.65,2.69,.85]); // inspection window
    point('machine',model.nodes.machine,[-.35,.8,-.25],!state.isolate);
    onProject(points);
  }
  function render(now) {
    raf=0;if(destroyed||contextLost||!inView||document.hidden||container.clientWidth<2||container.clientHeight<2)return;
    if(changing){const raw=duration?Math.min(1,(now-startTime)/duration):1,t=1-Math.pow(1-raw,3);center.lerpVectors(startCenter,goalCenter,t);theta=THREE.MathUtils.lerp(startTheta,goalTheta,t);phi=THREE.MathUtils.lerp(startPhi,goalPhi,t);height=THREE.MathUtils.lerp(startHeight,goalHeight,t);changing=raw<1;}
    setCamera();contours.render({selected:state.target,hovered});markReady();projectAnchors();if(changing)requestRender();
  }
  function requestRender(){if(!destroyed&&!contextLost&&inView&&!document.hidden&&!raf)raf=requestAnimationFrame(render);}
  let previousWidth=0,previousHeight=0;
  function resize(){
    if(destroyed)return;const w=container.clientWidth,h=container.clientHeight;if(w<2||h<2)return;
    renderer.setSize(w,h,false);
    if(w!==previousWidth||h!==previousHeight){previousWidth=w;previousHeight=h;poseForState(true);}else requestRender();
  }
  function hitTarget(event) {
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObject(model.group,true).filter(hit=>{if(!hit.object.isMesh||hit.object.userData.noPick)return false;let object=hit.object;while(object){if(!object.visible)return false;object=object.parent;}return true;});
    return hits.length&&validTargets.has(hits[0].object.userData.target)?hits[0].object.userData.target:null;
  }
  function updateHover(target){if(hovered===target)return;hovered=target;container.dataset.hoverTarget=target||'';requestRender();}
  function pointerDown(event){if(event.button!==0)return;down={x:event.clientX,y:event.clientY,theta,phi,id:event.pointerId};dragged=false;renderer.domElement.setPointerCapture(event.pointerId);}
  function pointerMove(event){
    if(!down){if(event.pointerType!=='touch'){const target=hitTarget(event);updateHover(target);renderer.domElement.style.cursor=target?'pointer':'grab';}return;}
    const dx=event.clientX-down.x,dy=event.clientY-down.y;
    if(Math.hypot(dx,dy)>5)dragged=true;
    if(!dragged)return;
    if(event.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)*1.25)return;
    updateHover(null);changing=false;theta=down.theta-dx*.006;phi=THREE.MathUtils.clamp(down.phi-dy*.005,.22,1.62);renderer.domElement.style.cursor='grabbing';requestRender();
  }
  function pointerUp(event){
    if(!down)return;
    if(!dragged){const target=hitTarget(event);if(target)onSelect?.(target);}
    cancelPointer(event);
  }
  function cancelPointer(){if(down&&renderer.domElement.hasPointerCapture?.(down.id))renderer.domElement.releasePointerCapture(down.id);down=null;renderer.domElement.style.cursor='grab';}
  function pointerLeave(){if(!down){updateHover(null);renderer.domElement.style.cursor='grab';}}
  function wheel(event){event.preventDefault();zoom(-Math.sign(event.deltaY)*.5);}
  function zoom(delta=0){if(destroyed||contextLost||!Number.isFinite(delta))return;changing=false;height=THREE.MathUtils.clamp(height*Math.exp(-THREE.MathUtils.clamp(delta,-1,1)*.32),fitHeight*.36,fitHeight*2.3);requestRender();}
  function doubleClick(event){if(event.target===renderer.domElement)poseForState();}
  function lost(event){event.preventDefault();contextLost=true;ready=false;cancelAnimationFrame(raf);raf=0;fallback(new Error('WebGL context unavailable'));}
  function restored(){if(destroyed)return;try{buildEnvironment();contextLost=false;resize();poseForState(true);}catch(error){fallback(error);}}
  function visibility(){if(document.hidden){cancelAnimationFrame(raf);raf=0;}else requestRender();}
  function motionChanged(){if(motion.matches&&changing){duration=0;requestRender();}}
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',cancelPointer);canvas.addEventListener('pointerleave',pointerLeave);
  canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('dblclick',doubleClick);canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
  document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',motionChanged);
  resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
  intersection=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)resize();else{cancelAnimationFrame(raf);raf=0;}});intersection.observe(container);
  model.setState(state);resize();poseForState(true);
  return {
    setState(next={}){if(destroyed)return;state={...state,...next};updateHover(null);if(!validTargets.has(state.target))state.target='machine';state.cutaway=state.target==='grinding'&&Boolean(state.cutaway);model.setState(state);container.dataset.sceneTarget=state.target;if(contextLost){fallback();return;}poseForState(!ready);},
    reset(){if(!destroyed)poseForState();},zoom,
    destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(raf);resizeObserver?.disconnect();intersection?.disconnect();document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',motionChanged);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',cancelPointer);canvas.removeEventListener('pointerleave',pointerLeave);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('dblclick',doubleClick);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);releaseResources();canvas.remove();fallback();}
  };
}
