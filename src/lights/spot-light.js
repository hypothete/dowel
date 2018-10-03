import {vec3} from '../../node_modules/gl-matrix/src/gl-matrix';

export default class SpotLight {
  constructor (name, intensity, color, angle) {
    this.name = name;
    this.intensity = intensity;
    this.color = color;
    this.angle = angle;
    this.translation = vec3.create();
    this.direction = vec3.create();
  }
}