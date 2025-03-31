import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';



// Global variables
let isInitialized = false; // global variable로 event listener가 등록되었는지 확인
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let positionBuffer;

let drawingMode = "Circle";
let isDrawing = false;
let startPoint = null;
let tempEndPoint = null;
let circleInfo = null;
let lineInfo = null;

let textOverlay;
let textOverlay2;
let textOverlay3;
let axes = new Axes(gl, 0.85);



// DOMContentLoaded event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임

// mouse 쓸 때 main call 방법
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});



function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.8, 0.9, 1.0);

    return true;
}

function setupCanvas() {
    canvas.width = 700;
    canvas.height = 700;

    // resizeAspectRatio(gl, canvas);
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
}

function setupBuffers(shader) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}



// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 상단이 (-1, 1), 우측 하단이 (1, -1)
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
    ];
}



/* 
    browser window
    +----------------------------------------+
    | toolbar, address bar, etc.             |
    +----------------------------------------+
    | browser viewport (컨텐츠 표시 영역)       | 
    | +------------------------------------+ |
    | |                                    | |
    | |    canvas                          | |
    | |    +----------------+              | |
    | |    |                |              | |
    | |    |      *         |              | |
    | |    |                |              | |
    | |    +----------------+              | |
    | |                                    | |
    | +------------------------------------+ |
    +----------------------------------------+

    *: mouse click position

    event.clientX = browser viewport 왼쪽 경계에서 마우스 클릭 위치까지의 거리
    event.clientY = browser viewport 상단 경계에서 마우스 클릭 위치까지의 거리
    rect.left = browser viewport 왼쪽 경계에서 canvas 왼쪽 경계까지의 거리
    rect.top = browser viewport 상단 경계에서 canvas 상단 경계까지의 거리

    x = event.clientX - rect.left  // canvas 내에서의 클릭 x 좌표
    y = event.clientY - rect.top   // canvas 내에서의 클릭 y 좌표
*/

function setupMouseEvents() {
    
    function handleMouseDown(event) {
        event.preventDefault(); // 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (!isDrawing && lineInfo == null) { // 원 또는 선분을 그리고 있는 도중이 아닌 경우
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startPoint = [glX, glY];
            isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 
        }
    }

    function handleMouseMove(event) {
        if (isDrawing) { // 원 또는 선분을 그리고 있는 도중인 경우
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY];

            render();
        }
    }

    function handleMouseUp() {
        if (isDrawing && startPoint && tempEndPoint) {
            if (drawingMode == "Circle") {
                circleInfo = {
                    center: startPoint,
                    radius: Math.sqrt((tempEndPoint[0] - startPoint[0]) ** 2 + (tempEndPoint[1] - startPoint[1]) ** 2)
                }

                updateText(textOverlay, "Circle: center (" + circleInfo.center[0].toFixed(2) + ", " + circleInfo.center[1].toFixed(2) + ") radius = " + circleInfo.radius.toFixed(2));

                drawingMode = "Line";

            } else if (drawingMode == "Line") {
                lineInfo = {
                    start: startPoint,
                    end: tempEndPoint
                }

                updateText(textOverlay2, "Line segment: (" + lineInfo.start[0].toFixed(2) + ", " + lineInfo.start[1].toFixed(2) + ") ~ (" + lineInfo.end[0].toFixed(2) + ", " + lineInfo.end[1].toFixed(2) + ")");
            
            }

            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;

            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}



function drawCircle(center, radius, color) {
    shader.setVec4("u_color", color);

    let iterCount = 360;
    let vertices = [];
    let delta_theta = 2 * Math.PI / 360;

    for (let i = 0; i < iterCount; i++) {
        let startX = center[0] + radius * Math.cos(delta_theta * i);
        let startY = center[1] + radius * Math.sin(delta_theta * i);

        let endX = center[0] + radius * Math.cos(delta_theta * (i + 1));
        let endY = center[1] + radius * Math.sin(delta_theta * (i + 1));

        vertices.push(startX, startY, endX, endY);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINES, 0, iterCount * 2);
}

function drawLine(start, end, color) {
    shader.setVec4("u_color", color);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...start, ...end]), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.LINES, 0, 2);
}

function drawPoint(point, color) {
    shader.setVec4("u_color", color);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(point), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, 1);
}



