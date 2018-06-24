import {vec3} from '../../node_modules/gl-matrix/src/gl-matrix';
import {makeDepthTexture} from '../core/textures-buffers';
import Camera from '../core/camera';
import {getGLContext} from '../core/gl-context';

export default function SpotLight(name, angle) {
  const gl = getGLContext();
  const spot = {
    translation: vec3.create(),
    direction: vec3.create(),
    angle,
    depthCamera: new Camera (gl, name + '-cam', angle, 1, 0.1, 100, {x:0,y:0,w:1024,h:1024}),
    depthTexture:  makeDepthTexture(gl, 1024),
    updateCamera: function() {
      vec3.copy(spot.depthCamera.translation, spot.translation);
      const ndir = vec3.normalize(vec3.create(), spot.direction);
      const r2d = 180 / Math.PI;
      // https://stackoverflow.com/questions/2782647/how-to-get-yaw-pitch-and-roll-from-a-3d-vector
      // everybody's got an opinion, not sure this is working
      let yaw, pitch;
      pitch = Math.asin(ndir[1]);
      yaw = r2d * Math.asin(ndir[0] / Math.cos(pitch));
      pitch = r2d * pitch;
      vec3.set(spot.depthCamera.rotation, pitch, yaw, 0);
      console.log(pitch, yaw);
    },
    renderDepth: function(scene) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, spot.depthTexture.buffer);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      spot.depthCamera.render(scene);
    }
  };
  return spot;
}