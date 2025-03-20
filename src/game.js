import * as THREE from 'three';
import { PlayerCar } from './player-car.js';
import { TrafficManager } from './traffic-manager.js';
import { Road } from './road.js';
import { CoinManager } from './coin-manager.js';

export class Game {
  constructor(container) {
    this.container = container;
    this.score = 0;
    this.scoreElement = document.getElementById('score');
    this.gameOver = false;
    
    // Add a game speed property that can be adjusted
    this.gameSpeed = 1.0;
    this.normalSpeed = 1.0;
    this.brakeDeceleration = 0.05;
    this.acceleration = 0.1;
    
    // Set up the scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue color
    
    // Set up the camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 16, -22);
    this.camera.lookAt(0, 0, 20);
    
    // Set up the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
    
    // Add lights
    this.setupLights();
    
    // Create road
    this.road = new Road();
    this.scene.add(this.road.mesh);
    
    // Create player car
    this.playerCar = new PlayerCar();
    this.scene.add(this.playerCar.mesh);
    
    // Set up traffic manager
    this.trafficManager = new TrafficManager(this.scene);

    // Set up coin manager
    this.coinManager = new CoinManager(this.scene);
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Set up keyboard controls
    this.keys = {};
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }
  
  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    this.scene.add(directionalLight);
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  onKeyDown(event) {
    this.keys[event.key] = true;
  }
  
  onKeyUp(event) {
    this.keys[event.key] = false;
  }
  
  update() {
    if (this.gameOver) return;
    
    // Check if braking
    const isBraking = this.keys['ArrowDown'] || false;
    
    // Gradually adjust game speed based on braking
    if (isBraking) {
        // Gradually slow down
        this.gameSpeed = Math.max(0, this.gameSpeed - this.brakeDeceleration);
    } else {
        // Gradually speed back up to normal
        this.gameSpeed = Math.min(this.normalSpeed, this.gameSpeed + this.acceleration);
    }
    
    // Only move the road if there's some speed
    if (this.gameSpeed > 0) {
        // Use the current game speed to scale the road update
        this.road.speed = 0.4 * this.gameSpeed;
        this.road.update();
        
        // Update traffic with current speed
        this.trafficManager.update(this.gameSpeed);

        // Update coins with road speed
        this.coinManager.update(this.road.speed);
    }
    
    // Update player car - swap left and right parameters
    this.playerCar.update(this.keys['ArrowRight'], this.keys['ArrowLeft'], isBraking);
    
    // Check collisions
    const playerBox = new THREE.Box3().setFromObject(this.playerCar.mesh);
    
    // Check coin collisions
    if (this.coinManager.checkCollision(playerBox)) {
        this.score += 10;
        this.scoreElement.textContent = 'Score: ' + this.score;
    }
    
    // Check traffic collisions
    if (this.checkCollisions()) {
        this.gameOver = true;
        alert('Game Over! Your score: ' + this.score);
        location.reload();
        return;
    }
    
    // Update score based on current speed
    if (this.gameSpeed > 0) {
        this.score += Math.round(this.gameSpeed);
        this.scoreElement.textContent = 'Score: ' + this.score;
    }
  }
  
  checkCollisions() {
    const playerBox = new THREE.Box3().setFromObject(this.playerCar.mesh);
    
    for (const car of this.trafficManager.cars) {
      const trafficBox = new THREE.Box3().setFromObject(car.mesh);
      if (playerBox.intersectsBox(trafficBox)) {
        return true;
      }
    }
    
    return false;
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  start() {
    this.gameLoop();
  }
  
  gameLoop() {
    requestAnimationFrame(this.gameLoop.bind(this));
    this.update();
    this.render();
  }
} 