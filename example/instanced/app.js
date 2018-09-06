import {
  Camera,
  Model,
  Scene,
  loadMesh,
  loadTexture,
  PointLight,
  setGLContext,
  vec3,
  mat4,
  quat
} from '../../dist/dowel.js';

import PBRInstancedShader from './pbr-instanced.js';
import PBRShader from '../shared/pbr.js';

const can = document.querySelector('canvas');
const gl = can.getContext('webgl2');
const keys = {};

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
  bunnyShader.setColor(vec3.fromValues(0.6, 0.6, 0.6));
  bunnyShader.setSpecularColor(vec3.fromValues(1.0, 1.0, 1.0));
  bunnyShader.setMetalness(0.1);
  bunnyShader.setRoughness(0.8);
  bunnyShader.updatePoint(point);
  bunnyShader.updateCamera(camera);

  const beadMesh = loaded[1];
  beadMesh.offsets = makeOffsetsFromVerts(bunnyMesh);
  const beadShader = new PBRInstancedShader();
  const bead = new Model('bead', beadMesh, shapePivot, beadShader);
  bead.textures.push(loaded[0]);
  beadShader.setColor(vec3.fromValues(0.9, 0.2, 0.2));
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

function getVertexData(mesh, index) {
  const vPos = vec3.fromValues(...mesh.vertices.slice(index * 3, index * 3 + 3));
  const vNorm = vec3.fromValues(...mesh.normals.slice(index * 3, index * 3 + 3));
  const vUv = vec3.fromValues(...mesh.textures.slice(index * 2, index * 2 + 2));
  return {
    position: vPos,
    normal: vNorm,
    uv: vUv
  };
}

function makeOffsetsFromVerts(mesh) {
  const numInstances = 5000;
  let offsetArray = [];
  for (let i = 0; i < numInstances; i++) {
    const randVert = getVertexData(mesh, mesh.indices[Math.random() * mesh.indices.length | 0]);
    const lookMat = mat4.targetTo(mat4.create(), vec3.create(), randVert.normal, vec3.fromValues(0, 1, 0));
    const transMat = mat4.fromTranslation(mat4.create(), randVert.position);
    const inst = mat4.mul(mat4.create(), transMat, lookMat);
    offsetArray = [
      ...offsetArray,
      ...inst
    ];
  }
  return offsetArray;
}

function makeOffsets() {
  const numInstances = 1000;
  let offsetArray = [];
  for (let i = 0; i < numInstances; i++) {
    const randQuat = quat.fromEuler(
      quat.create(),
      360 * Math.random(),
      360 * Math.random(),
      360 * Math.random());
    const randPos = vec3.fromValues(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    let inst = mat4.fromRotationTranslation(mat4.create(), randQuat, randPos);
    offsetArray = [
      ...offsetArray,
      ...inst
    ];
  }
  return offsetArray;
}