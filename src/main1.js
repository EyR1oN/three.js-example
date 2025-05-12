import "./style.css";
import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer, controls;
let torusKnotMesh, tubeMesh, extrudeMesh;

const state = {
  rotation: true,
  colorEmit: false,
  textures: false,
  pulse: false,
  speedFast: false,
  special: false,
  specialStart: 0,
};
const btn = (id) => document.getElementById(id);

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 40);
  camera.position.set(0, 1.5, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  const dir = new THREE.DirectionalLight(0xffffff, 3);
  dir.position.set(5, 10, 7.5);
  scene.add(dir);
  scene.add(new THREE.AmbientLight(0x404040, 1.5));

  const loader = new THREE.TextureLoader();
  const checker = loader.load(
    "https://threejs.org/examples/textures/uv_grid_opengl.jpg"
  );

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccee,
    emissive: 0x88ccee,
    emissiveIntensity: 0,
    metalness: 0.5,
    roughness: 0.1,
    transmission: 0.7,
    transparent: true,
    opacity: 0.6,
  });
  const emissiveMat = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    emissive: 0xff2200,
    emissiveIntensity: 0,
    roughness: 0.3,
    metalness: 0.4,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffd700,
    emissiveIntensity: 0,
    metalness: 1,
    roughness: 0.2,
  });

  const glassTex = glassMat.clone();
  glassTex.map = checker;
  const emiTex = emissiveMat.clone();
  emiTex.map = checker;
  const goldTex = goldMat.clone();
  goldTex.map = checker;

  torusKnotMesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.4, 0.1, 100, 16),
    glassMat
  );
  torusKnotMesh.position.set(-1.5, 0, -5);
  torusKnotMesh.scale.setScalar(0.8);
  scene.add(torusKnotMesh);

  class CustomSinCurve extends THREE.Curve {
    constructor(s = 1) {
      super();
      this.scale = s;
    }
    getPoint(t) {
      const x = t * 2 - 1,
        y = Math.sin(2 * Math.PI * t),
        z = 0;
      return new THREE.Vector3(x, y, z).multiplyScalar(this.scale);
    }
  }
  tubeMesh = new THREE.Mesh(
    new THREE.TubeGeometry(new CustomSinCurve(1.2), 64, 0.05, 8, false),
    emissiveMat
  );
  tubeMesh.position.set(0, 0, -5);
  tubeMesh.scale.setScalar(0.8);
  scene.add(tubeMesh);

  const shape = new THREE.Shape()
    .moveTo(-0.5, -0.2)
    .lineTo(-0.5, 0.2)
    .lineTo(0.5, 0.2)
    .lineTo(0.5, -0.2)
    .lineTo(-0.5, -0.2);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, 0.15, 0.15, 0, Math.PI * 2);
  shape.holes.push(hole);
  extrudeMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      steps: 2,
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.03,
      bevelSegments: 1,
    }),
    goldMat
  );
  extrudeMesh.position.set(1.5, 0, -5);
  extrudeMesh.scale.setScalar(0.8);
  scene.add(extrudeMesh);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  document.body.appendChild(ARButton.createButton(renderer));

  btn("btn-rotation").onclick = () => {
    state.rotation = !state.rotation;
    btn("btn-rotation").textContent = state.rotation
      ? "Disable Rotation"
      : "Enable Rotation";
  };

  btn("btn-color").onclick = () => {
    state.colorEmit = !state.colorEmit;
    btn("btn-color").textContent = state.colorEmit
      ? "Disable Color/Emit"
      : "Enable Color/Emit";
    [torusKnotMesh, tubeMesh, extrudeMesh].forEach((m) => {
      m.material.emissiveIntensity = state.colorEmit ? 2 : 0;
    });
  };

  btn("btn-texture").onclick = () => {
    state.textures = !state.textures;
    btn("btn-texture").textContent = state.textures
      ? "Disable Textures"
      : "Enable Textures";
    torusKnotMesh.material = state.textures ? glassTex : glassMat;
    tubeMesh.material = state.textures ? emiTex : emissiveMat;
    extrudeMesh.material = state.textures ? goldTex : goldMat;
  };

  btn("btn-pulse").onclick = () => {
    state.pulse = !state.pulse;
    btn("btn-pulse").textContent = state.pulse
      ? "Disable Pulse/Move"
      : "Enable Pulse/Move";
  };

  btn("btn-speed").onclick = () => {
    state.speedFast = !state.speedFast;
    btn("btn-speed").textContent = state.speedFast
      ? "Speed: Fast"
      : "Speed: Normal";
  };

  btn("btn-special").onclick = () => {
    state.special = true;
    state.specialStart = performance.now();
    btn("btn-special").textContent = "Special Active";
    [torusKnotMesh, tubeMesh, extrudeMesh].forEach(
      (m) => (m.material.emissiveIntensity = 5)
    );
  };

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
  controls.update();
}

function render(time) {
  const speed = state.speedFast ? 0.05 : 0.01;

  if (state.rotation) {
    torusKnotMesh.rotation.y -= speed;
    tubeMesh.rotation.z += speed;
    extrudeMesh.rotation.x -= speed;
  }

  if (state.pulse) {
    const s = 1 + 0.1 * Math.sin(time / 300);
    [torusKnotMesh, tubeMesh, extrudeMesh].forEach((m) => m.scale.setScalar(s));
  }

  if (state.special && time - state.specialStart >= 2000) {
    state.special = false;
    btn("btn-special").textContent = "Special Effect";
    [torusKnotMesh, tubeMesh, extrudeMesh].forEach((m) => {
      m.material.emissiveIntensity = state.colorEmit ? 2 : 0;
    });
  }

  renderer.render(scene, camera);
}
