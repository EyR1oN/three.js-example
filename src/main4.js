import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let camera, scene, renderer;
let reticle, controller, dirLight;
let hitTestSource = null,
  localSpace = null,
  hitInitialized = false;
let gltfModel = null;
const placed = [];

const state = {
  material: "original",
  sceneDirLight: true,
  lightIntensity: 1,
  lightColor: "#ffffff",
  jump: false,
  rotate: true,
};

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
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.5);
  scene.add(hemi);

  dirLight = new THREE.DirectionalLight(0xffffff, state.lightIntensity);
  dirLight.position.set(0.5, 2, 1);
  scene.add(dirLight);

  const ringGeo = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  reticle = new THREE.Mesh(ringGeo, ringMat);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  const loader = new GLTFLoader();
  const MODEL_URL =
    "https://raw.githubusercontent.com/EyR1oN/ar-toys/main/scene.gltf";
  loader.load(
    MODEL_URL,
    (gltf) => {
      gltfModel = gltf.scene;
      gltfModel.scale.setScalar(0.2);
      gltfModel.traverse((c) => {
        if (c.isMesh) c.userData.original = c.material;
      });
    },
    undefined,
    (err) => console.error(err)
  );

  document.body.appendChild(
    ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
  );

  const matSel = document.getElementById("materialSelect");
  const dirBtn = document.getElementById("sceneDirLightBtn");
  const inten = document.getElementById("lightIntensity");
  const color = document.getElementById("lightColor");
  const jumpBtn = document.getElementById("toggleJumpBtn");
  const rotBtn = document.getElementById("toggleRotateBtn");

  matSel.onchange = (e) => (state.material = e.target.value);
  dirBtn.onclick = () => {
    state.sceneDirLight = !state.sceneDirLight;
    dirLight.visible = state.sceneDirLight;
    dirBtn.textContent = `Direction Light: ${
      state.sceneDirLight ? "ON" : "OFF"
    }`;
  };
  inten.oninput = (e) => {
    state.lightIntensity = +e.target.value;
    dirLight.intensity = state.lightIntensity;
  };
  color.oninput = (e) => {
    state.lightColor = e.target.value;
    dirLight.color.set(state.lightColor);
  };
  jumpBtn.onclick = () => {
    state.jump = !state.jump;
    jumpBtn.textContent = `Jump: ${state.jump ? "ON" : "OFF"}`;
  };
  rotBtn.onclick = () => {
    state.rotate = !state.rotate;
    rotBtn.textContent = `Rotation: ${state.rotate ? "ON" : "OFF"}`;
  };

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
  if (!reticle.visible || !gltfModel) return;
  const clone = gltfModel.clone(true);
  clone.traverse((c) => {
    if (c.isMesh) {
      if (state.material === "gold") {
        c.material = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 1,
          roughness: 0.3,
        });
      } else if (state.material === "glass") {
        c.material = new THREE.MeshPhysicalMaterial({
          color: 0x88ccee,
          transmission: 0.7,
          transparent: true,
          opacity: 0.5,
        });
      } else if (state.material === "glow") {
        c.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x00ff00,
          emissiveIntensity: 2,
        });
      }
    }
  });
  clone.position.setFromMatrixPosition(reticle.matrix);
  clone.quaternion.setFromRotationMatrix(reticle.matrix);
  clone.userData.baseY = clone.position.y;
  placed.push(clone);
  scene.add(clone);
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
      if (state.rotate) m.rotation.y += 0.01;
      if (state.jump) {
        m.position.y = m.userData.baseY + 0.1 * Math.abs(Math.sin(time / 300));
      }
    });
    renderer.render(scene, camera);
  }
}
