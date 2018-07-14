import {Shader, getGLContext} from '../../dist/dowel.js';

export default function PBRShader() {
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
      #define PI 3.1415926

      uniform vec3 uPointPos;
      uniform float uPointIntensity;
      uniform vec3 uPointColor;
      uniform vec3 uCamPos;
      uniform vec3 uBaseColor;
      uniform sampler2D uTexture0;
      uniform sampler2D uTexture1;
      uniform float uMetalness;
      uniform float uRoughness;

      in vec2 vTextureCoord;
      in vec3 vVertPos;
      in vec3 vNormal;
      
      out vec4 fragColor;

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
        normalMap.y = -normalMap.y;
        mat3 TBN = cotangentFrame(N, -V, texCoord);
        return normalize(TBN * normalMap);
      }

      void main() {
        
        vec3 lightDir = normalize(uPointPos - vVertPos);
        vec3 viewDir = normalize(uCamPos - vVertPos);
        vec3 halfDir = normalize(viewDir + lightDir);

        vec3 normal = perturbNormal(vNormal, viewDir, vTextureCoord);
        
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
        vec3 specularColor = mix(vec3(1.0), uBaseColor, uMetalness);

        float spec = (F * G * D / (4.0 * NdotL * NdotV)) * brdf.x + brdf.y;
        float diff = (1.0 - F);

        vec3 color = NdotL * uPointColor * (diffuseColor * diff + specularColor * spec);
        fragColor = vec4(color, 1.0);

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

      texture0: gl.getUniformLocation(shader.shaderProgram, 'uTexture0'),
      texture1: gl.getUniformLocation(shader.shaderProgram, 'uTexture1'),
      baseColor: gl.getUniformLocation(shader.shaderProgram, 'uBaseColor'),
      metalness: gl.getUniformLocation(shader.shaderProgram, 'uMetalness'),
      roughness: gl.getUniformLocation(shader.shaderProgram, 'uRoughness'),

      pointPos: gl.getUniformLocation(shader.shaderProgram, 'uPointPos'),
      pointIntensity: gl.getUniformLocation(shader.shaderProgram, 'uPointIntensity'),
      pointColor: gl.getUniformLocation(shader.shaderProgram, 'uPointColor'),

      camPos: gl.getUniformLocation(shader.shaderProgram, 'uCamPos'),

    },
  };

  shader.setColor = function(color) {
    gl.useProgram(shader.shaderProgram);
    gl.uniform3f(
      shader.shaderLocations.uniformLocations.baseColor,
      color[0],
      color[1],
      color[2]
    );
  };

  shader.setMetalness = function(metalness) {
    gl.useProgram(shader.shaderProgram);
    gl.uniform1f(
      shader.shaderLocations.uniformLocations.metalness,
      metalness
    );
  };

  shader.setRoughness = function(roughness) {
    gl.useProgram(shader.shaderProgram);
    gl.uniform1f(
      shader.shaderLocations.uniformLocations.roughness,
      roughness
    );
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