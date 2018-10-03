import {
  Camera,
  Model,
  Scene,
  loadMesh,
  loadTexture,
  setGLContext,
  SpotLight,
  vec3,
  PlaneMesh,
  SphereMesh,
  BoxMesh
} from '../../dist/dowel.js';

import PhongBlinnShader from '../shared/phong-blinn.js';

const can = document.querySelector('canvas');
const gl = can.getContext('webgl2');
const keys = {};

can.width = gl.canvas.clientWidth;
can.height = gl.canvas.clientHeight;

var scene, camera, shapePivot, spot, bunnyShader;

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

  spot = new SpotLight('spot', 3.0, vec3.fromValues(1.0, 1.0, 1.0), 20);
  vec3.set(spot.translation, 0, 5, -3);
  vec3.set(spot.direction, 0, -1, 0);

  shapePivot = new Model('pivot', null, scene, null, null);
  vec3.set(shapePivot.translation, 0, 0, -5);

  const loaded = await Promise.all([
    loadTexture('../shared/escher.jpg'),
    loadMesh('../shared/bunny.obj')
  ]);

  const lizardTex = loaded[0];
  const bunnyMesh = loaded[1];

  bunnyShader = new PhongBlinnShader();
  const bunny = new Model('bunny', bunnyMesh, shapePivot, bunnyShader);
  bunny.textures.push(lizardTex);
  bunnyShader.updateSpot(spot);
  bunnyShader.updateCamera(camera);

  const planeMesh = new PlaneMesh(5, 5, 5, 5);
  const plane = new Model('plane', planeMesh, shapePivot, bunnyShader);
  plane.textures.push(lizardTex);
  vec3.set(plane.translation, 0, -0.35, 0);
  vec3.set(plane.rotation, -90, 0, 0);

  const sphereMesh = new SphereMesh(0.5, 32, 32);
  const sphere = new Model('sphere', sphereMesh, shapePivot, bunnyShader);
  sphere.textures.push(lizardTex);
  vec3.set(sphere.translation, 1.5, 0.15, -2);

  const boxMesh = new BoxMesh(0.5, 1, 0.5);
  const box = new Model('box', boxMesh, shapePivot, bunnyShader);
  box.textures.push(lizardTex);
  vec3.set(box.translation, -1.5, 0.15, 0.75);
  vec3.set(box.rotation, 0, 22.5, 0);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  scene.updateMatrix();
  enableControls();
  console.log('loaded');
  animate(0);
}

function animate(ts) {
  requestAnimationFrame(animate);
  ts = ts / 1000;
  vec3.set(spot.direction, 0.25 * Math.sin(ts), -1, -0.5 - 0.25 * Math.cos(ts / 2));
  bunnyShader.updateSpot(spot);

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