import * as THREE from 'three';

export class Road {
  constructor() {
    this.segments = [];
    this.segmentLength = 20;
    this.numSegments = 500;
    this.roadWidth = 16;
    this.laneWidth = 4;
    this.speed = 0.4;
    
    this.mesh = new THREE.Group();
    
    // Create initial road segments
    this.createInitialRoad();
  }
  
  createRoadSegment(position) {
    const segment = new THREE.Group();
    
    // Road base
    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength);
    const roadMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x333333, 
      side: THREE.DoubleSide 
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = Math.PI / 2;
    road.position.set(0, 0, position + this.segmentLength / 2);
    road.receiveShadow = true;
    segment.add(road);
    
    // Road markings
    this.addRoadMarkings(segment, position);
    
    // Road sides (grass)
    this.addRoadSides(segment, position);
    
    return segment;
  }
  
  addRoadMarkings(segment, position) {
    // Center line
    const centerLineGeometry = new THREE.PlaneGeometry(0.2, this.segmentLength);
    const centerLineMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, 
      side: THREE.DoubleSide 
    });
    const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
    centerLine.rotation.x = Math.PI / 2;
    centerLine.position.set(0, 0.01, position + this.segmentLength / 2);
    segment.add(centerLine);
    
    // Left lane divider
    const leftLineGeometry = new THREE.PlaneGeometry(0.2, this.segmentLength);
    const leftLine = new THREE.Mesh(leftLineGeometry, centerLineMaterial);
    leftLine.rotation.x = Math.PI / 2;
    leftLine.position.set(-this.laneWidth, 0.01, position + this.segmentLength / 2);
    segment.add(leftLine);
    
    // Right lane divider
    const rightLineGeometry = new THREE.PlaneGeometry(0.2, this.segmentLength);
    const rightLine = new THREE.Mesh(rightLineGeometry, centerLineMaterial);
    rightLine.rotation.x = Math.PI / 2;
    rightLine.position.set(this.laneWidth, 0.01, position + this.segmentLength / 2);
    segment.add(rightLine);
    
    // Add dashed lines for each lane
    const dashCount = 10;
    const dashLength = this.segmentLength / dashCount;
    const dashWidth = 0.2;
    const dashGap = dashLength / 2;
    
    // Left dashed line
    for (let i = 0; i < dashCount; i++) {
      if (i % 2 === 0) { // Only add on even numbers for dashed effect
        const dashGeometry = new THREE.PlaneGeometry(dashWidth, dashLength - dashGap);
        const dash = new THREE.Mesh(dashGeometry, centerLineMaterial);
        dash.rotation.x = Math.PI / 2;
        dash.position.set(-this.laneWidth / 2, 0.01, position + i * dashLength + dashLength / 2);
        segment.add(dash);
      }
    }
    
    // Right dashed line
    for (let i = 0; i < dashCount; i++) {
      if (i % 2 === 0) {
        const dashGeometry = new THREE.PlaneGeometry(dashWidth, dashLength - dashGap);
        const dash = new THREE.Mesh(dashGeometry, centerLineMaterial);
        dash.rotation.x = Math.PI / 2;
        dash.position.set(this.laneWidth / 2, 0.01, position + i * dashLength + dashLength / 2);
        segment.add(dash);
      }
    }
  }
  
  addRoadSides(segment, position) {
    // Grass on sides
    const sideWidth = 15;
    
    // Left grass
    const leftGrassGeometry = new THREE.PlaneGeometry(sideWidth, this.segmentLength);
    const grassMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x1e7a1e, 
      side: THREE.DoubleSide 
    });
    const leftGrass = new THREE.Mesh(leftGrassGeometry, grassMaterial);
    leftGrass.rotation.x = Math.PI / 2;
    leftGrass.position.set(-this.roadWidth / 2 - sideWidth / 2, -0.01, position + this.segmentLength / 2);
    segment.add(leftGrass);
    
    // Right grass
    const rightGrassGeometry = new THREE.PlaneGeometry(sideWidth, this.segmentLength);
    const rightGrass = new THREE.Mesh(rightGrassGeometry, grassMaterial);
    rightGrass.rotation.x = Math.PI / 2;
    rightGrass.position.set(this.roadWidth / 2 + sideWidth / 2, -0.01, position + this.segmentLength / 2);
    segment.add(rightGrass);
    
    // Add trees and buildings on the left side
    this.addTreesAndBuildings(segment, position, -1);
    
    // Add trees and buildings on the right side
    this.addTreesAndBuildings(segment, position, 1);
  }
  
  addTreesAndBuildings(segment, position, side) {
    // side is -1 for left, 1 for right
    const offsetX = side * (this.roadWidth / 2 + 3);
    const startZ = position;
    const endZ = position + this.segmentLength;
    
    // Add trees
    for (let z = startZ + 5; z < endZ; z += 10) {
      if (Math.random() < 0.3) {
        const x = offsetX + (Math.random() - 0.5) * 8;
        segment.add(this.createTree(x, z));
      }
    }
    
    // Add buildings
    if (Math.random() < 0.15) {
      const x = offsetX + (Math.random() - 0.5) * 5;
      const z = startZ + Math.random() * this.segmentLength;
      segment.add(this.createBuilding(x, z));
    }
  }
  
  createTree(x, z) {
    const tree = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(0, 1, 0);
    trunk.castShadow = true;
    tree.add(trunk);
    
    // Tree top
    if (Math.random() > 0.5) {
      // Pine tree
      const topGeometry = new THREE.ConeGeometry(1.5, 3, 8);
      const topMaterial = new THREE.MeshPhongMaterial({ color: 0x2d4c1e });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.set(0, 3, 0);
      top.castShadow = true;
      tree.add(top);
    } else {
      // Round tree
      const topGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      const topMaterial = new THREE.MeshPhongMaterial({ color: 0x2e8b57 });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.set(0, 3, 0);
      top.castShadow = true;
      tree.add(top);
    }
    
    tree.position.set(x, 0, z);
    return tree;
  }
  
  createBuilding(x, z) {
    const building = new THREE.Group();
    
    // Random building dimensions
    const width = 2 + Math.random() * 3;
    const depth = 2 + Math.random() * 3;
    const height = 2 + Math.random() * 5;
    
    // Building colors
    const colors = [0xd3b8a3, 0xa9a9a9, 0xf5f5dc, 0xbdb76b, 0xcd853f];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    if (Math.random() > 0.5) {
      // House with sloped roof
      const baseGeometry = new THREE.BoxGeometry(width, height * 0.7, depth);
      const baseMaterial = new THREE.MeshPhongMaterial({ color: color });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = height * 0.35;
      base.castShadow = true;
      building.add(base);
      
      // Roof
      const roofGeometry = new THREE.ConeGeometry(Math.sqrt(width*width + depth*depth) / 2, height * 0.5, 4);
      const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = height * 0.7 + height * 0.25;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      building.add(roof);
    } else {
      // Commercial building
      const baseGeometry = new THREE.BoxGeometry(width, height, depth);
      const baseMaterial = new THREE.MeshPhongMaterial({ color: color });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = height / 2;
      base.castShadow = true;
      building.add(base);
      
      // Add simple windows
      const windowMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x87ceeb,
        emissive: Math.random() > 0.5 ? 0x555555 : 0
      });
      
      // Front windows
      const windowSize = 0.4;
      const windowRows = Math.floor(height / windowSize / 1.5);
      const windowCols = Math.floor(width / windowSize / 1.5);
      
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          if (Math.random() > 0.3) {
            const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
            const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
            windowMesh.position.set(
              (col - (windowCols-1)/2) * windowSize * 1.5,
              (row + 1) * windowSize * 1.5,
              depth/2 + 0.01
            );
            building.add(windowMesh);
          }
        }
      }
    }
    
    building.position.set(x, 0, z);
    return building;
  }
  
  createInitialRoad() {
    // Create a continuous road with segments spanning before and after the player
    // Make sure we have plenty of segments behind and ahead of the player
    // Position segments to have about 1/4 behind the player and 3/4 ahead
    const startOffset = -this.segmentLength * (this.numSegments / 4);
    
    for (let i = 0; i < this.numSegments; i++) {
      const segment = this.createRoadSegment(startOffset + i * this.segmentLength);
      this.segments.push(segment);
      this.mesh.add(segment);
    }
  }
  
  update() {
    // Road stays stationary - no movement needed
    return;
  }
}