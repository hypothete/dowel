import {Shader} from '../../dist/dowel.js';

export default class PhongBlinnShader extends Shader {
  constructor () {
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

    super(vert, frag);

    this.addAttribute('aVertexPosition');
    this.addAttribute('aTextureCoord');
    this.addAttribute('aVertexNormal');

    this.addUniform('uProjectionMatrix');
    this.addUniform('uModelMatrix');
    this.addUniform('uViewMatrix');
    this.addUniform('uNormalMatrix');
    this.addUniform('uSpotMap');
    this.addUniform('uSpotPos');
    this.addUniform('uSpotDir');
    this.addUniform('uSpotLimit');

  }

  updateSpot (spot) {
    this.gl.useProgram(this.shaderProgram);
    this.gl.uniform3f(
      this.shaderLocations.uniformLocations.uSpotPos,
      spot.translation[0],
      spot.translation[1],
      spot.translation[2]
    );
    this.gl.uniform3f(
      this.shaderLocations.uniformLocations.uSpotDir,
      spot.direction[0],
      spot.direction[1],
      spot.direction[2]
    );
    this.gl.uniform1f(
      this.shaderLocations.uniformLocations.uSpotLimit,
      Math.cos(spot.angle * Math.PI / 180)
    );
  }
}