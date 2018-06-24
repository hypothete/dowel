import {initShaderProgram} from './shader-utils.js';

export default function Shader(gl, vert, frag) {
  this.shaderProgram = initShaderProgram(gl, vert, frag);
  this.shaderLocations = {
    attribLocations: {},
    uniformLocations: {}
  };
}