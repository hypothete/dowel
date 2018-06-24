import {quat, mat4, vec3} from '../../node_modules/gl-matrix/src/gl-matrix';
import {viewMatrix, projectionMatrix, matrixStack} from './matrix-stack';
import {getGLContext} from './gl-context';

export default function Camera (name, fov, aspect, near, far, viewport) {
  const gl = getGLContext();
  const cam = {
    name,
    fov,
    aspect,
    near,
    far,
    viewport,
    matrix: mat4.create(),
    translation: vec3.create(),
    rotation: vec3.create(),
    updateMatrix () {
      const rotQuat = quat.fromEuler(quat.create(), cam.rotation[0], cam.rotation[1], cam.rotation[2]);
      const rotMat = mat4.fromQuat(mat4.create(), rotQuat);
      mat4.copy(cam.matrix, mat4.create());
      mat4.translate(cam.matrix, cam.matrix, cam.translation);
      mat4.multiply(cam.matrix, cam.matrix, rotMat);
    },
    render (scene, parent) {
      cam.updateMatrix();
      if (parent) {
        mat4.multiply(cam.matrix, parent.matrix, cam.matrix);
      }

      gl.viewport(cam.viewport.x, cam.viewport.y, cam.viewport.w, cam.viewport.h);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(cam.viewport.x, cam.viewport.y, cam.viewport.w, cam.viewport.h);
      mat4.invert(viewMatrix, cam.matrix);
      mat4.perspective(projectionMatrix, cam.fov * Math.PI / 180, cam.aspect, cam.near, cam.far);

      matrixStack.length = 0;
      matrixStack.push(mat4.multiply(mat4.create(), viewMatrix, scene.matrix));

      for (let child of scene.children) {
        child.draw();
      }

      matrixStack.pop();

      gl.disable(gl.SCISSOR_TEST);
    }
  };
  return cam;
}