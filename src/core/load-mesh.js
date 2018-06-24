import {Mesh as OBJMesh} from '../../node_modules/webgl-obj-loader/src/index';
import Mesh from '../core/mesh';

export default async function loadMesh (gl, url) {
  const objRequest = new Request(url);
  const objResponse = await fetch(objRequest);
  const objData = await objResponse.text();
  return new Mesh(gl, new OBJMesh(objData));
}