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

const can = document.querySelector('canvas');
const gl = can.getContext('webgl2');
const keys = {};

can.width = gl.canvas.clientWidth;
can.height = gl.canvas.clientHeight;

var scene, camera, shapePivot, point, bunnyShader;

setGLContext(gl); // must happen before anything
init();

async function init() {

  scene = new Scene();
  camera = new Camera(
    'view cam',
    45,
    gl.canvas.width / gl.canvas.height,
    1.0, 100.0,
    { x: 0, y: 0, w: gl.canvas.width, h: gl.canvas.height }
  );
  vec3.set(camera.translation, 0, 1, 0);
  vec3.set(camera.rotation, -10, 0, 0);

  point = new PointLight('point', 2, vec3.fromValues(1.0, 1.0, 1.0));
  vec3.set(point.translation,3, 3, 3);

  shapePivot = new Model('pivot', null, scene, null, null);
  vec3.set(shapePivot.translation, 0, 0, -3);

  const offsets = makeOffsets();

  const loaded = await Promise.all([
    loadTexture('../shared/brdfLUT.png'),
    loadMesh('../shared/bunny.obj', offsets)
  ]);

  const bunnyMesh = loaded[1];

  bunnyShader = new PBRInstancedShader();
  const bunny = new Model('bunny', bunnyMesh, shapePivot, bunnyShader);
  bunny.textures.push(loaded[0]);
  bunnyShader.setColor(vec3.fromValues(0.9, 0.2, 0.2));
  bunnyShader.setSpecularColor(vec3.fromValues(1.0, 1.0, 1.0));
  bunnyShader.setMetalness(0);
  bunnyShader.setRoughness(1.0);
  bunnyShader.updatePoint(point);
  bunnyShader.updateCamera(camera);

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

function makeOffsets() {
  const numInstances = 4;
  let offsetArray = [];
  for (let i = 0; i < numInstances; i++) {
    let inst = mat4.fromTranslation(mat4.create(), vec3.fromValues(i * 2, 0, 0));
    offsetArray = [
      ...offsetArray,
      ...inst
    ];
  }
  return offsetArray;
}