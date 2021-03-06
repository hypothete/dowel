import {
  Camera,
  Model,
  Scene,
  setGLContext,
  PointLight,
  vec3,
  SphereMesh,
  loadTexture
} from '../../dist/dowel.js';

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
    0.1, 100.0,
    { x: 0, y: 0, w: gl.canvas.width, h: gl.canvas.height }
  );
  vec3.set(camera.translation, 0, 0, 0);

  point = new PointLight('point', 3, vec3.fromValues(1.0, 1.0, 1.0));
  vec3.set(point.translation,6, 0, 5);

  shapePivot = new Model('pivot', null, scene, null, null);
  vec3.set(shapePivot.translation, 0, 0, -3);

  const loaded = await Promise.all([
    loadTexture('../shared/brdfLUT.png'),
    loadTexture('../shared/normal.jpg'),
  ]);

  // moon from:
  // https://coryg89.github.io/technical/2013/06/01/photorealistic-3d-moon-demo-in-webgl-and-javascript/

  const sphereMesh = new SphereMesh(1, 32, 32);

  const sphereShader = new PBRShader({ fragDefines: { NORMAL_MAP: true } });
  sphereShader.setColor(vec3.fromValues(0.25, 0.25, 0.25));
  sphereShader.setSpecularColor(vec3.fromValues(0.8, 0.8, 0.8));
  sphereShader.setMetalness(0);
  sphereShader.setRoughness(1.0);
  sphereShader.updatePoint(point);
  sphereShader.updateCamera(camera);

  const sphere = new Model('sphere-normal', sphereMesh, shapePivot, sphereShader);
  sphere.textures.push(loaded[0]);
  sphere.textures.push(loaded[1]);


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