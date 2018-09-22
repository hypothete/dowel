import {Shader, getGLContext} from '../../dist/dowel.js';

export default function LommelSeeligerShader() {
  const gl = getGLContext();

  const vert = `#version 300 es
      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform mat3 uNormalMatrix;

      in vec4 aVertexPosition;
      in vec2 aTextureCoord;
      in vec3 aVertexNormal;

      out vec2 vTextureCoord;
      out vec3 vVertPos;
      out vec3 vNormal;

      void main() {
        vTextureCoord = aTextureCoord;
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;

        // make normals
        vVertPos = vec4(uModelMatrix * aVertexPosition).xyz;
        vNormal = normalize(uNormalMatrix * aVertexNormal);
      }
    `;

  const frag = `#version 300 es
      precision mediump float;

      uniform vec3 uPointPos;
      uniform float uPointIntensity;
      uniform vec3 uPointColor;
      uniform vec3 uCamPos;

      in vec2 vTextureCoord;
      in vec3 vVertPos;
      in vec3 vNormal;
      
      out vec4 fragColor;

      void main() {
        vec3 toView = normalize(uCamPos - vVertPos);
        vec3 toLight = normalize(uPointPos);

        float mu0 = max(0.0, dot(vNormal, toLight));
        float mur = max(0.0, dot(reflect(-toLight, vNormal), toView));
        float w0 = 0.037;

        float brdf = w0 * (mur + mu0);

        vec3 diffuseColor = vec3(0.5, 0.5, 0.5);

        vec3 finalColor = uPointIntensity * uPointColor * (brdf * diffuseColor);

        fragColor = vec4(finalColor, 1.0);
      }
    `;

  const shader = new Shader(vert, frag);

  shader.shaderLocations = {
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shader.shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shader.shaderProgram, 'aTextureCoord'),
      vertexNormal: gl.getAttribLocation(shader.shaderProgram, 'aVertexNormal'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shader.shaderProgram, 'uProjectionMatrix'),
      modelMatrix: gl.getUniformLocation(shader.shaderProgram, 'uModelMatrix'),
      viewMatrix: gl.getUniformLocation(shader.shaderProgram, 'uViewMatrix'),
      normalMatrix: gl.getUniformLocation(shader.shaderProgram, 'uNormalMatrix'),
      pointPos: gl.getUniformLocation(shader.shaderProgram, 'uPointPos'),
      pointIntensity: gl.getUniformLocation(shader.shaderProgram, 'uPointIntensity'),
      pointColor: gl.getUniformLocation(shader.shaderProgram, 'uPointColor'),

      camPos: gl.getUniformLocation(shader.shaderProgram, 'uCamPos'),
    },
  };

  shader.updatePoint = function(point) {
    gl.useProgram(shader.shaderProgram);
    gl.uniform3f(
      shader.shaderLocations.uniformLocations.pointPos,
      point.translation[0],
      point.translation[1],
      point.translation[2]
    );
    gl.uniform1f(
      shader.shaderLocations.uniformLocations.pointIntensity,
      point.intensity
    );
    gl.uniform3f(
      shader.shaderLocations.uniformLocations.pointColor,
      point.color[0],
      point.color[1],
      point.color[2]
    );
  };

  shader.updateCamera = function(camera) {
    gl.useProgram(shader.shaderProgram);
    gl.uniform3f(
      shader.shaderLocations.uniformLocations.camPos,
      camera.translation[0],
      camera.translation[1],
      camera.translation[2]
    );
  };

  return shader;
}