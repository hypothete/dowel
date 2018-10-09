import {getGLContext} from './gl-context';

export default class Shader {
  constructor (vert, frag, compute) {
    this.gl = getGLContext();
    this.shaderProgram = null;
    this.shaderLocations = {
      attribLocations: {},
      uniformLocations: {}
    };
    // TODO: not pretty, revisit
    if (typeof compute !== 'undefined') {
      this.initComputeProgram(compute);
    }
    else {
      this.initShaderProgram(vert, frag);
    }
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

  initComputeProgram(csSource) {
    const computeShader = this.loadShader(this.gl.COMPUTE_SHADER, csSource);

    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, computeShader);
    this.gl.linkProgram(this.shaderProgram);

    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      const shaderInfo = this.gl.getProgramInfoLog(this.shaderProgram);
      console.error(`Unable to initialize the shader program: ${shaderInfo}`);
    }
  }

  addUniform (uniformName) {
    const uniformLocation = this.gl.getUniformLocation(this.shaderProgram, uniformName);
    if (uniformLocation === null) {
      console.error(`Could not locate uniform ${uniformName}`);
    }
    this.shaderLocations.uniformLocations[uniformName] = uniformLocation;
  }

  addAttribute(attribName) {
    const attribLocation = this.gl.getAttribLocation(this.shaderProgram, attribName);
    if (attribLocation === -1) {
      console.error(`Could not locate attribute ${attribName}`);
    }
    this.shaderLocations.attribLocations[attribName] = attribLocation;
  }

  hasUniform(uniformName) {
    return typeof this.shaderLocations.uniformLocations[uniformName] !== 'undefined' &&
      this.shaderLocations.uniformLocations[uniformName] !== null;
  }

  hasAttribute(attribName) {
    return typeof this.shaderLocations.attribLocations[attribName] !== 'undefined' &&
    this.shaderLocations.attribLocations[attribName] !== -1;
  }
}