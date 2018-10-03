import {Shader} from '../../dist/dowel.js';

export default class PBRInstancedShader extends Shader {
  constructor (options = {}) {
    let vertDefines = '';
    let fragDefines = '';

    for (let define in options.vertDefines) {
      vertDefines += `#define ${define} ${options.vertDefines[define]}`;
    }

    for (let define in options.fragDefines) {
      fragDefines += `#define ${define} ${options.fragDefines[define]}`;
    }

    const vert = `#version 300 es
      ${vertDefines}
      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;

      in vec4 aInstanceOffset0;
      in vec4 aInstanceOffset1;
      in vec4 aInstanceOffset2;
      in vec4 aInstanceOffset3;
      in vec4 aVertexPosition;
      in vec2 aTextureCoord;
      in vec3 aVertexNormal;

      out vec2 vTextureCoord;
      out vec3 vVertPos;
      out vec3 vNormal;

      void main() {
        vTextureCoord = aTextureCoord;
        mat4 instanceOffset = mat4(
          aInstanceOffset0,
          aInstanceOffset1,
          aInstanceOffset2,
          aInstanceOffset3
        );
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * instanceOffset * aVertexPosition;

        mat4 trans = transpose(uModelMatrix * instanceOffset);
        mat4 transinv = inverse(trans);

        // make normals
        vVertPos = vec4(uModelMatrix * instanceOffset * aVertexPosition).xyz;
        vNormal = normalize(vec3(transinv * vec4(aVertexNormal, 0.0)).xyz);
      }
    `;

    const frag = `#version 300 es
      precision mediump float;
      ${fragDefines}
      #define PI 3.1415926

      uniform vec3 uPointPos;
      uniform float uPointIntensity;
      uniform vec3 uPointColor;
      uniform vec3 uCamPos;
      uniform vec3 uBaseColor;
      uniform vec3 uSpecularColor;
      uniform sampler2D uTexture0;
      uniform sampler2D uTexture1;
      uniform float uMetalness;
      uniform float uRoughness;

      in vec2 vTextureCoord;
      in vec3 vVertPos;
      in vec3 vNormal;
      
      out vec4 fragColor;

      #ifdef NORMAL_MAP
      // this and next function - http://www.thetenthplanet.de/archives/1180
      mat3 cotangentFrame(vec3 N, vec3 p, vec2 uv) {
        vec3 dp1 = dFdx(p);
        vec3 dp2 = dFdy(p);
        vec2 duv1 = dFdx(uv);
        vec2 duv2 = dFdy(uv);
        // solve the linear system
        vec3 dp2perp = cross(dp2, N);
        vec3 dp1perp = cross(N, dp1);
        vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
        vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
        // construct a scale-invariant frame
        float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );
        // side note - dot(A,A) gives the square of the magnitude of a vector.
        return mat3( T * invmax, B * invmax, N );
      }

      vec3 perturbNormal(vec3 N, vec3 V, vec2 texCoord) {
        vec3 normalMap = texture(uTexture1, texCoord).rgb;
        normalMap = normalMap * 2.0 - 1.0;
        mat3 TBN = cotangentFrame(N, -V, texCoord);
        return normalize(TBN * normalMap);
      }
      #endif

      void main() {
        
        vec3 lightDir = normalize(uPointPos - vVertPos);
        vec3 viewDir = normalize(uCamPos - vVertPos);
        vec3 halfDir = normalize(viewDir + lightDir);

        vec3 normal = vNormal;
        
        #ifdef NORMAL_MAP
        normal = perturbNormal(vNormal, viewDir, vTextureCoord);
        #endif

        float NdotL = dot(normal, lightDir);
        float NdotV = dot(normal, viewDir);
        float VdotH = dot(viewDir, halfDir);
        float NdotH = dot(normal, halfDir);
        vec2 brdf = texture(uTexture0, vec2(NdotV, uRoughness)).rg;
        brdf = pow(brdf, vec2(2.2));

        // heavily adapted from https://github.com/KhronosGroup/glTF-WebGL-PBR

        // specular reflection - Fresnel Schlick
        float F = uMetalness + (1.0 - uMetalness) * pow(1.0 - VdotH, 5.0);

        // geometric occlusion - Cook Torrance
        float G = min(min(2.0 * NdotV * NdotH / VdotH, 2.0 * NdotL * NdotH / VdotH), 1.0);

        // microfacet distribution - Trowbridge-Reitz
        float roughnessSq = uRoughness * uRoughness + 0.01;
        float f = (NdotH * roughnessSq - NdotH) * NdotH + 1.0;
        float D = roughnessSq / (PI * f * f);

        vec3 diffuseColor = uBaseColor;
        vec3 specularColor = mix(uSpecularColor, uBaseColor, uMetalness);

        float spec = min(1.0, (F * G * D / (4.0 * NdotL * NdotV)) * brdf.x + brdf.y);
        float diff = (1.0 - F);

        vec3 color = NdotL * uPointColor * uPointIntensity * (diffuseColor * diff + specularColor * spec);
        fragColor = vec4(color, 1.0);

      }
    `;

    super(vert, frag);

    this.addAttribute('aVertexPosition');
    this.addAttribute('aTextureCoord');
    this.addAttribute('aVertexNormal');
    this.addAttribute('aInstanceOffset0');
    this.addAttribute('aInstanceOffset1');
    this.addAttribute('aInstanceOffset2');
    this.addAttribute('aInstanceOffset3');

    this.addUniform('uProjectionMatrix');
    this.addUniform('uModelMatrix');
    this.addUniform('uViewMatrix');
    this.addUniform('uTexture0');
    this.addUniform('uTexture1');
    this.addUniform('uBaseColor');
    this.addUniform('uSpecularColor');
    this.addUniform('uMetalness');
    this.addUniform('uRoughness');
    this.addUniform('uPointPos');
    this.addUniform('uPointIntensity');
    this.addUniform('uPointColor');
    this.addUniform('uCamPos');
  }

  setColor (color) {
    this.gl.useProgram(this.shaderProgram);
    this.gl.uniform3f(
      this.shaderLocations.uniformLocations.uBaseColor,
      color[0],
      color[1],
      color[2]
    );
  }

  setSpecularColor (color) {
    this.gl.useProgram(this.shaderProgram);
    this.gl.uniform3f(
      this.shaderLocations.uniformLocations.uSpecularColor,
      color[0],
      color[1],
      color[2]
    );
  }

  setMetalness (metalness) {
    this.gl.useProgram(this.shaderProgram);
    this.gl.uniform1f(
      this.shaderLocations.uniformLocations.uMetalness,
      metalness
    );
  }

  setRoughness (roughness) {
    this.gl.useProgram(this.shaderProgram);
    this.gl.uniform1f(
      this.shaderLocations.uniformLocations.uRoughness,
      roughness
    );
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
}