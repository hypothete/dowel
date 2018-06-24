import {initShaderProgram} from './shader-utils';

export default function Shader(vert, frag) {
  this.shaderProgram = initShaderProgram(vert, frag);
  this.shaderLocations = {
    attribLocations: {},
    uniformLocations: {}
  };
}