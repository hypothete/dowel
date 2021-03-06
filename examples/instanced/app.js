import {
  Camera,
  Model,
  Scene,
  loadMesh,
  loadTexture,
  PointLight,
  setGLContext,
  vec3
} from '../../dist/dowel.js';

import PBRInstancedShader from '../shared/pbr-instanced.js';
import PBRShader from '../shared/pbr.js';
import { parallelUniformSurfaceSampling, makeOffsets } from '../shared/poisson.js';

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

  point = new PointLight('point', 1, vec3.fromValues(1.0, 1.0, 1.0));
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
