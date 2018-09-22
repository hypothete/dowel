import {quat, mat4, vec3} from '../../node_modules/gl-matrix/src/gl-matrix';
import {viewMatrix, projectionMatrix, matrixStack} from './matrix-stack';
import {getGLContext} from './gl-context';

export default function OrthographicCamera (name, left, right, bottom, top, near, far, viewport) {
  const gl = getGLContext();
  const cam = {
    name,
    left, right, bottom, top,
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
    getProjection () {
      return mat4.ortho(mat4.create(), cam.left, cam.right, cam.bottom, cam.top, cam.near, cam.far);
    },
    render (scene, parent, overrideShader) {
      cam.updateMatrix();
      if (parent) {
        mat4.multiply(cam.matrix, parent.matrix, cam.matrix);
      }

      gl.viewport(cam.viewport.x, cam.viewport.y, cam.viewport.w, cam.viewport.h);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(cam.viewport.x, cam.viewport.y, cam.viewport.w, cam.viewport.h);
      mat4.invert(viewMatrix, cam.matrix);
      mat4.copy(projectionMatrix, cam.getProjection());

      matrixStack.length = 0;
      matrixStack.push(scene.matrix);

      for (let child of scene.children) {
        child.draw(overrideShader);
      }

      matrixStack.pop();

      gl.disable(gl.SCISSOR_TEST);
    }
  };
  return cam;
}