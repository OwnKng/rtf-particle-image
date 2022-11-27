attribute vec3 offset; 

void main() {
    vec3 transformedPosition = position; 
    transformedPosition += offset; 
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0); 
}