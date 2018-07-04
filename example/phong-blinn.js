import {Shader, getGLContext} from '../dist/dowel.js';

export default function PhongBlinnShader() {
  const gl = getGLContext();

  const vert = `#version 300 es
      uniform mat4 uModelViewMatrix;
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
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

        // make normals
        vVertPos = vec4(uModelViewMatrix * aVertexPosition).xyz;
        vNormal = normalize(uNormalMatrix * aVertexNormal);
      }
    `;

  const frag = `#version 300 es
      precision mediump float;

      uniform sampler2D uSpotMap;
      uniform vec3 uSpotPos;
      uniform vec3 uSpotDir;
      uniform float uSpotLimit;

      in vec2 vTextureCoord;
      in vec3 vVertPos;
      in vec3 vNormal;
      
      out vec4 fragColor;

      void main() {
        vec3 diffuse = texture(uSpotMap, vTextureCoord).rgb;
        vec3 specColor = vec3(1.0);

        // vec3 fdx = vec3(dFdx(vVertPos.x),dFdx(vVertPos.y),dFdx(vVertPos.z));
        // vec3 fdy = vec3(dFdy(vVertPos.x),dFdy(vVertPos.y),dFdy(vVertPos.z));
        vec3 normal = vNormal; // normalize(cross(fdx, fdy));
        vec3 dirToSpot = normalize(uSpotPos - vVertPos);

        float lambertian = max(dot(dirToSpot,normal), 0.0);
        float specular = 0.0;
        float shininess = 10.0;
        float ambient = 0.2;

        if (lambertian > 0.0 && dot(-uSpotDir, dirToSpot) >= uSpotLimit) {
          vec3 viewDir = normalize(-vVertPos);
          vec3 halfDir = normalize(viewDir-uSpotDir);
          float specAngle = max(dot(halfDir, normal), 0.0);
          specular = pow(specAngle, shininess);
        }

        fragColor = vec4(
          diffuse * max(lambertian, ambient) +
          specColor * specular,
          1.0);
        
        fragColor.rgb *= 0.454545;
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
      modelViewMatrix: gl.getUniformLocation(shader.shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shader.shaderProgram, 'uNormalMatrix'),
      texture0: gl.getUniformLocation(shader.shaderProgram, 'uSpotMap'),
      spotPos: gl.getUniformLocation(shader.shaderProgram, 'uSpotPos'),
      spotDir: gl.getUniformLocation(shader.shaderProgram, 'uSpotDir'),
      spotLimit: gl.getUniformLocation(shader.shaderProgram, 'uSpotLimit'),
    },
  };

  shader.updateSpot = function(spot) {
    gl.useProgram(shader.shaderProgram);
    gl.uniform3f(
      shader.shaderLocations.uniformLocations.spotPos,
      spot.translation[0],
      spot.translation[1],
      spot.translation[2]
    );
    gl.uniform3f(
      shader.shaderLocations.uniformLocations.spotDir,
      spot.direction[0],
      spot.direction[1],
      spot.direction[2]
    );
    gl.uniform1f(
      shader.shaderLocations.uniformLocations.spotLimit,
      Math.cos(spot.angle * Math.PI / 180)
    );
  };

  return shader;
}