function calculateIntersectionPoints(circleInfo, lineInfo) {

    let x0 = circleInfo.center[0];
    let y0 = circleInfo.center[1];

    let x1 = lineInfo.start[0];
    let y1 = lineInfo.start[1];

    let x2 = lineInfo.end[0];
    let y2 = lineInfo.end[1];

    // Line의 직선의 방정식
    // (y2 - y1) * x + (x1 - x2) * y + x2 * y1 - y2 * x1 = 0

    // 1. 수선의 발 좌표 구하기
    // 2. 수선의 발 좌표로부터 교점까지의 거리 구하기
    // 3. 교점 좌표 구하기
    // 4. 교점이 선분의 범위에 있는지 확인하기

    // 직선 벡터의 크기
    let len = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
    // 수선의 발까지의 거리
    let distance = ((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2)

    // 직선이 원 밖에 있는 경우
    if (Math.abs(distance) > circleInfo.radius) {
        updateText(textOverlay3, "No intersection");
        return;
    }

    // 수선의 발 좌표
    let hx = x0 - distance * ((y2 - y1) / len); // cos(90-theta) = sin(theta) = (y2-y1)/len
    let hy = y0 + distance * ((x2 - x1) / len); // sin(90-theta) = cos(theta) = (x2-x1)/len

    // 수선의 발로부터 교점 까지의 거리
    let distanceBetweenIntersectionAndFoot = Math.sqrt(circleInfo.radius ** 2 - distance ** 2);

    //cos(theta) = (x2-x1)/len, sin(theta) = (y2-y1)/len
    let intersection1 = [hx - distanceBetweenIntersectionAndFoot * ((x2 - x1) / len), hy - distanceBetweenIntersectionAndFoot * ((y2 - y1) / len)]; 
    let intersection2 = [hx + distanceBetweenIntersectionAndFoot * ((x2 - x1) / len), hy + distanceBetweenIntersectionAndFoot * ((y2 - y1) / len)]; 

    let intersectionList = [];

    // 교점이 선분의 범위에 있는지 확인
    if (intersection1[0] >= Math.min(x1, x2) && intersection1[0] <= Math.max(x1, x2)) {
        intersectionList.push(intersection1);
    }
    if (intersection2[0] >= Math.min(x1, x2) && intersection2[0] <= Math.max(x1, x2)) {
        intersectionList.push(intersection2);
    }
    if (distanceBetweenIntersectionAndFoot == 0) { // 접하는 경우 
        intersectionList.pop();
    }

    if (intersectionList.length == 0) {
        updateText(textOverlay3, "No intersection");
    } else if (intersectionList.length == 1) {
        updateText(textOverlay3, "Intersection Points: 1 Point 1: (" + intersectionList[0][0].toFixed(2) + ", " + intersectionList[0][1].toFixed(2) + ")");
    } else if (intersectionList.length == 2) {
        updateText(textOverlay3, "Intersection Points: 2 Point 1: (" + intersectionList[0][0].toFixed(2) + ", " + intersectionList[0][1].toFixed(2) + ") Point 2: (" + intersectionList[1][0].toFixed(2) + ", " + intersectionList[1][1].toFixed(2) + ")");
    }

    for (let i = 0; i < intersectionList.length; i++) {
        drawPoint(intersectionList[i], [1.0, 1.0, 0, 1.0]);
    }
}



function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    shader.use();

    if (circleInfo) {
        drawCircle(circleInfo.center, circleInfo.radius, [1.0, 0.0, 1.0, 1.0]);
    }

    if (lineInfo && isDrawing == false) {
        drawLine(lineInfo.start, lineInfo.end, [0.5, 0.5, 0.7, 1.0]);

        calculateIntersectionPoints(circleInfo, lineInfo);
    }

    if (isDrawing && startPoint && tempEndPoint) {
        
        if (drawingMode == "Circle") {
            drawCircle([startPoint[0], startPoint[1]], 
                Math.sqrt((tempEndPoint[0] - startPoint[0]) ** 2 + (tempEndPoint[1] - startPoint[1]) ** 2), 
                [0.5, 0.5, 0.5, 1.0]);
        } else if (drawingMode == "Line") {
            drawLine(startPoint, tempEndPoint, [0.5, 0.5, 0.5, 1.0]);
        }

    }

    axes.draw(mat4.create(), mat4.create());
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

        // 셰이더 초기화
        shader = await initShader();

        // 나머지 초기화
        setupCanvas();
        setupBuffers(shader);
        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);

        // 마우스 이벤트 설정
        setupMouseEvents();

        // 초기 렌더링
        render();

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
