const pb = new PocketBase(PB_URL);

const loginBtn = document.getElementById("login-button");
const logoutBtn = document.getElementById("logout-button");
const accountName = document.getElementById("account-name");
const loggedIn = document.getElementById("logged-in-panel");

if (pb.authStore.isValid) {
    loginBtn.className = "hidden";
    loggedIn.className = "logged-in-panel";
    accountName.innerText = pb.authStore.record.name;
} else {
    window.location.replace("/login.html");
}

logoutBtn.addEventListener("click", ((e) => {
    pb.authStore.clear();
    window.location.replace("/index.html");
}))


// WGPU Variables

var adapter;
var device;
var canvas;
var context;
var renderPipeline;
var descriptor;
var uniformBuffer;
var shapesBuffer;
var matricesBuffer;
var bindGroup;
var meshID;
async function getShapes() {
    const searchParams = new URLSearchParams(window.location.search);
    meshID = searchParams.get("id");
    const rec = await pb.collection('models').getOne(meshID);
    document.getElementById("filename").value = rec.name;
    if (rec.mesh) {
        var url = pb.files.getURL(rec, rec.mesh);
        var js = await (await fetch(url)).json();
        for (var shape of js) {
            addShape(new Shape(shape.pos, shape.type, shape.size, shape.color, shape.smoothness, shape.shapeType));
        }
    }
}

async function save() {
    var js = shapesToJSON(shapes);
    await canvas.toBlob((blob) => {
        const body = {
            "name": document.getElementById("filename").value,
            "thumbnail": new File([blob], meshID+"_thumbnail.png"),
            "mesh": new File([js], meshID+"_shapes.json"),
        };
        pb.collection('models').update(meshID, body);
    }, "image/png");
}

async function init() {
  // 1: request adapter and device
  if (!navigator.gpu) {
    throw Error('WebGPU not supported.');
  }

  adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw Error('Couldn\'t request WebGPU adapter.');
  }

  device = await adapter.requestDevice();

  // 2: Create a shader module from the shaders template literal
  const shaderModule = device.createShaderModule({
    code: document.getElementById("shader").textContent
  });

  // 3: Get reference to the canvas to render on
  canvas = document.getElementById("wgpu-canvas");
  context = canvas.getContext('webgpu');
  let bounding = canvas.getBoundingClientRect();
  context.canvas.width = bounding.width;
  context.canvas.height = bounding.height;

  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied'
  });


  const pipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'vertex_main',
      buffers: []
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragment_main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'triangle-list'
    },
    layout: 'auto'
  };

  // 6: Create the actual render pipeline
  renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    
  // 7: Create GPUCommandEncoder to issue commands to the GPU
  // Note: render pass descriptor, command encoder, etc. are destroyed after use, fresh one needed for each frame.

  // 8: Create GPURenderPassDescriptor to tell WebGPU which texture to draw into, then initiate render pass

  descriptor = {
    colorAttachments: [{
      clearValue: {r:0, g:0, b:0, a:1.0},
      loadOp: 'clear',
      storeOp: 'store',
      view: context.getCurrentTexture().createView()
    }]
  };


    const uniformBufferSize = 8;
    uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const shapesBufferSize = 4 * 12 * 128;
    shapesBuffer = device.createBuffer({
        size: shapesBufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    const matricesBufferSize = 4 * 16 * 2;
    matricesBuffer = device.createBuffer({
        size: matricesBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });


    bindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
        { 
            binding: 0, 
            resource: uniformBuffer
         },
        { 
            binding: 1, 
            resource: shapesBuffer
         },
        { 
            binding: 2, 
            resource: matricesBuffer
         },
        
        ],
    });

    await getShapes();
}

function shapesToJSON(shapeList) {
    return JSON.stringify(shapeList);
}

function Color(r, g, b) {
    return {r: r, g: g, b: b};
}
function Vec3(x, y, z) {
    return {x:x, y:y, z:z};
}
function Vec4(x, y, z, w) {
    return {x:x, y:y, z:z, w:w};
}

const boxInspector = document.getElementById("box-inspector");
const sphereInspector = document.getElementById("sphere-inspector");

var time = 0.0;

class Shape {
    constructor(pos, type, size, color, smoothness, typeName) {
        this.pos = pos;
        this.type = type;
        this.size = size;
        this.color = color;
        this.smoothness = smoothness;
        this.shapeType = typeName;
    }    
    encode() {
        return [
            this.pos.x, this.pos.y, this.pos.z, this.type,
            this.size.x, this.size.y, this.size.z, this.size.w,
            this.color.r, this.color.g, this.color.b, this.smoothness
        ];
    }
}

