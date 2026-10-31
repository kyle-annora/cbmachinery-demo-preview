import{u as de,v as pe,w as he,x as ge,y as we,C as J,s as K,S as V,l as $,m as xe,t as Y,I as te,z as ce,k as le,f as ye,J as ve,K as be,T as Se,U as Ce,X as Ae,n as Pe}from"./three-C-IhcKZu.js";const Te=16;function re(r,e){if(!(r instanceof ArrayBuffer)||!e||!Number.isInteger(e.byteOffset)||e.byteOffset<0||e.byteOffset%4||!Number.isInteger(e.segmentCount)||e.segmentCount<0)throw new Error("Invalid contour buffer record.");const d=e.segmentCount*Te;if(e.byteOffset+d>r.byteLength)throw new Error("Contour record exceeds its asset.");return{indices:new Uint32Array(r,e.byteOffset,e.segmentCount*4),normals:new Int16Array(r,e.byteOffset,e.segmentCount*8),count:e.segmentCount}}const ae=Object.freeze({crease:1.4,contour:2}),ue=8,ne=ue*4,H=.75,oe=()=>new Promise(r=>setTimeout(r,0)),z=r=>{if(r?.aborted)throw r.reason||new DOMException("Line preparation interrupted.","AbortError")};class Me{constructor(e){this.meshes=e,this.data=new Float32Array(Math.max(1,e.length)*ne),this.texture=new de(this.data,ue,Math.max(1,e.length),pe,he),this.texture.minFilter=this.texture.magFilter=ge,this.texture.generateMipmaps=!1,this.texture.needsUpdate=!0,this.normal=new we,this.uploads=0}sync({active:e=new Set,context:d=new Set,highlighted:l=new Set,filled:x=new Set,renderStyle:n="linework",perPartAlpha:k,worldMatricesUpdated:F=!1}={}){let E=!1,u=0,i=0,y=0;const g=(w,c)=>{const f=Math.fround(c);this.data[w]!==f&&(this.data[w]=f,E=!0)};for(let w=0;w<this.meshes.length;w++){const c=this.meshes[w],f=w*ne;F||c.updateWorldMatrix(!0,!1);const S=c.matrixWorld.elements;let A=!1;for(let o=0;o<16;o++){if(!Number.isFinite(S[o]))throw new Error(`Invalid linework transform: ${c.name}`);this.data[f+o]!==Math.fround(S[o])&&(A=!0),g(f+o,S[o])}if(A){this.normal.getNormalMatrix(c.matrixWorld);for(let o=0;o<3;o++)for(let C=0;C<3;C++)g(f+16+o*4+C,this.normal.elements[o*3+C])}const p=e.has(c.name),v=!p&&d.has(c.name),P=k?.get(c.name),T=c.visible&&(p||v)?Math.max(0,Math.min(1,Number.isFinite(P)?P:p?1:.06)):0,W=n==="flat"&&p&&x.has(c.name)&&T>.001;g(f+28,T),g(f+29,p?1:0),g(f+30,p&&l.has(c.name)?1:0),g(f+31,W?1:0),T>.001&&(p?i++:v&&y++),W&&u++}return E&&(this.texture.needsUpdate=!0,this.uploads++),{dirty:E,flatPartCount:u,activePartCount:i,contextPartCount:y,paletteUploads:this.uploads}}dispose(){this.texture.dispose()}}const fe=`
  uniform sampler2D partPalette;
  uniform float partRows;
  attribute float partIndex;
  vec4 partTexel(float column) { return texture2D(partPalette, vec2((column+0.5)/8.0, (partIndex+0.5)/partRows)); }
  mat4 partMatrix() { return mat4(partTexel(0.0), partTexel(1.0), partTexel(2.0), partTexel(3.0)); }
  mat3 partNormalMatrix() { return mat3(partTexel(4.0).xyz, partTexel(5.0).xyz, partTexel(6.0).xyz); }
`;function me(r){return{partPalette:{value:r.texture},partRows:{value:Math.max(1,r.meshes.length)}}}function se(r,e,d){return new ce({uniforms:{...me(r),accent:{value:d}},vertexShader:`${fe}
      varying vec4 partState;
      void main() {
        partState=partTexel(7.0);
        if(partState.x<=0.001 || partState.y<0.5 ${e?"|| partState.w<0.5":""}) {
          gl_Position=vec4(2.0,2.0,2.0,1.0); return;
        }
        gl_Position=projectionMatrix*viewMatrix*partMatrix()*vec4(position,1.0);
      }`,fragmentShader:`uniform vec3 accent; varying vec4 partState;
      void main() {
        if(partState.x<=0.001 || partState.y<0.5 ${e?"|| partState.w<0.5":""}) discard;
        gl_FragColor=vec4(accent, ${e?"partState.x":"1.0"});
      }`,colorWrite:e,depthWrite:!e,depthTest:!0,transparent:e,side:le,forceSinglePass:!0,toneMapped:!1,polygonOffset:!0,polygonOffsetFactor:1,polygonOffsetUnits:1})}function Z(r,e,d,l=!1){const x=e?ae.contour:ae.crease,n=new ce({uniforms:{...me(r),accent:{value:d},resolution:{value:new ye(1,1)},lineWidth:{value:x}},vertexShader:`${fe}
      attribute vec3 segmentStart;
      attribute vec3 segmentEnd;
      ${e?`attribute vec2 edgeNormalA; attribute vec2 edgeNormalB;
        vec3 octNormal(vec2 encoded) {
          vec3 normal=vec3(encoded,1.0-abs(encoded.x)-abs(encoded.y));
          if(normal.z<0.0) normal.xy=(1.0-abs(normal.yx))*vec2(normal.x>=0.0?1.0:-1.0,normal.y>=0.0?1.0:-1.0);
          return normalize(normal);
        }`:""}
      uniform vec2 resolution;
      uniform float lineWidth;
      varying vec4 partState;
      varying vec2 strokePointTimesW;
      varying float strokeW;
      varying float strokeLength;
      void main() {
        partState=partTexel(7.0);
        strokePointTimesW=vec2(1000.0); strokeW=1.0; strokeLength=0.0;
        // Parent context uses silhouettes only. Dense hidden crease bundles can
        // otherwise accumulate into bright spots even at a low per-part opacity.
        if(partState.x<=0.001 || partState.y${l?">":"<"}0.5) { gl_Position=vec4(2.0,2.0,2.0,1.0); return; }
        mat4 world=partMatrix();
        mat4 modelView=viewMatrix*world;
        ${e?`
          vec3 viewPoint=(modelView*vec4((segmentStart+segmentEnd)*0.5,1.0)).xyz;
          vec3 towardCamera=normalize(-viewPoint);
          mat3 viewNormal=mat3(viewMatrix)*partNormalMatrix();
          float first=dot(normalize(viewNormal*octNormal(edgeNormalA)),towardCamera);
          float second=dot(normalize(viewNormal*octNormal(edgeNormalB)),towardCamera);
          if(first*second>0.0) { gl_Position=vec4(2.0,2.0,2.0,1.0); return; }
        `:""}
        vec4 start=projectionMatrix*modelView*vec4(segmentStart,1.0);
        vec4 end=projectionMatrix*modelView*vec4(segmentEnd,1.0);
        if(start.w<=0.0001 || end.w<=0.0001) { gl_Position=vec4(2.0,2.0,2.0,1.0); return; }
        vec2 delta=(end.xy/end.w-start.xy/start.w)*resolution*0.5;
        float lengthPixels=length(delta);
        vec2 along=lengthPixels>0.0001?delta/lengthPixels:vec2(1.0,0.0);
        vec2 across=vec2(-along.y,along.x);
        float halfWidth=(lineWidth+${H})*0.5;
        vec2 offset=across*position.x*halfWidth+along*(position.y*2.0-1.0)*halfWidth;
        vec4 projected=mix(start,end,position.y);
        projected.xy+=offset*2.0/resolution*projected.w;
        gl_Position=projected;
        // Recover screen-linear analytic coverage despite perspective interpolation.
        strokePointTimesW=vec2(position.x*halfWidth,position.y*lengthPixels+(position.y*2.0-1.0)*halfWidth)*projected.w;
        strokeW=projected.w; strokeLength=lengthPixels;
      }`,fragmentShader:`
      uniform vec3 accent;
      uniform float lineWidth;
      varying vec4 partState;
      varying vec2 strokePointTimesW;
      varying float strokeW;
      varying float strokeLength;
      void main() {
        if(partState.x<=0.001 || partState.y${l?">":"<"}0.5) discard;
        vec2 point=strokePointTimesW/strokeW;
        float beyond=max(0.0,max(-point.y,point.y-strokeLength));
        float distanceToStroke=length(vec2(point.x,beyond));
        float coverage=1.0-smoothstep(max(0.0,lineWidth*0.5-${H*.5}),lineWidth*0.5+${H*.5},distanceToStroke);
        if(coverage<=0.0) discard;
        vec3 color=vec3(245.0,243.0,237.0)/255.0;
        ${l?`
          // Resolve coverage against the fixed display background before MAX
          // blending. Overlapping context never adds opacity or brightness.
          gl_FragColor=vec4(mix(vec3(27.0/255.0),color,partState.x*coverage),1.0);
        `:`
          if(partState.z>0.5 && partState.w<0.5) color=accent;
          gl_FragColor=vec4(color,partState.x*coverage);
        `}
      }`,transparent:!0,depthTest:!0,depthWrite:!1,side:le,forceSinglePass:!0,toneMapped:!1});return l&&(n.blending=ve,n.blendEquation=n.blendEquationAlpha=be,n.blendSrc=n.blendDst=n.blendSrcAlpha=n.blendDstAlpha=Se),n.userData.cssLineWidth=x,n}function ie(r){const e=new Ae;return e.setAttribute("position",new Pe([-1,0,0,1,0,0,-1,1,0,1,1,0],3)),e.setIndex([0,1,2,2,1,3]),e.instanceCount=r,e}function Ee(r,e,d){if(!(r instanceof ArrayBuffer)||!e||!Number.isInteger(e.byteOffset)||e.byteOffset<0||e.byteOffset%4||!Number.isInteger(e.segmentCount)||e.segmentCount<0||e.vertexCount!==e.segmentCount*2||e.byteOffset+e.segmentCount*24>r.byteLength)throw new Error(`Invalid prepared crease data: ${d}`)}async function We(r,e,d,l,x,{signal:n,onProgress:k}){if(l?.contours?.format!=="uint32-oct16-le"||l.contours.bytesPerSegment!==16)throw new Error("Unsupported prepared contour format.");if(e?.source?.sha256&&l?.source?.sha256&&e.source.sha256!==l.source.sha256)throw new Error("Crease and contour packages describe different source assets.");let F=0,E=0,u=0,i=0;const y=new Set;for(const a of r){if(!a.name||y.has(a.name)||a.isSkinnedMesh||a.geometry.morphAttributes.position?.length)throw new Error("Batched linework requires uniquely named rigid parts.");y.add(a.name);const h=a.geometry.getAttribute("position");if(!h||h.itemSize!==3)throw new Error(`Missing part positions: ${a.name}`);const s=e?.meshes?.[a.name];Ee(d,s,a.name);const L=l?.meshes?.[a.name];re(x,L),F+=h.count,E+=a.geometry.index?.count||h.count,u+=s.segmentCount,i+=L.segmentCount}z(n);const g=new Float32Array(F*3),w=new Float32Array(F),c=new Uint32Array(E),f=new Float32Array(u*3),S=new Float32Array(u*3),A=new Float32Array(u),p=new Float32Array(i*3),v=new Float32Array(i*3),P=new Int16Array(i*2),T=new Int16Array(i*2),W=new Float32Array(i);let o=0,C=0,O=0,b=0,M=performance.now();const I=async()=>{performance.now()-M>5&&(await oe(),z(n),M=performance.now())};for(let a=0;a<r.length;a++){z(n);const h=r[a],s=h.geometry.getAttribute("position"),L=h.geometry.index;for(let t=0;t<s.count;t++){const B=(o+t)*3;g[B]=s.getX(t),g[B+1]=s.getY(t),g[B+2]=s.getZ(t),t>0&&t%8192===0&&await I()}w.fill(a,o,o+s.count);const Q=L?.count||s.count;for(let t=0;t<Q;t++)c[C+t]=o+(L?L.getX(t):t),t>0&&t%16384===0&&await I();const _=e.meshes[h.name],ee=new Float32Array(d,_.byteOffset,_.segmentCount*6);for(let t=0;t<_.segmentCount;t++)f.set(ee.subarray(t*6,t*6+3),(O+t)*3),S.set(ee.subarray(t*6+3,t*6+6),(O+t)*3),t>0&&t%8192===0&&await I();A.fill(a,O,O+_.segmentCount);const U=l.meshes[h.name],j=re(x,U);for(let t=0;t<U.segmentCount;t++){const B=t*4,R=(b+t)*3,q=j.indices[B],G=j.indices[B+1];if(q>=s.count||G>=s.count)throw new Error(`Contour vertex exceeds source geometry: ${h.name}`);p[R]=s.getX(q),p[R+1]=s.getY(q),p[R+2]=s.getZ(q),v[R]=s.getX(G),v[R+1]=s.getY(G),v[R+2]=s.getZ(G),P.set(j.normals.subarray(t*8+4,t*8+6),(b+t)*2),T.set(j.normals.subarray(t*8+6,t*8+8),(b+t)*2),t>0&&t%8192===0&&await I()}W.fill(a,b,b+U.segmentCount),o+=s.count,C+=Q,O+=_.segmentCount,b+=U.segmentCount,(performance.now()-M>5||a===r.length-1)&&(k?.({phase:"Preparing linework",completed:a+1,total:r.length,progress:(a+1)/r.length}),await oe(),z(n),M=performance.now())}const m=new xe;m.setAttribute("position",new Y(g,3)),m.setAttribute("partIndex",new Y(w,1)),m.setIndex(new Y(c,1));const D=ie(u),N=ie(i);for(const[a,h,s]of[["segmentStart",f,3],["segmentEnd",S,3],["partIndex",A,1]])D.setAttribute(a,new te(h,s));for(const[a,h,s]of[["segmentStart",p,3],["segmentEnd",v,3],["edgeNormalA",P,2],["edgeNormalB",T,2],["partIndex",W,1]])N.setAttribute(a,new te(h,s,h instanceof Int16Array));const X=[f,S,A,p,v,P,T,W].reduce((a,h)=>a+h.byteLength,0);return{surface:m,crease:D,contour:N,stats:{edgeSegments:u,silhouetteSegments:i,lineBytes:X,surfaceBytes:g.byteLength+w.byteLength+c.byteLength,lineBatchCount:2,surfaceTriangleCount:E/3}}}class ke extends Ce{constructor(e,d,l,x,n){super(),this.depthScene=e,this.flatScene=d,this.lineScene=l,this.contextScene=n,this.camera=x,this.needsSwap=!1,this.enabled=!1,this.drawFlat=!1,this.drawContext=!1,this.background=new J().setHex(1776411,K),this.previousColor=new J}render(e,d,l){const x=e.getRenderTarget(),n=e.autoClear,k=e.getClearAlpha();e.getClearColor(this.previousColor),e.autoClear=!1;try{e.setRenderTarget(this.renderToScreen?null:l),e.setClearColor(this.background,1),e.clear(!0,!0,!1),e.render(this.depthScene,this.camera),this.drawContext&&e.render(this.contextScene,this.camera),this.drawFlat&&e.render(this.flatScene,this.camera),e.render(this.lineScene,this.camera)}finally{e.autoClear=n,e.setClearColor(this.previousColor,k),e.setRenderTarget(x)}}}async function Ie({meshes:r,edgeMetadata:e,edgeBuffer:d,silhouetteMetadata:l,silhouetteBuffer:x,camera:n,signal:k,onProgress:F}={}){if(!Array.isArray(r)||!r.length||!n)throw new Error("Linework requires rigid meshes and a camera.");z(k);const E=performance.now(),u=await We(r,e,d,l,x,{signal:k,onProgress:F}),i=new Me(r),y=new J().setHex(16738368,K),g=se(i,!1,y),w=se(i,!0,y),c=Z(i,!1,y),f=Z(i,!0,y),S=Z(i,!0,y,!0),A=new V,p=new V,v=new V,P=new V,T=new $(u.surface,g),W=new $(u.surface,w),o=new $(u.crease,c),C=new $(u.contour,f),O=new $(u.contour,S);for(const m of[T,W,o,C,O])m.frustumCulled=!1,m.matrixAutoUpdate=!1;o.renderOrder=1,C.renderOrder=2,A.add(T),p.add(W),v.add(o,C),P.add(O);const b=new ke(A,p,v,n,P),M={...u.stats,partCount:r.length,paletteBytes:i.data.byteLength,paletteUploads:0,flatPartCount:0,prepareMs:performance.now()-E};let I=!1;return{pass:b,stats:M,sync(m){I||(m?.accent&&y.setHex(parseInt(m.accent.replace("#",""),16),K),Object.assign(M,i.sync(m)),b.drawFlat=M.flatPartCount>0,b.drawContext=M.contextPartCount>0,M.lineBatchCount=2+(b.drawContext?1:0))},resize(m,D,N=1){const X=m<=480?.75:1;for(const a of[c,f,S])a.uniforms.resolution.value.set(Math.max(1,m*N),Math.max(1,D*N)),a.uniforms.lineWidth.value=a.userData.cssLineWidth*X*N},dispose(){if(!I){I=!0,b.enabled=!1;for(const m of[u.surface,u.crease,u.contour])m.dispose();for(const m of[g,w,c,f,S])m.dispose();i.dispose(),A.clear(),p.clear(),v.clear(),P.clear()}}}}export{ae as ASSEMBLY_LINE_WIDTHS,Me as PartTransformPalette,Ie as createAssemblyLinework};
