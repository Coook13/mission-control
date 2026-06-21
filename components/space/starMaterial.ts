import * as THREE from "three";

/* Soft round twinkling star — radial-falloff point sprite, cold blue→white,
   far stars fade (no recycle pop), brightest cores pushed >1.0 so only they
   bloom (blacks stay black). Used via the built-in <shaderMaterial> element
   (no extend / custom-element registration needed).

   The rendered z is a PURE FUNCTION of the camera z (uCamZ): each star's
   immutable base z is wrapped, via mod(), into a fixed-width window that ends a
   little behind the camera and extends uWrapDepth ahead. No mutated/integrated
   buffer state → the field is identical scrubbing forward AND backward and can
   never deplete on reverse scroll (BUG 2). */
export const starVertex = `
  attribute float aSize;
  attribute float aBright;
  attribute float aSeed;
  attribute float aTint;
  uniform float uTime;
  uniform float uSizeScale;
  uniform float uFar;
  uniform float uCamZ;       // camera z this frame (drives the pure wrap)
  uniform float uWrapDepth;  // depth of the rolling star band
  uniform float uWrapMargin; // how far behind the camera the band ends
  varying float vBright;
  varying float vTint;
  varying float vTwinkle;
  varying float vFade;
  void main() {
    // Wrap the star's base z into the band (uCamZ + margin - depth, uCamZ + margin].
    // mod(top - z, depth) ∈ [0, depth) ⇒ zWrapped ∈ (top - depth, top]. The camera
    // looks down -z, so this band sits AHEAD of the camera (plus a small sliver
    // behind). Pure in uCamZ → reverses exactly, never depletes (BUG 2).
    float top = uCamZ + uWrapMargin;
    float zWrapped = top - mod(top - position.z, uWrapDepth);
    vec3 wrapped = vec3(position.x, position.y, zWrapped);

    vec4 mv = modelViewMatrix * vec4(wrapped, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    gl_PointSize = min(aSize * uSizeScale * (90.0 / dist), 16.0);
    vBright = aBright;
    vTint = aTint;
    vTwinkle = 0.72 + 0.28 * sin(uTime * 1.6 + aSeed);
    // fade far (no wrap pop) AND near (so the camera isn't engulfed in giant blobs)
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
    uCamZ: { value: 0 },
    uWrapDepth: { value: 360 },
    uWrapMargin: { value: 8 },
    uColorCool: { value: new THREE.Color("#a9c6ff") },
    uColorWarm: { value: new THREE.Color("#ffffff") },
  };
}
