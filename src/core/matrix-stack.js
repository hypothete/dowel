import {mat4} from '../../node_modules/gl-matrix/src/gl-matrix.js';

const matrixStack = [];
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();

export {matrixStack, viewMatrix, projectionMatrix};