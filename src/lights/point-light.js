import {vec3} from '../../node_modules/gl-matrix/src/gl-matrix';

export default class PointLight {
  constructor (name, intensity, color) {
    this.name = name;
    this.intensity = intensity;
    this.color = color;
    this.translation = vec3.create();
  }
}
