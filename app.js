import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ViewportGizmo } from "three-viewport-gizmo";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(30, 30, 30); // Better initial camera position to see the whole scene
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true }); // Added antialiasing
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x123456, 1);
document.body.appendChild(renderer.domElement);

// Improved lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Add a grid helper for better spatial reference
const gridHelper = new THREE.GridHelper(50, 50);
scene.add(gridHelper);

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
const gizmo = new ViewportGizmo(camera, renderer);
gizmo.attachControls(controls);

const loader = new GLTFLoader();
const objects = {};

const modelPaths = ['Platform', 'X_axis', 'Y_axis', 'Z_axis', 'Track'];

// Modified points with adjusted coordinates
const points = [
    [0, 1, 0],
    [10, 2, 8],
    [0, 1.5, 0],
    [20, 1.23, 20],
    [20, 1, -10]
];

// Improved path visualization
function drawMotionPaths(points) {
    try {
        // Create separate paths for each axis of movement
        const colors = {
            x: 0xff0000, // red
            y: 0x00ff00, // green
            z: 0x0000ff  // blue
        };

        // Draw the complete path
        const pathMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        const pathGeometry = new THREE.BufferGeometry();
        const vertices = points.map(point => new THREE.Vector3(
            point[0],  // Adjust for offset
            point[1],  // Adjust for offset
            point[2]
        ));
        pathGeometry.setFromPoints(vertices);
        const pathLine = new THREE.Line(pathGeometry, pathMaterial);
        scene.add(pathLine);

        // Add point markers
        points.forEach(point => {
            const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(point[0], point[1], point[2]);
            scene.add(sphere);
        });

    } catch (error) {
        window.alert(`Error drawing motion paths: ${error.message}`);
    }
}

// Improved object movement function
function moveObjectsThroughPoints(points, totalFrames = 1000) {
    let currentFrame = 0;

    const animate = () => {
        if (currentFrame >= totalFrames) {
            currentFrame = 0; // Reset frame to loop animation
        }

        const progress = currentFrame / totalFrames;
        const currentIndex = Math.floor(progress * (points.length - 1));
        const nextIndex = Math.min(currentIndex + 1, points.length - 1);
        const segmentProgress = (progress * (points.length - 1)) % 1;

        const current = points[currentIndex];
        const next = points[nextIndex];

        if (objects['X_axis'] && objects['Y_axis'] && objects['Z_axis'] && objects['Track']) {
            const lerpPosition = (start, end, progress) => start + (end - start) * progress;

            const currentX = lerpPosition(current[0], next[0], segmentProgress) - 6.5;
            const currentY = lerpPosition(current[1], next[1], segmentProgress) - 2.5;
            const currentZ = lerpPosition(current[2], next[2], segmentProgress);

            objects['X_axis'].position.set(currentX, objects['X_axis'].position.y, objects['X_axis'].position.z);
            objects['Y_axis'].position.set(currentX, objects['Y_axis'].position.y, currentZ);
            objects['Z_axis'].position.set(currentX, currentY, currentZ);
            objects['Track'].position.set(currentX, currentY, currentZ);
        }

        currentFrame++;
        requestAnimationFrame(animate);
    };

    animate();
}


// Load models
let modelsLoaded = 0;
const totalModels = modelPaths.length;

modelPaths.forEach((model) => {
    loader.load(`/public/${model}.glb`, (gltf) => {
        const object = gltf.scene;
        object.name = model;
        scene.add(object);
        objects[model] = object;

        modelsLoaded++;

        if (modelsLoaded === totalModels) {
            drawMotionPaths(points);
            moveObjectsThroughPoints(points, 300);
            annotateObjectCenters();
        }
    }, undefined, (error) => {
        window.alert(`Error loading model: ${model} - ${error}`);
    });
});

function annotateObjectCenters() {
    for (const objectName in objects) {
        const object = objects[objectName];
        const center = object.getWorldPosition(new THREE.Vector3());

        const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

        sphere.position.copy(center);
        scene.add(sphere);
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    gizmo.render();
}

animate();