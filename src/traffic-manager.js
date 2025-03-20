import * as THREE from 'three';

class TrafficCar {
  constructor(lane) {
    this.speed = 0.2 + Math.random() * 0.3;
    this.mesh = this.createCarMesh();
    
    // Spawn traffic farther ahead with our extended road
    this.mesh.position.set(lane, 0.5, 100);
  }
  
  createCarMesh() {
    // Create a simple car using primitive shapes with random colors
    const car = new THREE.Group();
    
    // Generate a random car color
    const colors = [0xff0000, 0x00ff00, 0xff00ff, 0xffff00, 0x00ffff, 0xffa500];
    const carColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(1.8, 1, 4);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: carColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    car.add(body);
    
    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.4, 0.7, 2);
    const roofMaterial = new THREE.MeshPhongMaterial({ color: carColor });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1.35;
    roof.position.z = -0.5;
    roof.castShadow = true;
    car.add(roof);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    // Front left wheel
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.rotation.z = Math.PI / 2;
    frontLeftWheel.position.set(-1, 0.4, 1.2);
    car.add(frontLeftWheel);
    
    // Front right wheel
    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.rotation.z = Math.PI / 2;
    frontRightWheel.position.set(1, 0.4, 1.2);
    car.add(frontRightWheel);
    
    // Rear left wheel
    const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearLeftWheel.rotation.z = Math.PI / 2;
    rearLeftWheel.position.set(-1, 0.4, -1.2);
    car.add(rearLeftWheel);
    
    // Rear right wheel
    const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearRightWheel.rotation.z = Math.PI / 2;
    rearRightWheel.position.set(1, 0.4, -1.2);
    car.add(rearRightWheel);
    
    // Taillights
    const taillightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const taillightMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000 });
    
    // Left taillight
    const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    leftTaillight.position.set(-0.7, 0.7, -2);
    car.add(leftTaillight);
    
    // Right taillight
    const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    rightTaillight.position.set(0.7, 0.7, -2);
    car.add(rightTaillight);
    
    return car;
  }
  
  update() {
    // Move the car forward (towards the player)
    this.mesh.position.z -= this.speed;
    
    // Check if the car is behind the player (needs to be reset)
    // Adjusted threshold to match our new road recycling logic
    return this.mesh.position.z < -40;
  }
}

export class TrafficManager {
  constructor(scene) {
    this.scene = scene;
    this.cars = [];
    this.lanes = [-6, -2, 2, 6]; // Adjusted from [-3, -1, 1, 3] to match wider lanes
    this.spawnInterval = 60; // Frames between spawns
    this.spawnCounter = 0;
    this.difficulty = 1;
    this.maxCars = 12; // Increased max cars for better traffic
  }
  
  spawnCar() {
    if (this.cars.length >= this.maxCars) return;
    
    // Choose a random lane
    const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
    
    // Create a new traffic car
    const car = new TrafficCar(lane);
    this.cars.push(car);
    
    // Add it to the scene
    this.scene.add(car.mesh);
  }
  
  update(gameSpeed = 1.0) {
    // Spawn new cars periodically, adjusted by game speed
    this.spawnCounter += gameSpeed;
    if (this.spawnCounter >= this.spawnInterval) {
        this.spawnCar();
        this.spawnCounter = 0;
        
        // Increase difficulty over time (only when at full speed)
        if (gameSpeed >= 0.9) {
            this.spawnInterval = Math.max(30, this.spawnInterval - 0.1);
            this.difficulty += 0.01;
            this.maxCars = Math.min(15, 10 + this.difficulty);
        }
    }
    
    // Update existing cars
    for (let i = this.cars.length - 1; i >= 0; i--) {
        // Apply the game speed to the car's movement
        this.cars[i].speed = (0.2 + Math.random() * 0.3) * gameSpeed;
        const needsReset = this.cars[i].update();
        
        // If the car is behind the player, remove it and create a new one
        if (needsReset) {
            this.scene.remove(this.cars[i].mesh);
            this.cars.splice(i, 1);
        }
    }
  }
} 