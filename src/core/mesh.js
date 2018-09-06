import {getGLContext} from './gl-context';

export default function Mesh (objMesh) {
  const gl = getGLContext();
  let mesh = {
    side: gl.BACK,
    vao: gl.createVertexArray(),
    vertexBuffer: gl.createBuffer(),
    textureBuffer: gl.createBuffer(),
    indexBuffer: gl.createBuffer(),
    normalBuffer: gl.createBuffer(),
    offsetBuffer: gl.createBuffer(),
    colorBuffer: gl.createBuffer(),
    indices: objMesh ? objMesh.indices : [],
    vertices: objMesh ? objMesh.vertices : [],
    textures: objMesh ? objMesh.textures : [],  // texture coords
    normals: objMesh ? objMesh.vertexNormals : [], // vertex normals
    offsets: [],
    updateVertices(shaderLocations) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
      mesh.vertexBuffer.itemSize = 3;
      mesh.vertexBuffer.numItems = mesh.vertices.length / mesh.vertexBuffer.itemSize;
      gl.enableVertexAttribArray(shaderLocations.attribLocations.vertexPosition);
      gl.vertexAttribPointer(shaderLocations.attribLocations.vertexPosition, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    },
    updateTextures(shaderLocations) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textures), gl.STATIC_DRAW);
      mesh.textureBuffer.itemSize = 2;
      mesh.textureBuffer.numItems = mesh.textures.length / mesh.textureBuffer.itemSize;
      gl.enableVertexAttribArray(shaderLocations.attribLocations.textureCoord);
      gl.vertexAttribPointer(shaderLocations.attribLocations.textureCoord, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    },
    updateIndices() {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
      mesh.indexBuffer.itemSize = 1;
      mesh.indexBuffer.numItems = mesh.indices.length / mesh.indexBuffer.itemSize;
    },
    updateNormals(shaderLocations) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW);
      mesh.normalBuffer.itemSize = 3;
      mesh.normalBuffer.numItems = mesh.normals.length / mesh.normalBuffer.itemSize;
      gl.enableVertexAttribArray(shaderLocations.attribLocations.vertexNormal);
      gl.vertexAttribPointer(shaderLocations.attribLocations.vertexNormal, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    },
    updateOffsets(shaderLocations) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.offsetBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.offsets), gl.STATIC_DRAW);
      mesh.offsetBuffer.itemSize = 4;
      mesh.offsetBuffer.numItems = mesh.offsets.length / 16;
      gl.enableVertexAttribArray(shaderLocations.attribLocations.instanceOffset0);
      gl.vertexAttribPointer(shaderLocations.attribLocations.instanceOffset0, mesh.offsetBuffer.itemSize, gl.FLOAT, false, 16 * 4, 0);
      gl.vertexAttribDivisor(shaderLocations.attribLocations.instanceOffset0, 1);

      gl.enableVertexAttribArray(shaderLocations.attribLocations.instanceOffset1);
      gl.vertexAttribPointer(shaderLocations.attribLocations.instanceOffset1, mesh.offsetBuffer.itemSize, gl.FLOAT, false, 16 * 4, 4 * 4);
      gl.vertexAttribDivisor(shaderLocations.attribLocations.instanceOffset1, 1);

      gl.enableVertexAttribArray(shaderLocations.attribLocations.instanceOffset2);
      gl.vertexAttribPointer(shaderLocations.attribLocations.instanceOffset2, mesh.offsetBuffer.itemSize, gl.FLOAT, false, 16 * 4, 8 * 4);
      gl.vertexAttribDivisor(shaderLocations.attribLocations.instanceOffset2, 1);

      gl.enableVertexAttribArray(shaderLocations.attribLocations.instanceOffset3);
      gl.vertexAttribPointer(shaderLocations.attribLocations.instanceOffset3, mesh.offsetBuffer.itemSize, gl.FLOAT, false, 16 * 4, 12 * 4);
      gl.vertexAttribDivisor(shaderLocations.attribLocations.instanceOffset3, 1);
    },
    initializeBuffers (shaderLocations) {
      gl.bindVertexArray(mesh.vao);
      mesh.updateVertices(shaderLocations);
      if (typeof shaderLocations.attribLocations.textureCoord !== 'undefined' &&
        shaderLocations.attribLocations.textureCoord > -1) {
        mesh.updateTextures(shaderLocations);
      }
      mesh.updateIndices(shaderLocations);
      if (typeof shaderLocations.attribLocations.vertexNormal !== 'undefined' &&
        shaderLocations.attribLocations.vertexNormal > -1) {
        mesh.updateNormals(shaderLocations);
      }
      if (typeof shaderLocations.attribLocations.instanceOffset0 !== 'undefined' &&
        shaderLocations.attribLocations.instanceOffset0 > -1) {
        mesh.updateOffsets(shaderLocations);
      }
      gl.bindVertexArray(null);
    }
  };

  return mesh;
}