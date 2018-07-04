import {mat3, mat4} from '../../node_modules/gl-matrix/src/gl-matrix';

const matrixStack = [];
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();
const normalMatrix = mat3.create();

export {matrixStack, viewMatrix, projectionMatrix, normalMatrix};