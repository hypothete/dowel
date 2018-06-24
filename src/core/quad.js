import {getGLContext} from './gl-context';

export default function Quad (name, shader) {
  const gl = getGLContext();
  const quad = {
    name,
    mesh: {
      vertexBuffer: gl.createBuffer(),
      textureBuffer: gl.createBuffer(),
      indexBuffer: gl.createBuffer(),
      vao: gl.createVertexArray(),
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
    },
    textures: [],
    draw: function () {
      gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
      gl.useProgram(shader.shaderProgram);

      for (let texInd = 0; texInd < quad.textures.length; texInd++) {
        let glSlot = 'TEXTURE' + texInd;
        let uniformLoc = glSlot.toLowerCase();
        gl.activeTexture(gl[glSlot]);
        gl.bindTexture(gl.TEXTURE_2D, quad.textures[texInd]);
        gl.uniform1i(shader.shaderLocations.uniformLocations[uniformLoc], texInd);
      }

      gl.bindVertexArray(quad.mesh.vao);
      gl.drawElements(gl.TRIANGLES, quad.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
    }
  };

  gl.bindVertexArray(quad.mesh.vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, quad.mesh.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.mesh.vertices), gl.STATIC_DRAW);
  quad.mesh.vertexBuffer.itemSize = 2;
  quad.mesh.vertexBuffer.numItems = quad.mesh.vertices.length / quad.mesh.vertexBuffer.itemSize;
  gl.enableVertexAttribArray(shader.shaderLocations.attribLocations.vertexPosition);
  gl.vertexAttribPointer(shader.shaderLocations.attribLocations.vertexPosition, quad.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad.mesh.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quad.mesh.indices), gl.STATIC_DRAW);
  quad.mesh.indexBuffer.itemSize = 1;
  quad.mesh.indexBuffer.numItems = quad.mesh.indices.length;

  gl.bindBuffer(gl.ARRAY_BUFFER, quad.mesh.textureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.mesh.textures), gl.STATIC_DRAW);
  quad.mesh.textureBuffer.itemSize = 2;
  quad.mesh.textureBuffer.numItems = quad.mesh.textures.length / quad.mesh.textureBuffer.itemSize;
  gl.enableVertexAttribArray(shader.shaderLocations.attribLocations.textureCoord);
  gl.vertexAttribPointer(shader.shaderLocations.attribLocations.textureCoord, quad.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);

  return quad;
}