import * as THREE from '../illustrations/vendor/three.module.js';

/** Screen-space contour, independent of the underlying mesh triangulation. */
export function createTechnicalContours(renderer,scene,camera,model,{excluded=[]}={}) {
  const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true});
  target.texture.name='CB-explorer-selection-mask';
  const maskMaterials={
    selected:new THREE.MeshBasicMaterial({color:0xff0000,toneMapped:false}),
    hovered:new THREE.MeshBasicMaterial({color:0xffff00,toneMapped:false}),
    hoverOnly:new THREE.MeshBasicMaterial({color:0x00ff00,toneMapped:false}),
    occluder:new THREE.MeshBasicMaterial({color:0x000000,toneMapped:false})
  };
  const overlay=new THREE.Scene(),quadCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
    uniforms:{uMask:{value:target.texture},uTexel:{value:new THREE.Vector2(1,1)},uScale:{value:1}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`uniform sampler2D uMask;uniform vec2 uTexel;uniform float uScale;varying vec2 vUv;
      vec2 neighbors(float px){vec2 d=uTexel*px*uScale;vec2 m=vec2(0.);m=max(m,texture2D(uMask,vUv+vec2(d.x,0.)).rg);m=max(m,texture2D(uMask,vUv-vec2(d.x,0.)).rg);m=max(m,texture2D(uMask,vUv+vec2(0.,d.y)).rg);m=max(m,texture2D(uMask,vUv-vec2(0.,d.y)).rg);m=max(m,texture2D(uMask,vUv+d*.707).rg);m=max(m,texture2D(uMask,vUv-d*.707).rg);m=max(m,texture2D(uMask,vUv+vec2(d.x,-d.y)*.707).rg);m=max(m,texture2D(uMask,vUv+vec2(-d.x,d.y)*.707).rg);return m;}
      void main(){vec2 center=texture2D(uMask,vUv).rg;vec2 edge=max(neighbors(1.8)-center,vec2(0.));vec2 halo=max(neighbors(4.5)-center,vec2(0.));float selected=max(edge.r,halo.r*.11);float hover=max(edge.g,halo.g*.14);float a=max(selected,hover);if(a<.004)discard;vec3 orange=vec3(1.,.353,.122);vec3 hoverOrange=vec3(1.,.62,.33);gl_FragColor=vec4(mix(orange,hoverOrange,clamp(hover,0.,.45)),a);}`
  });
  const geometry=new THREE.PlaneGeometry(2,2),quad=new THREE.Mesh(geometry,material);overlay.add(quad);
  const size=new THREE.Vector2(),clear=new THREE.Color();
  function resize(){renderer.getDrawingBufferSize(size);if(target.width!==size.x||target.height!==size.y)target.setSize(size.x,size.y);material.uniforms.uTexel.value.set(1/size.x,1/size.y);material.uniforms.uScale.value=renderer.getPixelRatio();}
  function render({selected='machine',hovered=null}={}) {
    resize();
    const original=[],hidden=[];
    model.group.traverse(object=>{
      if(object.isMesh){original.push([object,object.material]);const id=object.userData.target;const isSelected=selected==='machine'||id===selected;const isHover=hovered&&(hovered==='machine'||id===hovered);object.material=isHover?(isSelected?maskMaterials.hovered:maskMaterials.hoverOnly):isSelected?maskMaterials.selected:maskMaterials.occluder;}
      else if(object.isLine){hidden.push([object,object.visible]);object.visible=false;}
    });
    excluded.forEach(object=>{hidden.push([object,object.visible]);object.visible=false;});
    const previousTarget=renderer.getRenderTarget(),oldAlpha=renderer.getClearAlpha(),oldAutoClear=renderer.autoClear;
    const oldShadowAuto=renderer.shadowMap.autoUpdate,oldShadowNeedsUpdate=renderer.shadowMap.needsUpdate;
    renderer.getClearColor(clear);
    try {renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;renderer.setRenderTarget(target);renderer.setClearColor(0x000000,0);renderer.autoClear=true;renderer.render(scene,camera);}
    finally {original.forEach(([object,m])=>object.material=m);hidden.forEach(([object,visible])=>object.visible=visible);renderer.setRenderTarget(previousTarget);renderer.setClearColor(clear,oldAlpha);renderer.autoClear=oldAutoClear;renderer.shadowMap.autoUpdate=oldShadowAuto;renderer.shadowMap.needsUpdate=oldShadowNeedsUpdate;}
    renderer.render(scene,camera);
    renderer.autoClear=false;renderer.render(overlay,quadCamera);renderer.autoClear=oldAutoClear;
  }
  return {render,dispose(){target.dispose();Object.values(maskMaterials).forEach(m=>m.dispose());material.dispose();geometry.dispose();}};
}
