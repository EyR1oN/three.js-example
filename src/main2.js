import "./style.css";
import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let camera, scene, renderer, controls;
let model, modelLight, dirLight, ambientLight;
let alternativeMaterial;

const state = {
  rotationEnabled: true,
  axis: "y",
  material: "original",
  sceneLightOn: true,
  modelLightOn: false,
  modelLightType: "point",
  lightIntensity: 1,
  lightColor: "#ffffff",
};

const btn = (id) => document.getElementById(id);
const sel = (id) => document.getElementById(id);

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 40);
  camera.position.set(0, 1.5, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  alternativeMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.7,
  });

  const loader = new GLTFLoader();
  const MODEL_URL =
    "https://raw.githubusercontent.com/EyR1oN/ar-fruits-vegetables/main/scene.gltf";

  loader.load(
    MODEL_URL,
    (gltf) => {
      model = gltf.scene;
      model.position.set(0, 0.2, -1.5);
      model.scale.setScalar(2.0);

      model.traverse((child) => {
        if (child.isMesh) child.userData.original = child.material;
      });

      scene.add(model);

      modelLight = new THREE.PointLight(state.lightColor, state.lightIntensity);
      modelLight.visible = false;
      model.add(modelLight);
    },
    undefined,
    (err) => console.error("GLTF load error:", err)
  );

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  document.body.appendChild(ARButton.createButton(renderer));

  btn("toggleRotationBtn").onclick = () => {
    state.rotationEnabled = !state.rotationEnabled;
    btn("toggleRotationBtn").textContent = state.rotationEnabled
      ? "Disable Rotation"
      : "Enable Rotation";
  };

  sel("axisSelect").onchange = (e) => (state.axis = e.target.value);

  sel("materialSelect").onchange = (e) => {
    state.material = e.target.value;
    model.traverse((child) => {
      if (child.isMesh) {
        child.material =
          state.material === "original"
            ? child.userData.original
            : alternativeMaterial;
        child.material.needsUpdate = true;
      }
    });
  };

  btn("sceneLightBtn").onclick = () => {
    state.sceneLightOn = !state.sceneLightOn;
    btn("sceneLightBtn").textContent = `Scene Light: ${
      state.sceneLightOn ? "ON" : "OFF"
    }`;
    dirLight.visible = ambientLight.visible = state.sceneLightOn;
  };

  btn("modelLightBtn").onclick = () => {
    state.modelLightOn = !state.modelLightOn;
    btn("modelLightBtn").textContent = `Model Light: ${
      state.modelLightOn ? "ON" : "OFF"
    }`;
    modelLight.visible = state.modelLightOn;
  };

  sel("modelLightTypeSelect").onchange = (e) => {
    state.modelLightType = e.target.value;
    model.remove(modelLight);
    const ctor = {
      point: THREE.PointLight,
      spot: THREE.SpotLight,
      directional: THREE.DirectionalLight,
    }[state.modelLightType];
    modelLight = new ctor(state.lightColor, state.lightIntensity);
    modelLight.visible = state.modelLightOn;
    model.add(modelLight);
  };

  sel("modelLightIntensity").oninput = (e) => {
    state.lightIntensity = +e.target.value;
    modelLight.intensity = state.lightIntensity;
  };

  sel("modelLightColor").oninput = (e) => {
    state.lightColor = e.target.value;
    modelLight.color.set(state.lightColor);
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
}

function render() {
  if (model && state.rotationEnabled) {
    model.rotation[state.axis] += 0.01;
  }
  renderer.render(scene, camera);
}
