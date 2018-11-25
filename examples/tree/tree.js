import {
  vec3,
  Model,
  mat4
} from '../../dist/dowel.js';

// space colonization algorithm
// largely bassed off of jgallant's code:
// http://www.jgallant.com/procedurally-generating-trees-with-space-colonization-algorithm-in-xna/

class Leaf {
  constructor(position) {
    this.position = position;
    this.closestBranch = null;
  }
}

class Branch {
  constructor(parent, position, growDirection) {
    this.parent = parent;
    this.position = position;
    this.growDirection = vec3.copy(vec3.create(), growDirection);
    this.originalGrowDirection = vec3.copy(vec3.create(), growDirection);
    this.growCount = 0;
    this.drawScale = this.parent ? this.parent.drawScale * 0.9 : 10;
  }

  reset() {
    this.growCount = 0;
    vec3.copy(this.growDirection, this.originalGrowDirection);
  }
}

export class Tree {
  constructor(points, rootPosition, parent, trunkHeight, branchLength, minDist, maxDist, shader, mesh, maxBranches) {
    this.leaves = points.map(point => new Leaf(point));
    this.rootPosition = rootPosition;
    this.branches = [];
    this.model = new Model('tree', null, parent, null);
    this.doneGrowing = false;
    this.trunkHeight = trunkHeight;
    this.branchLength = branchLength;
    this.minDist = minDist;
    this.maxDist = maxDist;
    this.up = vec3.fromValues(0,1,0);
    this.shader = shader;
    this.mesh = mesh;
    this.maxBranches = maxBranches;
    this.reachedLeaves = [];
    this.growTrunk();
  }

  growTrunk() {
    const root = new Branch(null, this.rootPosition, this.up);
    this.branches.push(root);
    let current = new Branch(
      root,
      vec3.add(vec3.create(), root.position, vec3.fromValues(0, this.branchLength, 0)),
      vec3.fromValues(0, 1, 0)
    );
    this.branches.push(current);
    while(distTo(root.position, current.position) < this.trunkHeight) {

      const trunk = new Branch(
        current,
        vec3.add(vec3.create(), current.position, vec3.fromValues(0, this.branchLength, 0)),
        vec3.fromValues(0, 1, 0)
      );
      this.branches.push(trunk);
      current = trunk;
    }
  }

  grow() {
    if (this.doneGrowing) {
      console.log('done');
      return;
    }

    if(this.branches.length > this.maxBranches) {
      console.log('capped branch count');
      this.doneGrowing = true;
      return;

    }

    if(this.leaves.length === 0) {
      console.log('no more leaves');
      this.doneGrowing = true;
      return;
    }

    this.leaves.forEach((leaf, pIndex) => {
      let leafRemoved = false;
      leaf.closestBranch = null;
      this.branches.forEach(branch => {
        if (leafRemoved) {
          return;
        }
        let dir = vec3.sub(vec3.create(), leaf.position, branch.position);
        vec3.normalize(dir, dir);
        let distance = distTo(leaf.position, branch.position);
        if (distance < this.minDist) {
          this.reachedLeaves.push(leaf);
          this.leaves.splice(pIndex, 1);
          leafRemoved = true;
        }
        else if(distance <= this.maxDist) {
          if (leaf.closestBranch == null) {
            leaf.closestBranch = branch;
          }
          else if(distTo(leaf.position, leaf.closestBranch.position) < distance) {
            leaf.closestBranch = branch;
          }
        }
      });

      if (!leafRemoved && leaf.closestBranch !== null) {
        const growDir = vec3.sub(vec3.create(), leaf.position, leaf.closestBranch.position);
        vec3.normalize(growDir, growDir);
        vec3.add(leaf.closestBranch.growDirection, leaf.closestBranch.growDirection, growDir);
        leaf.closestBranch.growCount++;
      }
    });

    const newBranches = [];
    this.branches.forEach(branch => {
      if (branch.growCount > 0) {
        const avgDir = vec3.scale(vec3.create(), branch.growDirection, 1 / branch.growCount);
        vec3.normalize(avgDir, avgDir);
        const newBranch = new Branch(
          branch,
          vec3.add(vec3.create(), branch.position, vec3.scale(vec3.create(), avgDir, this.branchLength)),
          avgDir
        );
        newBranches.push(newBranch);
        branch.reset();
      }
    });

    let addedBranch = false;

    newBranches.forEach(nBranch => {
      addedBranch = true;
      this.branches.push(nBranch);
    });

    if (!addedBranch) {
      console.log('no more branches to add');
      this.doneGrowing = true;
    }

  }

  render(point, camera) {
    this.model.children = [];
    this.shader.updatePoint(point);
    this.shader.updateCamera(camera);

    this.branches.forEach(branch => {
      const look = mat4.targetTo(
        mat4.create(),
        branch.parent ? branch.parent.position : vec3.create(),
        branch.parent ? branch.position : branch.originalGrowDirection,
        vec3.fromValues(0, 1, 0)
      );
      const eul = rotationMatrixToEuler(look);
      const bParent = new Model('branch', null, this.model, null);
      vec3.set(bParent.translation, ...branch.position);
      vec3.set(bParent.rotation, ...eul);
      const bModel = new Model('branch', this.mesh, bParent, this.shader);
      vec3.set(bModel.translation, 0, 0, this.branchLength / 2);
      vec3.set(bModel.rotation, 90, 0, 0);
      vec3.set(bModel.scale, branch.drawScale, 1, branch.drawScale);
    });
  }
}

function distTo(a, b) {
  return vec3.len(vec3.sub(vec3.create(), a, b));
}

function rotationMatrixToEuler(mat) {
  // from "Extracting Euler Angles from a Rotation Matrix" by Mike Day
  // 0 4 8  12
  // 1 5 9  13
  // 2 6 10 14
  // 3 7 11 15
  let c1, c2, s1, t1, t2, t3;
  t1 = Math.atan2(mat[6], mat[10]);
  c2 = Math.sqrt(mat[0] * mat[0] + mat[1] * mat[1]);
  t2 = Math.atan2(-mat[2], c2);
  s1 = Math.sin(t1);
  c1 = Math.cos(t1);
  t3 = Math.atan2(
    s1 * mat[8] - c1 * mat[4],
    c1 * mat[5] - s1 * mat[9]
  );
  return vec3.fromValues(
    t1 * 180 / Math.PI,
    t2 * 180 / Math.PI,
    t3 * 180 / Math.PI
  );
}