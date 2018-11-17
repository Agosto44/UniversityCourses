var cylinder_points = [];
var cylinder_normals = [];
var cylinder_faces = [];
var cylinder_edges = [];

var cylinder_points_buffer;
var cylinder_normals_buffer;
var cylinder_faces_buffer;
var cylinder_edges_buffer;

var CYLINDER_LONS=30;

function cylinderInit(gl) {
    cylinderBuild(CYLINDER_LONS);
    cylinderUploadData(gl);
}

// Generate points using polar coordinates
function cylinderBuild(nlon) 
{
    // phi will be latitude
    // theta will be longitude
 
    var d_phi = Math.PI;
    var d_theta = 2*Math.PI / nlon;
    var r = 0.5;
    
    // Generate north polar cap
    var north = vec3(0,1,0);
    cylinder_points.push(north);
    cylinder_normals.push(vec3(0,1,0));

    for(var j=0, theta=0; j<nlon; j++, theta+=d_theta) {
        var pt = vec3(r*Math.cos(d_phi)*Math.cos(theta),1,r*Math.cos(d_phi)*Math.sin(theta));
        cylinder_points.push(pt);
        var n = vec3(pt);
        cylinder_normals.push(normalize(n));
    }

    for(var j=0, theta=0; j<nlon; j++, theta+=d_theta) {
        var pt = vec3(r*Math.cos(d_phi)*Math.cos(theta),-1,r*Math.cos(d_phi)*Math.sin(theta));
        cylinder_points.push(pt);
        var n = vec3(pt);
        cylinder_normals.push(normalize(n));
    }

    var south = vec3(0,-1,0);
    cylinder_points.push(south);
    cylinder_normals.push(vec3(0,-1,0));
    
    // Generate norh south cap
    var south = vec3(0,-r,0);
    cylinder_points.push(south);
    cylinder_normals.push(vec3(0,-1,0));


    
    // Generate the faces
    
    // north pole faces
    for(var i=0; i<nlon-1; i++) {
        cylinder_faces.push(0);
        cylinder_faces.push(i+1);
        cylinder_faces.push(i+2);
    }
    cylinder_faces.push(0);
    cylinder_faces.push(nlon);
    cylinder_faces.push(1);
    
    //build lateral edges
    for(var i=1; i<nlon + 1; i++) {
        cylinder_faces.push(i);
        cylinder_faces.push(i + nlon);

        if(i!=nlon) 
        cylinder_faces.push(i + 1 + nlon);
        else cylinder_faces.push(i + 1);

        cylinder_faces.push(i );
        cylinder_faces.push(i + 1);

        if(i!=nlon){
        	cylinder_faces.push(i + 1 + nlon);
        }
        else{
        	cylinder_faces.push(i + 1);
        } 
    }






    // Build South faces
    for(var i=nlon; i< nlon * 2; i++) {
        cylinder_faces.push(nlon * 2 + 1);   // South pole 
        cylinder_faces.push(i+1);
        cylinder_faces.push(i+2);
    }
    cylinder_faces.push(nlon * 2 + 1);
    cylinder_faces.push(nlon * 2);
    cylinder_faces.push(nlon + 1);


 
   // Build North edges
    for(var i=0; i<nlon; i++) {
        cylinder_edges.push(0);   // North pole 
        cylinder_edges.push(i+1);
    }

    //build top wheel
    for(var j=1; j< nlon + 1;j++) {
        cylinder_edges.push(j);   // horizontal line (same latitude)

        if(j!=nlon) 
        cylinder_edges.push(j+1);
        else cylinder_edges.push(j+1-nlon);

    }

    //build bottom wheel
    for(var j=nlon + 1; j<=nlon * 2;j++) {
        cylinder_edges.push(j);   // horizontal line (same latitude)

        if(j!=nlon * 2) 
        cylinder_edges.push(j+1);
        else cylinder_edges.push(j+1-nlon);
    }

    // Build South edges
    for(var i=nlon; i<=nlon * 2; i++) {
        cylinder_edges.push(nlon * 2 + 1);   // South pole 
        cylinder_edges.push(i+1);
    }

    //build lateral edges
    for(var i=1; i<nlon + 1; i++) {
        cylinder_edges.push(i);
        cylinder_edges.push(i + nlon);
        cylinder_edges.push(i);

        if(i!=nlon) 
        cylinder_edges.push(i + 1 + nlon);
        else cylinder_edges.push(i + 1	 );
    }
    
}

function cylinderUploadData(gl)
{
    cylinder_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cylinder_points), gl.STATIC_DRAW);
    
    cylinder_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cylinder_normals), gl.STATIC_DRAW);
    
    cylinder_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinder_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cylinder_faces), gl.STATIC_DRAW);
    
    cylinder_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinder_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cylinder_edges), gl.STATIC_DRAW);
}

function cylinderDrawWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinder_edges_buffer);
    gl.drawElements(gl.LINES, cylinder_edges.length, gl.UNSIGNED_SHORT, 0);
}

function cylinderDrawFilled(gl, program)
{
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinder_faces_buffer);
    gl.drawElements(gl.TRIANGLES, cylinder_faces.length, gl.UNSIGNED_SHORT, 0);
}
