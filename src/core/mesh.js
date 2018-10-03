import {getGLContext} from './gl-context';

export default class Mesh {
  constructor (objMesh) {
    this.gl = getGLContext();
    this.side = this.gl.BACK;
    this.vao = this.gl.createVertexArray();
    this.vertexBuffer = this.gl.createBuffer();
    this.textureBuffer = this.gl.createBuffer();
    this.indexBuffer = this.gl.createBuffer();
    this.normalBuffer = this.gl.createBuffer();
    this.offsetBuffer = this.gl.createBuffer();
    this.colorBuffer = this.gl.createBuffer();
    this.indices = objMesh ? objMesh.indices : [];
    this.vertices = objMesh ? objMesh.vertices : [];
    this.textures = objMesh ? objMesh.textures : [];  // texture coords
    this.normals = objMesh ? objMesh.vertexNormals : []; // vertex normals
    this.offsets = [];
  }
  updateVertices(shaderLocations) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
    this.vertexBuffer.itemSize = 3;
    this.vertexBuffer.numItems = this.vertices.length / this.vertexBuffer.itemSize;
    this.gl.enableVertexAttribArray(shaderLocations.attribLocations.aVertexPosition);
    this.gl.vertexAttribPointer(shaderLocations.attribLocations.aVertexPosition, this.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
  }

  updateTextures(shaderLocations) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.textures), this.gl.STATIC_DRAW);
    this.textureBuffer.itemSize = 2;
    this.textureBuffer.numItems = this.textures.length / this.textureBuffer.itemSize;
    this.gl.enableVertexAttribArray(shaderLocations.attribLocations.aTextureCoord);
    this.gl.vertexAttribPointer(shaderLocations.attribLocations.aTextureCoord, this.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
  }

  updateIndices() {
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);
    this.indexBuffer.itemSize = 1;
    this.indexBuffer.numItems = this.indices.length / this.indexBuffer.itemSize;
  }

  updateNormals(shaderLocations) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);
    this.normalBuffer.itemSize = 3;
    this.normalBuffer.numItems = this.normals.length / this.normalBuffer.itemSize;
    this.gl.enableVertexAttribArray(shaderLocations.attribLocations.aVertexNormal);
    this.gl.vertexAttribPointer(shaderLocations.attribLocations.aVertexNormal, this.normalBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
  }

  updateOffsets(shaderLocations) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.offsetBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.offsets), this.gl.STATIC_DRAW);
    this.offsetBuffer.itemSize = 4;
    this.offsetBuffer.numItems = this.offsets.length / 16;
    this.gl.enableVertexAttribArray(shaderLocations.attribLocations.aInstanceOffset0);
    this.gl.vertexAttribPointer(shaderLocations.attribLocations.aInstanceOffset0, this.offsetBuffer.itemSize, this.gl.FLOAT, false, 16 * 4, 0);
    this.gl.vertexAttribDivisor(shaderLocations.attribLocations.aInstanceOffset0, 1);

    this.gl.enableVertexAttribArray(shaderLocations.attribLocations.aInstanceOffset1);
    this.gl.vertexAttribPointer(shaderLocations.attribLocations.aInstanceOffset1, this.offsetBuffer.itemSize, this.gl.FLOAT, false, 16 * 4, 4 * 4);
    this.gl.vertexAttribDivisor(shaderLocations.attribLocations.aInstanceOffset1, 1);

    this.gl.enableVertexAttribArray(shaderLocations.attribLocations.aInstanceOffset2);
    this.gl.vertexAttribPointer(shaderLocations.attribLocations.aInstanceOffset2, this.offsetBuffer.itemSize, this.gl.FLOAT, false, 16 * 4, 8 * 4);
    this.gl.vertexAttribDivisor(shaderLocations.attribLocations.aInstanceOffset2, 1);

    this.gl.enableVertexAttribArray(shaderLocations.attribLocations.aInstanceOffset3);
    this.gl.vertexAttribPointer(shaderLocations.attribLocations.aInstanceOffset3, this.offsetBuffer.itemSize, this.gl.FLOAT, false, 16 * 4, 12 * 4);
    this.gl.vertexAttribDivisor(shaderLocations.attribLocations.aInstanceOffset3, 1);
  }

  initializeBuffers (shader) {
    this.gl.bindVertexArray(this.vao);
    this.updateVertices(shader.shaderLocations);
    if (shader.hasAttribute('aTextureCoord')) {
      this.updateTextures(shader.shaderLocations);
    }
    this.updateIndices(shader.shaderLocations);
    if (shader.hasAttribute('aVertexNormal')) {
      this.updateNormals(shader.shaderLocations);
    }
    if (shader.hasAttribute('aInstanceOffset0')) {
      this.updateOffsets(shader.shaderLocations);
    }
    this.gl.bindVertexArray(null);
  }
}