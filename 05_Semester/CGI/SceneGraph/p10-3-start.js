var canvas;
var gl;
var program;

var aspect;

var mProjectionLoc, mModelViewLoc;

var matrixStack = [];
var modelView;
var time = 0;

// Stack related operations
function pushMatrix() {
    var m =  mat4(modelView[0], modelView[1],
           modelView[2], modelView[3]);
    matrixStack.push(m);
}
function popMatrix() {
    modelView = matrixStack.pop();
}
// Append transformations to modelView
function multMatrix(m) {
    modelView = mult(modelView, m);
}
function multTranslation(t) {
    modelView = mult(modelView, translate(t));
}
function multScale(s) { 
    modelView = mult(modelView, scalem(s)); 
}
function multRotationX(angle) {
    modelView = mult(modelView, rotateX(angle));
}
function multRotationY(angle) {
    modelView = mult(modelView, rotateY(angle));
}
function multRotationZ(angle) {
    modelView = mult(modelView, rotateZ(angle));
}

function fit_canvas_to_window()
{
    canvas.width = window.innerWidth - 4;
    canvas.height = window.innerHeight - 4;

    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0,canvas.width, canvas.height);

}

window.onresize = function () {
    fit_canvas_to_window();
}

window.onload = function() {
    canvas = document.getElementById('gl-canvas');

    document.getElementById("slide_joint1_X").oninput = function(event) {
        JOINT1_XANGLE = event.srcElement.value;
        document.getElementById("span_joint1_X").innerHTML = JOINT1_XANGLE;
    };

    document.getElementById("slide_joint1_Y").oninput = function(event) {
        JOINT1_YANGLE = event.srcElement.value;
        document.getElementById("span_joint1_Y").innerHTML = JOINT1_YANGLE;
    };

    document.getElementById("slide_joint1_Z").oninput = function(event) {
        JOINT1_ZANGLE = event.srcElement.value;
        document.getElementById("span_joint1_Z").innerHTML = JOINT1_ZANGLE;
    };

    document.getElementById("slide_joint2_X").oninput = function(event) {
        JOINT2_XANGLE = event.srcElement.value;
        document.getElementById("span_joint1_X").innerHTML = JOINT2_XANGLE;
    };

    document.getElementById("slide_joint2_Y").oninput = function(event) {
        JOINT2_YANGLE = event.srcElement.value;
        document.getElementById("span_joint2_Y").innerHTML = JOINT2_YANGLE;
    };

    document.getElementById("slide_joint2_Z").oninput = function(event) {
        JOINT2_ZANGLE = event.srcElement.value;
        document.getElementById("span_joint2_Z").innerHTML = JOINT2_ZANGLE;
    };

    document.getElementById("slide_hand_Y").oninput = function(event) {
        HAND_YANGLE = event.srcElement.value;
        document.getElementById("span_hand_Y").innerHTML = HAND_YANGLE;
    };


    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    fit_canvas_to_window();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    sphereInit(gl);
    cubeInit(gl);
    cylinderInit(gl);

    render();
}

var JOINT1_XANGLE = 0;
var JOINT1_YANGLE = 0;
var JOINT1_ZANGLE = 0;

var JOINT2_XANGLE = 0;
var JOINT2_YANGLE = 0;
var JOINT2_ZANGLE = 0;

var HAND_YANGLE = 0;

const JOINT_Y = 8;
const LONGPART_Y = 15;

const VP_DISTANCE = 50;

function render() 
{
    requestAnimationFrame(render);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    modelView = lookAt([0,VP_DISTANCE,VP_DISTANCE], [0,0,0], [0,1,0]); // [0,VP_DISTANCE,VP_DISTANCE]

    multTranslation([0, -30 , 0]);
    multRotationY(time);

    pushMatrix();
    part1();
    popMatrix();

    multTranslation([0, 5, 0]);

    pushMatrix();
    part2();
    popMatrix();

    multTranslation([0, 10, 0]);

    pushMatrix();
    longPart();
    popMatrix();

    multTranslation([0, JOINT_Y, 0]);
    pushMatrix();
    joint();
    popMatrix();

    multRotationX(JOINT1_XANGLE);
    multRotationY(JOINT1_YANGLE);
    multRotationZ(JOINT1_ZANGLE);
    multTranslation([0, 10, 0]);
    
    pushMatrix();
    longPart();
    popMatrix();

    multTranslation([0, JOINT_Y, 0]);
    pushMatrix();
    joint();
    popMatrix();

    multRotationX(JOINT2_XANGLE);
    multRotationY(JOINT2_YANGLE);
    multRotationZ(JOINT2_ZANGLE);
    multTranslation([0, 10, 0]);

    pushMatrix();
    longPart();
    popMatrix();


    multTranslation([0, JOINT_Y, 0]);
    multRotationY(HAND_YANGLE);
    pushMatrix();
    hand();
    popMatrix();

    multTranslation([0, JOINT_Y, 0]);
    multTranslation([0, 0, 3]);

    pushMatrix();
    finger();
    popMatrix();

    multTranslation([0, 0, -6]);
    pushMatrix();
    finger();
    popMatrix();

    time += 0.05;
}

function drawPrimitive(obj, mode, program){


    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));

    switch(obj){
        case"sphere":
            if(!mode)
                sphereDrawWireFrame(gl, program);
            else
                sphereDrawFilled(gl, program);
            break;
        case"cube":
            if(!mode)
                cubeDrawWireFrame(gl, program);
            else
                cubeDrawFilled(gl, program);
            break;
        case"cylinder":
            if(!mode)
                cylinderDrawWireFrame(gl, program);
            else
                cylinderDrawFilled(gl, program);
            break;
        default:
            break;
    }

}

function part1(){

    multScale([30, 5, 30]);

    drawPrimitive("cube", true, program);
}

function part2(){


    multScale([8, 5, 8]);

    drawPrimitive("cylinder", true, program);
}

function longPart(){

    multScale([5, LONGPART_Y, 5]);

    drawPrimitive("cylinder", true, program);
}

function joint(){

    multScale([JOINT_Y, JOINT_Y, JOINT_Y]);

    drawPrimitive("sphere", true, program);
}

function hand(){

    multScale([12, 4, 12]);

    drawPrimitive("cylinder", true, program);
}

function finger(){

    multScale([2, 12, 2]);

    drawPrimitive("cylinder", true, program);
}