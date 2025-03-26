#version 300 es

layout (location = 0) in vec3 aPos;

uniform float rectangleDeltaX;
uniform float rectangleDeltaY;

void main() {
    gl_Position = vec4(aPos[0] + rectangleDeltaX, aPos[1] + rectangleDeltaY, aPos[2], 1.0);
} 