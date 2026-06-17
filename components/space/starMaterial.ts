import * as THREE from "three";

/* Soft round twinkling star — radial-falloff point sprite, cold blue→white,
   far stars fade (no recycle pop), brightest cores pushed >1.0 so only they
   bloom (blacks stay black). Used via the built-in <shaderMaterial> element
   (no extend / custom-element registration needed). */
export const starVertex = `
  attribute float aSize;
  attribute float aBright;
  attribute float aSeed;
  attribute float aTint;
  uniform float uTime;
  uniform float uSizeScale;
  uniform float uFar;
  varying float vBright;
  varying float vTint;
  varying float vTwinkle;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    gl_PointSize = min(aSize * uSizeScale * (90.0 / dist), 16.0);
    vBright = aBright;
    vTint = aTint;
    vTwinkle = 0.72 + 0.28 * sin(uTime * 1.6 + aSeed);
    // fade far (no recycle pop) AND near (so the camera isn't engulfed in giant blobs)
    vFade = (1.0 - smoothstep(uFar * 0.7, uFar, dist)) * smoothstep(2.0, 34.0, dist);
  }
`;

export const starFragment = `
  uniform vec3 uColorCool;
  uniform vec3 uColorWarm;
  varying float vBright;
  varying float vTint;
  varying float vTwinkle;
  varying float vFade;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), 1.7) * vFade;
    vec3 col = mix(uColorCool, uColorWarm, vTint) * vBright * vTwinkle;
    col *= 1.0 + step(0.82, vBright) * 0.9;
    gl_FragColor = vec4(col, a);
  }
`;

export function makeStarUniforms() {
  return {
    uTime: { value: 0 },
    uSizeScale: { value: 1 },
    uFar: { value: 360 },
    uColorCool: { value: new THREE.Color("#a9c6ff") },
    uColorWarm: { value: new THREE.Color("#ffffff") },
  };
}
