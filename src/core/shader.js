import {initShaderProgram} from './shader-utils';

export default function Shader(gl, vert, frag) {
  this.shaderProgram = initShaderProgram(gl, vert, frag);
  this.shaderLocations = {
    attribLocations: {},
    uniformLocations: {}
  };
}