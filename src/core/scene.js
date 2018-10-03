import {quat, mat4, vec3} from '../../node_modules/gl-matrix/src/gl-matrix';

export default class Scene {
  constructor () {
    this.children = [];
    this.matrix = mat4.create();
    this.translation = vec3.create();
    this.rotation = vec3.create();
    this.scale = vec3.fromValues(1,1,1);
  }
  updateMatrix () {
    const rotQuat = quat.fromEuler(quat.create(), this.rotation[0], this.rotation[1], this.rotation[2]);
    const rotMat = mat4.fromQuat(mat4.create(), rotQuat);
    mat4.copy(this.matrix, mat4.create());
    mat4.translate(this.matrix, this.matrix, this.translation);
    mat4.multiply(this.matrix, this.matrix, rotMat);
    mat4.scale(this.matrix, this.matrix, this.scale);
  }
}