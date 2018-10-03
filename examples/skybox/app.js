import {
  Camera,
  Model,
  Scene,
  loadCubeMap,
  loadMesh,
  setGLContext,
  vec3,
  BoxMesh
} from '../../dist/dowel.js';

import CubemapShader from '../shared/cubemap.js';
import EnvmapShader from '../shared/envmap.js';

const can = document.querySelector('canvas');
const gl = can.getContext('webgl2');
const keys = {};

can.width = gl.canvas.clientWidth;
can.height = gl.canvas.clientHeight;

var scene, camera, shapePivot;

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
  vec3.set(camera.translation, 0, 0, 0);

  shapePivot = new Model('pivot', null, scene, null, null);
  vec3.set(shapePivot.translation, 0, 0, -3);

  const loaded = await Promise.all([
    loadCubeMap([
      '../shared/yokohama/posx.jpg',
      '../shared/yokohama/negx.jpg',
      '../shared/yokohama/posy.jpg',
      '../shared/yokohama/negy.jpg',
      '../shared/yokohama/posz.jpg',
      '../shared/yokohama/negz.jpg',
    ]),
    loadMesh('../shared/teapot-scaled.obj'),
    loadMesh('../shared/bunny.obj'),
  ]);

  const cubemapShader = new CubemapShader();
  const boxMesh = new BoxMesh(100, 100, 100);
  boxMesh.side = gl.FRONT;
  const box = new Model('box', boxMesh, scene, cubemapShader);
  box.textures.push(loaded[0]);

  const reflectShader = new EnvmapShader();
  const teapot = new Model('teapot', loaded[1], shapePivot, reflectShader);
  teapot.textures.push(loaded[0]);
  vec3.set(teapot.translation, -1, 0, 0);

  const refractShader = new EnvmapShader({ fragDefines: { REFRACT: true } });
  const bunny = new Model('bunny', loaded[2], shapePivot, refractShader);
  bunny.textures.push(loaded[0]);
  vec3.set(bunny.translation, 1, 0, 0);

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