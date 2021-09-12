var texturesize = 1024;
var particles = texturesize * texturesize;

var container = void 0;
var camera = void 0,scene = void 0,renderer = void 0,controls = void 0;
var cloud_obj = void 0;
var uniforms = void 0;
var gpuComputationRenderer = void 0,dataPos = void 0,dataVel = void 0,textureArraySize = texturesize * texturesize * 4.;

var textureVelocity = void 0,texturePosition = void 0;

var particleVert = document.getElementById('vertexShaderParticle').textContent;
var particleFrag = document.getElementById('fragmentShaderParticle').textContent;
var velocityFrag = document.getElementById('fragmentShaderVelocity').textContent;
var positionFrag = document.getElementById('fragmentShaderPosition').textContent;

var loader = new THREE.TextureLoader();
var texture = void 0;
loader.setCrossOrigin("anonymous");
loader.load(
'https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/noise.png',
function do_something_with_texture(tex) {
  texture = tex;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  init();
  animate();
});



function init() {
  container = document.getElementById('container');

  camera = new THREE.PerspectiveCamera(65, 1, 0.001, Math.pow(2, 16));
  // camera.position.x = -25;
  // camera.position.y = 75;
  camera.position.z = 100.;
  camera.position.setLength(40);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // create out particles
  // ----------------------------
  var vertices = new Float32Array(particles * 3).fill(0);
  var references = new Float32Array(particles * 2);

  for (var i = 0; i < references.length; i += 2) {
    var index = i / 2;

    references[i] = index % texturesize / texturesize;
    references[i + 1] = Math.floor(index / texturesize) / texturesize;
  }

  var geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.addAttribute('reference', new THREE.BufferAttribute(references, 2));

  // Create our particle material
  // ----------------------------
  uniforms = {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    u_noise: { type: "t", value: texture },
    u_mouse: { type: "v2", value: new THREE.Vector2() },
    u_texturePosition: { value: null },
    u_clicked: { type: 'b', value: false } };

  var particleMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: particleVert,
    fragmentShader: particleFrag,
    side: THREE.DoubleSide,
    transparent: true });

  particleMaterial.transparent = true;
  particleMaterial.blending = THREE.MultiplyBlending;
  particleMaterial.depthTest = false;
  particleMaterial.extensions.derivatives = true;

  // Create the particle cloud object
  // ----------------------------
  cloud_obj = new THREE.Points(geometry, particleMaterial);
  scene.background = new THREE.Color(0x111111);
  cloud_obj.material.blending = THREE.AdditiveBlending;
  //   scene.background = new THREE.Color( 0xFFFFFF );
  // cloud_obj.material.blending = THREE.MultiplyBlending;
  // cloud_obj.material.blending = THREE.SubtractiveBlending;

  // Create the renderer and controls and add them to the scene
  // ----------------------------
  renderer = new THREE.WebGLRenderer();
  // renderer.setPixelRatio( 2 );

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  window.controls = controls;

  container.appendChild(renderer.domElement);

  // Finally, add everything to stage
  // ----------------------------
  scene.add(cloud_obj);

  // Add the computational renderer and populate it with data
  // ----------------------------
  gpuComputationRenderer = new GPUComputationRenderer(texturesize, texturesize, renderer);
  dataPos_orig = gpuComputationRenderer.createTexture();
  dataPos = gpuComputationRenderer.createTexture();
  dataVel = gpuComputationRenderer.createTexture();

  for (var _i = 0; _i < textureArraySize; _i += 4) {
    var radius = 1.;
    var phi = Math.random() * Math.PI * 2.;
    var costheta = Math.random() * 2. - 1.;
    var u = Math.random();

    var theta = Math.acos(costheta);
    var r = radius * Math.cbrt(u);

    var x = r * Math.sin(theta) * Math.cos(phi);
    var y = r * Math.sin(theta) * Math.sin(phi);
    var z = r * Math.cos(theta);

    dataPos.image.data[_i] = x;
    dataPos.image.data[_i + 1] = y;
    dataPos.image.data[_i + 2] = z;
    dataPos.image.data[_i + 3] = 1;

    dataPos_orig.image.data[_i] = x;
    dataPos_orig.image.data[_i + 1] = y;
    dataPos_orig.image.data[_i + 2] = z;
    dataPos_orig.image.data[_i + 3] = 1;

    dataVel.image.data[_i] = x * 3.;
    dataVel.image.data[_i + 1] = y * 3.;
    dataVel.image.data[_i + 2] = z * 3.;
    dataVel.image.data[_i + 3] = 1;
  }

  textureVelocity = gpuComputationRenderer.addVariable('v_samplerVelocity', velocityFrag, dataVel);
  texturePosition = gpuComputationRenderer.addVariable('v_samplerPosition', positionFrag, dataPos);

  texturePosition.material.uniforms.delta = { value: 0 };
  texturePosition.material.uniforms.v_samplerPosition_orig = { type: "t", value: dataPos_orig };
  textureVelocity.material.uniforms.u_time = { value: -1000 };
  textureVelocity.material.uniforms.u_mousex = { value: 0 };
  texturePosition.material.uniforms.u_time = { value: 0 };

  gpuComputationRenderer.
  setVariableDependencies(textureVelocity, [textureVelocity, texturePosition]);
  gpuComputationRenderer.
  setVariableDependencies(texturePosition, [textureVelocity, texturePosition]);

  texturePosition.wrapS = THREE.RepeatWrapping;
  texturePosition.wrapT = THREE.RepeatWrapping;
  textureVelocity.wrapS = THREE.RepeatWrapping;
  textureVelocity.wrapT = THREE.RepeatWrapping;

  var gpuComputationRendererError = gpuComputationRenderer.init();
  if (gpuComputationRendererError) {
    console.error('ERROR', gpuComputationRendererError);
  }

  // Add event listeners for resize and mouse move
  // ----------------------------
  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('pointermove', pointerMove);
  // document.addEventListener('click', onClick);

  // initialise the video renderer
}

