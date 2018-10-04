import { Shader } from '../../dist/dowel.js';

export default class DeferredMaterialShader extends Shader {
  constructor( options = {} ) {
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
      uniform mat4 uProjectionMatrix;
      uniform mat4 uViewMatrix;
      uniform mat3 uNormalMatrix;

      in vec4 aVertexPosition;
      in vec2 aTextureCoord;
      in vec3 aVertexNormal;

      out vec2 vTextureCoord;
      out vec3 vVertPos;
      out vec3 vNormal;

      void main() {
        vTextureCoord = aTextureCoord;
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
        vVertPos = vec3(uModelMatrix * aVertexPosition).xyz;
        vNormal = normalize(uNormalMatrix * aVertexNormal);
      }
    `;

    const frag = `#version 300 es
      precision mediump float;
      ${fragDefines}

      in vec2 vTextureCoord;
      in vec3 vVertPos;
      in vec3 vNormal;

      layout(location = 0) out vec4 posBuf;
      layout(location = 1) out vec4 uvIdxBuf;
      layout(location = 2) out vec4 nrmBuf;


      void main() {
        vec3 dummy = vVertPos;
        vec3 finalColor = vec3(vTextureCoord, 0.0);

        posBuf = vec4(vVertPos, 1.0);
        uvIdxBuf = vec4(vTextureCoord, 0.0, 1.0);

        #ifdef index
          uvIdxBuf.b = float(index);
        #endif

        nrmBuf = vec4(vNormal, 1.0);
      }
    `;

    super(vert, frag);

    this.addAttribute('aVertexPosition');
    this.addAttribute('aTextureCoord');
    this.addAttribute('aVertexNormal');

    this.addUniform('uProjectionMatrix');
    this.addUniform('uModelMatrix');
    this.addUniform('uViewMatrix');
    this.addUniform('uNormalMatrix');
  }
}