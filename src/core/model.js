import {quat, mat4, vec3} from '../../node_modules/gl-matrix/src/gl-matrix.js';
import {projectionMatrix, matrixStack} from './matrix-stack.js';

export default function Model (gl, name, mesh, parent, shader) {
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
      let parentMVMatrix = matrixStack[matrixStack.length - 1];
      let worldMVMatrix = mat4.multiply(mat4.create(), parentMVMatrix, model.matrix);
      matrixStack.push(worldMVMatrix);

      for (let child of model.children) {
        child.draw();
      }

      matrixStack.pop();

      if (typeof model.mesh === 'undefined' || model.mesh == null) {
        return;
      }

      gl.useProgram(model.shader.shaderProgram);

      gl.uniformMatrix4fv(model.shader.shaderLocations.uniformLocations.projectionMatrix, false, projectionMatrix);
      gl.uniformMatrix4fv(model.shader.shaderLocations.uniformLocations.modelViewMatrix, false, worldMVMatrix);

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