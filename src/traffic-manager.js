import * as THREE from 'three';

class TrafficCar {
  constructor(lane) {
    this.mesh = this.createCarMesh();
    this.baseSpeed = 0.3;  // Even slower base speed to make overtaking easier
    this.minSpeed = 0.3;   // Minimum speed of traffic cars
    this.maxSpeed = 0.15;  // Maximum speed of traffic cars
    this.currentSpeed = this.baseSpeed + (Math.random() * 0.05); // Small variation in speed
    this.lane = lane;
    // Initial position is ahead of the player
    this.zPosition = 100 + Math.random() * 100;
    this.mesh.position.set(lane, 0.5, this.zPosition);
    this.active = true;
  }
  
  createCarMesh() {
    const car = new THREE.Group();
    
    // Random car colors
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0xffa500];
    const carColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(1.8, 1, 4);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: carColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    car.add(body);
    
    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.4, 0.7, 2);
    const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
    roof.position.y = 1.35;
    roof.position.z = -0.5;
    roof.castShadow = true;
    car.add(roof);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    // Add wheels
    const wheelPositions = [
      [-0.9, 0.4, 1.2],  // Front left
      [0.9, 0.4, 1.2],   // Front right
      [-0.9, 0.4, -1.2], // Rear left
      [0.9, 0.4, -1.2]   // Rear right
    ];
    
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(...pos);
      car.add(wheel);
    });
    
    // Headlights (front)
    const headlightGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const headlightMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.5
    });
    
    // Add headlights
    [-0.6, 0.6].forEach(x => {
      const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlight.position.set(x, 0.5, 2);
      car.add(headlight);
      
      // Add headlight glow
      const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffcc,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(headlight.position);
      car.add(glow);
    });
    
    // Taillights (back)
    const taillightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const taillightMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    
    // Add taillights
    [-0.7, 0.7].forEach(x => {
      const taillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
      taillight.position.set(x, 0.7, -2);
      car.add(taillight);
      
      // Add brake light glow
      const brakeGlowGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.1);
      const brakeGlowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.3
      });
      const brakeGlow = new THREE.Mesh(brakeGlowGeometry, brakeGlowMaterial);
      brakeGlow.position.copy(taillight.position);
      car.add(brakeGlow);
    });
    
    // Add a small reverse light in the middle
    const reverseLightGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.1);
    const reverseLightMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.3
    });
    const reverseLight = new THREE.Mesh(reverseLightGeometry, reverseLightMaterial);
    reverseLight.position.set(0, 0.5, -2);
    car.add(reverseLight);
    
    return car;
  }
  
  update(playerSpeed) {
    // Traffic cars move forward at their own speed
    // They don't need to account for player speed since they're moving independently
    this.zPosition += this.currentSpeed;
    this.mesh.position.z = this.zPosition;
    
    // Return true if car needs to be reset (when it's too far behind)
    return this.zPosition < -100;
  }
}

export class TrafficManager {
  constructor(scene) {
    this.scene = scene;
    this.cars = [];
    this.lanes = [-4.5, -1.5, 1.5, 4.5];
    
    // Traffic control parameters
    this.spawnDistance = 400;      // Distance ahead of player to spawn cars
    this.spawnRange = 500;         // Range within which to spawn cars
    this.minSpawnDistance = 50;    // Minimum distance between cars
    this.spawnDelay = 3;           // Spawn cars every 3 frames
    this.minActiveCars = 8;        // Minimum cars that should always be active
    this.spawnBatchSize = 5;       // Number of cars to spawn when below minimum
    this.maxCarsPerLane = 2;       // Maximum cars allowed per lane
    
    // Spawn control
    this.spawnTimer = 0;
    this.lastSpawnCheck = 0;       // Track last spawn check time
    
    // Difficulty settings
    this.trafficDensity = 1.0;
    this.speedVariation = 0.3;
    
    // Initial spawn
    this.initialSpawn();
    
    // Set up continuous spawn check
    setInterval(() => this.ensureTraffic(), 100);
  }
  
