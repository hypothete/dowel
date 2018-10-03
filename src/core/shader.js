import {getGLContext} from './gl-context';

export default class Shader {
  constructor (vert, frag) {
    this.gl = getGLContext();
    this.shaderProgram = null;
    this.shaderLocations = {
      attribLocations: {},
      uniformLocations: {}
    };
    this.initShaderProgram(vert, frag);
  }

  loadShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const compileError = this.gl.getShaderInfoLog(shader);
      console.error(`An error occurred compiling the shaders: ${compileError}`);
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  initShaderProgram(vsSource, fsSource) {
    const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);

    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    this.gl.linkProgram(this.shaderProgram);

    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      const shaderInfo = this.gl.getProgramInfoLog(this.shaderProgram);
      console.error(`Unable to initialize the shader program: ${shaderInfo}`);
    }
  }
}