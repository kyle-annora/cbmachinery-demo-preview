import * as THREE from '../../illustrations/vendor/three.module.js';
import { RoomEnvironment } from '../../illustrations/vendor/RoomEnvironment.js';

/**
 * Video renderer for the ring gear explainer.
 * Geometry mirrors dist/illustrations/ring-gear-scene.js: illustrative, not CAD.
 * Every frame is a pure function of a pose object (no clocks, tweens or observers),
 * so the same pose always renders the same image and any frame can be sought.
 */
export const RING = { outer: 2, faceInner: 1.668, faceOuter: 1.977, faceY: .221, bottom: .25 };
export const WHEEL = { radius: 2.3, thickness: .34 };

// Per-theme scene colours. `steel` is [end-face caps, outer wall, face base]; `teeth` defaults to the outer wall.
// `active` is the explained face: an unlit ramp centred on the theme token, or null when the overlay outlines it instead.
export const SCENE_THEMES = {
  light: {
    steel: ['#a7aaac', '#7f8487', '#aeb2b5'], faceRamp: ['#f2f3f4', '#d5d8da'],
    active: ['#54707F', '#3F5562'], wheelEdge: '#8C969D', wheelFace: '#9FB0BA', shadow: [30, 38, 43], shadowScale: 1,
  },
  // Darker steel on the dark canvas so the pale ice-blue face separates by value, not hue alone.
  immersive: {
    steel: ['#80868a', '#5d6367', '#8a9094'], faceRamp: ['#f2f3f4', '#cfd3d6'],
    active: ['#CFE8EF', '#A6CCD8'], wheelEdge: '#7E939E', wheelFace: '#5D707B', shadow: [6, 12, 16], shadowScale: 1.6,
  },
  // Ink-burgundy canvas (specs/09): silver steel in three clear values, ground faces brightest, outer wall mid,
  // tooth flanks darkest. The explained face keeps its metal; the overlay draws its orange-red rims.
  // Rougher walls keep their reflections soft, so no wall streak outshines the face, even seen from below (01c).
  wine: {
    steel: ['#a5a3a0', '#6d6a68', '#aaa9a6'], faceRamp: ['#ffffff', '#d9d8d6'], teeth: '#3e3b3a', wallRoughness: .55,
    sheen: .3, under: 4.2, active: null, wheelEdge: '#9A8F8C', wheelFace: '#5A4C50',
    shadow: [8, 4, 6], shadowScale: 1.8, wheelShadow: .35, ground: '#6a5f62',
  },
};

