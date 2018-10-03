import {quat, mat4, vec3} from '../../node_modules/gl-matrix/src/gl-matrix';
import {viewMatrix, projectionMatrix, matrixStack} from './matrix-stack';
import {getGLContext} from './gl-context';

export default class Camera {
  constructor (name, fov, aspect, near, far, viewport) {
    this.gl = getGLContext();
    this.name = name;
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.viewport = viewport;
    this.matrix = mat4.create();
    this.translation = vec3.create();
    this.rotation = vec3.create();
  }

  updateMatrix () {
    const rotQuat = quat.fromEuler(quat.create(), this.rotation[0], this.rotation[1], this.rotation[2]);
    const rotMat = mat4.fromQuat(mat4.create(), rotQuat);
    mat4.copy(this.matrix, mat4.create());
    mat4.translate(this.matrix, this.matrix, this.translation);
    mat4.multiply(this.matrix, this.matrix, rotMat);
  }

  getProjection() {
    return mat4.perspective(mat4.create(), this.fov * Math.PI / 180, this.aspect, this.near, this.far);
  }

  render (scene, parent, overrideShader) {
    this.updateMatrix();
    if (parent) {
      mat4.multiply(this.matrix, parent.matrix, this.matrix);
    }

    this.gl.viewport(this.viewport.x, this.viewport.y, this.viewport.w, this.viewport.h);
    this.gl.enable(this.gl.SCISSOR_TEST);
    this.gl.scissor(this.viewport.x, this.viewport.y, this.viewport.w, this.viewport.h);
    mat4.invert(viewMatrix, this.matrix);
    mat4.copy(projectionMatrix, this.getProjection());

    matrixStack.length = 0;
    matrixStack.push(scene.matrix);

    for (let child of scene.children) {
      child.draw(overrideShader);
    }

    matrixStack.pop();

    this.gl.disable(this.gl.SCISSOR_TEST);
  }
}