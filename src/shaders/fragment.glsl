 varying vec2 vUv; 
 varying float vStrength; 

void main() {
    gl_FragColor = vec4(vec3(vStrength, vStrength, vStrength), 1.0); 
}