import * as THREE from 'three';

export class PlayerCar {
  constructor() {
    this.speed = 0;
    this.maxSpeed = 2.0;  // Increased max speed
    this.minSpeed = 0.5;  // Minimum forward speed
    this.acceleration = 0.05;
    this.brakeForce = 0.1;
    this.deceleration = 0.03;
    this.turnSpeed = 0.20;
    this.zPosition = 0;   // Track Z position for forward movement
    
    this.health = 100;    // Player health/damage variable
    this.isHit = false;   // Flag to track hit state
    this.hitAnimationTime = 0; // Timer for hit animation
    this.hitAnimationDuration = 20; // Duration in frames
    
    this.mesh = this.createCarMesh();
    this.mesh.position.set(0, 0.5, 0);
    
    // Create hit effect (initially invisible)
    this.hitEffect = this.createHitEffect();
    this.hitEffect.visible = false;
    this.mesh.add(this.hitEffect);
  }
  
  createCarMesh() {
    // Create a simple car using primitive shapes
    const car = new THREE.Group();
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x3333ff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    car.add(body);
    
    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.5, 0.7, 2);
    const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x3333ff });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1.35;
    roof.position.z = -0.5;
    roof.castShadow = true;
    car.add(roof);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    // Front left wheel
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.rotation.z = Math.PI / 2;
    frontLeftWheel.position.set(-1.1, 0.5, 1.2);
    car.add(frontLeftWheel);
    
    // Front right wheel
    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.rotation.z = Math.PI / 2;
    frontRightWheel.position.set(1.1, 0.5, 1.2);
    car.add(frontRightWheel);
    
    // Rear left wheel
    const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearLeftWheel.rotation.z = Math.PI / 2;
    rearLeftWheel.position.set(-1.1, 0.5, -1.2);
    car.add(rearLeftWheel);
    
    // Rear right wheel
    const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearRightWheel.rotation.z = Math.PI / 2;
    rearRightWheel.position.set(1.1, 0.5, -1.2);
    car.add(rearRightWheel);
    
    // Headlights
    const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const headlightMaterial = new THREE.MeshPhongMaterial({ color: 0xffffcc, emissive: 0xffffcc });
    
    // Left headlight
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.6, 0.5, 2);
    car.add(leftHeadlight);
    
    // Right headlight
    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(0.6, 0.5, 2);
    car.add(rightHeadlight);

    const taillightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const taillightMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000, 
        emissive: 0xff0000 
    });
    
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
  
  createHitEffect() {
    // Create a fire/damage effect
    const hitGroup = new THREE.Group();
    
    // Create several fire particles
    const particleCount = 8;
    const fireColors = [0xff4500, 0xff5500, 0xff6600, 0xff7700]; // Orange-red fire colors
    
    for (let i = 0; i < particleCount; i++) {
      const size = 0.2 + Math.random() * 0.3;
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({ 
        color: fireColors[Math.floor(Math.random() * fireColors.length)],
        transparent: true,
        opacity: 0.8
      });
      
      const particle = new THREE.Mesh(geometry, material);
      
      // Random position on top of the car
      particle.position.set(
        (Math.random() - 0.5) * 2,
        1 + Math.random() * 0.5,
        (Math.random() - 0.5) * 4
      );
      
      hitGroup.add(particle);
    }
    
    // Add smoke particles
    for (let i = 0; i < particleCount / 2; i++) {
      const size = 0.3 + Math.random() * 0.4;
      const geometry = new THREE.SphereGeometry(size, 8, 8);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x555555,
        transparent: true,
        opacity: 0.5
      });
      
      const smoke = new THREE.Mesh(geometry, material);
      
      // Position smoke slightly above fire
      smoke.position.set(
        (Math.random() - 0.5) * 2,
        1.5 + Math.random() * 0.5,
        (Math.random() - 0.5) * 4
      );
      
      hitGroup.add(smoke);
    }
    
    return hitGroup;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.isHit = true;
    this.hitAnimationTime = 0;
    this.hitEffect.visible = true;
    
    // Make hit effect children random each time
    this.hitEffect.children.forEach(particle => {
      particle.position.set(
        (Math.random() - 0.5) * 2,
        1 + Math.random() * 0.5,
        (Math.random() - 0.5) * 4
      );
      
      if (particle.material.color.r > 0.5) { // It's a fire particle
        particle.scale.set(
          0.8 + Math.random() * 0.4,
          0.8 + Math.random() * 0.4,
          0.8 + Math.random() * 0.4
        );
      }
    });
    
    return this.health <= 0; // Return true if player is dead
  }
  
  update(left, right, brake, accelerate) {
    // Handle acceleration (Up arrow)
    if (accelerate) {
      this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
    } else if (brake) {
      // When braking, stop the car completely
      this.speed = 0.1;
    } else {
      // Natural deceleration to minimum speed
      this.speed = Math.max(
        this.minSpeed, 
        this.speed - this.deceleration
      );
    }

    // Move forward (positive Z is forward)
    this.zPosition += this.speed;
    this.mesh.position.z = this.zPosition;
    
    // Steering boundaries
    if (left) {
      this.mesh.position.x = Math.max(-6, this.mesh.position.x - this.turnSpeed);
    }
    if (right) {
      this.mesh.position.x = Math.min(6, this.mesh.position.x + this.turnSpeed);
    }
    
    // Update hit animation if active
    if (this.isHit) {
      this.hitAnimationTime++;
      
      // Animate hit effect (pulsate and fade)
      this.hitEffect.children.forEach(particle => {
        if (particle.material.color.r > 0.5) { // It's a fire particle
          particle.scale.x = 0.8 + Math.sin(this.hitAnimationTime * 0.2) * 0.2;
          particle.scale.y = 0.8 + Math.sin(this.hitAnimationTime * 0.2) * 0.2;
          particle.scale.z = 0.8 + Math.sin(this.hitAnimationTime * 0.2) * 0.2;
          particle.position.y += 0.02; // Move up
        } else { // It's smoke
          particle.position.y += 0.03; // Move up faster
          particle.material.opacity = Math.max(0, 0.5 - (this.hitAnimationTime / this.hitAnimationDuration) * 0.5);
        }
      });
      
      // End animation after duration
      if (this.hitAnimationTime >= this.hitAnimationDuration) {
        this.isHit = false;
        this.hitEffect.visible = false;
      }
    }
  }
} 