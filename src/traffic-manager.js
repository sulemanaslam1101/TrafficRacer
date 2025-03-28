import * as THREE from 'three';

class TrafficCar {
  constructor(lane) {
    this.mesh = this.createCarMesh();
    this.baseSpeed = 0.3;  // Base speed for traffic cars
    this.currentSpeed = this.baseSpeed + (Math.random() * 0.05); // Small variation in speed
    this.lane = lane;
    this.zPosition = 0;
    this.mesh.position.set(lane, 0.5, this.zPosition);
    this.inUse = false; // Track if car is currently being used in active traffic
  }
  
  createCarMesh() {
    const car = new THREE.Group();
    
    // Random car colors - increased variety
    const colors = [
      0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0xffa500,
      0x800000, 0x008000, 0x000080, 0x808000, 0x800080, 0x008080,
      0xffffff, 0xc0c0c0, 0x808080, 0x4682B4, 0x9932CC, 0x2E8B57
    ];
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
    this.zPosition += this.currentSpeed;
    this.mesh.position.z = this.zPosition;
  }
  
  // Set car as active and visible at a specific position
  activate(lane, zPosition, speed) {
    this.lane = lane;
    this.zPosition = zPosition;
    this.currentSpeed = speed;
    this.mesh.position.set(lane, 0.5, zPosition);
    this.mesh.visible = true;
    this.inUse = true;
  }
  
  // Hide car when not in use
  deactivate() {
    this.mesh.visible = false;
    this.inUse = false;
  }
}

export class TrafficManager {
  constructor(scene) {
    this.scene = scene;
    this.lanes = [-4.5, -1.5, 1.5, 4.5];
    
    // Visibility parameters
    this.visibleRange = 80;         // Distance ahead of player where cars are visible
    this.behindDistance = -20;      // Distance behind player where cars are hidden
    this.playerZPosition = 0;       // Current player Z position
    
    // Car pool parameters
    this.totalCarsPerBatch = 12;    // Total cars per batch (4 per lane)
    this.batches = 2;               // Number of batches to cycle through
    this.totalPoolSize = this.totalCarsPerBatch * this.batches; // Total cars in pool
    
    // Car positioning
    this.minDistanceBetweenCars = 20; // Minimum distance between cars in same lane - INCREASED for better spacing
    this.safetyDistance = 40;        // Minimum distance ahead of player for first car - INCREASED for more reaction time
    
    // Car pools
    this.carPool = [];              // All car objects
    this.activeCars = [];           // Currently visible/active cars
    
    // Distribution tracking
    this.carsPerLane = {};          // Track number of cars in each lane
    this.lanes.forEach(lane => this.carsPerLane[lane] = 0);
    
    // Lane filling control
    // ADDED: Max cars per lane to prevent all lanes being filled
    this.maxCarsPerLane = 2;        // Maximum number of cars allowed in each lane
    // ADDED: Some lanes will be kept emptier for overtaking
    this.preferredLanes = [this.lanes[1], this.lanes[2]]; // Middle lanes will have more traffic
    this.sparseTrafficLanes = [this.lanes[0], this.lanes[3]]; // Outside lanes will have less traffic
    
    // Initialize car pool
    this.initializeCarPool();
    
    // Create initial traffic pattern
    this.setupInitialTraffic();
  }
  
  // Create all car objects for the pool
  initializeCarPool() {
    for (let i = 0; i < this.totalPoolSize; i++) {
      const lane = this.lanes[i % this.lanes.length]; // Distribute evenly across lanes
      const car = new TrafficCar(lane);
      car.deactivate(); // Start hidden
      this.carPool.push(car);
      this.scene.add(car.mesh); // Add to scene even when hidden
    }
  }
  
  // Set up initial traffic pattern
  setupInitialTraffic() {
    // MODIFIED: Changed initial traffic to be sparser and have better spacing
    
    // First, select 2 random lanes to have traffic initially (leaving 2 lanes empty for overtaking)
    const initialTrafficLanes = this.preferredLanes.slice();
    
    // Place 1-2 cars in each selected lane at different distances
    for (let lane of initialTrafficLanes) {
      // MODIFIED: Reduced from 3 to 2 cars per lane
      const carsInThisLane = 1 + Math.floor(Math.random() * 2); // 1 or 2 cars
      
      for (let i = 0; i < carsInThisLane; i++) {
        // MODIFIED: Increased spacing between cars
        const distance = this.safetyDistance + (i * 35) + (Math.random() * 15);
        this.placeCarInLane(lane, this.playerZPosition + distance);
      }
    }
    
    // Place just 1 car in one of the sparse traffic lanes
    const randomSparseLane = this.sparseTrafficLanes[Math.floor(Math.random() * this.sparseTrafficLanes.length)];
    const distance = this.safetyDistance + 45 + (Math.random() * 20); // Further away
    this.placeCarInLane(randomSparseLane, this.playerZPosition + distance);
  }
  
