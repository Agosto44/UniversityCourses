var canvas;
var gl;
var program;

var aspect;

var mProjectionLoc, mModelViewLoc;

var matrixStack = [];
var modelView;
var time = 50000;

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

    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    fit_canvas_to_window();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    sphereInit(gl);

    render();
}

const PLANET_SCALE = 10;
const ORBIT_SCALE = 1 / 60;

const SUN_DIAMETER = 1391900;
const SUN_DAY = 24.47; // At the equator. The poles are slower as the sun is gaseous

const MERCURY_DIAMETER = 4866*PLANET_SCALE;
const MERCURY_ORBIT = 57950000*ORBIT_SCALE;
const MERCURY_YEAR = 87.97;
const MERCURY_DAY = 58.646;

const VENUS_DIAMETER = 12106*PLANET_SCALE;
const VENUS_ORBIT = 108110000*ORBIT_SCALE;
const VENUS_YEAR = 224.70;
const VENUS_DAY = 243.018;

const EARTH_DIAMETER = 12742*PLANET_SCALE;
const EARTH_ORBIT = 149570000*ORBIT_SCALE;
const EARTH_YEAR = 365.26;
const EARTH_DAY = 0.99726968;

const MOON_DIAMETER = 3474*PLANET_SCALE;
const MOON_ORBIT = 363396*ORBIT_SCALE * 30;
const MOON_YEAR = 28;
const MOON_DAY = 0;

const MARS_DIAMETER = 6760*PLANET_SCALE;
const MARS_ORBIT = 227840000*ORBIT_SCALE;
const MARS_YEAR = 686.98;
const MARS_DAY = 1.02749125170;

const DEIMOS_DIAMETER = 12.6*PLANET_SCALE * 50;
const DEIMOS_ORBIT = 23459*ORBIT_SCALE * 400;
const DEIMOS_YEAR = 1.263;

const PHOBOS_DIAMETER = 22.2*PLANET_SCALE * 50;
const PHOBOS_ORBIT = 9378*ORBIT_SCALE * 400;
const PHOBOS_YEAR = 0.31891023;

const JUPITER_DIAMETER = 142984*PLANET_SCALE / 2;
const JUPITER_ORBIT = 778140000*ORBIT_SCALE / 1.8;
const JUPITER_YEAR = 4332.59;
const JUPITER_DAY = 0.413541667;

const SATURN_DIAMETER = 116438*PLANET_SCALE / 2;
const SATURN_ORBIT = 1427000000*ORBIT_SCALE / 2.5;
const SATURN_YEAR = 10759.22;
const SATURN_DAY = 0.439583333;

const ASTEROIDS_LESSER_DIAMETER = 1*PLANET_SCALE * 1000;
const ASTEROIDS_BIGGER_DIAMETER = 50*PLANET_SCALE * 100;
const ASTEROIDS_CENTER_ORBIT = 308171614*ORBIT_SCALE / 1.2;
const ASTEROIDS_OUTER_ORBIT = 489185037*ORBIT_SCALE / 1.5;
const ASTEROIDS_LESSER_YEAR = 337.649791;
const ASTEROIDS_BIGGER_YEAR = 229.601858;

const VP_DISTANCE = JUPITER_ORBIT;


function render() 
{
    requestAnimationFrame(render);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    modelView = lookAt([0,VP_DISTANCE,VP_DISTANCE], [0,0,0], [0,1,0]);

    pushMatrix();
    sun();
    popMatrix();

    pushMatrix();
    mercury();
    popMatrix();

    pushMatrix();    
    venus();
    popMatrix();

    pushMatrix();    
    earthAndMoon();
    popMatrix();

    pushMatrix();    
    marsAndMoons();
    popMatrix();

    pushMatrix();    
    jupiter();
    popMatrix();

    pushMatrix();    
    saturn();
    popMatrix();   

    for (var i = 1; i < 50; i++) {
        pushMatrix();    
        saturnBelt(i);
        popMatrix();   
    }

    for (var i = 1; i < 50; i++) {
        pushMatrix();    
        asteroid(i);
        popMatrix();   
    }

    time += 1;
}

function drawPrimitive(obj, mode, program){


    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));

    if(!mode){
        sphereDrawWireFrame(gl, program);
    }
    else{
        sphereDrawFilled(gl, program);
    }

}

function sun(){
    multRotationY(time * 360 / SUN_DAY)
    multScale([SUN_DIAMETER , SUN_DIAMETER , SUN_DIAMETER ]);
    drawPrimitive("sphere", true, program);
}

function mercury(){

    multRotationY(time * 360 / MERCURY_YEAR);
    multTranslation([MERCURY_ORBIT, 0 , 0]);

    multRotationY(time * 360 / MERCURY_DAY)
    multScale([MERCURY_DIAMETER, MERCURY_DIAMETER, MERCURY_DIAMETER]);

    drawPrimitive("sphere", false, program);
}

function venus(){

    multRotationY(time * 360 / VENUS_YEAR)
    multTranslation([VENUS_ORBIT, 0 , 0]);

    multRotationY(time * 360 / VENUS_DAY);
    multScale([VENUS_DIAMETER , VENUS_DIAMETER , VENUS_DIAMETER]);

    drawPrimitive("sphere", false, program);
}

function earth(){


    multRotationY(time * 360 / EARTH_YEAR);
    multTranslation([EARTH_ORBIT, 0 , 0]);

    multRotationY(time * 360 / EARTH_DAY);
    multScale([EARTH_DIAMETER , EARTH_DIAMETER , EARTH_DIAMETER ]);

    drawPrimitive("sphere", false, program);
}

