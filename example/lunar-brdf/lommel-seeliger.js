import {Shader, getGLContext} from '../../dist/dowel.js';

export default function LommelSeeligerShader() {
  const gl = getGLContext();

  const vert = `#version 300 es
      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform mat3 uNormalMatrix;
      uniform mat4 uLightMatrix;

      in vec4 aVertexPosition;
      in vec2 aTextureCoord;
      in vec3 aVertexNormal;

      out vec2 vTextureCoord;
      out vec3 vVertPos;
      out vec3 vNormal;
      out vec4 vShadowCoord;

      // mat4 texUnitConverter = mat4(
      //   0.5, 0.0, 0.0, 0.5,
      //   0.0, 0.5, 0.0, 0.5,
      //   0.0, 0.0, 0.5, 0.5,
      //   0.0, 0.0, 0.0, 1.0);

        // mat4 texUnitConverter = mat4(
        //   0.5, 0.0, 0.0, 0.0,
        //   0.0, 0.5, 0.0, 0.0,
        //   0.0, 0.0, 0.5, 0.0,
        //   0.5, 0.5, 0.5, 1.0);

      void main() {
        vTextureCoord = aTextureCoord;
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;

        // make normals
        vVertPos = vec4(uModelMatrix * aVertexPosition).xyz;
        vNormal = normalize(uNormalMatrix * aVertexNormal);

        // shadow
        vShadowCoord = uLightMatrix * uModelMatrix * aVertexPosition;
      }
    `;

  const frag = `#version 300 es
      precision highp float;
      precision highp int;

      uniform vec3 uPointPos;
      uniform float uPointIntensity;
      uniform vec3 uPointColor;
      uniform vec3 uCamPos;
      uniform sampler2D uTexture0;
      uniform vec2 uResolution;

      in vec2 vTextureCoord;
      in vec3 vVertPos;
      in vec3 vNormal;
      in vec4 vShadowCoord;
      
      out vec4 fragColor;

      float computeShadow(vec3 shadowCoord, float dotNL) {
        float lightDepth = texture(uTexture0, shadowCoord.xy).r;

        float bias = 0.0005 * tan(acos(dotNL));
        bias = clamp(bias, 0.0, 0.0005);
        if (lightDepth < shadowCoord.z - bias) {
          return 0.5;
        }
        return 1.0;
      }

      void main() {
        vec3 toView = normalize(uCamPos - vVertPos);
        vec3 toLight = normalize(uPointPos);

        float mu0 = max(0.0, dot(vNormal, toLight));
        float mur = max(0.0, dot(reflect(-toLight, vNormal), toView));
        float w0 = 0.037;

        float brdf = w0 * (mur + mu0);

        vec3 diffuseColor = vec3(0.5, 0.5, 0.5);

        vec3 shadowCoord = (vShadowCoord.xyz/vShadowCoord.w)/2.0 + 0.5;
        float shadow = computeShadow(shadowCoord, mu0);

        vec3 finalColor = uPointIntensity * uPointColor * (shadow * brdf * diffuseColor);
        
        // debug shadows
        // finalColor = mix(brdf * diffuseColor, vec3(1.0, 0.0, 0.0), 1.0 - shadow);
        
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
      texture0: gl.getUniformLocation(shader.shaderProgram, 'uTexture0'),
      lightMatrix: gl.getUniformLocation(shader.shaderProgram, 'uLightMatrix'),
      resolution: gl.getUniformLocation(shader.shaderProgram, 'uResolution'),
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

  shader.updateResolution = function(w, h) {
    gl.useProgram(shader.shaderProgram);
    gl.uniform2f(
      shader.shaderLocations.uniformLocations.resolution,
      w, h
    );
  };

  shader.updateLightMatrix = function(lightMatrix) {
    gl.useProgram(shader.shaderProgram);
    gl.uniformMatrix4fv(shader.shaderLocations.uniformLocations.lightMatrix, false, lightMatrix);
  };

  return shader;
}