import Mesh from '../core/mesh.js';

export default function PlaneMesh (gl, w, h, dw, dh) {
  let mesh = new Mesh(gl);

  let qw = w / dw; //quad width
  let qh = h / dh;

  let hw = w / 2; //half side for centering
  let hh = h / 2;

  let dn = 0;
  for (let j = 0; j < dh + 1; j++) {
    for (let i = 0; i < dw + 1; i++) {
      let dx = i * qw - hw;
      let dy = j * qh - hh;
      mesh.vertices.push(dx, dy, 0.0);
      mesh.textures.push(i / dw, j / dh);

      if (j < dh) {
        if (i < dw) {
          mesh.indices.push(dn, dn + 1, dn + (dw + 1));
        }
        if (i > 0) {
          mesh.indices.push(dn, dn + (dw + 1), dn + dw);
        }
      }

      dn++;
    }
  }

  return mesh;
}