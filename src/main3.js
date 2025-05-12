import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";

let camera, scene, renderer;
let reticle, controller;
let hitTestSource = null,
  localSpace = null,
  hitInitialized = false;

const state = {
  color: "#ffcc00",
  rotationEnabled: true,
  size: 0.1,
  pulseEnabled: false,
  materialType: "standard",
};

const placed = [];

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  hemi.position.set(0.5, 1, 0.25);
  scene.add(hemi);

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  const geo = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  reticle = new THREE.Mesh(geo, mat);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const colorPicker = document.getElementById("colorPicker");
  const toggleRotation = document.getElementById("toggleRotationBtn");
  const sizeRange = document.getElementById("sizeRange");
  const togglePulse = document.getElementById("togglePulseBtn");
  const materialSelect = document.getElementById("materialSelect");

  colorPicker.oninput = (e) => (state.color = e.target.value);

  toggleRotation.onclick = () => {
    state.rotationEnabled = !state.rotationEnabled;
    toggleRotation.textContent = state.rotationEnabled
      ? "Disable Rotation"
      : "Enable Rotation";
  };

  sizeRange.oninput = (e) => (state.size = parseFloat(e.target.value));

  togglePulse.onclick = () => {
    state.pulseEnabled = !state.pulseEnabled;
    togglePulse.textContent = state.pulseEnabled
      ? "Disable Pulse"
      : "Enable Pulse";
  };

  materialSelect.onchange = (e) => (state.materialType = e.target.value);

  const arBtn = ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
  });
  document.body.appendChild(arBtn);

  window.addEventListener("resize", onWindowResize);
}

async function initializeHitTest() {
  const session = renderer.xr.getSession();
  const viewer = await session.requestReferenceSpace("viewer");
  hitTestSource = await session.requestHitTestSource({ space: viewer });
  localSpace = await session.requestReferenceSpace("local");
  hitInitialized = true;
  session.addEventListener("end", () => {
    hitInitialized = false;
    hitTestSource = null;
  });
}

function onSelect() {
  if (!reticle.visible) return;
  let material;
  const color = new THREE.Color(state.color);
  if (state.materialType === "standard") {
    material = new THREE.MeshStandardMaterial({ color });
  } else if (state.materialType === "emissive") {
    material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1,
    });
  } else {
    material = new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity: 0.6,
    });
  }
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(state.size),
    material
  );
  mesh.position.setFromMatrixPosition(reticle.matrix);
  mesh.quaternion.setFromRotationMatrix(reticle.matrix);
  mesh.userData.baseScale = state.size;
  placed.push(mesh);
  scene.add(mesh);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(time, frame) {
  if (frame) {
    if (!hitInitialized) initializeHitTest();
    if (hitInitialized) {
      const hits = frame.getHitTestResults(hitTestSource);
      if (hits.length) {
        const pose = hits[0].getPose(localSpace);
        reticle.matrix.fromArray(pose.transform.matrix);
        reticle.visible = true;
      } else {
        reticle.visible = false;
      }
    }

    placed.forEach((m) => {
      if (state.rotationEnabled) m.rotation.y += 0.01;
      if (state.pulseEnabled) {
        const scale = m.userData.baseScale * (1 + 0.2 * Math.sin(time / 300));
        m.scale.setScalar(scale);
      }
    });
    renderer.render(scene, camera);
  }
}
