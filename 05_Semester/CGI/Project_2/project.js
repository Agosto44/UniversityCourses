var gl;
var d = 3, l = 0.5, alpha = 1.10653874576, zoom = 0.6, gamma = 36.0, theta = 36.0;

var mViewLoc;
var mModelViewLoc;
var mModelType;
var mModelView = mat4();
var mProjectionLoc;

var mProjection = scalem([zoom, zoom, 1]); //scalem;
var mprojectionType = 0; 

var mFrontView = mat4();
var mSideView = rotateY(90);
var mTopView = rotateX(90);

var singleView = false;

var obliqueDiv;
var perspectiveDiv;
var axonometricDiv;

var currentProjection;

var canvasWidth;
var canvasHeight;

var ratio = 1;

var filled = false;

function openDiv(s){

    switch(s){
        case "oblique":
            obliqueDiv.style.display = "block";
            perspectiveDiv.style.display = "none";
            axonometricDiv.style.display = "none";
            break;
        case "perspective":
            obliqueDiv.style.display = "none";
            perspectiveDiv.style.display = "block";
            axonometricDiv.style.display = "none";
            break;
        case "axonometric":
            obliqueDiv.style.display = "none";
            perspectiveDiv.style.display = "none";
            axonometricDiv.style.display = "block";
            break;
        case "free":
            obliqueDiv.style.display = "none";
            perspectiveDiv.style.display = "none";
            axonometricDiv.style.display = "none";
            break;
        default:
            break;
    }
    currentProjection = s;
}

function buildMProjection(){
    mProjection = scalem([zoom, zoom * ratio, 1]);
}

function setAxonometric(){
    mModelView = mult(rotateX(gamma), rotateY(theta));
}

function setOblique(){
    mModelView = mat4();
    mModelView[0][2] = -l * Math.cos(alpha);
    mModelView[1][2] = -l * Math.sin(alpha);
}

function setPerspective(){
    mModelView = mat4();
    mModelView[3][2] = -1/d;
}

