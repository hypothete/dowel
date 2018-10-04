import {getGLContext} from './gl-context';

export function loadTexture (url) {
  const gl = getGLContext();
  return new Promise(function (resolve) {
    const texture = gl.createTexture();
    texture.type = gl.TEXTURE_2D;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
      1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255]));
    const image = new Image();
    image.onload = function() {
      texture.image = image;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      resolve(texture);
    };
    image.src = url;
  });
}

export function makeGenericTexture () {
  const gl = getGLContext();
  const texture = gl.createTexture();
  texture.type = gl.TEXTURE_2D;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

export async function loadCubeMap(filenames) {
  const gl = getGLContext();
  const texture = gl.createTexture();
  texture.type = gl.TEXTURE_CUBE_MAP;
  const facePromises = [];
  for (let filename of filenames) {
    facePromises.push(new Promise((res, rej) => {
      const image = new Image();
      image.onload = function() {
        res(image);
      };
      image,onerror = function(err) {
        rej(err);
      };
      image.src = filename;
    }));
  }
  const images = await Promise.all(facePromises);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  for(let i = 0; i < 6; i++) {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA,
      gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
  }
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return texture;
}

export function makeFramebuffer () {
  const gl = getGLContext();
  // prep texture for drawing
  const texture = makeGenericTexture(gl);
  texture.type = gl.TEXTURE_2D;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
    gl.canvas.width, gl.canvas.height, 0,
    gl.RGBA, gl.UNSIGNED_BYTE, null);
  // prep actual frameBuffer
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  return { buffer: fbo, texture };
}

export function makeGBuffer () {
  // Generic GBuffer, 4 RGBA Float32 attachments
  const gl = getGLContext();
  const ext = gl.getExtension('EXT_color_buffer_float');
  if (ext === null) {
    throw new Error('The EXT_color_buffer_float extension is not supported on this machine.');
  }
  const gBuffer = {
    buffer: gl.createFramebuffer(),
    textures: []
  };
  const attachments = [];
  gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer.buffer);
  checkFramebufferStatus(gl);
  for (let i = 0; i < 4; i++) {
    const texture = gl.createTexture();
    texture.type = gl.TEXTURE_2D;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F,
      gl.canvas.width, gl.canvas.height, 0,
      gl.RGBA, gl.FLOAT, null);
    // TODO: Fix resizing canvas not jiving with fixed sizes for GBuffer textures
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const attachment =  gl['COLOR_ATTACHMENT' + i];
    attachments.push(attachment);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture, 0);
    gBuffer.textures.push(texture);
    checkFramebufferStatus(gl);
  }
  gl.drawBuffers(attachments);
  checkFramebufferStatus(gl);
  return gBuffer;
}

export function makeDepthTexture (width, height) {
  const gl = getGLContext();
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  texture.type = gl.TEXTURE_2D;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.DEPTH_COMPONENT16,
    width,
    height,
    0,
    gl.DEPTH_COMPONENT,
    gl.UNSIGNED_SHORT,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { buffer: fbo, texture };
}

function checkFramebufferStatus(gl) {
  const statusCode = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  switch(statusCode) {
  case gl.FRAMEBUFFER_COMPLETE:
    console.log('Framebuffer status: framebuffer complete.');
    break;
  case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
    console.error('Framebuffer status: incomplete attachment');
    break;
  case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
    console.error('Framebuffer status: missing attachment.');
    break;
  case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
    console.error('Framebuffer status: incomplete dimensions.');
    break;
  case gl.FRAMEBUFFER_UNSUPPORTED:
    console.error('Framebuffer status: the attachment format is not supported.');
    break;
  case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
    console.error('Framebufer status: The values of gl.RENDERBUFFER_SAMPLES are different among attached renderbuffers');
    break;
  }
}