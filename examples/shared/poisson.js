import {
  vec3, mat4
} from '../../dist/dowel.js';

function getVertexData(mesh, index) {
  const vPos = vec3.fromValues(...mesh.vertices.slice(index * 3, index * 3 + 3));
  const vNorm = vec3.fromValues(...mesh.normals.slice(index * 3, index * 3 + 3));
  const vUv = vec3.fromValues(...mesh.textures.slice(index * 2, index * 2 + 2));
  return {
    position: vPos,
    normal: vNorm,
    uv: vUv
  };
}

function triangleArea(a, b, c) {
  const ba = vec3.sub(vec3.create(), b, a);
  const ca = vec3.sub(vec3.create(), c, a);
  const crossSides = vec3.cross(vec3.create(), ba, ca);
  const out = 0.5 * vec3.length(crossSides);
  return out;
}

function getFaceData(mesh, indA, indB, indC) {
  const vA = getVertexData(mesh, indA);
  const vB = getVertexData(mesh, indB);
  const vC = getVertexData(mesh, indC);
  const area = triangleArea(vA.position, vB.position, vC.position);
  return { a: vA, b: vB, c: vC, area };
}

function getFaces(mesh) {
  const faces = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const face = getFaceData(mesh, mesh.indices[i], mesh.indices[i + 1], mesh.indices[i + 2]);
    faces.push(face);
  }
  return faces;
}

// Two different ways of sampling points in a triangle - not sure which is more efficient

function interpVec3s(u, v, w, r1, r2) {
  // https://www.cs.princeton.edu/~funk/tog02.pdf section 4.2
  const dA = vec3.scale(vec3.create(), u, 1 - Math.sqrt(r1));
  const dB = vec3.scale(vec3.create(), v, Math.sqrt(r1) * (1 - r2));
  const dC = vec3.scale(vec3.create(), w, Math.sqrt(r1) * r2);
  const interPt = vec3.add(vec3.create(), dA, vec3.add(vec3.create(), dB, dC));
  return interPt;
}

function interpVec3B(u, v, w, r1, r2) {
  // https://math.stackexchange.com/questions/538458/triangle-point-picking-in-3d
  if (r1 + r2 >= 1.0) {
    r1 = 1.0 - r1;
    r2 = 1.0 - r2;
  }
  const dBA = vec3.scale(vec3.create(), vec3.sub(vec3.create(), v, u), r1);
  const dCA = vec3.scale(vec3.create(), vec3.sub(vec3.create(), w, u), r2);
  return vec3.add(vec3.create(), u, vec3.add(vec3.create(), dBA, dCA));
}

function getRandomPointOnFace(face) {
  const r1 = Math.random();
  const r2 = Math.random();
  const randPos = interpVec3B(
    face.a.position,
    face.b.position,
    face.c.position,
    r1,
    r2
  );
  const randNorm = interpVec3B(
    face.a.normal,
    face.b.normal,
    face.c.normal,
    r1,
    r2
  );
  const randUV = interpVec3B(
    face.a.uv,
    face.b.uv,
    face.c.uv,
    r1,
    r2
  );
  return { position: randPos, normal: randNorm, uv: randUV };
}

function getWeightedSampler(faces) {
  // constructs an object that allows us to sample points on the mesh
  // randomly, but weighted by area so that bigger tris = more samples
  const sortedFaces = faces.sort((a, b) => {
    return a.area - b.area;
  });
  const areaTotal = sortedFaces.reduce((accum, curr) => {
    return accum + curr.area;
  }, 0);
  let areaTally = 0;
  const intervals = sortedFaces.map(face => {
    areaTally += face.area;
    return areaTally;
  });
  return {
    sortedFaces,
    areaTotal,
    intervals,
    sample
  };

  function sample() {
    const randNum = Math.random() * areaTotal;
    let intervalIndex = -1;
    for (let i = 0; i < intervals.length; i++) {
      if (intervals[i] > randNum) {
        break;
      }
      else {
        intervalIndex = i;
      }
    }
    return sortedFaces[intervalIndex];
  }
}

function whiteNoisePoints(mesh, numPoints) {
  // generates a random set of points on the mesh
  const points = [];
  const faces = getFaces(mesh);
  const sampler = getWeightedSampler(faces);
  for (let i = 0; i < numPoints; i++) {
    const weightedFace = sampler.sample();
    points.push(getRandomPointOnFace(weightedFace));
  }
  return points;
}

function getPointsBounds(points) {
  // returns the min and max positions of a set of points
  let min = vec3.fromValues(Infinity, Infinity, Infinity);
  let max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
  points.forEach(point => {
    vec3.min(min, min, point.position);
    vec3.min(max, max, point.position);
  });
  return { min, max };
}

