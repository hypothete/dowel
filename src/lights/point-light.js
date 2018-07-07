import {vec3} from '../../node_modules/gl-matrix/src/gl-matrix';

export default function PointLight(name, intensity, color) {
  const point = {
    translation: vec3.create(),
    intensity,
    color,
  };
  return point;
}