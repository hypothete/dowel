import Mesh from '../core/mesh';

export default class BoxMesh extends Mesh {
  constructor (w, h, d) {
    super();

    const wl = w / 2;
    const hl = h / 2;
    const dl = d / 2;

    this.vertices = [
      // +x
      wl,  hl,  dl,
      wl,  hl, -dl,
      wl, -hl, -dl,
      wl, -hl,  dl,

      // -x
      -wl,  hl, -dl,
      -wl,  hl,  dl,
      -wl, -hl,  dl,
      -wl, -hl, -dl,

      // +y
      -wl,  hl, -dl,
      wl,  hl, -dl,
      wl,  hl,  dl,
      -wl,  hl,  dl,

      // -y
      wl, -hl, -dl,
      -wl, -hl, -dl,
      -wl, -hl, dl,
      wl, -hl, dl,

      // +z
      -wl,  hl,  dl,
      wl,  hl,  dl,
      wl, -hl,  dl,
      -wl, -hl,  dl,

      // -z
      wl,  hl, -dl,
      -wl,  hl, -dl,
      -wl, -hl, -dl,
      wl, -hl, -dl
    ];

    this.textures = [

      // +x
      0.5, 0.667,
      0.75, 0.667,
      0.75, 0.334,
      0.5, 0.334,

      // -x
      0, 0.667,
      0.25, 0.667,
      0.25, 0.334,
      0, 0.33,

      // +y
      0.25, 1.0,
      0.5, 1.0,
      0.5, 0.667,
      0.25, 0.667,

      // -y
      0.25, 0.334,
      0.5, 0.334,
      0.5, 0,
      0.25, 0,

      // +z
      0.25, 0.667,
      0.5, 0.667,
      0.5, 0.334,
      0.25, 0.334,

      // -z
      0.75, 0.667,
      1.0, 0.667,
      1.0, 0.334,
      0.75, 0.334,
    ];

    this.indices = [
      // +x
      1, 0, 2,
      0, 3, 2,

      // -x
      5, 4, 6,
      4, 7, 6,

      // +y
      9, 8, 10,
      8, 11, 10,

      // -y
      13, 12, 14,
      12, 15, 14,

      // +z
      17, 16, 18,
      16, 19, 18,

      // -z
      21, 20, 22,
      20, 23, 22
    ];

    this.normals = [
      // +x
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,

      // -x
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,

      // +y
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,

      // -y
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,
      0, -1, 0,

      // +z
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,

      // -z
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
      0, 0, -1,
    ];
  }
}