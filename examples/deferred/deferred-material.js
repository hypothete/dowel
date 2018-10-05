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

      uniform sampler2D uTexture0;

      layout(location = 0) out vec4 posBuf;
      layout(location = 1) out vec4 colorBuf;
      layout(location = 2) out vec4 nrmIdxBuf;

      void main() {
        posBuf = vec4(vVertPos, 1.0);
        colorBuf = vec4(texture(uTexture0, vTextureCoord));
        nrmIdxBuf = vec4(vNormal, 0.0);

        #ifdef index
          nrmIdxBuf.a = float(index);
        #endif
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
    this.addUniform('uTexture0');
  }
}