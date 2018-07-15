import Mesh from '../core/mesh';

export default function BoxMesh (w, h, d) {
  let mesh = new Mesh();

  let wl = w / 2;
  let hl = h / 2;
  let dl = d / 2;

  mesh.vertices = [
    -wl, -hl, -dl,
    wl, -hl, -dl,
    wl, -hl,  dl,
    -wl, -hl,  dl,

    -wl,  hl, -dl,
    wl,  hl, -dl,
    wl,  hl,  dl,
    -wl,  hl,  dl,

    wl,  hl,  dl,
    wl,  hl, -dl,
    wl, -hl, -dl,
    wl, -hl,  dl,

    -wl,  hl,  dl,
    wl,  hl,  dl,
    wl, -hl,  dl,
    -wl, -hl,  dl,

    -wl,  hl, -dl,
    -wl,  hl,  dl,
    -wl, -hl,  dl,
    -wl, -hl, -dl,

    wl,  hl, -dl,
    -wl,  hl, -dl,
    -wl, -hl, -dl,
    wl, -hl, -dl
  ];

  mesh.textures = [
    0.25, 0.25,
    0.5, 0.25,
    0.25, 0.5,
    0.5, 0.5,

    0.75, 0.25,
    1.0, 0.25,
    0.75, 0.5,
    1.0, 0.5,

    0, 0.25,
    0.25, 0.25,
    0, 0.5,
    0.25, 0.5,

    0.25, 0,
    0.5, 0,
    0.25, 0.25,
    0.5, 0.25,

    0.5, 0.25,
    0.75, 0.25,
    0.5, 0.5,
    0.75, 0.5,

    0.25, 0.5,
    0.5, 0.5,
    0.5, 0.75,
    0.75, 0.75
  ];

  mesh.indices = [
    2, 0, 1,
    2, 3, 0,

    5, 4, 6,
    4, 7, 6,

    9, 8, 10,
    8, 11, 10,

    13, 12, 14,
    12, 15, 14,

    17, 16, 18,
    16, 19, 18,

    21, 20, 22,
    20, 23, 22
  ];

  mesh.normals = [
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
  ];

  return mesh;
}