import {
  Camera,
  Model,
  Scene,
  loadMesh,
  loadTexture,
  SpotLight,
  vec3
} from '../dist/dowel.js';

import PhongBlinnShader from './phong-blinn.js';

const can = document.querySelector('canvas');
const gl = can.getContext('webgl2');
const keys = {};

can.width = gl.canvas.clientWidth;
can.height = gl.canvas.clientHeight;
gl.enable(gl.DEPTH_TEST);

const scene = new Scene();
const camera = new Camera(gl,
  'view cam',
  45,
  gl.canvas.width / gl.canvas.height,
  1.0, 100.0,
  { x: 0, y: 0, w: gl.canvas.width, h: gl.canvas.height }
);

const spot = new SpotLight(gl, 'spot', 15);
vec3.set(spot.translation, 0, 5, -5);
vec3.set(spot.direction, 0, -1, 0);

const shapePivot = new Model(gl, 'pivot', null, scene, null, null);
vec3.set(shapePivot.translation, 0, 0, -5);

gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);
scene.updateMatrix();

init();

enableControls();

async function init() {
  const loaded = await Promise.all([
    loadTexture(gl, './escher.jpg'),
    loadMesh(gl, './bunny.obj')
  ]);

  const lizardTex = loaded[0];
  const bunnyMesh = loaded[1];

  const bunnyShader = new PhongBlinnShader(gl);
  const bunny = new Model(gl, 'bunny', bunnyMesh, shapePivot, bunnyShader);
  bunny.textures.push(lizardTex);
  bunnyShader.updateSpot(spot);

  console.log('loaded');
  animate();
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