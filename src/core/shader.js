import {initShaderProgram} from './shader-utils';

export default class shader {
  constructor (vert, frag) {
    this.shaderProgram = initShaderProgram(vert, frag);
    this.shaderLocations = {
      attribLocations: {},
      uniformLocations: {}
    };
  }
}