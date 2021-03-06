import Mesh from '../core/mesh';
import {vec3} from '../../node_modules/gl-matrix/src/gl-matrix';

export default class SphereMesh extends Mesh {
  constructor (r, dr, dh) {
    super();
    let dn = 0;
    for (let j = 0; j < dh + 1; j++) {
      for (let i = 0; i < dr + 1; i++) {
        let angle = -2 * Math.PI * i / dr;
        let dy = -Math.cos(Math.PI * j / dh) * r;
        let rr = Math.sin(Math.PI * j / dh) * r;
        let dx = Math.cos(angle) * rr;
        let dz = Math.sin(angle) * rr;

        this.vertices.push(dx, dy, dz);
        this.textures.push(i / dr, j / dh);

        let vNorm = vec3.normalize(vec3.create(), vec3.fromValues(dx, dy, dz));
        this.normals.push(vNorm[0], vNorm[1], vNorm[2]);

        if (j < dh) {
          if (i < dr) {
            this.indices.push(dn, dn + 1, dn + (dr + 1));
          }
          if (i > 0) {
            this.indices.push(dn, dn + (dr + 1), dn + dr);
          }
        }
        dn++;
      }
    }
  }
}