function onWindowResize(event) {
  var w = window.innerWidth;
  var h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}

function pointerMove(event) {
  var ratio = window.innerHeight / window.innerWidth;
  textureVelocity.material.uniforms.u_mousex.value = event.pageX;
  uniforms.u_mouse.value.x = (event.pageX - window.innerWidth / 2) / window.innerWidth / ratio;
  uniforms.u_mouse.value.y = (event.pageY - window.innerHeight / 2) / window.innerHeight * -1;

  event.preventDefault();
}

function onClick() {
  // return;
  var newval = !uniforms.u_clicked.value;
  uniforms.u_clicked.value = newval;
  console.log(cloud_obj.material.blending);
  if (newval === false) {
    scene.background = new THREE.Color(0xffffff);
    cloud_obj.material.blending = THREE.MultiplyBlending;
  } else {
    scene.background = new THREE.Color(0x000000);
    cloud_obj.material.blending = THREE.AdditiveBlending;
  }
}

function animate(delta) {
  requestAnimationFrame(animate);
  render(delta);
}



var capturer = new CCapture({
  verbose: true,
  framerate: 30,
  // motionBlurFrames: 4,
  quality: 90,
  format: 'webm',
  workersPath: 'js/' });

var capturing = false;

isCapturing = function isCapturing(val) {
  if (val === false && window.capturing === true) {
    capturer.stop();
    capturer.save();
    renderer.setPixelRatio(window.devicePixelRatio);
  } else if (val === true && window.capturing === false) {
    capturer.start();
    controls.enabled = false;
    renderer.setPixelRatio(1);
  }
  capturing = val;
};
toggleCapture = function toggleCapture() {
  isCapturing(!capturing);
};
window.toggleCapture = toggleCapture;
// setTimeout(()=> { 
// toggleCapture()}, 0)


window.addEventListener('keyup', function (e) {if (e.keyCode == 68) toggleCapture();});

var then = 0;
function render(delta) {

  var now = Date.now() / 1000;
  var _delta = now - then;
  then = now;

  gpuComputationRenderer.compute();

  texturePosition.material.uniforms.delta.value = Math.min(_delta, 0.5);
  textureVelocity.material.uniforms.u_time.value += .0005;
  texturePosition.material.uniforms.u_time.value += _delta;

  uniforms.u_time.value = -10000 + delta;
  uniforms.u_texturePosition.value = gpuComputationRenderer.getCurrentRenderTarget(texturePosition).texture;

  window.pos = gpuComputationRenderer.getCurrentRenderTarget(texturePosition);

  renderer.render(scene, camera);

  if (capturing) {
    capturer.capture(renderer.domElement);
  }
}