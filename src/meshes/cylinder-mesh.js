import Mesh from '../core/mesh';

export default class CylinderMesh extends Mesh {
  constructor(r, h, dr, dh) {
    super();

    let qh = h / dh;
    let hh = h / 2;
    let dn = 0;

    //top
    this.vertices.push(0, -h / 2,0);
    this.normals.push(0.0, -1.0, 0.0);
    this.textures.push(0.0,0.5);
    dn++;

    //top ring
    for (let i = 0; i < dr + 1; i++) {
      let angle = -2 * Math.PI * i / dr;
      let dx = Math.cos(angle) * r;
      let dz = Math.sin(angle) * r;
      let dy = -hh;
      this.vertices.push(dx, dy, dz);
      this.normals.push(0, -1, 0);
      this.textures.push(i / dr, 0);
      if (i < dr) {
        this.indices.push(0, dn + 1, dn);
      }
      dn++;
    }

    //tube length

    for (let j = 0; j < dh + 1; j++) {
      for (let i = 0; i < dr + 1; i++) {
        let angle = -2 * Math.PI * i / dr;
        let dx = Math.cos(angle) * r;
        let dz = Math.sin(angle) * r;
        let dy = j * qh - hh;
        this.vertices.push(dx, dy, dz);
        this.normals.push(Math.cos(angle), 0.0, Math.sin(angle));
        this.textures.push(i / dr, j / dh);

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

    //bottom ring
    for (let i = 0; i < dr + 1; i++) {
      let angle = -2 * Math.PI * i / dr;
      let dx = Math.cos(angle) * r;
      let dz = Math.sin(angle) * r;
      let dy = hh;
      this.vertices.push(dx, dy, dz);
      this.normals.push(0, 1, 0);
      this.textures.push(i / dr, 1.0);
      dn++;
    }

    // bottom
    this.vertices.push(0, h / 2, 0);
    this.normals.push(0.0, 1.0, 0.0);
    this.textures.push(1.0,0.5);

    let dm = dn - dr - 1;
    for (let i = 0; i < dr; i++) {
      this.indices.push(dn, dm + i, dm + i + 1);
    }
  }
}