import {
  Camera,
  Model,
  Scene,
  loadMesh,
  loadTexture,
  PointLight,
  setGLContext,
  vec3,
  mat4
} from '../../dist/dowel.js';

import PBRInstancedShader from './pbr-instanced.js';
import PBRShader from '../shared/pbr.js';
import { parallelUniformSurfaceSampling } from './poisson.js';

const can = document.querySelector('canvas');
const gl = can.getContext('webgl2');
const keys = {};
const loadMsg = document.querySelector('.loadmsg');

can.width = gl.canvas.clientWidth;
can.height = gl.canvas.clientHeight;

var scene, camera, shapePivot, point;

setGLContext(gl); // must happen before anything
init();

async function init() {

  scene = new Scene();
  camera = new Camera(
    'view cam',
    45,
    gl.canvas.width / gl.canvas.height,
    0.01, 100.0,
    { x: 0, y: 0, w: gl.canvas.width, h: gl.canvas.height }
  );
  vec3.set(camera.translation, 0, 0, 0);
  vec3.set(camera.rotation, 0, 0, 0);

  point = new PointLight('point', 2, vec3.fromValues(1.0, 1.0, 1.0));
  vec3.set(point.translation,3, 3, 3);

  shapePivot = new Model('pivot', null, scene, null, null);
  vec3.set(shapePivot.translation, 0, 0, -3);

  const loaded = await Promise.all([
    loadTexture('../shared/brdfLUT.png'),
    loadMesh('./bead.obj'),
    loadMesh('../shared/bunny.obj')
  ]);

  const bunnyMesh = loaded[2];
  const bunnyShader = new PBRShader();
  const bunny = new Model('bunny', bunnyMesh, shapePivot, bunnyShader);
  bunny.textures.push(loaded[0]);
  bunnyShader.setColor(vec3.fromValues(0.47, 0.45, 0.4));
  bunnyShader.setSpecularColor(vec3.fromValues(1.0, 1.0, 1.0));
  bunnyShader.setMetalness(0.1);
  bunnyShader.setRoughness(0.9);
  bunnyShader.updatePoint(point);
  bunnyShader.updateCamera(camera);

  const beadMesh = loaded[1];

  const points = parallelUniformSurfaceSampling(bunnyMesh, 20000, 0.02, 3);
  console.log(points.length);
  const offsets = makeOffsets(points);
  beadMesh.offsets = offsets;

  const beadShader = new PBRInstancedShader();
  const bead = new Model('bead', beadMesh, shapePivot, beadShader);
  bead.textures.push(loaded[0]);
  beadShader.setColor(vec3.fromValues(0.1, 0.3, 0.8));
  beadShader.setSpecularColor(vec3.fromValues(1.0, 1.0, 1.0));
  beadShader.setMetalness(0.1);
  beadShader.setRoughness(0.1);
  beadShader.updatePoint(point);
  beadShader.updateCamera(camera);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  scene.updateMatrix();
  enableControls();
  console.log('loaded');
  loadMsg.style.display = 'none';
  animate(0);
}

function animate() {
  requestAnimationFrame(animate);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  camera.render(scene);
}

function enableControls () {
  gl.canvas.onmousemove = (e) => {
    let nDx = 2 * (e.offsetX / gl.canvas.offsetWidth) - 1;
    let nDy = 2 * (e.offsetY / gl.canvas.offsetHeight) - 1;

    if (e.buttons) {
      vec3.set(shapePivot.rotation, nDy * 180, nDx * 180, 0);
    }
  };

  window.addEventListener('resize', () => {
    gl.canvas.width = gl.canvas.clientWidth;
    gl.canvas.height = gl.canvas.clientHeight;
    camera.viewport.w = gl.canvas.clientWidth;
    camera.viewport.h = gl.canvas.clientHeight;
    camera.aspect = camera.viewport.w / camera.viewport.h;
  });

  window.addEventListener('wheel', (e) => {
    let dir = e.deltaY / Math.abs(e.deltaY);
    let newZ = shapePivot.translation[2] + dir / 5;
    vec3.set(shapePivot.translation, 0, 0, newZ);
  });

  window.addEventListener('keydown', (e) => {
    keys[e.keyCode] = true;
  });

  window.addEventListener('keyup', (e) => {
    keys[e.keyCode] = false;
  });
}

function getBitangent(normal) {
  const up = vec3.fromValues(0, 1, 0);
  const dn = vec3.fromValues(0, -1, 0);
  const c1 = vec3.cross(vec3.create(), normal, dn);
  const c2 = vec3.cross(vec3.create(), normal, up);
  let tang;
  if (vec3.length(c1) > vec3.length(c2)) {
    tang = c1;
  }
  else {
    tang = c2;
  }
  return vec3.cross(vec3.create(), tang, normal);
}

function makeOffsets(points) {
  let offsetArray = [];
  points.forEach(point => {
    const bitg = getBitangent(point.normal);
    const lookMat = mat4.targetTo(mat4.create(), vec3.create(), bitg, vec3.fromValues(0, 1, 0));
    const transMat = mat4.fromTranslation(mat4.create(), point.position);
    const inst = mat4.mul(mat4.create(), transMat, lookMat);
    offsetArray = [
      ...offsetArray,
      ...inst
    ];
  });
  return offsetArray;
}