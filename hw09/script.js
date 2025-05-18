import * as THREE from 'three';  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


const scene = new THREE.Scene();


let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 0;
camera.position.y = 80;
camera.position.z = 150;
camera.lookAt(scene.position);
scene.add(camera);


const textureLoader = new THREE.TextureLoader();

const mercuryTexture = textureLoader.load('./Mercury.jpg');
const mercuryMaterial = new THREE.MeshStandardMaterial({
    map: mercuryTexture,
    roughness: 0.8,
    metalness: 0.2,
    color: "#a6a6a6"
});

const venusTexture = textureLoader.load('./Venus.jpg');
const venusMaterial = new THREE.MeshStandardMaterial({
    map: venusTexture,
    roughness: 0.8,
    metalness: 0.2,
    color: "#e39e1c"
});

const earthTexture = textureLoader.load('./Earth.jpg');
const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.8,
    metalness: 0.2,
    color: "#3498db"
});

const marsTexture = textureLoader.load('./Mars.jpg');
const marsMaterial = new THREE.MeshStandardMaterial({
    map: marsTexture,
    roughness: 0.8,
    metalness: 0.2,
    color: "#c0392b"
});


const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color(0x000000));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const stats = new Stats();
document.body.appendChild(stats.dom);


let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;


// add ambient lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// add directional light
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(100, 200, 200);
dirLight.castShadow = true;
scene.add(dirLight);


window.addEventListener('resize', onResize, false);
function onResize() { // resize handler
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}





const gui = new GUI();

const controls = new function () {
  this.mercuryR = 0.02;
  this.mercuryO = 0.02;

  this.venusR = 0.015;
  this.venusO = 0.015;

  this.earthR = 0.01;
  this.earthO = 0.01;

  this.marsR = 0.008;
  this.marsO = 0.008;

  this.perspective = "Perspective";
  
  this.switchCamera = function () {
    if (camera instanceof THREE.PerspectiveCamera) {
      scene.remove(camera);
      camera = null; // 기존의 camera 제거
      camera = new THREE.OrthographicCamera(window.innerWidth / -16, 
      window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / -16, -200, 500);
      camera.position.x = 0;
      camera.position.y = 80;
      camera.position.z = 150;
      camera.lookAt(scene.position);
      orbitControls.dispose(); // 기존의 orbitControls 제거
      orbitControls = null;
      orbitControls = new OrbitControls(camera, renderer.domElement);
      orbitControls.enableDamping = true;
      this.perspective = "Orthographic";
    } else {
      scene.remove(camera);
      camera = null; // 기존의 camera 제거거
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.x = 0;
      camera.position.y = 80;
      camera.position.z = 150;
      camera.lookAt(scene.position);
      orbitControls.dispose(); // 기존의 orbitControls 제거
      orbitControls = null;
      orbitControls = new OrbitControls(camera, renderer.domElement);
      orbitControls.enableDamping = true;
      this.perspective = "Perspective";
    }
  };
};

const guiCamera = gui.addFolder('Camera');
guiCamera.add(controls, 'switchCamera').name('Switch Camera Type');
guiCamera.add(controls, 'perspective').listen();

const guiMercury = gui.addFolder('Mercury');
guiMercury.add(controls, 'mercuryR', 0, 0.1, 0.001).name('Rotation Speed'); 
guiMercury.add(controls, 'mercuryO', 0, 0.1, 0.001).name('Orbit Speed');

const guiVenus = gui.addFolder('Venus');
guiVenus.add(controls, 'venusR', 0, 0.1, 0.001).name('Rotation Speed'); 
guiVenus.add(controls, 'venusO', 0, 0.1, 0.001).name('Orbit Speed');

const guiEarth = gui.addFolder('Earth');
guiEarth.add(controls, 'earthR', 0, 0.1, 0.001).name('Rotation Speed'); 
guiEarth.add(controls, 'earthO', 0, 0.1, 0.001).name('Orbit Speed');

const guiMars = gui.addFolder('Mars');
guiMars.add(controls, 'marsR', 0, 0.1, 0.001).name('Rotation Speed'); 
guiMars.add(controls, 'marsO', 0, 0.1, 0.001).name('Orbit Speed');




const sunGeometry = new THREE.SphereGeometry(10);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff33 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const sunLight = new THREE.PointLight(0xffffff, 2, 300);
sunLight.position.copy(sun.position);
scene.add(sunLight);

const pivot_mercury = new THREE.Object3D();
scene.add(pivot_mercury);
const mercury = new THREE.Mesh(new THREE.SphereGeometry(1.5), mercuryMaterial);
mercury.position.set(20,0,0);
pivot_mercury.add(mercury);

const pivot_venus = new THREE.Object3D();
scene.add(pivot_venus);
const venus = new THREE.Mesh(new THREE.SphereGeometry(3), venusMaterial);
venus.position.set(35,0,0);
pivot_venus.add(venus);

const pivot_earth = new THREE.Object3D();
scene.add(pivot_earth)
const earth = new THREE.Mesh(new THREE.SphereGeometry(3.5), earthMaterial);
earth.position.set(50,0,0);
pivot_earth.add(earth);

const pivot_mars = new THREE.Object3D();
scene.add(pivot_mars)
const mars = new THREE.Mesh(new THREE.SphereGeometry(2.5), marsMaterial);
mars.position.set(65,0,0);
pivot_mars.add(mars);





// for controlling the rendering
let step = 0;

render();

function render() {
  stats.update();
  orbitControls.update();

  pivot_mercury.rotation.y += controls.mercuryO;
  pivot_venus.rotation.y += controls.venusO;
  pivot_earth.rotation.y += controls.earthO;
  pivot_mars.rotation.y += controls.marsO;
  
  mercury.rotation.y += controls.mercuryR;
  venus.rotation.y += controls.venusR;
  earth.rotation.y += controls.earthR;
  mars.rotation.y += controls.marsR;

  step += 0.02;

  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

