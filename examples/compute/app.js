import {
  setGLContext,
} from '../../dist/dowel.js';

import ComputeShader from './compute.js';

const can = document.querySelector('canvas');
const gl = can.getContext('webgl2-compute');
const loadMsg = document.querySelector('.loadmsg');

can.width = gl.canvas.clientWidth;
can.height = gl.canvas.clientHeight;

setGLContext(gl); // must happen before anything
init();

async function init() {

  console.log('loaded');
  loadMsg.style.display = 'none';

  const compShader = new ComputeShader();

  gl.useProgram(compShader.shaderProgram);

  const data = new Array(1024).fill(0);
  const srcData = new Float32Array(data);

  const dataBuffer = gl.createBuffer();
  gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, dataBuffer);
  gl.bufferData(gl.SHADER_STORAGE_BUFFER, srcData, gl.DYNAMIC_DRAW);
  gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, dataBuffer);
  console.log(gl.getParameter(gl.SHADER_STORAGE_BUFFER_BINDING));

  gl.dispatchCompute(1024, 1, 1);
  gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);

  console.log(srcData[0]);

}