export function createVideoRingScene(canvas, { width = 1920, height = 1080, pixelRatio = 1, theme = 'wine' } = {}) {
  const colors = SCENE_THEMES[theme];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(pixelRatio); renderer.setSize(width, height, false);
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100);
  scene.add(new THREE.HemisphereLight('#ffffff', colors.ground || '#8d9aa2', 2.2));
  const key = new THREE.DirectionalLight('#ffffff', 3.4); key.position.set(-3, 7, 5); scene.add(key);
  const fill = new THREE.DirectionalLight('#dce8ef', 1.2); fill.position.set(6, 2, -3); scene.add(fill);
  // Without a colour fill, Face B seen from below must still read as the brightest surface, as Face A does from above.
  // A light straight up reaches only downward-facing surfaces, so views from above are unchanged.
  if (colors.under) { const under = new THREE.DirectionalLight('#ffffff', colors.under); under.position.set(0, -7, 0); scene.add(under); }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, .06).texture; scene.environmentIntensity = .65;
  room.dispose(); pmrem.dispose();

  // The stack shares one axis: the ring and, when shown, the two grinding wheels.
  const stack = new THREE.Group();
  const ring = makeRing();
  const wheels = makeWheels();
  stack.add(ring.group, wheels.group);
  const shadow = makeShadow();
  scene.add(stack, shadow);

  function setCamera({ elevation = 30.4, azimuth = 35.9, height: h = 5.4, cx = .5, cy = .5 } = {}) {
    const el = THREE.MathUtils.degToRad(elevation), az = THREE.MathUtils.degToRad(azimuth);
    camera.position.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(12);
    camera.lookAt(0, 0, 0);
    // Offset the frustum so the stack origin lands at (cx, cy) of the frame.
    const w = h * width / height;
    camera.left = -cx * w; camera.right = (1 - cx) * w;
    camera.top = cy * h; camera.bottom = -(1 - cy) * h;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  }

  function apply(pose) {
    setCamera(pose.view);
    stack.position.set(...(pose.stack?.position || [0, 0, 0]));
    // The ring alone can travel within the stack (loading and unloading); anchors and outlines follow it.
    ring.group.position.set(...(pose.ring?.position || [0, 0, 0]));
    ring.group.rotation.set(...(pose.ring?.rotation || [0, -.14, 0]));
    ring.set(pose.faceA ?? 0, pose.faceB ?? 0);
    ring.fade(pose.ring?.opacity ?? 1);
    const amount = pose.wheels?.amount ?? 0, gap = pose.wheels?.gap ?? .6;
    wheels.set(amount, gap);
    // Contact shadow sits just under the lowest object; scaled to the wheel when wheels are shown.
    // It follows the wheels' amount, so it travels with them as they come and go (exact at 0 and 1).
    const mix = (ringValue, wheelValue) => amount >= 1 ? wheelValue : ringValue + (wheelValue - ringValue) * amount;
    const lowest = mix(RING.bottom, RING.faceY + gap + WHEEL.thickness);
    shadow.position.set(stack.position.x, stack.position.y - lowest - .005, stack.position.z);
    shadow.scale.setScalar(mix(1, WHEEL.radius / RING.outer));
    // There is no floor under the floating lower wheel, so its shadow stays faint where the theme asks.
    shadow.material.opacity = (pose.shadow ?? 1) * mix(1, colors.wheelShadow ?? 1);
    scene.updateMatrixWorld(true);
  }

  function project(point, object) {
    const p = new THREE.Vector3(...point);
    if (object) object.localToWorld(p);
    p.project(camera);
    return { x: (p.x + 1) / 2 * width, y: (1 - p.y) / 2 * height };
  }

  // Named anchors for callouts, in degrees around the axis.
  const radial = (deg, r, y) => { const a = THREE.MathUtils.degToRad(deg); return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  const anchors = {
    faceA: (deg, r = 1.82) => project(radial(deg, r, RING.faceY), ring.group),
    faceB: (deg, r = 1.82) => project(radial(deg, r, -RING.faceY), ring.group),
    ringEdge: (deg, y = 0) => project(radial(deg, RING.outer, y), ring.group),
    // The working rim of each wheel: the edge that faces the ring.
    wheelUpperRim: deg => project(radial(deg, WHEEL.radius, wheels.upper.position.y - WHEEL.thickness / 2), stack),
    wheelLowerRim: deg => project(radial(deg, WHEEL.radius, wheels.lower.position.y + WHEEL.thickness / 2), stack),
  };

  // How squarely a face points at the camera: 1 head-on, 0 edge-on, negative when turned away.
  function facing(face) {
    return new THREE.Vector3(0, face === 'B' ? -1 : 1, 0).transformDirection(ring.group.matrixWorld).dot(camera.position.clone().normalize());
  }

  // Screen-space outline of a face's outer edge. Each point says whether it is visible:
  // the edge of a face turned away from the camera is still seen where the side wall faces the camera.
  // `minFacing` trims the ends where the wall turns edge-on (used when wheel rims would meet them).
  function faceEdge(face, steps = 240, minFacing = 0) {
    const y = face === 'B' ? -RING.faceY : RING.faceY;
    const toCamera = camera.position.clone().normalize();
    const facesCamera = facing(face) > 0;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const deg = i / steps * 360, a = THREE.MathUtils.degToRad(deg);
      const normal = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).transformDirection(ring.group.matrixWorld);
      return { ...project(radial(deg, RING.outer, y), ring.group), visible: facesCamera || normal.dot(toCamera) > minFacing };
    });
  }

  // Screen-space inner and outer rims of a face's ground annulus, for the outlined highlight.
  // Both rims are fully visible whenever the face itself faces the camera; callers fade them by `facing`.
  function faceRims(face, steps = 240) {
    const y = face === 'B' ? -RING.faceY : RING.faceY;
    const rims = [RING.faceInner, RING.faceOuter].map(r => Array.from({ length: steps + 1 }, (_, i) => project(radial(i / steps * 360, r, y), ring.group)));
    return { rims, facing: facing(face) };
  }

  return {
    render(pose) { apply(pose); renderer.render(scene, camera); },
    anchors, faceEdge, faceRims, project, outlined: !colors.active,
  };

  // A vertical colour ramp; after rotateX the canvas top lands at the back of a flat face.
  function ramp(top, bottom) {
    const c = document.createElement('canvas'); c.width = 2; c.height = 256;
    const ctx = c.getContext('2d'), g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 2, 256);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // A flat face under an orthographic camera reflects one colour everywhere, so a ground face gets its sheen
  // from the map: the front-to-back ramp darkened in a soft bow-tie around the axis, as ground steel catches light by angle.
  function sheen([top, bottom], depth) {
    const size = 512, c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d'), g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    const bowtie = ctx.createConicGradient(0, size / 2, size / 2);
    for (let i = 0; i <= 32; i++) bowtie.addColorStop(i / 32, `rgba(0,0,0,${(depth * (1 - Math.cos(i / 32 * Math.PI * 4)) / 2).toFixed(4)})`);
    ctx.fillStyle = bowtie; ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function makeRing() {
    const group = new THREE.Group();
    const shape = new THREE.Shape();
    shape.absarc(0, 0, RING.outer, 0, Math.PI * 2, false);
    // Deliberately simplified internal-tooth contour, as on the website scene.
    const hole = new THREE.Path(), teeth = 72, points = [];
    for (let t = 0; t < teeth; t++) {
      for (const [phase, radius] of [[0, 1.65], [.20, 1.65], [.34, 1.525], [.66, 1.525], [.80, 1.65]]) {
        const angle = -(t + phase) / teeth * Math.PI * 2;
        points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
      }
    }
    hole.setFromPoints(points); hole.closePath(); shape.holes.push(hole);
    const body = new THREE.ExtrudeGeometry(shape, { depth: .39, bevelEnabled: true, bevelThickness: .025, bevelSize: .012, bevelSegments: 2, curveSegments: 128, steps: 1 });
    body.translate(0, 0, -.195); body.rotateX(-Math.PI / 2);
    // Split the extruded side walls into the outer wall (index 1) and the tooth flanks (index 2).
    const position = body.getAttribute('position'), groups = body.groups.slice();
    body.clearGroups();
    for (const { start, count, materialIndex } of groups) {
      if (materialIndex !== 1) { body.addGroup(start, count, materialIndex); continue; }
      let runStart = start, runIndex = null;
      for (let i = start; i < start + count; i += 3) {
        const x = position.getX(i) + position.getX(i + 1) + position.getX(i + 2), z = position.getZ(i) + position.getZ(i + 1) + position.getZ(i + 2);
        const index = Math.hypot(x, z) / 3 > 1.8 ? 1 : 2;
        if (index !== runIndex) { if (runIndex !== null) body.addGroup(runStart, i - runStart, runIndex); runStart = i; runIndex = index; }
      }
      body.addGroup(runStart, start + count - runStart, runIndex);
    }
    // Neutral steel: desaturated so the explained face is the only colour on the part.
    // Tooth flanks seen edge-on sit a hair behind the face, or they show through it as a 1px seam.
    const wallRoughness = colors.wallRoughness ?? .36;
    const bodyMaterials = [
      new THREE.MeshStandardMaterial({ color: colors.steel[0], metalness: .58, roughness: .39 }),
      new THREE.MeshStandardMaterial({ color: colors.steel[1], metalness: .67, roughness: wallRoughness }),
      new THREE.MeshStandardMaterial({ color: colors.teeth || colors.steel[1], metalness: .67, roughness: wallRoughness, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    ];
    group.add(new THREE.Mesh(body, bodyMaterials));

    const annulus = new THREE.RingGeometry(RING.faceInner, RING.faceOuter, 180); annulus.rotateX(-Math.PI / 2);
    const neutralMap = colors.sheen ? sheen(colors.faceRamp, colors.sheen) : ramp(...colors.faceRamp);
    const activeMap = colors.active && ramp(...colors.active);
    const neutral = () => new THREE.MeshStandardMaterial({ color: colors.steel[2], map: neutralMap, metalness: .48, roughness: .42, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    // The highlight is unlit and outside tone mapping so its ramp is measured on screen as authored.
    // It draws after the translucent wheels (renderOrder) so a wheel never washes it out.
    const active = () => new THREE.MeshBasicMaterial({ map: activeMap, toneMapped: false, transparent: true, opacity: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const faceA = new THREE.Mesh(annulus, neutral()), faceB = new THREE.Mesh(annulus, neutral());
    const activeA = new THREE.Mesh(annulus, active()), activeB = new THREE.Mesh(annulus, active());
    faceA.position.y = activeA.position.y = RING.faceY;
    faceB.position.y = activeB.position.y = -RING.faceY;
    activeA.renderOrder = activeB.renderOrder = 30;
    activeA.visible = activeB.visible = !!activeMap;
    group.add(faceA, faceB, activeA, activeB);
    // A part arriving can fade in (shot 03's next part). Fully shown, the materials are opaque again,
    // so every other frame renders exactly as before.
    const solid = [...bodyMaterials, faceA.material, faceB.material];
    return {
      group,
      set(a, b) { activeA.material.opacity = a; activeB.material.opacity = b; },
      fade(opacity) {
        for (const m of solid) {
          const transparent = opacity < 1;
          if (m.transparent !== transparent) { m.transparent = transparent; m.needsUpdate = true; }
          m.opacity = opacity;
        }
      },
    };
  }

  function makeWheels() {
    const group = new THREE.Group();
    // Schematic wheels: nearly clear bodies with crisp edges, so the ring stays the hero.
    const body = new THREE.MeshStandardMaterial({ color: '#d3dbe0', roughness: .85, metalness: 0, transparent: true, opacity: 0, depthWrite: false });
    const work = new THREE.MeshBasicMaterial({ color: colors.wheelFace, toneMapped: false, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const edgeMaterial = new THREE.MeshBasicMaterial({ color: colors.wheelEdge, toneMapped: false, transparent: true, opacity: 0 });
    const cylinder = new THREE.CylinderGeometry(WHEEL.radius, WHEEL.radius, WHEEL.thickness, 160, 1, true);
    const disc = new THREE.CircleGeometry(WHEEL.radius, 160); disc.rotateX(-Math.PI / 2);
    // Edges are thin tori and rods so they stay crisp at video sizes (WebGL ignores line width).
    const rimGeometry = new THREE.TorusGeometry(WHEEL.radius, .009, 6, 220); rimGeometry.rotateX(Math.PI / 2);
    const rodGeometry = new THREE.CylinderGeometry(.009, .009, WHEEL.thickness, 6);
    const make = direction => {
      const wheel = new THREE.Group();
      const back = new THREE.Mesh(disc, body); back.position.y = direction * WHEEL.thickness / 2;
      const face = new THREE.Mesh(disc, work); face.position.y = -direction * WHEEL.thickness / 2;
      const rims = [1, -1].map(side => { const rim = new THREE.Mesh(rimGeometry, edgeMaterial); rim.position.y = side * WHEEL.thickness / 2; return rim; });
      const rods = [0, 1].map(() => new THREE.Mesh(rodGeometry, edgeMaterial));
      for (const edge of [...rims, ...rods]) edge.renderOrder = 31;
      wheel.add(new THREE.Mesh(cylinder, body), back, face, ...rims, ...rods);
      wheel.userData.rods = rods;
      group.add(wheel); return wheel;
    };
    const upper = make(1), lower = make(-1);
    return {
      group, upper, lower,
      set(amount, gap) {
        group.visible = amount > 0;
        upper.position.y = RING.faceY + gap + WHEEL.thickness / 2;
        lower.position.y = -upper.position.y;
        body.opacity = amount * .14; work.opacity = amount * .22; edgeMaterial.opacity = amount;
        // Silhouette rods sit where the cylinder's side turns away from the camera.
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize().multiplyScalar(WHEEL.radius);
        for (const wheel of [upper, lower]) {
          wheel.userData.rods[0].position.copy(right); wheel.userData.rods[1].position.copy(right).negate();
        }
      },
    };
  }

  function makeShadow() {
    // A tight annular contact shadow under the rim, not a halo.
    const size = 512, c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d'), [r, g, b] = colors.shadow, k = colors.shadowScale;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [stop, alpha] of [[0, .05], [.52, .07], [.6, .3], [.68, .22], [.76, .04], [1, 0]]) {
      gradient.addColorStop(stop, `rgba(${r},${g},${b},${Math.min(1, alpha * k)})`);
    }
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
    const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, dithering: true }));
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }
}
