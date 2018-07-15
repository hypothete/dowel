import {getGLContext} from './gl-context';

export default function Mesh (objMesh) {
  const gl = getGLContext();
  let mesh = {
    vao: gl.createVertexArray(),
    vertexBuffer: gl.createBuffer(),
    textureBuffer: gl.createBuffer(),
    indexBuffer: gl.createBuffer(),
    normalBuffer: gl.createBuffer(),
    indices: objMesh ? objMesh.indices : [],
    vertices: objMesh ? objMesh.vertices : [],
    textures: objMesh ? objMesh.textures : [],  // texture coords
    normals: objMesh ? objMesh.vertexNormals : [], // vertex normals
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
      if (shaderLocations.attribLocations.vertexNormal) {
        gl.enableVertexAttribArray(shaderLocations.attribLocations.vertexNormal);
        gl.vertexAttribPointer(shaderLocations.attribLocations.vertexNormal, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
      }
    },
    initializeBuffers (shaderLocations) {
      gl.bindVertexArray(mesh.vao);
      mesh.updateVertices(shaderLocations);
      mesh.updateTextures(shaderLocations);
      mesh.updateIndices(shaderLocations);
      mesh.updateNormals(shaderLocations);
      gl.bindVertexArray(null);
    }
  };

  return mesh;
}