import {getGLContext} from './gl-context';

export default class Quad {
  constructor (name, shader) {
    this.gl = getGLContext();
    this.name = name;
    this.shader = shader;
    this.mesh = {
      vertexBuffer: this.gl.createBuffer(),
      textureBuffer: this.gl.createBuffer(),
      indexBuffer: this.gl.createBuffer(),
      vao: this.gl.createVertexArray(),
      vertices: [
        1.0,  1.0,
        -1.0,  1.0,
        -1.0, -1.0,
        1.0, -1.0
      ],
      textures: [
        1.0,  1.0,
        0.0,  1.0,
        0.0, 0.0,
        1.0, 0.0
      ],
      indices: [
        0, 1, 2,
        0, 2, 3
      ]
    };
    this.textures = [];

    this.initializeVAO();

  }

  initializeVAO () {
    this.gl.bindVertexArray(this.mesh.vao);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.mesh.vertices), this.gl.STATIC_DRAW);
    this.mesh.vertexBuffer.itemSize = 2;
    this.mesh.vertexBuffer.numItems = this.mesh.vertices.length / this.mesh.vertexBuffer.itemSize;
    this.gl.enableVertexAttribArray(this.shader.shaderLocations.attribLocations.vertexPosition);
    this.gl.vertexAttribPointer(this.shader.shaderLocations.attribLocations.vertexPosition, this.mesh.vertexBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.mesh.indices), this.gl.STATIC_DRAW);
    this.mesh.indexBuffer.itemSize = 1;
    this.mesh.indexBuffer.numItems = this.mesh.indices.length;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.mesh.textureBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.mesh.textures), this.gl.STATIC_DRAW);
    this.mesh.textureBuffer.itemSize = 2;
    this.mesh.textureBuffer.numItems = this.mesh.textures.length / this.mesh.textureBuffer.itemSize;
    this.gl.enableVertexAttribArray(this.shader.shaderLocations.attribLocations.textureCoord);
    this.gl.vertexAttribPointer(this.shader.shaderLocations.attribLocations.textureCoord, this.mesh.textureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindVertexArray(null);
  }

  draw () {
    this.gl.viewport(0, 0, this.gl.canvas.clientWidth, this.gl.canvas.clientHeight);
    this.gl.enable(this.gl.SCISSOR_TEST);
    this.gl.scissor(0, 0, this.gl.canvas.clientWidth, this.gl.canvas.clientHeight);
    this.gl.useProgram(this.shader.this.shaderProgram);

    for (let texInd = 0; texInd < this.textures.length; texInd++) {
      let glSlot = 'TEXTURE' + texInd;
      let uniformLoc = glSlot.toLowerCase();
      this.gl.activeTexture(this.gl[glSlot]);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[texInd]);
      this.gl.uniform1i(this.shader.shaderLocations.uniformLocations[uniformLoc], texInd);
    }

    this.gl.bindVertexArray(this.mesh.vao);
    this.gl.drawElements(this.gl.TRIANGLES, this.mesh.indexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
    this.gl.bindVertexArray(null);
  }
}