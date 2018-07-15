import {Shader, getGLContext} from '../../dist/dowel.js';

export default function FlatShader() {
  const gl = getGLContext();

  const vert = `#version 300 es
      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;

      in vec4 aVertexPosition;
      in vec2 aTextureCoord;
      in vec3 aVertexNormal;

      out vec2 vTextureCoord;

      void main() {
        vTextureCoord = aTextureCoord;
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;

      }
    `;

  const frag = `#version 300 es
      precision mediump float;

      uniform sampler2D uSpotMap;
      uniform vec3 uSpotPos;
      uniform vec3 uSpotDir;
      uniform float uSpotLimit;

      in vec2 vTextureCoord;
      
      out vec4 fragColor;

      void main() {
        vec3 diffuse = texture(uSpotMap, vTextureCoord).rgb;
        fragColor = vec4(diffuse, 1.0);
      }
    `;

  const shader = new Shader(vert, frag);

  shader.shaderLocations = {
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shader.shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shader.shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shader.shaderProgram, 'uProjectionMatrix'),
      modelMatrix: gl.getUniformLocation(shader.shaderProgram, 'uModelMatrix'),
      viewMatrix: gl.getUniformLocation(shader.shaderProgram, 'uViewMatrix'),
    },
  };

  return shader;
}