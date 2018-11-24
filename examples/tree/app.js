import {
  Camera,
  Model,
  Scene,
  loadTexture,
  PointLight,
  setGLContext,
  CylinderMesh,
  vec3
} from '../../dist/dowel.js';

import PBRShader from '../shared/pbr.js';

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
  vec3.set(shapePivot.translation, 0, 0, -5);

  const loaded = await Promise.all([
    loadTexture('../shared/brdfLUT.png')
  ]);

  const trunkMesh = new CylinderMesh(0.05, 0.1, 16, 1);
  const trunkShader = new PBRShader();
  trunkShader.setColor(vec3.fromValues(0.47, 0.45, 0.4));
  trunkShader.setSpecularColor(vec3.fromValues(1.0, 1.0, 1.0));
  trunkShader.setMetalness(0.1);
  trunkShader.setRoughness(0.9);
  trunkShader.updatePoint(point);
  trunkShader.updateCamera(camera);

  const tree = new Branch(vec3.fromValues(0,0.1,0), trunkShader, trunkMesh, 30, loaded[0], shapePivot);
  vec3.set(tree.model.translation, 0, -1, 0);

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

class Branch {
  constructor(offset, shader, mesh, count, lut, parent, points) {
    this.count = count;
    this.lut = lut;
    this.offset = offset;
    this.points = points;
    this.model = new Model('branch-' + count, mesh, parent, shader);
    this.model.textures.push(lut);
    vec3.copy(this.model.translation, this.offset);

    vec3.mul(this.model.scale, this.model.scale, vec3.fromValues(0.95, 0.95, 0.95));

    vec3.set(this.model.rotation,
      180 * vec3.dot(vec3.fromValues(1, 0, 0), offset),
      0,
      180 * vec3.dot(vec3.fromValues(0, 0, 1), offset),
    );

    if (count > 0) {
      setTimeout(() => {
        this.addBranch();
        if (Math.random() > 0.8) {
          this.addBranch();
        }
      }, 100);
    }
  }

  addBranch() {
    const newPos = vec3.copy(vec3.create(), this.model.translation);
    vec3.add(
      newPos,
      this.offset,
      vec3.fromValues(Math.random() * 0.2 - 0.1, 0, Math.random() * 0.2 - 0.1)
    );

    vec3.normalize(newPos, newPos);
    vec3.scale(newPos, newPos, 0.15);

    new Branch(
      newPos,
      this.model.shader,
      this.model.mesh,
      this.count - 1,
      this.lut,
      this.model,
      this.points
    );
  }
}

function distTo(a, b) {
  return vec3.len(vec3.sub(vec3.create(), b, a));
}

function getClosestPoint(pos, points) {
  const nearest = points.sort((a, b) => {
    const distA = distTo(pos, a);
    const distB = distTo(pos, b);

    if (distA < distB) {
      return -1;
    }
    else if (distB < distA) {
      return 1;
    }
    return 0;
  });

  return nearest(0);
}