import * as THREE from '../illustrations/vendor/three.module.js';

/** A world-space floor grid: size/spacing are illustrative scene units, not dimensions. */
export function createTechnicalGrid({size=80,spacing=1,height=.005,color='#7b6168',opacity=.36,fadeRadius=26}={}) {
  const geometry=new THREE.PlaneGeometry(size,size);
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{uColor:{value:new THREE.Color(color)},uOpacity:{value:opacity},uSpacing:{value:spacing},uFadeRadius:{value:fadeRadius}},
    vertexShader:`varying vec2 vGrid; void main(){ vec4 world=modelMatrix*vec4(position,1.); vGrid=world.xz; gl_Position=projectionMatrix*viewMatrix*world; }`,
    fragmentShader:`uniform vec3 uColor; uniform float uOpacity; uniform float uSpacing; uniform float uFadeRadius; varying vec2 vGrid;
      float grid(vec2 p){vec2 derivative=max(fwidth(p),vec2(.0001));vec2 line=abs(fract(p-.5)-.5)/derivative;return 1.-min(min(line.x,line.y),1.);}
      void main(){float fine=grid(vGrid/uSpacing);float major=grid(vGrid/(uSpacing*5.));float fade=1.-smoothstep(uFadeRadius*.2,uFadeRadius,length(vGrid));float alpha=max(fine*.52,major)*fade*uOpacity;if(alpha<.002)discard;gl_FragColor=vec4(uColor,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`
  });
  const object=new THREE.Mesh(geometry,material);object.name='illustrative-world-grid';object.rotation.x=-Math.PI/2;object.position.y=height;object.renderOrder=-1;object.userData.noPick=true;object.raycast=()=>{};
  return {object,dispose(){geometry.dispose();material.dispose();}};
}
