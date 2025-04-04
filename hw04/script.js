import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';



let isInitialized = false;
let isAnimating = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let axes;
let vao_s;
let vao_e;
let vao_m;
let finalTransform_s;
let finalTransform_e;
let finalTransform_m;
let rotationAngle = 0;
let lastTime = 0;



document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        isAnimating = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});



function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupBuffers(shader, color) {
    const cubeVertices = new Float32Array([
        -0.5,  0.5, 0.0,  // 좌상단
        -0.5, -0.5, 0.0,  // 좌하단
         0.5, -0.5, 0.0,  // 우하단
         0.5,  0.5, 0.0,  // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const cubeColors = new Float32Array(color);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 3, gl.FLOAT, false, 0, 0);

    // VBO for color
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return vao;
}



function applyTransform() {
    finalTransform_s = mat4.create();
    finalTransform_e = mat4.create();
    finalTransform_m = mat4.create();

    const S = mat4.create();
    mat4.rotate(S, S, rotationAngle * 45, [0, 0, 1]); // 자전
    mat4.scale(S, S, [0.2, 0.2, 1.0]);

    const E = mat4.create();
    mat4.rotate(E, E, rotationAngle * 30, [0, 0, 1]); // 공전
    mat4.translate(E, E, [0.7, 0.0, 0.0]);
    mat4.rotate(E, E, rotationAngle * 180, [0, 0, 1]); // 자전
    mat4.scale(E, E, [0.1, 0.1, 1.0]);

    const M = mat4.create();
    mat4.rotate(M, M, rotationAngle * 30, [0, 0, 1]); // Earth 중심
    mat4.translate(M, M, [0.7, 0.0, 0.0]);
    mat4.rotate(M, M, rotationAngle * 360, [0, 0, 1]); // 공전
    mat4.translate(M, M, [0.2, 0.0, 0.0]);
    mat4.rotate(M, M, rotationAngle * 180, [0, 0, 1]); // 자전
    mat4.scale(M, M, [0.05, 0.05, 1.0]);
    
    mat4.multiply(finalTransform_s, S, finalTransform_s);
    mat4.multiply(finalTransform_e, E, finalTransform_e);
    mat4.multiply(finalTransform_m, M, finalTransform_m);
}



function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw axes
    axes.draw(mat4.create(), mat4.create()); 

    // draw cubes
    shader.use();

    shader.setMat4("u_model", finalTransform_s);
    gl.bindVertexArray(vao_s);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    shader.setMat4("u_model", finalTransform_e);
    gl.bindVertexArray(vao_e);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    shader.setMat4("u_model", finalTransform_m);
    gl.bindVertexArray(vao_m);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function animate(currentTime) {

    if (!lastTime) lastTime = currentTime;
    // deltaTime: 이전 frame에서부터의 elapsed time (in seconds)
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (isAnimating) {
        // 1초당 1도 회전
        rotationAngle += Math.PI / 180 * deltaTime;
        applyTransform();
    }

    render();
    requestAnimationFrame(animate);
}



async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        axes = new Axes(gl, 1.0);

        finalTransform_s = mat4.create();
        finalTransform_e = mat4.create();
        finalTransform_m = mat4.create();

        shader = await initShader();

        vao_s = setupBuffers(shader, [
            1.0, 0.0, 0.0, 1.0, // Red
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
        ]);
        vao_e = setupBuffers(shader, [
            0.0, 1.0, 1.0, 1.0, // Cyan
            0.0, 1.0, 1.0, 1.0,
            0.0, 1.0, 1.0, 1.0,
            0.0, 1.0, 1.0, 1.0,
        ]);
        vao_m = setupBuffers(shader, [
            1.0, 1.0, 0.0, 1.0, // Yellow
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,
        ]);

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
