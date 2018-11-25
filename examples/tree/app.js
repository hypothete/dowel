import {
  Camera,
  Model,
  Scene,
  loadTexture,
  PointLight,
  setGLContext,
  vec3,
  SphereMesh,
  CylinderMesh
} from '../../dist/dowel.js';

import PBRInstancedShader from '../shared/pbr-instanced.js';
import { makeOffsets } from '../shared/poisson.js';
import PBRShader from '../shared/pbr.js';
import {Tree} from './tree.js';

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
  vec3.set(shapePivot.translation, 0, 0.5, -5);

  const loaded = await Promise.all([
    loadTexture('../shared/brdfLUT.png')
  ]);

  const branchShader = new PBRShader();
  branchShader.setColor(vec3.fromValues(0.47, 0.45, 0.4));
  branchShader.setSpecularColor(vec3.fromValues(1.0, 1.0, 1.0));
  branchShader.setMetalness(0.1);
  branchShader.setRoughness(0.9);
  const branchMesh = new CylinderMesh(0.01, 0.1, 8, 1);

  const points = [];
  for (let i = 0; i < 1000; i++) {
    const pos = vec3.fromValues(
      2 * Math.random() - 1,
      2 * Math.random() - 1,
      2 * Math.random() - 1
    );
    points.push(pos);
  }

  const leafMesh = new SphereMesh(0.01, 8, 8);
  const leafShader = new PBRInstancedShader();

  const tree = new Tree(
    points,
    vec3.fromValues(0, -2, 0),
    shapePivot,
    1, 0.1, 0.1, 0.3,
    branchShader,
    branchMesh,
    2000
  );

  //tree.grow();
  tree.render(point, camera);

  let interv = setInterval(() => {
    if (tree.doneGrowing) {
      clearInterval(interv);

      leafMesh.offsets = makeOffsets(tree.reachedLeaves.map(leaf => {
        return {
          position: leaf.position,
          normal: vec3.fromValues(1,1,1)
        };
      }));
      const leaf = new Model('leaf', leafMesh, shapePivot, leafShader);
      leaf.textures.push(loaded[0]);
      leafShader.setColor(vec3.fromValues(0.1, 0.8, 0.3));
      leafShader.setSpecularColor(vec3.fromValues(1.0, 1.0, 1.0));
      leafShader.setMetalness(0.1);
      leafShader.setRoughness(0.9);
      leafShader.updatePoint(point);
      leafShader.updateCamera(camera);
    }
    tree.grow();
    tree.render(point, camera);
  }, 10);

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
    shapePivot.translation[2] = newZ;
  });

  window.addEventListener('keydown', (e) => {
    keys[e.keyCode] = true;
  });

  window.addEventListener('keyup', (e) => {
    keys[e.keyCode] = false;
  });
}