class Sphere extends Shape {
    constructor(pos, radius, color, smoothness) {
        super(pos, 0, {x:radius, y:0, z:0, w:0}, color, smoothness, "Esfera");
    }
}

class Box extends Shape {
    constructor(pos, size, color, smoothness) {
        super(pos, 1, {x:size.x, y:size.y, z:size.z, w:0}, color, smoothness, "Caixa");
    }
}

class Camera {
    constructor() {
        this.pos = glMatrix.vec3.fromValues(0, 4, 8);
        this.target = glMatrix.vec3.fromValues(0, 0, 0);
        this.up = glMatrix.vec3.fromValues(0, 1, 0);
        this.right = glMatrix.vec3.fromValues(1, 0, 0);
        this.front = glMatrix.vec3.fromValues(0, 0, -1);
        this.calcDirs();
    }
    moveUp(amt) {
        var up = glMatrix.vec3.clone(this.up);
        glMatrix.vec3.scale(up, up, amt);
        glMatrix.vec3.add(this.pos, this.pos, up);
        glMatrix.vec3.add(this.target, this.target, up);
    }
    moveRight(amt) {
        var up = glMatrix.vec3.clone(this.right);
        glMatrix.vec3.scale(up, up, amt);
        glMatrix.vec3.add(this.pos, this.pos, up);
        glMatrix.vec3.add(this.target, this.target, up);
    }
    moveForwards(amt) {
        var up = glMatrix.vec3.clone(this.front);
        glMatrix.vec3.scale(up, up, amt);
        glMatrix.vec3.add(this.pos, this.pos, up);
        glMatrix.vec3.add(this.target, this.target, up);
    }
    calcDirs() {
        glMatrix.vec3.sub(this.front, this.target, this.pos);
        glMatrix.vec3.normalize(this.front, this.front);
        glMatrix.vec3.cross(this.right, this.up, this.front);
    }
    move(vec) {
        this.moveForwards(vec.z);
        this.moveRight(vec.x);
        this.moveUp(vec.y);
    }
    rotate(vec) {
        glMatrix.vec3.rotateX(this.pos, this.pos, this.target, vec.x);
        glMatrix.vec3.rotateY(this.pos, this.pos, this.target, vec.y);
        this.calcDirs();
    }

    encode(aspectRatio) {
        var view = glMatrix.mat4.create();
        var projection = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projection, 3.14159265/3.0, aspectRatio, 0.01, 100.0);
        glMatrix.mat4.lookAt(view, this.pos, this.target, this.up);
        glMatrix.mat4.invert(view, view);
        glMatrix.mat4.invert(projection, projection);
        var values = new Array();
        values.push(...view);
        values.push(...projection);
        return new Float32Array(values);
    }


}

var shapes = new Array();
var cam = new Camera();
var movingCam = false;


function encodeShapes(shapeList) {
    var encoded = new Array();
    for (var shape of shapeList) {
        encoded.push(...shape.encode());
    }
    return new Float32Array(encoded);
}

function render() {
    let bounding = canvas.getBoundingClientRect();
    context.canvas.width = bounding.width;
    context.canvas.height = bounding.height;
    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([bounding.width / bounding.height]), 0, 1);
    device.queue.writeBuffer(uniformBuffer, 4, new Int32Array([shapes.length]), 0, 1);
    device.queue.writeBuffer(shapesBuffer, 0, encodeShapes(shapes), 0, shapes.length * 12);
    var matrices = cam.encode(bounding.width / bounding.height);
    device.queue.writeBuffer(matricesBuffer, 0, matrices, 0, matrices.length);
    const commandEncoder = device.createCommandEncoder();
    descriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
    const passEncoder = commandEncoder.beginRenderPass(descriptor);
    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.draw(3);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
    time += 0.016;
    window.requestAnimationFrame(render)
}

