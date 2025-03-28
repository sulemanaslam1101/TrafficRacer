import * as THREE from 'three';
import { PlayerCar } from './player-car.js';
import { TrafficManager } from './traffic-manager.js';
import { Road } from './road.js';
import { CoinManager } from './coin-manager.js';
import { AirObstacleManager } from './air-obstacle-manager.js';
import { AudioManager } from './audio-manager.js';

export class Game {
  constructor(container, carData) {
    this.container = container;
    this.score = 0;
    this.scoreElement = document.getElementById('score');
    this.gameOver = false;
    
    // Initialize audio manager
    this.audioManager = new AudioManager();
    
    // Add a game speed property that can be adjusted
    this.gameSpeed = 1.0;
    this.normalSpeed = 1.0;
    this.brakeDeceleration = 0.05;
    this.acceleration = 0.1;
    
    // Speed display configuration
    this.minSpeed = 0.5;  // Minimum internal speed
    this.maxSpeed = 2.0;  // Maximum internal speed
    this.speedMultiplier = 20; // Multiply internal speed by this to get km/h
    this.speedElement = document.getElementById('speed-display').querySelector('span');
    
    // Create health display dynamically
    this.createHealthDisplay();
    
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
    
    // Create player car with selected car data
    this.playerCar = new PlayerCar(carData);
    this.scene.add(this.playerCar.mesh);
    
    // Initialize health display with player car health
    this.updateHealthDisplay();
    
    // Set up traffic manager
    this.trafficManager = new TrafficManager(this.scene);

    // Set up coin manager
    this.coinManager = new CoinManager(this.scene, this.audioManager);
    
    // Set up air obstacle manager
    this.airObstacleManager = new AirObstacleManager(this.scene, this.audioManager);
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Set up keyboard controls
    this.keys = {};
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // Add camera follow properties
    this.cameraOffset = new THREE.Vector3(0, 16, -22);
    this.cameraTarget = new THREE.Vector3(0, 0, 20);
    this.cameraLerpFactor = 0.1; // Smooth camera following
  }

  createHealthDisplay() {
    // Create the health element dynamically
    this.healthElement = document.createElement('div');
    this.healthElement.id = 'player-health';
    this.healthElement.style.position = 'absolute';
    this.healthElement.style.top = '70px';
    this.healthElement.style.left = '20px';
    this.healthElement.style.color = 'white';
    this.healthElement.style.fontSize = '24px';
    this.healthElement.style.zIndex = '100';
    this.healthElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.healthElement.style.padding = '10px 20px';
    this.healthElement.style.borderRadius = '10px';
    this.healthElement.style.transition = 'color 0.3s ease';
    
    // Add span for health text
    const healthSpan = document.createElement('span');
    healthSpan.textContent = 'Health: 100%';
    this.healthElement.appendChild(healthSpan);
    
    // Add CSS animations and styles
    this.addHealthStylesAndAnimations();
    
    // Append to game container
    document.getElementById('game-container').appendChild(this.healthElement);
  }
  