function moon(){

    multRotationY(time * 360 / EARTH_YEAR);
    multTranslation([EARTH_ORBIT, 0 , 0]);

    multRotationY(time * 360 / MOON_YEAR);
    multTranslation([MOON_ORBIT, 0 , 0]);

    multScale([MOON_DIAMETER , MOON_DIAMETER , MOON_DIAMETER ]);

    drawPrimitive("sphere", false, program);
}

function earthAndMoon(){

    earth();
    popMatrix();

    pushMatrix();
    moon();
}

function mars(){


    multRotationY(time * 360 / MARS_YEAR);
    multTranslation([MARS_ORBIT, 0 , 0]);


    multRotationY(time * 360 / MARS_DAY);
    multScale([MARS_DIAMETER , MARS_DIAMETER , MARS_DIAMETER ]);

    drawPrimitive("sphere", false, program);
}

function deimos(){

    multRotationY(time * 360 / MARS_YEAR);
    multTranslation([MARS_ORBIT, 0 , 0]);

    multRotationY(time * 360 / DEIMOS_YEAR);
    multTranslation([DEIMOS_ORBIT, 0 , 0]);

    multScale([DEIMOS_DIAMETER , DEIMOS_DIAMETER , DEIMOS_DIAMETER ]);

    drawPrimitive("sphere", false, program);
}

function phobos(){

    multRotationY(time * 360 / MARS_YEAR);
    multTranslation([MARS_ORBIT, 0 , 0]);

    multRotationY(time * 360 / PHOBOS_YEAR);
    multTranslation([PHOBOS_ORBIT, 0 , 0]);

    multScale([PHOBOS_DIAMETER , PHOBOS_DIAMETER , PHOBOS_DIAMETER ]);

    drawPrimitive("sphere", false, program);
}

function marsAndMoons(){

    mars();
    popMatrix();

    pushMatrix();
    deimos();
    popMatrix();

    pushMatrix();
    phobos();
}

function jupiter(){

    multRotationY(time * 360 / JUPITER_YEAR);
    multTranslation([JUPITER_ORBIT, 0 , 0]);

    multRotationY(time * 360 / JUPITER_DAY);
    multScale([JUPITER_DIAMETER , JUPITER_DIAMETER , JUPITER_DIAMETER ]);

    drawPrimitive("sphere", false, program);
}

function saturn(){

    multRotationY(time * 360 / SATURN_YEAR);
    multTranslation([SATURN_ORBIT, 0 , 0]);

    multRotationY(time * 360 / SATURN_DAY);
    multScale([SATURN_DIAMETER , SATURN_DIAMETER , SATURN_DIAMETER]);

    drawPrimitive("sphere", false, program);
}

function saturnBelt(seed){

    var x = Math.sin(seed++) * 10000;
    var valueOrbit = x - Math.floor(x);

    var y = Math.sin(x++) * 10000;
    var valueSize = y - Math.floor(y);

    multRotationY(time * 360 / SATURN_YEAR);
    multTranslation([SATURN_ORBIT, 0 , 0]);

    multRotationY(time * 360 / (-Math.floor((valueSize + valueOrbit) / 2 * (ASTEROIDS_BIGGER_YEAR - ASTEROIDS_LESSER_YEAR + 1)) + ASTEROIDS_LESSER_YEAR));
    multTranslation([Math.floor(valueOrbit * (ASTEROIDS_OUTER_ORBIT / 9 - ASTEROIDS_CENTER_ORBIT / 9 + 1)) + ASTEROIDS_CENTER_ORBIT / 9, 0 , 0]);

    multScale([Math.floor(valueSize * (ASTEROIDS_LESSER_DIAMETER * 2 - ASTEROIDS_LESSER_DIAMETER + 1)) + ASTEROIDS_LESSER_DIAMETER
            ,  Math.floor(valueSize * (ASTEROIDS_LESSER_DIAMETER * 2 - ASTEROIDS_LESSER_DIAMETER + 1)) + ASTEROIDS_LESSER_DIAMETER , 
               Math.floor(valueSize * (ASTEROIDS_LESSER_DIAMETER * 2 - ASTEROIDS_LESSER_DIAMETER + 1)) + ASTEROIDS_LESSER_DIAMETER ]);

    drawPrimitive("sphere", false, program);
}

function asteroid(seed){

    var x = Math.sin(seed++) * 10000;
    var valueOrbit = x - Math.floor(x);

    var y = Math.sin(x++) * 10000;
    var valueSize = y - Math.floor(y);

    multRotationY(time * 360 / (-Math.floor((valueSize + valueOrbit) / 2 * (ASTEROIDS_BIGGER_YEAR - ASTEROIDS_LESSER_YEAR + 1)) + ASTEROIDS_LESSER_YEAR));
    multTranslation([Math.floor(valueOrbit * (ASTEROIDS_OUTER_ORBIT - ASTEROIDS_CENTER_ORBIT + 1)) + ASTEROIDS_CENTER_ORBIT, 0 , 0]);

    multScale([Math.floor(valueSize * (ASTEROIDS_BIGGER_DIAMETER - ASTEROIDS_LESSER_DIAMETER + 1)) + ASTEROIDS_LESSER_DIAMETER
            ,  Math.floor(valueSize * (ASTEROIDS_BIGGER_DIAMETER - ASTEROIDS_LESSER_DIAMETER + 1)) + ASTEROIDS_LESSER_DIAMETER , 
               Math.floor(valueSize * (ASTEROIDS_BIGGER_DIAMETER - ASTEROIDS_LESSER_DIAMETER + 1)) + ASTEROIDS_LESSER_DIAMETER ]);

    drawPrimitive("sphere", false, program);
}
