import {Shader, getGLContext} from '../../dist/dowel.js';

export default function DepthShader() {
  const gl = getGLContext();

  const vert = `#version 300 es
      precision highp float;
      precision highp int;
      
      uniform mat4 uModelMatrix;
      uniform mat4 uProjectionMatrix;
      uniform mat4 uViewMatrix;

      in vec4 aVertexPosition;

      void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
      }
    `;

  const frag = `#version 300 es
      precision highp float;
      precision highp int;

      void main() {
      }
    `;

  const shader = new Shader(vert, frag);

  shader.shaderLocations = {
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shader.shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shader.shaderProgram, 'uProjectionMatrix'),
      modelMatrix: gl.getUniformLocation(shader.shaderProgram, 'uModelMatrix'),
      viewMatrix: gl.getUniformLocation(shader.shaderProgram, 'uViewMatrix'),
    },
  };

  return shader;
}