  // Initial spawn of traffic cars to populate the road
  initialSpawn() {
    // Spawn initial cars in all lanes
    for (let lane of this.lanes) {
      // Place fewer cars in each lane at different distances
      for (let i = 0; i < 2; i++) {
        this.spawnCarInLane(lane, this.spawnDistance + (i * 100) + Math.random() * 50);
      }
    }
  }
  
  spawnCarInLane(lane, zPosition) {
    // Check if lane is already full
    const carsInLane = this.cars.filter(car => car.lane === lane).length;
    if (carsInLane >= this.maxCarsPerLane) {
      return null;
    }

    const car = new TrafficCar(lane);
    car.zPosition = zPosition;
    car.mesh.position.z = zPosition;
    car.currentSpeed = car.baseSpeed + (Math.random() * this.speedVariation - this.speedVariation/2);
    this.cars.push(car);
    this.scene.add(car.mesh);
    return car;
  }
  
  spawnCar() {
    // Pick random lane
    const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
    
    // Random position within spawn range
    const spawnZ = this.spawnDistance + Math.random() * this.spawnRange;
    
    // Check for minimum distance in the same lane
    const canSpawn = !this.cars.some(car => 
      car.lane === lane && 
      Math.abs(car.zPosition - spawnZ) < this.minSpawnDistance
    );
    
    if (canSpawn) {
      return this.spawnCarInLane(lane, spawnZ) !== null;
    }
    
    return false;
  }
  
  spawnBatch() {
    // Spawn a smaller batch of new cars
    for (let i = 0; i < this.spawnBatchSize; i++) {
      const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
      const spawnZ = this.spawnDistance + Math.random() * this.spawnRange;
      this.spawnCarInLane(lane, spawnZ);
    }
  }
  
  ensureTraffic() {
    // Check if we need to spawn more cars
    if (this.cars.length < this.minActiveCars) {
      const neededCars = this.minActiveCars - this.cars.length;
      for (let i = 0; i < neededCars; i++) {
        const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
        const spawnZ = this.spawnDistance + Math.random() * this.spawnRange;
        this.spawnCarInLane(lane, spawnZ);
      }
    }
  }
  
  update(playerSpeed) {
    // Remove cars that are too far behind
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const needsReset = this.cars[i].update(playerSpeed);
      
      if (needsReset) {
        // Instead of removing, recycle the car by putting it back far ahead
        const car = this.cars[i];
        const newLane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
        const newZ = this.spawnDistance + Math.random() * this.spawnRange;
        
        // Reset the car's position
        car.lane = newLane;
        car.zPosition = newZ;
        car.mesh.position.set(newLane, 0.5, newZ);
        car.currentSpeed = car.baseSpeed + (Math.random() * this.speedVariation - this.speedVariation/2);
      }
    }
    
    // Try to spawn new cars
    this.spawnTimer++;
    
    if (this.spawnTimer >= this.spawnDelay) {
      // Try one spawn attempt each cycle
      this.spawnCar();
      this.spawnTimer = 0;
    }
    
    // Adjust spawn delay based on player speed
    // Faster speed = slightly quicker spawns
    this.spawnDelay = Math.max(3, 5 - (playerSpeed));
  }
  
  // Method to adjust difficulty
  setDifficulty(level) {
    // level should be between 0 and 1
    level = Math.max(0, Math.min(1, level));
    
    // Adjust traffic parameters based on difficulty
    this.trafficDensity = 1.0 + (level * 0.3);        // 1.0-1.3 density
    this.speedVariation = 0.3 + (level * 0.05);       // 0.1-0.15 speed variation
    this.spawnDelay = Math.max(3, 5 - (level * 1));   // 5-4 frames delay
    this.minActiveCars = 8 + Math.floor(level * 4);   // 8-12 minimum active cars
    this.spawnBatchSize = 5 + Math.floor(level * 2);  // 5-7 cars per batch
    this.maxCarsPerLane = 2 + Math.floor(level * 1);  // 2-3 cars per lane
  }
} 