  // Get an inactive car from the pool
  getAvailableCar() {
    for (let car of this.carPool) {
      if (!car.inUse) {
        return car;
      }
    }
    return null; // No cars available
  }
  
  // Calculate the furthest car position in a lane
  getFurthestCarPosition(lane) {
    let furthestZ = this.playerZPosition + this.safetyDistance;
    
    this.activeCars.forEach(car => {
      if (car.lane === lane && car.zPosition > furthestZ) {
        furthestZ = car.zPosition;
      }
    });
    
    return furthestZ;
  }
  
  // Place a car in a specific lane
  placeCarInLane(lane, zPosition) {
    // Get an available car from the pool
    const car = this.getAvailableCar();
    if (!car) return null; // No more cars available in pool
    
    // Check if position is already occupied
    const tooClose = this.activeCars.some(activeCar => 
      activeCar.lane === lane && 
      Math.abs(activeCar.zPosition - zPosition) < this.minDistanceBetweenCars
    );
    
    if (tooClose) return null;
    
    // MODIFIED: More variation in car speeds
    const speedFactor = 0.7 + (Math.random() * 0.5); // 0.7-1.2 speed multiplier (more variation)
    const speed = car.baseSpeed * speedFactor;
    
    // Activate and position the car
    car.activate(lane, zPosition, speed);
    
    // Add to active cars list
    this.activeCars.push(car);
    this.carsPerLane[lane]++;
    
    return car;
  }
  
  // Ensure proper traffic density in visible range
  ensureTrafficDensity() {
    // Reset car lane counter
    this.lanes.forEach(lane => this.carsPerLane[lane] = 0);
    
    // Count current cars in each lane
    this.activeCars.forEach(car => {
      if (car.inUse) {
        this.carsPerLane[car.lane]++;
      }
    });
    
    // MODIFIED: Adjust traffic density based on lane preferences
    
    // First handle preferred lanes (more traffic)
    for (let lane of this.preferredLanes) {
      // MODIFIED: Reduced maximum cars in preferred lanes
      if (this.carsPerLane[lane] < this.maxCarsPerLane) {
        // Calculate where to place the new car
        const furthestZ = this.getFurthestCarPosition(lane);
        
        // Position new car beyond the furthest one with increased spacing
        const newPosition = furthestZ + this.minDistanceBetweenCars + (Math.random() * 15);
        
        // Only spawn if within visible range
        if (newPosition <= this.playerZPosition + this.visibleRange) {
          this.placeCarInLane(lane, newPosition);
        }
      }
    }
    
    // Then handle sparse traffic lanes (less traffic)
    for (let lane of this.sparseTrafficLanes) {
      // MODIFIED: Keep sparse lanes emptier (only 1 car max)
      if (this.carsPerLane[lane] < 1 && Math.random() < 0.3) { // 30% chance to add a car
        const furthestZ = this.getFurthestCarPosition(lane);
        
        // Even greater spacing for sparse lanes
        const newPosition = furthestZ + this.minDistanceBetweenCars * 1.5 + (Math.random() * 20);
        
        // Only spawn if within visible range
        if (newPosition <= this.playerZPosition + this.visibleRange) {
          this.placeCarInLane(lane, newPosition);
        }
      }
    }
  }
  
  // Update car visibility based on player position
  updateVisibility() {
    // Check each active car
    for (let i = this.activeCars.length - 1; i >= 0; i--) {
      const car = this.activeCars[i];
      
      // If car is behind player's visibility range, recycle it
      if (car.zPosition < this.playerZPosition + this.behindDistance) {
        car.deactivate();
        this.carsPerLane[car.lane]--;
        this.activeCars.splice(i, 1);
      }
      // If car is beyond visible range ahead, recycle it
      else if (car.zPosition > this.playerZPosition + this.visibleRange) {
        car.deactivate();
        this.carsPerLane[car.lane]--;
        this.activeCars.splice(i, 1);
      }
    }
    
    // Add new cars to maintain density
    this.ensureTrafficDensity();
    
    // ADDED: Occasionally change lane preferences to create dynamic traffic patterns
    if (Math.random() < 0.005) { // 0.5% chance each frame to change lane preferences
      this.updateLanePreferences();
    }
  }
  
  // ADDED: New method to periodically change which lanes are preferred for traffic
  updateLanePreferences() {
    // Randomly select 2 lanes to be preferred (more traffic)
    const shuffledLanes = [...this.lanes].sort(() => 0.5 - Math.random());
    this.preferredLanes = shuffledLanes.slice(0, 2);
    this.sparseTrafficLanes = shuffledLanes.slice(2, 4);
  }
  
  // Main update method called each frame
  update(playerSpeed, playerPosition = null) {
    // Update player position
    if (playerPosition) {
      this.playerZPosition = playerPosition.z;
    } else {
      this.playerZPosition += playerSpeed;
    }
    
    // Update active cars
    for (let car of this.activeCars) {
      car.update(playerSpeed);
    }
    
    // Check visibility and recycle cars
    this.updateVisibility();
  }
} 