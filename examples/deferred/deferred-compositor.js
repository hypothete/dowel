import { Shader } from '../../dist/dowel.js';

export default class DeferrdCompositorShader extends Shader {
  constructor () {
    const vert = `#version 300 es

      in vec4 aVertexPosition;
      in vec2 aTextureCoord;

      out vec2 vTextureCoord;
      out vec3 vVertPos;

      void main() {
        vTextureCoord = aTextureCoord;
        gl_Position =  aVertexPosition;
        vVertPos = aVertexPosition.xyz;
      }
    `;

    const frag = `#version 300 es
      precision mediump float;

      uniform sampler2D uTexture0;
      uniform sampler2D uTexture1;
      uniform sampler2D uTexture2;
      uniform sampler2D uTexture3;
      uniform vec3 uCamPos;

      in vec2 vTextureCoord;
      in vec3 vVertPos;

      out vec4 fragColor;

      void main() {
        vec3 defPos = texture(uTexture0, vTextureCoord).rgb;
        vec3 defCol = texture(uTexture1, vTextureCoord).rgb;
        float defIdx = texture(uTexture2, vTextureCoord).a;
        vec3 defNrm = texture(uTexture2, vTextureCoord).rgb;

        vec3 lightPos = vec3(0.0, 50.0, 100.0);
        vec3 toView = normalize(uCamPos - defPos);
        vec3 toLight = normalize(lightPos - defPos);
        vec3 halfVec = normalize(toView + toLight);
        float lambert = max(dot(defNrm, toLight), 0.0);
        vec3 specular = vec3(1.0) * pow(max(dot(defNrm, halfVec), 0.0), 10.0);
        vec3 diffuse = defCol * lambert;
        vec3 finalColor = specular + diffuse;

        fragColor = vec4(finalColor, 1.0);
      }
    `;
    super(vert, frag);

    this.addAttribute('aVertexPosition');
    this.addAttribute('aTextureCoord');

    this.addUniform('uTexture0');
    this.addUniform('uTexture1');
    this.addUniform('uTexture2');
    this.addUniform('uTexture3');
    this.addUniform('uCamPos');
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