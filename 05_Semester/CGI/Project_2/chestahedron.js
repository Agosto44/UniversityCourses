var chestahedron_points = [];
var chestahedron_normals = [];
var chestahedron_faces = [];
var chestahedron_edges = [];

var chestahedron_points_buffer;
var chestahedron_normals_buffer;
var chestahedron_faces_buffer;
var chestahedron_edges_buffer;

function chestahedronInit(gl) {
    chestahedronBuild();
    chestahedronUploadData(gl);
}

function chestahedronBuild()
{    
    chestahedron_points.push(vec3(0,1,0));
    pushcirc();


}

function chestahedronUploadData(gl)
{
    chestahedron_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, chestahedron_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(chestahedron_points), gl.STATIC_DRAW);
    
    chestahedron_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, chestahedron_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(chestahedron_normals), gl.STATIC_DRAW);
    
    chestahedron_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, chestahedron_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(chestahedron_faces), gl.STATIC_DRAW);
    
    chestahedron_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, chestahedron_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(chestahedron_edges), gl.STATIC_DRAW);
}

function chestahedronDrawWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, chestahedron_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, chestahedron_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, chestahedron_edges_buffer);
    gl.drawElements(gl.LINES, chestahedron_edges.length, gl.UNSIGNED_BYTE, 0);
}

function pushcirc(){
    var offset = chestahedron_points.length;
    var d_phi = Math.PI;
    var d_theta = 2*Math.PI / 6 ;
    var r = 0.5;
    for(var j=0, theta=0; j<3; j++, theta+= 2 * d_theta) {
        var pt = vec3(r*0.8*Math.cos(d_phi)*Math.cos(theta),r*0.8*Math.cos(d_phi)*Math.sin(4 * d_theta),r*0.8*Math.cos(d_phi)*Math.sin(theta));
        chestahedron_points.push(pt);
    }
    for(var j=0, theta=d_theta; j<3; j++, theta+= 2 * d_theta) {
        pt = vec3(r*Math.cos(d_phi)*Math.cos(theta),-0.5,r*Math.cos(d_phi)*Math.sin(theta));
        chestahedron_points.push(pt);
    }
//connect north
    chestahedron_edges.push(0);
    chestahedron_edges.push(offset);
    chestahedron_edges.push(0);    
    chestahedron_edges.push(offset+1);
    chestahedron_edges.push(0);    
    chestahedron_edges.push(offset+2);




        // Add first edge (a,b)
    chestahedron_edges.push(offset+3);
    chestahedron_edges.push(offset+4);
    
    // Add second edge (b,c)
    chestahedron_edges.push(offset+4);
    chestahedron_edges.push(offset+5);

        // Add second edge (b,c)
    chestahedron_edges.push(offset+5);
    chestahedron_edges.push(offset+3);

        //connect
    chestahedron_edges.push(offset);
    chestahedron_edges.push(offset+3);
    chestahedron_edges.push(offset+3);
    chestahedron_edges.push(offset+1);   
    chestahedron_edges.push(offset+1);
    chestahedron_edges.push(offset+4);
    chestahedron_edges.push(offset+4);
    chestahedron_edges.push(offset+2); 
    chestahedron_edges.push(offset+2);
    chestahedron_edges.push(offset+5);
    chestahedron_edges.push(offset+5);
    chestahedron_edges.push(offset); 

}