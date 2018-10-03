import {
  Camera,
  Model,
  Scene,
  loadMesh,
  PointLight,
  setGLContext,
  vec3,
  mat4,
  makeDepthTexture,
  OrthographicCamera,
  Quad,
} from '../../dist/dowel.js';

import LommelSeeligerShader from './lommel-seeliger.js';
import DepthShader from './depth-shader.js';
import BasicShader from './basic-shader.js';

const can = document.querySelector('canvas');
const gl = can.getContext('webgl2');
const keys = {};
const loadMsg = document.querySelector('.loadmsg');

can.width = gl.canvas.clientWidth;
can.height = gl.canvas.clientHeight;

var scene, camera, pointCamera, shapePivot,
  point, depthTex, depthShader, quad, quadShader,
  ryugu, ryuguShader;

setGLContext(gl); // must happen before anything
init();

async function init() {

  scene = new Scene();
  camera = new Camera(
    'view cam',
    45,
    gl.canvas.width / gl.canvas.height,
    0.1, 50.0,
    { x: 0, y: 0, w: gl.canvas.width, h: gl.canvas.height }
  );
  vec3.set(camera.translation, 0, 0, 0);
  vec3.set(camera.rotation, 0.0, 0, 0);

  pointCamera = new OrthographicCamera(
    'point cam',
    -2, 2, -2, 2,
    0.1, 50.0,
    { x: 0, y: 0, w: 2048, h: 2048 }
  );

  // pointCamera = new Camera(
  //   'point cam',
  //   45,
  //   1,
  //   0.1, 50.0,
  //   { x: 0, y: 0, w: 2048, h: 2048 }
  // );
  vec3.set(pointCamera.translation, 3, 0, -1); // match to point
  vec3.set(pointCamera.rotation, 0, 45, 0);

  point = new PointLight('point', 15, vec3.fromValues(1.0, 1.0, 1.0));
  vec3.set(point.translation, 3, 0, -1);

  shapePivot = new Model('pivot', null, scene, null, null);
  vec3.set(shapePivot.translation, 0, 0, -3);

  depthTex = makeDepthTexture(2048, 2048);
  depthShader = new DepthShader();

  quadShader = new BasicShader();
  quad = new Quad('quad', quadShader);

  const loaded = await Promise.all([
    loadMesh('./ryugu.obj'),
  ]);

  const ryuguMesh = loaded[0];
  ryuguShader = new LommelSeeligerShader();
  ryugu = new Model('ryugu', ryuguMesh, shapePivot, ryuguShader);
  // Model by Doug Ellison
  // https://sketchfab.com/models/44876e2f0d314b05ba32b0472a1eddc6
  ryuguShader.updatePoint(point);
  ryuguShader.updateCamera(camera);
  ryugu.textures.push(depthTex.texture);
  ryuguShader.updateResolution(gl.canvas.width, gl.canvas.height);
  ryugu.shader.updateLightMatrix(getLightMatrix(pointCamera));
  ryugu.rotation[0] = 90;
  quad.textures.push(depthTex.texture);

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
  ryugu.rotation[1] += 0.1;
  gl.bindFramebuffer(gl.FRAMEBUFFER, depthTex.buffer);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.clearDepth(1.0);
  pointCamera.render(scene, null, depthShader);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (keys[32]) {
    quad.draw();
  }
  else {
    camera.render(scene);
  }
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
    // lazy scene graph fudge - fix later
    vec3.set(pointCamera.translation, 3, 0, newZ + 2);
    vec3.set(pointCamera.rotation, 0, 45, 0);
    vec3.set(point.translation, 3, 0, newZ + 2);
    ryugu.shader.updateLightMatrix(getLightMatrix(pointCamera));
  });

  window.addEventListener('keydown', (e) => {
    keys[e.keyCode] = true;
  });

  window.addEventListener('keyup', (e) => {
    keys[e.keyCode] = false;
  });
}

function getLightMatrix(cam) {
  cam.updateMatrix();
  const view = mat4.invert(mat4.create(), cam.matrix);
  const proj = cam.getProjection();
  return mat4.multiply(mat4.create(), proj, view);
}