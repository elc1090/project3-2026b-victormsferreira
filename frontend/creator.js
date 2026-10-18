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
var uniformBindGroup;

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

    uniformBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: uniformBuffer }],
    });


}

var time = 0.0;

function render() {
    let bounding = canvas.getBoundingClientRect();
    context.canvas.width = bounding.width;
    context.canvas.height = bounding.height;
    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([bounding.width / bounding.height, time]), 0, 2);
    console.log(bounding.width / bounding.height);
    const commandEncoder = device.createCommandEncoder();
    descriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
    const passEncoder = commandEncoder.beginRenderPass(descriptor);
    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.draw(3);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
    time += 0.016;
    window.requestAnimationFrame(render)
}

init().then((() => {
    window.requestAnimationFrame(render);
}))