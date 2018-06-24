// Core Imports
import Mesh from './core/mesh';
import Model from './core/model';
import Scene from './core/scene';
import Camera from './core/camera';
import Quad from './core/quad';
import Shader from './core/shader';
import {
  initShaderProgram,
  loadShader
} from './core/shader-utils';
import {
  loadTexture,
  makeGenericTexture,
  makeFramebuffer,
  makeDepthTexture
} from './core/textures-buffers';
import loadMesh from './core/load-mesh';

// Meshes
import BoxMesh from './meshes/box-mesh';
import PlaneMesh from './meshes/plane-mesh';
import SphereMesh from './meshes/sphere-mesh';

// Lights
import SpotLight from './lights/spot-light';

export default {
  Camera,
  Mesh,
  Model,
  Scene,
  Quad,
  Shader,
  initShaderProgram,
  loadShader,
  loadTexture,
  loadMesh,
  makeGenericTexture,
  makeFramebuffer,
  makeDepthTexture,
  BoxMesh,
  PlaneMesh,
  SphereMesh,
  SpotLight
};