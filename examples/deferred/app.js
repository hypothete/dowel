import {
  Camera,
  Model,
  Scene,
  setGLContext,
  vec3,
  PlaneMesh,
  BoxMesh,
  Quad,
  makeGBuffer
} from '../../dist/dowel.js';

import DeferredMaterialShader from './deferred-material.js';
import DeferredCompositorShader from './deferred-compositor.js';

const can = document.querySelector('canvas');
const gl = can.getContext('webgl2');
const keys = {};
const loadMsg = document.querySelector('.loadmsg');

can.width = gl.canvas.clientWidth;
can.height = gl.canvas.clientHeight;

var scene, camera, shapePivot, gBuffer, quad;

setGLContext(gl); // must happen before anything
init();

async function init() {

  // set up GBuffer
  gBuffer = makeGBuffer();

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

  shapePivot = new Model('pivot', null, scene, null, null);
  vec3.set(shapePivot.translation, 0, 0, -5);

  const planeShader = new DeferredMaterialShader({ fragDefines: { index: 1 } });
  const planeMesh = new PlaneMesh(5, 5, 5, 5);
  const plane = new Model('plane', planeMesh, shapePivot, planeShader);
  vec3.set(plane.translation, 0, -0.5, 0);
  vec3.set(plane.rotation, -90, 0, 0);

  const boxShader = new DeferredMaterialShader({ fragDefines: { index: 2 } });
  const boxMesh = new BoxMesh(1, 1, 1);
  const box = new Model('box', boxMesh, shapePivot, boxShader);
  vec3.set(box.translation, 0, 0.3, 0);
  vec3.set(box.rotation, 35.264, 0, 35.264);


  const quadShader = new DeferredCompositorShader();
  quad = new Quad('output', quadShader);
  quad.textures.push(...gBuffer.textures);
  quadShader.updateCamera(camera);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  scene.updateMatrix();
  enableControls();
  console.log('loaded');
  loadMsg.style.display = 'none';
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  animate(0);
}

function animate() {
  requestAnimationFrame(animate);
  gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer.buffer);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  camera.render(scene);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  quad.draw();
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