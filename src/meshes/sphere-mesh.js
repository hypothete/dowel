import Mesh from '../core/mesh.js';

export default function SphereMesh (gl, r, dr, dh) {
  let mesh = new Mesh(gl);

  let dn = 0;
  for (let j = 0; j < dh + 1; j++) {
    for (let i = 0; i < dr + 1; i++) {
      let angle = -2 * Math.PI * i / dr;
      let dy = -Math.cos(Math.PI * j / dh) * r;
      let rr = Math.sin(Math.PI * j / dh) * r;
      let dx = Math.cos(angle) * rr;
      let dz = Math.sin(angle) * rr;

      mesh.vertices.push(dx, dy, dz);
      mesh.textures.push(i / dr, j / dh);

      if (j < dh) {
        if (i < dr) {
          mesh.indices.push(dn, dn + 1, dn + (dr + 1));
        }
        if (i > 0) {
          mesh.indices.push(dn, dn + (dr + 1), dn + dr);
        }
      }
      dn++;
    }
  }

  return mesh;
}