  addHealthStylesAndAnimations() {
    // Create a style element for health-related CSS
    const style = document.createElement('style');
    style.textContent = `
      #player-health.warning {
        color: #ffaa00;
        text-shadow: 0 0 10px #ffaa00;
      }
      #player-health.danger {
        color: #ff0000;
        text-shadow: 0 0 10px #ff0000;
        animation: pulse 2s infinite;
      }
      #player-health.flash {
        animation: damage-flash 0.3s;
      }
      @keyframes damage-flash {
        0% { background-color: rgba(255, 0, 0, 0.7); transform: scale(1.1); }
        100% { background-color: rgba(0, 0, 0, 0.5); transform: scale(1); }
      }
      @keyframes pulse {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
      }
    `;
    document.head.appendChild(style);
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
    
    // Check controls
    const isBraking = this.keys['ArrowDown'] || false;
    const isAccelerating = this.keys['ArrowUp'] || false;
    
    // Keep road stationary
    this.road.speed = 0;
    
    // Update traffic based on player's speed
    this.trafficManager.update(this.playerCar.speed, this.playerCar.mesh.position);

    // Update coins with same speed as traffic
    this.coinManager.update(this.playerCar.speed);
    
    // Update air obstacles
    this.airObstacleManager.update(
      this.playerCar.mesh.position,
      this.playerCar.speed,
      this.score
    );
    
    // Update player car with all controls - swap left and right for correct directions
    this.playerCar.update(
      this.keys['ArrowRight'],
      this.keys['ArrowLeft'],
      isBraking,
      isAccelerating
    );
    
    // Update speed display
    this.updateSpeedDisplay();
    
    // Update camera position to follow player
    this.updateCamera();
    
    // Check collisions
    const playerBox = new THREE.Box3().setFromObject(this.playerCar.mesh);
    
    // Check coin collisions
    if (this.coinManager.checkCollision(playerBox)) {
        this.score += 10;
        this.scoreElement.textContent = 'Score: ' + this.score;
        this.audioManager.play('coinCollect');
    }
    
    // Check for collisions with aerial projectiles
    const projectileDamage = this.airObstacleManager.checkCollision(playerBox);
    if (projectileDamage > 0) {
        // Apply damage to player
        const isDead = this.playerCar.takeDamage(projectileDamage);
        
        // Update health display with current health value
        this.updateHealthDisplay();
        
        // Add visual indication of damage 
        this.healthElement.classList.add('flash');
        setTimeout(() => {
            this.healthElement.classList.remove('flash');
        }, 300);
        
        // Log hit for debugging
        console.log(`Player hit! Health: ${this.playerCar.health} (${Math.round((this.playerCar.health / 1000) * 100)}%)`);
        
        // Check if player died from this hit
        if (isDead) {
            this.gameOver = true;
            this.audioManager.play('crash');
            alert('Game Over! Your score: ' + this.score);
            location.reload();
            return;
        }
    }
    
    // Check traffic collisions
    if (this.checkCollisions()) {
        this.gameOver = true;
        this.audioManager.play('crash');
        alert('Game Over! Your score: ' + this.score);
        location.reload();
        return;
    }
    
    // Update score based on current speed
    if (this.normalSpeed > 0) {
        this.score += Math.round(this.normalSpeed);
        this.scoreElement.textContent = 'Score: ' + this.score;
    }
  }
  
  updateCamera() {
    // Calculate target camera position based on player car position
    const targetCameraPos = new THREE.Vector3(
      this.playerCar.mesh.position.x + this.cameraOffset.x,
      this.cameraOffset.y,
      this.playerCar.mesh.position.z + this.cameraOffset.z
    );
    
    // Smoothly interpolate camera position
    this.camera.position.lerp(targetCameraPos, this.cameraLerpFactor);
    
    // Calculate target look position based on player car
    const targetLookPos = new THREE.Vector3(
      this.playerCar.mesh.position.x,
      0,
      this.playerCar.mesh.position.z + 20
    );
    
    // Update camera look target
    this.camera.lookAt(targetLookPos);
  }
  
  checkCollisions() {
    const playerBox = new THREE.Box3().setFromObject(this.playerCar.mesh);
    
    for (const car of this.trafficManager.activeCars) {
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

  updateHealthDisplay() {
    // Calculate health percentage (1000 is max health)
    const healthPercent = Math.max(0, Math.round((this.playerCar.health / 1000) * 100));
    
    // Update health display in HUD
    const healthSpan = this.healthElement.querySelector('span');
    healthSpan.textContent = 'Health: ' + healthPercent + '%';
    
    // Update styling based on health level
    this.healthElement.classList.remove('warning', 'danger');
    if (healthPercent <= 25) {
      this.healthElement.classList.add('danger');
    } else if (healthPercent <= 50) {
      this.healthElement.classList.add('warning');
    }
  }
  
  updateSpeedDisplay() {
    // Get current speed from player car
    const currentSpeed = this.playerCar.speed;
    
    // Convert internal speed to display speed (km/h)
    // Formula: displaySpeed = minSpeed * speedMultiplier
    const displaySpeed = Math.round(currentSpeed * this.speedMultiplier);
    
    // Update the speed display
    this.speedElement.textContent = `Speed: ${displaySpeed} km/h`;
  }
} 