import {Shader} from '../../dist/dowel.js';

export default class DepthShader extends Shader {
  constructor () {
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

    super(vert, frag);

    this.addAttribute('aVertexPosition');

    this.addUniform('uProjectionMatrix');
    this.addUniform('uModelMatrix');
    this.addUniform('uViewMatrix');
  }
}