init().then((() => {
    canvas.addEventListener("mousedown", ((e) => { 
        movingCam = true;
     }));
    canvas.addEventListener("mouseup", ((e) => { 
        movingCam = false;
     }));
    document.addEventListener("keydown", ((e) => {
        if (e.code == "Escape") {
            e.preventDefault();
            selectShape(-1);
        }
     }), false);


    canvas.addEventListener("mousemove", ((e) => {
        e.preventDefault();
        if (!movingCam) return;
        if (selectedShape != -1) {
            var p = glMatrix.vec3.fromValues(shapes[selectedShape].pos.x, shapes[selectedShape].pos.y, shapes[selectedShape].pos.z);
            var dist = 1.0 / 100.0;
            cam.calcDirs();
            if (e.ctrlKey) {
                var a = glMatrix.vec3.clone(cam.right);
                var b = glMatrix.vec3.clone(cam.front);
                glMatrix.vec3.scale(a, a, -e.movementX * dist);
                glMatrix.vec3.scale(b, b, -e.movementY * dist);
                shapes[selectedShape].pos.x += a[0] + b[0];
                shapes[selectedShape].pos.y += a[1] + b[1];
                shapes[selectedShape].pos.z += a[2] + b[2];
            } else {
                var a = glMatrix.vec3.clone(cam.right);
                var b = glMatrix.vec3.clone(cam.up);
                glMatrix.vec3.scale(a, a, -e.movementX * dist);
                glMatrix.vec3.scale(b, b, -e.movementY * dist);
                console.log(shapes[selectedShape].pos);
                console.log(a[0]+b[0]);
                shapes[selectedShape].pos.x += a[0] + b[0];
                shapes[selectedShape].pos.y += a[1] + b[1];
                shapes[selectedShape].pos.z += a[2] + b[2];
                console.log(shapes[selectedShape].pos);
            }
            updateInspector();
        } else {
            if (e.shiftKey) {
                cam.rotate(Vec3(-e.movementY / 60.0, -e.movementX / 60.0, 0.0));
            } else if (e.ctrlKey) {
                cam.move(Vec3(-e.movementX / 60.0, 0.0, -e.movementY / 60.0));
            } else {
                cam.move(Vec3(-e.movementX / 60.0, -e.movementY / 60.0, 0.0));
            }
        }
    }));
    window.requestAnimationFrame(render);
}));

var selectedShape = -1;

function colorToHex(col) {
  let r = Math.round(255 * col.r).toString(16);
  let g = Math.round(255 * col.g).toString(16);
  let b = Math.round(255 * col.b).toString(16);
  if (r.length < 2) { r = "0"+r; }
  if (g.length < 2) { g = "0"+g; }
  if (b.length < 2) { b = "0"+b; }
  return "#"+r+g+b;
}

function parseColor(hex) {
  let color = {r: 0, g:0, b: 0};
  color.r = parseInt(hex.slice(1, 3), 16);
  color.g = parseInt(hex.slice(3, 5), 16);
  color.b = parseInt(hex.slice(5, 7), 16);
  return color;
}


const sphereValueEditors = {
    pos: {
        x: document.getElementById("sphere-pos-x"),
        y: document.getElementById("sphere-pos-y"),
        z: document.getElementById("sphere-pos-z"),
    },
    radius: document.getElementById("sphere-radius"),
    color: document.getElementById("sphere-color"),
    blend: document.getElementById("sphere-blend"),
}

const boxValueEditors = {
    pos: {
        x: document.getElementById("box-pos-x"),
        y: document.getElementById("box-pos-y"),
        z: document.getElementById("box-pos-z"),
    },
    size: {
        x: document.getElementById("box-size-x"),
        y: document.getElementById("box-size-y"),
        z: document.getElementById("box-size-z"),
    },
    round: document.getElementById("box-round"),
    color: document.getElementById("box-color"),
    blend: document.getElementById("box-blend"),
}

function updateInspector() {
    var shape = shapes[selectedShape];
    switch (shape.type) {
        case 0:
            sphereValueEditors.pos.x.value = shape.pos.x;
            sphereValueEditors.pos.y.value = shape.pos.y;
            sphereValueEditors.pos.z.value = shape.pos.z;
            sphereValueEditors.radius.value = shape.size.x;
            sphereValueEditors.color.value = colorToHex(shape.color);
            sphereValueEditors.blend.value = shape.smoothness;
            break;
        case 1:
            boxValueEditors.pos.x.value = shape.pos.x;
            boxValueEditors.pos.y.value = shape.pos.y;
            boxValueEditors.pos.z.value = shape.pos.z;
            boxValueEditors.size.x.value = shape.size.x;
            boxValueEditors.size.y.value = shape.size.y;
            boxValueEditors.size.z.value = shape.size.z;
            boxValueEditors.round.value = shape.size.w;
            boxValueEditors.color.value = colorToHex(shape.color);
            boxValueEditors.blend.value = shape.smoothness;
            break;
    }
}

function selectShape(index) {
    selectedShape = index;
    if (index == -1) {
        boxInspector.className = "hidden";
        sphereInspector.className = "hidden";
        return;
    }
    switch (shapes[index].type) {
        case 0:
            boxInspector.className = "hidden";
            sphereInspector.className = "inspector";
            break;
        case 1:
            boxInspector.className = "inspector";
            sphereInspector.className = "hidden";
            break;
    }
    updateInspector();
}

