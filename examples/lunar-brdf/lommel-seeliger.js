import {Shader} from '../../dist/dowel.js';

export default class LommelSeeligerShader extends Shader {
  constructor () {
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
          return 0.1;
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

    super(vert, frag);

    this.addAttribute('aVertexPosition');
    this.addAttribute('aTextureCoord');
    this.addAttribute('aVertexNormal');

    this.addUniform('uProjectionMatrix');
    this.addUniform('uModelMatrix');
    this.addUniform('uViewMatrix');
    this.addUniform('uNormalMatrix');
    this.addUniform('uPointPos');
    this.addUniform('uPointIntensity');
    this.addUniform('uPointColor');
    this.addUniform('uCamPos');
    this.addUniform('uTexture0');
    this.addUniform('uLightMatrix');
    this.addUniform('uResolution');

  }

  updatePoint (point) {
    this.gl.useProgram(this.shaderProgram);
    this.gl.uniform3f(
      this.shaderLocations.uniformLocations.uPointPos,
      point.translation[0],
      point.translation[1],
      point.translation[2]
    );
    this.gl.uniform1f(
      this.shaderLocations.uniformLocations.uPointIntensity,
      point.intensity
    );
    this.gl.uniform3f(
      this.shaderLocations.uniformLocations.uPointColor,
      point.color[0],
      point.color[1],
      point.color[2]
    );
  }

  updateCamera (camera) {
    this.gl.useProgram(this.shaderProgram);
    this.gl.uniform3f(
      this.shaderLocations.uniformLocations.uCamPos,
      camera.translation[0],
      camera.translation[1],
      camera.translation[2]
    );
  }

  updateResolution (w, h) {
    this.gl.useProgram(this.shaderProgram);
    this.gl.uniform2f(
      this.shaderLocations.uniformLocations.uResolution,
      w, h
    );
  }

  updateLightMatrix (lightMatrix) {
    this.gl.useProgram(this.shaderProgram);
    this.gl.uniformMatrix4fv(this.shaderLocations.uniformLocations.uLightMatrix, false, lightMatrix);
  }
}