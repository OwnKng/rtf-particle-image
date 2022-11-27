uniform vec2 uTextureSize;
uniform sampler2D uTexture; 
uniform sampler2D uMouseTexture; 
uniform vec2 uMouse; 
uniform float uTime; 

attribute vec3 offset; 
attribute float angle; 
attribute float pindex; 
varying vec2 vUv; 
varying float vStrength; 

#include noise.glsl;

void main() {
    vUv = offset.xy / uTextureSize; 
    vec3 color = texture2D(uTexture, vUv).rgb;

    float grey = color.r * 0.21 + color.g * 0.71 + color.b * 0.07;
    vStrength = grey; 

    vec3 transformedPosition = position; 
    transformedPosition += offset; 

    float t = texture2D(uMouseTexture, vUv).r; 
    float rdnz = snoise(vec2(pindex * 0.1, uTime * 0.1)); 

    transformedPosition.z += t * 20.0 * rdnz;
    transformedPosition.x += cos(angle) * t * 20.0 * rdnz;
    transformedPosition.y += sin(angle) * t * 20.0 * rdnz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0); 
}