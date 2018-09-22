import {Shader, getGLContext} from '../../dist/dowel.js';

export default function BasicShader() {
  const gl = getGLContext();

  const vert = `#version 300 es

      in vec4 aVertexPosition;
      in vec2 aTextureCoord;

      out vec2 vTextureCoord;
      out vec3 vVertPos;

      void main() {
        vTextureCoord = aTextureCoord;
        gl_Position =  aVertexPosition;
        vVertPos = aVertexPosition.xyz;
      }
    `;

  const frag = `#version 300 es
      precision mediump float;

      uniform sampler2D uTexture0;

      in vec2 vTextureCoord;
      in vec3 vVertPos;

      out vec4 fragColor;

      float linearizeDepth(float n) {
          float zNear = 0.1;
          float zFar  = 50.0;
          return (2.0 * zNear) / (zFar + zNear - n * (zFar - zNear));
      }

      void main() {
        float depth = texture(uTexture0, vTextureCoord).r;
        vec3 finalColor =vec3(linearizeDepth(depth));
        fragColor = vec4(finalColor, 1.0);
      }
    `;

  const shader = new Shader(vert, frag);

  shader.shaderLocations = {
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shader.shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shader.shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {

      texture0: gl.getUniformLocation(shader.shaderProgram, 'uTexture0'),
    },
  };

  return shader;
}