function getNeighboringCells(cells, cellId){
  // get nearest n <= 26 cells
  const neighbors = cells.filter(cell => {
    // ignore self
    if (cell.cellId[0] === cellId[0] &&
        cell.cellId[1] === cellId[1] &&
        cell.cellId[2] === cellId[2]) {
      return false;
    }
    return Math.abs(cell.cellId[0] - cellId[0]) <= 1 &&
      Math.abs(cell.cellId[1] - cellId[1]) <= 1 &&
      Math.abs(cell.cellId[2] - cellId[2]) <= 1;
  });
  return neighbors;
}

export function parallelUniformSurfaceSampling(mesh, numPoints, cellDiagonal, k) {
  // Based on http://www.liyiwei.org/papers/sample-siga10/paper.pdf
  // uses poisson disc sampling and a voxel grid to evenly sample and return points
  let points = whiteNoisePoints(mesh, numPoints);
  // return points;

  // /*
  let bounds = getPointsBounds(points);
  const phaseGroupCount = 27; // 3 x 3 x 3
  const mu = cellDiagonal / Math.sqrt(3);

  // TODO: parallelize!
  points = points.map(point => {
    // get cellId for each point
    let diffMin = vec3.sub(vec3.create(), point.position, bounds.min);
    vec3.divide(diffMin, diffMin, vec3.fromValues(mu, mu, mu));
    diffMin[0] = Math.floor(diffMin[0]);
    diffMin[1] = Math.floor(diffMin[1]);
    diffMin[2] = Math.floor(diffMin[2]);
    return {
      ...point,
      cellId: diffMin
    };
  });

  // sort points by cell x, y, z
  points = points.sort((a, b) => {
    return (a.cellId[0] - b.cellId[0]) || (a.cellId[1] - b.cellId[1]) || (a.cellId[2] - b.cellId[2]);
  });

  let currentCellID = vec3.create();
  const cells = [];
  points.forEach((point, index) => {
    if (
      point.cellId[0] !== currentCellID[0] ||
      point.cellId[1] !== currentCellID[1] ||
      point.cellId[2] !== currentCellID[2]
    ) {
      currentCellID = point.cellId;
      const phaseGroupId = (cells.length * 61) % phaseGroupCount;
      // the 61 is to pseudorandomize the order a bit for phase group assignment
      cells.push({
        cellId: point.cellId,
        startIndex:index,
        phaseGroupId,
        sample: null
      });
    }
  });

  // TODO: parallelize!
  for (let j = 0; j < k; j++) { // trial runs
    for(let i = 0; i < phaseGroupCount; i++) {
      const phaseGroupCells = cells.filter(cellData => cellData.phaseGroupId === i);
      for (let p = 0; p < phaseGroupCells.length; p++) {
        const cell = phaseGroupCells[p];
        const trialPt = points[cell.startIndex + j];
        if (
          trialPt &&
          (trialPt.cellId[0] !== cell.cellId[0] ||
          trialPt.cellId[1] !== cell.cellId[1] ||
          trialPt.cellId[2] !== cell.cellId[2])
        ) {
          // no more random points for the cell
          p = phaseGroupCells.length; // break
        }
        else {
          let conflict = false;
          const neighboringCells = getNeighboringCells(cells, cell.cellId);
          for (let q = 0; q < neighboringCells.length; q++) {
            const nbr = neighboringCells[q];
            if (nbr && nbr.sample) {
              const distToSample = vec3.length(
                vec3.sub(
                  vec3.create(), trialPt.position, nbr.sample.position
                )
              );if (distToSample < cellDiagonal) {
                conflict = true;
                q = neighboringCells.length;
              }
            }
          }
          if (!conflict) {
            cell.sample = trialPt;
          }
        }
      }
    }
  }

  return cells.map(cell => cell.sample).filter(sample => !!sample);
}

export function getBitangent(normal) {
  const up = vec3.fromValues(0, 1, 0);
  const dn = vec3.fromValues(0, -1, 0);
  const c1 = vec3.cross(vec3.create(), normal, dn);
  const c2 = vec3.cross(vec3.create(), normal, up);
  let tang;
  if (vec3.length(c1) > vec3.length(c2)) {
    tang = c1;
  }
  else {
    tang = c2;
  }
  return vec3.cross(vec3.create(), tang, normal);
}

export function makeOffsets(points) {
  let offsetArray = [];
  points.forEach(point => {
    const bitg = getBitangent(point.normal);
    const lookMat = mat4.targetTo(mat4.create(), vec3.create(), bitg, vec3.fromValues(0, 1, 0));
    const transMat = mat4.fromTranslation(mat4.create(), point.position);
    const inst = mat4.mul(mat4.create(), transMat, lookMat);
    offsetArray = [
      ...offsetArray,
      ...inst
    ];
  });
  return offsetArray;
}