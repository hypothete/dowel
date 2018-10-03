import {quat, mat4, vec3, mat3} from '../../node_modules/gl-matrix/src/gl-matrix';
import {projectionMatrix, normalMatrix, viewMatrix, matrixStack} from './matrix-stack';
import {getGLContext} from './gl-context';

export default class Model {
  constructor (name, mesh, parent, shader) {
    this.gl = getGLContext();
    this.name = name;
    this.mesh = mesh;
    this.shader = shader;
    this.textures = [];
    this.parent = parent;
    this.children = [];
    this.matrix = mat4.create();
    this.translation = vec3.create();
    this.rotation = vec3.create();
    this.scale = vec3.fromValues(1,1,1);

    // TODO: consider revising this. not obvious
    if (parent && parent.children) {
      parent.children.push(this);
    }
    // TODO: maybe move to method?
    if (this.mesh) {
      this.mesh.initializeBuffers(shader.shaderLocations);
    }
  }
  updateMatrix () {
    const rotQuat = quat.fromEuler(quat.create(), this.rotation[0], this.rotation[1], this.rotation[2]);
    const rotMat = mat4.fromQuat(mat4.create(), rotQuat);
    mat4.copy(this.matrix, mat4.create());
    mat4.translate(this.matrix, this.matrix, this.translation);
    mat4.multiply(this.matrix, this.matrix, rotMat);
    mat4.scale(this.matrix, this.matrix, this.scale);
  }

  draw (overrideShader) {
    this.updateMatrix();
    let parentModelMatrix = matrixStack[matrixStack.length - 1];
    let modelMatrix = mat4.multiply(mat4.create(), parentModelMatrix, this.matrix);
    matrixStack.push(modelMatrix);

    for (let child of this.children) {
      child.draw(overrideShader);
    }

    matrixStack.pop();

    if (typeof this.mesh === 'undefined' || this.mesh == null) {
      return;
    }

    this.gl.cullFace(this.mesh.side || this.gl.BACK);

    let shader;

    if (overrideShader) {
      shader = overrideShader;
    }
    else {
      shader = this.shader;
    }
    this.gl.useProgram(shader.shaderProgram);

    this.gl.uniformMatrix4fv(shader.shaderLocations.uniformLocations.projectionMatrix, false, projectionMatrix);
    this.gl.uniformMatrix4fv(shader.shaderLocations.uniformLocations.modelMatrix, false, modelMatrix);
    this.gl.uniformMatrix4fv(shader.shaderLocations.uniformLocations.viewMatrix, false, viewMatrix);

    if (typeof shader.shaderLocations.uniformLocations.normalMatrix !== 'undefined') {
      mat3.normalFromMat4(normalMatrix, modelMatrix);
      this.gl.uniformMatrix3fv(shader.shaderLocations.uniformLocations.normalMatrix, false, normalMatrix);
    }

    for (let texInd = 0; texInd < this.textures.length; texInd++) {
      let glSlot = 'TEXTURE' + texInd;
      let uniformLoc = glSlot.toLowerCase();
      if (shader.shaderLocations.uniformLocations[uniformLoc]) {
        this.gl.activeTexture(this.gl[glSlot]);
        this.gl.bindTexture(this.textures[texInd].type, this.textures[texInd]);
        this.gl.uniform1i(shader.shaderLocations.uniformLocations[uniformLoc], texInd);
      }
    }

    this.gl.bindVertexArray(this.mesh.vao);
    if (typeof shader.shaderLocations.attribLocations.instanceOffset0 !== 'undefined') {
      this.gl.drawElementsInstanced(this.gl.TRIANGLES, this.mesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0, this.mesh.offsetBuffer.numItems);
    }
    else {
      this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
    }
    this.gl.bindVertexArray(null);
  }
}