function setFree(){
    mModelView = mat4();
}

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    canvas.height = window.innerHeight - 30;
    canvas.width = window.innerWidth - 30;

    canvasHeight = canvas.height;
    canvasWidth = canvas.width;

    // adjust projection to height and width
    ratio = canvas.width/canvas.height;
    buildMProjection();

    document.getElementById("slide_zoom").oninput = function(event) {
        zoom = event.srcElement.value;
        buildMProjection();
    };

    document.getElementById("slide_l").oninput = function(event) {
        l = event.srcElement.value;
        setOblique();
    };

    document.getElementById("slide_alpha").oninput = function(event) {
        alpha = event.srcElement.value;
        setOblique();
    };

    document.getElementById("slide_d").oninput = function(event) {
        d = event.srcElement.value;
        setPerspective();
    };

    document.getElementById("slide_gamma").oninput = function(event) {
        gamma = event.srcElement.value;
        setAxonometric();
    };

    document.getElementById("slide_theta").oninput = function(event) {
        theta = event.srcElement.value;
        setAxonometric();
    };


    window.addEventListener("keydown", function(event){

        switch(event.keyCode){
            case 107: //UP
                zoom *= 1.1;
                break;
            case 109: //DOWN
                zoom *= 0.9;
                break;
            default:
                break;
        }
        buildMProjection();
    });

    var m = document.getElementById("objectMenu");
        m.addEventListener("click", function() {

        switch (m.selectedIndex) {
            case 0:
                if(!filled)
                    mModelType = cubeDrawWireFrame;
                else
                    mModelType = cubeDrawFilled;
                break;
            case 1:
                if(!filled)
                    mModelType = sphereDrawWireFrame;
                else
                    mModelType = sphereDrawFilled;
                break;
            case 2:
                if(!filled)
                    mModelType = cylinderDrawWireFrame;
                else
                    mModelType = cylinderDrawFilled;
                break;
            case 3:
                if(!filled)
                    mModelType = bunnyDrawWireFrame;
                else
                    mModelType = bunnyDrawFilled;
                break;
            case 4:
                if(!filled)
                    mModelType = teapotDrawWireFrame;
                else
                    mModelType = teapotDrawFilled;
                break;
            default:
                break;
        }

    });

    var m2 = document.getElementById("projectionMenu");
        m2.addEventListener("click", function() {

        switch (m2.selectedIndex) {
            case 0:
                openDiv("oblique");
                setOblique();
                break;
            case 1:
                openDiv("axonometric");       
                setAxonometric();
                break;
            case 2:
                openDiv("perspective");
                setPerspective();
                break;
            case 3:
                openDiv("free");
                setFree();
                break;
            default:
                break;
        }

    });

    document.getElementById("toggleFill").onclick = function(event) {

        switch(mModelType){
            case cubeDrawFilled:
                mModelType = cubeDrawWireFrame;
                break;
            case cubeDrawWireFrame:
                mModelType = cubeDrawFilled;
                break;
            case sphereDrawFilled:
                mModelType = sphereDrawWireFrame;
                break;
            case sphereDrawWireFrame:
                mModelType = sphereDrawFilled;
                break;
            case cylinderDrawFilled:
                mModelType = cylinderDrawWireFrame;
                break;
            case cylinderDrawWireFrame:
                mModelType = cylinderDrawFilled;
                break;
            case bunnyDrawWireFrame:
                mModelType = bunnyDrawFilled;
                break;
            case bunnyDrawFilled:
                mModelType = bunnyDrawWireFrame;
                break;
            case teapotDrawWireFrame:
                mModelType = teapotDrawFilled;
                break;
            case teapotDrawFilled:
                mModelType = teapotDrawWireFrame;
                break;
            default:
                break;
        }

        filled = !filled;

    };

    document.getElementById("reset").onclick = function() {

        switch(currentProjection){
        case "oblique":
            document.getElementById("slide_l").value = 0.5;
            document.getElementById("slide_alpha").value = 0;
            l = 0.5, alpha = 1.10653874576;
            setOblique();
            break;
        case "perspective":
            document.getElementById("slide_d").value = 3;
            d = 3;
            setPerspective();
            break;
        case "axonometric":
            document.getElementById("slide_gamma").value = 36.0;
            document.getElementById("slide_theta").value = 36.0;
            gamma = 36.0, theta = 36.0;
            setAxonometric();
            break;
        default:
            break;
        }
        document.getElementById("slide_zoom").value = 0.6;
        zoom = 0.6;
        buildMProjection();
    };

    document.getElementById("toggleSingleView").onclick = function(event) {
        singleView = !singleView;
    };

    window.onresize = function() {

        canvas.height = window.innerHeight - 30; 
        canvas.width = window.innerWidth - 30;

        canvasWidth = canvas.width;
        canvasHeight = canvas.height;

        ratio = canvas.width/canvas.height;
        buildMProjection();

    };

    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
        
    // Configure WebGL
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    obliqueDiv = document.getElementById("obliqueDiv");
    perspectiveDiv = document.getElementById("perspectiveDiv");
    axonometricDiv = document.getElementById("axonometricDiv");
    openDiv("free");

    cubeInit(gl);
    sphereInit(gl);
    cylinderInit(gl); 
    bunnyInit(gl);
    teapotInit(gl);

    gl.enable(gl.DEPTH_TEST);

    render();
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(mModelType !== undefined){

        if(singleView){

            gl.viewport(0, 0, canvasWidth, canvasHeight);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mModelView));
            mModelType(gl, program);

        }else{

            gl.viewport(0, canvasHeight/2, canvasWidth/2, canvasHeight/2);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mFrontView));
            mModelType(gl, program);

            gl.viewport(canvasWidth/2, canvasHeight/2, canvasWidth/2, canvasHeight/2);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mSideView));
            mModelType(gl, program);

            gl.viewport(0, 0, canvasWidth/2, canvasHeight/2);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mTopView));
            mModelType(gl, program);

            gl.viewport(canvasWidth/2, 0, canvasWidth/2, canvasHeight/2);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mModelView));
            mModelType(gl, program);           
        }

    }
    
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));
    
    requestAnimFrame(render); 
}
