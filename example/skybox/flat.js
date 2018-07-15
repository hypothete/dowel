import {Shader, getGLContext} from '../../dist/dowel.js';

export default function FlatShader() {
  const gl = getGLContext();

  const vert = `#version 300 es
      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;

      in vec4 aVertexPosition;
      out vec3 vCubeCoord;

      void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
        vCubeCoord = normalize(aVertexPosition.xyz);
      }
    `;

  const frag = `#version 300 es
      precision mediump float;

      uniform samplerCube uCubeMap;
      in vec3 vCubeCoord;
      out vec4 fragColor;

      void main() {
        vec3 diffuse = texture(uCubeMap, vCubeCoord).rgb;
        fragColor = vec4(diffuse, 1.0);
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