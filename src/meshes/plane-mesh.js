import Mesh from '../core/mesh';

export default class PlaneMesh extends Mesh {
  constructor (w, h, dw, dh) {
    super();
    const qw = w / dw; //quad width
    const qh = h / dh;

    const hw = w / 2; //half side for centering
    const hh = h / 2;

    let dn = 0;

    for (let j = 0; j < dh + 1; j++) {
      for (let i = 0; i < dw + 1; i++) {
        let dx = i * qw - hw;
        let dy = j * qh - hh;
        this.vertices.push(dx, dy, 0.0);
        this.textures.push(i / dw, j / dh);
        this.normals.push(0.0, 0.0, 1.0);
        if (j < dh) {
          if (i < dw) {
            this.indices.push(dn, dn + 1, dn + (dw + 1));
          }
          if (i > 0) {
            this.indices.push(dn, dn + (dw + 1), dn + dw);
          }
        }

        dn++;
      }
    }
  }
}