function addShape(shape) {
    shapes.push(shape);
    const shapeList = document.getElementById("shape-list");
    while (shapeList.firstChild) {
        shapeList.removeChild(shapeList.firstChild);
    }
    var i = 0;
    for (var s of shapes) {
        var p = document.createElement("p");
        p.innerText = s.shapeType;
        p.shapeIndex = i++;
        p.addEventListener("click", function (e) {
            selectShape(this.shapeIndex);
        });
        shapeList.appendChild(p);
    }
    selectShape(shapes.length-1);
}
function removeShape(index) {
    shapes.splice(index, 1);
    const shapeList = document.getElementById("shape-list");
    while (shapeList.firstChild) {
        shapeList.removeChild(shapeList.firstChild);
    }
    var i = 0;
    for (var s of shapes) {
        var p = document.createElement("p");
        p.innerText = s.shapeType;
        p.shapeIndex = i++;
        p.addEventListener("click", function (e) {
            selectShape(this.shapeIndex);
        });
        shapeList.appendChild(p);
    }
}
document.getElementById("add-shape-button").addEventListener("click", ((e) => {
    document.getElementById("add-shape-dropdown").classList.toggle("dropdown-show");
}));

document.getElementById("add-sphere").addEventListener("click", ((e) => {
    const shapeDropdown = document.getElementById("add-shape-dropdown").classList.toggle("dropdown-show");
    addShape(new Sphere(Vec3(Math.random(),Math.random(),Math.random()), 1.0, Color(1.0, 1.0, 1.0), 0.01));
}));

document.getElementById("add-box").addEventListener("click", ((e) => {
    const shapeDropdown = document.getElementById("add-shape-dropdown").classList.toggle("dropdown-show");
    addShape(new Box(Vec3(0,0,0), Vec3(1.0, 1.0, 1.0), Color(1.0, 1.0, 1.0), 0.01));
}));


sphereValueEditors.pos.x.addEventListener("input", function (e) {
    shapes[selectedShape].pos.x = this.valueAsNumber ;
});

sphereValueEditors.pos.y.addEventListener("input", function (e) {
    shapes[selectedShape].pos.y = this.valueAsNumber ;
});

sphereValueEditors.pos.z.addEventListener("input", function (e) {
    shapes[selectedShape].pos.z = this.valueAsNumber ;
});
sphereValueEditors.radius.addEventListener("input", function (e) {
    shapes[selectedShape].size.x = this.valueAsNumber ;
});
sphereValueEditors.color.addEventListener("input", function (e) {
    var col = parseColor(this.value);
    shapes[selectedShape].color = Color(col.r / 255.0, col.g / 255.0, col.b / 255.0);
});
sphereValueEditors.blend.addEventListener("input", function (e) {
    shapes[selectedShape].smoothness = this.valueAsNumber ;
});



boxValueEditors.pos.x.addEventListener("input", function (e) {
    shapes[selectedShape].pos.x = this.valueAsNumber ;
});

boxValueEditors.pos.y.addEventListener("input", function (e) {
    shapes[selectedShape].pos.y = this.valueAsNumber ;
});
boxValueEditors.pos.z.addEventListener("input", function (e) {
    shapes[selectedShape].pos.z = this.valueAsNumber ;
});
boxValueEditors.size.x.addEventListener("input", function (e) {
    shapes[selectedShape].size.x = this.valueAsNumber ;
});
boxValueEditors.size.y.addEventListener("input", function (e) {
    shapes[selectedShape].size.y = this.valueAsNumber ;
});
boxValueEditors.size.z.addEventListener("input", function (e) {
    shapes[selectedShape].size.z = this.valueAsNumber ;
});
boxValueEditors.round.addEventListener("input", function (e) {
    shapes[selectedShape].size.w = this.valueAsNumber ;
});
boxValueEditors.color.addEventListener("input", function (e) {
    var col = parseColor(this.value);
    shapes[selectedShape].color = Color(col.r / 255.0, col.g / 255.0, col.b / 255.0);
});
boxValueEditors.blend.addEventListener("input", function (e) {
    shapes[selectedShape].smoothness = this.valueAsNumber ;
});

document.getElementById("remove-shape-button").addEventListener("click", ((e) => {
    if (selectedShape < 0) return;
    removeShape(selectedShape);
    selectShape(-1);
}));

document.getElementById("save-button").addEventListener("click", save);