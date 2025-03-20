import * as THREE from 'three';

export class PlayerCar {
  constructor() {
    this.speed = 0;
    this.maxSpeed = 0.5;
    this.acceleration = 0.01;
    this.brakeForce = 0.03;
    this.deceleration = 0.005;
    this.turnSpeed = 0.20;
    
    this.mesh = this.createCarMesh();
    this.mesh.position.set(0, 0.5, 0);
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
    
    return car;
  }
  
  update(left, right, brake) {
    // If the brake (Down arrow) is pressed, force speed to zero
    if (brake) {
      this.speed = 0;
    } else {
      // Auto acceleration when not braking
      this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration);
      // Natural deceleration
      this.speed = Math.max(0, this.speed - this.deceleration);
    }
    
    // Steering boundaries: increase from ±3.5 to ±6
    if (left) {
      this.mesh.position.x = Math.max(-6, this.mesh.position.x - this.turnSpeed);
    }
    if (right) {
      this.mesh.position.x = Math.min(6, this.mesh.position.x + this.turnSpeed);
    }
  }
} 