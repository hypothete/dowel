import {Shader} from '../../dist/dowel.js';

export default class ComputeShader extends Shader {
  constructor () {
    const comp = `#version 310 es

    layout (local_size_x = 1, local_size_y = 1, local_size_z = 1) in;

    layout(std140, binding = 0) buffer Output {
      float data[];
    } outBuf;

    void main() {
      uint index = gl_GlobalInvocationID.x + gl_GlobalInvocationID.y * gl_NumWorkGroups.x * gl_WorkGroupSize.x;

      outBuf.data[index] = 255.0;

    }
    `;
    super(null, null, comp);
  }
}