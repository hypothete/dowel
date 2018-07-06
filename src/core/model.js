import {quat, mat4, vec3, mat3} from '../../node_modules/gl-matrix/src/gl-matrix';
import {projectionMatrix, normalMatrix, viewMatrix, matrixStack} from './matrix-stack';
import {getGLContext} from './gl-context';

export default function Model (name, mesh, parent, shader) {
  const gl = getGLContext();
  const model = {
    name,
    mesh,
    shader,
    textures: [],
    parent,
    children: [],
    matrix: mat4.create(),
    translation: vec3.create(),
    rotation: vec3.create(),
    scale: vec3.fromValues(1,1,1),
    updateMatrix: function () {
      const rotQuat = quat.fromEuler(quat.create(), model.rotation[0], model.rotation[1], model.rotation[2]);
      const rotMat = mat4.fromQuat(mat4.create(), rotQuat);
      mat4.copy(model.matrix, mat4.create());
      mat4.translate(model.matrix, model.matrix, model.translation);
      mat4.multiply(model.matrix, model.matrix, rotMat);
      mat4.scale(model.matrix, model.matrix, model.scale);
    },
    draw: function () {
      model.updateMatrix();
      let parentModelMatrix = matrixStack[matrixStack.length - 1];
      let modelMatrix = mat4.multiply(mat4.create(), parentModelMatrix, model.matrix);
      matrixStack.push(modelMatrix);

      for (let child of model.children) {
        child.draw();
      }

      matrixStack.pop();

      if (typeof model.mesh === 'undefined' || model.mesh == null) {
        return;
      }

      gl.useProgram(model.shader.shaderProgram);

      gl.uniformMatrix4fv(model.shader.shaderLocations.uniformLocations.projectionMatrix, false, projectionMatrix);
      gl.uniformMatrix4fv(model.shader.shaderLocations.uniformLocations.modelMatrix, false, modelMatrix);
      gl.uniformMatrix4fv(model.shader.shaderLocations.uniformLocations.viewMatrix, false, viewMatrix);

      if (typeof model.shader.shaderLocations.uniformLocations.normalMatrix !== 'undefined') {
        mat3.normalFromMat4(normalMatrix, modelMatrix);
        gl.uniformMatrix3fv(model.shader.shaderLocations.uniformLocations.normalMatrix, false, normalMatrix);
      }

      for (let texInd = 0; texInd < model.textures.length; texInd++) {
        let glSlot = 'TEXTURE' + texInd;
        let uniformLoc = glSlot.toLowerCase();
        gl.activeTexture(gl[glSlot]);
        gl.bindTexture(gl.TEXTURE_2D, model.textures[texInd]);
        gl.uniform1i(model.shader.shaderLocations.uniformLocations[uniformLoc], texInd);
      }

      gl.bindVertexArray(model.mesh.vao);
      gl.drawElements(gl.TRIANGLES, model.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
    }
  };
  if (parent && parent.children) {
    parent.children.push(model);
  }
  if (model.mesh) {
    model.mesh.initializeBuffers(model.shader.shaderLocations);
  }
  return model;
}