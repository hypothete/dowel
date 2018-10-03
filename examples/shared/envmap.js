import {Shader} from '../../dist/dowel.js';

export default class EnvmapShader extends Shader {
  constructor (options = {}) {
    let vertDefines = '';
    let fragDefines = '';

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

    super(vert, frag);

    this.addAttribute('aVertexPosition');
    this.addAttribute('aVertexNormal');

    this.addUniform('uProjectionMatrix');
    this.addUniform('uModelMatrix');
    this.addUniform('uViewMatrix');
    this.addUniform('uNormalMatrix');
    this.addUniform('uCamPos');

  }

  updateCamera (camera) {
    this.gl.useProgram(this.shaderProgram);
    this.gl.uniform3f(
      this.shaderLocations.uniformLocations.camPos,
      camera.translation[0],
      camera.translation[1],
      camera.translation[2]
    );
  }
}