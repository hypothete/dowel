import {quat, mat4, vec3} from '../../node_modules/gl-matrix/src/gl-matrix';

export default function Scene () {
  const scene = {
    matrix: mat4.create(),
    translation: vec3.create(),
    rotation: vec3.create(),
    scale: vec3.fromValues(1,1,1),
    updateMatrix: function () {
      const rotQuat = quat.fromEuler(quat.create(), scene.rotation[0], scene.rotation[1], scene.rotation[2]);
      const rotMat = mat4.fromQuat(mat4.create(), rotQuat);
      mat4.copy(scene.matrix, mat4.create());
      mat4.translate(scene.matrix, scene.matrix, scene.translation);
      mat4.multiply(scene.matrix, scene.matrix, rotMat);
      mat4.scale(scene.matrix, scene.matrix, scene.scale);
    },
    children: []
  };
  return scene;
}