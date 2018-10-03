import {Shader, getGLContext} from '../../dist/dowel.js';

export default function EnvmapShader(options = {}) {
  const gl = getGLContext();

  var vertDefines = '';
  var fragDefines = '';

  for (let define in options.vertDefines) {
    vertDefines += `#define ${define} ${options.vertDefines[define]}`;
  }

  for (let define in options.fragDefines) {
    fragDefines += `#define ${define} ${options.fragDefines[define]}`;
  }

  const vert = `#version 300 es
      ${vertDefines}
      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform mat3 uNormalMatrix;

      in vec4 aVertexPosition;
      in vec3 aVertexNormal;
      out vec3 vNormal;
      out vec3 vVertPos;

      void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
        vNormal = normalize(uNormalMatrix * aVertexNormal);
        vVertPos = vec4(uModelMatrix * aVertexPosition).xyz;
      }
    `;

  const frag = `#version 300 es
      precision mediump float;
      ${fragDefines}

      uniform samplerCube uCubeMap;
      uniform vec3 uCamPos;

      in vec3 vVertPos;
      in vec3 vNormal;
      
      out vec4 fragColor;

      void main() {
        vec3 viewDir = normalize(uCamPos - vVertPos);
        #ifdef REFRACT
        vec3 ref = refract(-viewDir, vNormal, 1.0/1.5);
        #else
        vec3 ref = reflect(-viewDir, vNormal);
        #endif
        
        vec3 diffuse = texture(uCubeMap, ref).rgb;
        fragColor = vec4(diffuse, 1.0);
      }
    `;

  const shader = new Shader(vert, frag);

  shader.shaderLocations = {
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shader.shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shader.shaderProgram, 'aVertexNormal'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shader.shaderProgram, 'uProjectionMatrix'),
      modelMatrix: gl.getUniformLocation(shader.shaderProgram, 'uModelMatrix'),
      viewMatrix: gl.getUniformLocation(shader.shaderProgram, 'uViewMatrix'),
      normalMatrix: gl.getUniformLocation(shader.shaderProgram, 'uNormalMatrix'),
      camPos: gl.getUniformLocation(shader.shaderProgram, 'uCamPos'),
    },
  };

  shader.updateCamera = function(camera) {
    gl.useProgram(shader.shaderProgram);
    gl.uniform3f(
      shader.shaderLocations.uniformLocations.camPos,
      camera.translation[0],
      camera.translation[1],
      camera.translation[2]
    );
  };

  return shader;
}