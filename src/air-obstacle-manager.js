import * as THREE from 'three';

class Explosion {
    constructor(position, scene) {
        this.scene = scene;
        this.particles = [];
        this.lifetime = 30; // Frames the explosion lasts
        this.timer = 0;
        
        this.createExplosion(position);
    }
    
    createExplosion(position) {
        // Create explosion particles
        const particleCount = 15;
        const particleColors = [0xFF4500, 0xFF8C00, 0xFFD700, 0xFF0000];
        
        for (let i = 0; i < particleCount; i++) {
            // Particle geometry and material
            const size = 0.2 + Math.random() * 0.6;
            const geometry = new THREE.SphereGeometry(size, 8, 8);
            const color = particleColors[Math.floor(Math.random() * particleColors.length)];
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1.0
            });
            
            // Create mesh and add to scene
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            // Random direction and speed
            const speed = 0.2 + Math.random() * 0.3;
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI;
            
            particle.velocity = new THREE.Vector3(
                speed * Math.sin(angle) * Math.sin(elevation),
                speed * Math.cos(elevation),
                speed * Math.cos(angle) * Math.sin(elevation)
            );
            
            this.particles.push(particle);
            this.scene.add(particle);
        }
    }
    
    update() {
        this.timer++;
        
        // Update each particle
        for (const particle of this.particles) {
            // Move particle
            particle.position.add(particle.velocity);
            
            // Apply gravity
            particle.velocity.y -= 0.01;
            
            // Fade out
            const fadeStart = this.lifetime * 0.6;
            if (this.timer > fadeStart) {
                particle.material.opacity = 1.0 - ((this.timer - fadeStart) / (this.lifetime - fadeStart));
            }
        }
        
        // Return true when explosion is complete
        return this.timer >= this.lifetime;
    }
    
    remove() {
        // Clean up all particles
        for (const particle of this.particles) {
            this.scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        }
        this.particles = [];
    }
}

class Projectile {
    constructor(position, targetPosition, playerZSpeed) {
        // Create a larger projectile mesh
        this.mesh = this.createProjectileMesh();
        this.mesh.position.copy(position);
        // Store initial position
        this.initialPosition = position.clone();
        // Store target position
        this.targetPosition = targetPosition.clone();
        // Store player's current speed
        this.playerZSpeed = playerZSpeed;
        // Calculate direction vector
        this.direction = new THREE.Vector3()
            .subVectors(this.targetPosition, this.initialPosition)
            .normalize();
        this.speed = 1.5;
        this.timeAlive = 0;
        this.maxLifetime = 100; // frames before auto-removal
        this.trackingFactor = 0.03; // How much the projectile corrects its course
    }

    createProjectileMesh() {
        const projectile = new THREE.Group();

        // Fire ball core - make it larger
        const coreGeometry = new THREE.SphereGeometry(0.8, 8, 8); // Increased from 0.5
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF4500,
            emissive: 0xFF4500,
            emissiveIntensity: 0.7
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        projectile.add(core);

        // Outer glow - make it larger
        const glowGeometry = new THREE.SphereGeometry(1.2, 8, 8); // Increased from 0.8
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF8C00,
            transparent: true,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        projectile.add(glow);

        // Fire trail - make it larger
        const trailGeometry = new THREE.ConeGeometry(0.6, 1.8, 8); // Increased from 0.4, 1.2
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF8C00,
            transparent: true,
            opacity: 0.6
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.z = -1.2;
        trail.rotation.x = Math.PI;
        projectile.add(trail);

        return projectile;
    }

    update(playerSpeed) {
        // Move projectile toward target
        this.mesh.position.add(
            this.direction.clone().multiplyScalar(this.speed)
        );
        
        // Get our current speed delta (if player speed changed)
        const speedDelta = playerSpeed - this.playerZSpeed;
        this.playerZSpeed = playerSpeed;
        
        // Adjust position for player's forward movement
        this.mesh.position.z -= playerSpeed;
        
        // Create a pulsing effect for better visibility
        const pulseScale = 1 + Math.sin(this.timeAlive * 0.2) * 0.1;
        this.mesh.scale.set(pulseScale, pulseScale, pulseScale);
        
        // Rotate the projectile
        this.mesh.rotation.z += 0.1;
        
        // Increase lifetime
        this.timeAlive++;
        
        // Return true if projectile should be removed
        return this.timeAlive > this.maxLifetime || this.mesh.position.y < 0;
    }
}

class AirEnemy {
    constructor() {
        this.mesh = this.createEnemyMesh();
        // Position above and ahead of player
        this.mesh.position.set(0, 15, 20);
        this.active = false;
        
        // Projectile properties
        this.projectiles = [];
        this.fireRate = 60; // frames between shots
        this.fireCounter = 0;
        this.scene = null; // Will be set by the manager
        
        // Relative position to maintain from player
        this.zOffset = 20; // Stay ahead of player
        
        // Movement properties
        this.horizontalSpeed = 0.15;
        this.verticalSpeed = 0.05;
        this.horizontalDirection = 1; // 1 = right, -1 = left
        this.verticalDirection = 1; // 1 = up, -1 = down
        this.leftBoundary = -12;
        this.rightBoundary = 12;
        this.topBoundary = 20;
        this.bottomBoundary = 10;
        
        // Advanced movement pattern
        this.movementPattern = 'patrol'; // 'patrol', 'hover', 'chase'
        this.patternChangeCounter = 0;
        this.patternChangeDuration = 300; // Change movement pattern every 300 frames (5 seconds)
        this.targetPosition = new THREE.Vector3(0, 15, 20); // For hover movement
        this.hoverRadius = 5; // Hover movement radius
        this.hoverSpeed = 0.02; // Hover movement speed
        this.hoverAngle = 0;
    }

    createEnemyMesh() {
        const enemy = new THREE.Group();

        // Choose between helicopter or monster
        if (Math.random() > 0.5) {
            // Create helicopter
            this.createHelicopter(enemy);
        } else {
            // Create monster
            this.createMonster(enemy);
        }

        return enemy;
    }

    createHelicopter(group) {
        // Main body - changed color from dark gray to vibrant blue
        const bodyGeometry = new THREE.CylinderGeometry(1, 1.5, 4, 8);
        bodyGeometry.rotateZ(Math.PI / 2);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x0088FF,  // Changed from 0x333333 to bright blue
            emissive: 0x003366,
            emissiveIntensity: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(1.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.7
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(2, 0, 0);
        cockpit.rotation.z = Math.PI / 2;
        group.add(cockpit);

        // Main rotor
        const rotorGroup = new THREE.Group();
        const rotorGeometry = new THREE.BoxGeometry(8, 0.2, 0.4);
        const rotorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xCCCCCC,  // Lighter color for better visibility
            emissive: 0x555555,
            emissiveIntensity: 0.2
        });
        const rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
        rotorGroup.add(rotor);
        rotorGroup.position.set(0, 1.5, 0);
        
        // Store rotor for animation
        this.rotor = rotorGroup;
        group.add(rotorGroup);

        // Tail
        const tailGeometry = new THREE.CylinderGeometry(0.3, 0.6, 4, 8);
        tailGeometry.rotateZ(Math.PI / 2);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(-3, 0, 0);
        group.add(tail);

        // Tail rotor
        const tailRotorGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.1);
        const tailRotor = new THREE.Mesh(tailRotorGeometry, rotorMaterial);
        tailRotor.position.set(-5, 0, 0);
        group.add(tailRotor);

        // Gun/weapon - add a bright red tip to make it more visible
        const gunGeometry = new THREE.BoxGeometry(0.5, 0.5, 2);
        const gunMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x555555 
        });
        const gun = new THREE.Mesh(gunGeometry, gunMaterial);
        gun.position.set(0, -1, 1);
        group.add(gun);
        
        // Gun tip with glowing red
        const gunTipGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const gunTipMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.8
        });
        const gunTip = new THREE.Mesh(gunTipGeometry, gunTipMaterial);
        gunTip.position.set(0, -1, 2);
        group.add(gunTip);

        group.rotation.y = Math.PI / 2; // Face forward
    }

    createMonster(group) {
        // Body
        const bodyGeometry = new THREE.SphereGeometry(2, 8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        // Eyes (add two glowing eyes)
        const eyeGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFF00,
            emissive: 0xFFFF00,
            emissiveIntensity: 0.7
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.8, 0.6, 1.5);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.8, 0.6, 1.5);
        group.add(rightEye);

        // Wings
        const wingGeometry = new THREE.BoxGeometry(4, 0.2, 1.5);
        const wingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000,
            roughness: 0.7
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(3, 0, 0);
        leftWing.rotation.z = Math.PI / 6;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(-3, 0, 0);
        rightWing.rotation.z = -Math.PI / 6;
        group.add(rightWing);

        // Mouth/fire emitter
        const mouthGeometry = new THREE.ConeGeometry(0.8, 1.5, 8);
        const mouthMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000,
            emissive: 0xFF4500,
            emissiveIntensity: 0.3
        });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.5, 2);
        mouth.rotation.x = -Math.PI / 2;
        group.add(mouth);
        
        // Horns
        const hornGeometry = new THREE.ConeGeometry(0.3, 1, 8);
        const hornMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(1, 1.5, 0.5);
        leftHorn.rotation.x = -Math.PI / 4;
        group.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(-1, 1.5, 0.5);
        rightHorn.rotation.x = -Math.PI / 4;
        group.add(rightHorn);

        // Store wings for animation
        this.leftWing = leftWing;
        this.rightWing = rightWing;

        group.rotation.y = Math.PI; // Face forward
    }

    fireProjectile(playerPosition, audioManager) {
        // Create starting position for projectile, slightly in front of the enemy
        const startPosition = this.mesh.position.clone();
        startPosition.z += 2;
        
        // Create target position based on player's current position
        // We adjust y to be at the player's height
        const targetPosition = playerPosition.clone();
        targetPosition.y = 0.5;
        
        // Add lead targeting - aim ahead of the player based on their position
        // This makes the projectile more likely to hit the player
        const leadDistance = 5.0;  // How far ahead to aim
        targetPosition.z += leadDistance;
        
        // Add slight randomization to x-position to increase hit chances
        targetPosition.x += (Math.random() * 2 - 1); // +/- 1 unit
        
        // Create new projectile, passing player's current speed
        const projectile = new Projectile(startPosition, targetPosition, 0);
        this.projectiles.push(projectile);
        
        // Play projectile fire sound
        if (audioManager) {
            audioManager.play('projectileFire');
        }
        
        return projectile.mesh;
    }

    updateMovementPattern() {
        this.patternChangeCounter++;
        
        // Change movement pattern periodically
        if (this.patternChangeCounter >= this.patternChangeDuration) {
            const patterns = ['patrol', 'hover', 'chase'];
            // Choose a different pattern than current
            let newPattern;
            do {
                newPattern = patterns[Math.floor(Math.random() * patterns.length)];
            } while (newPattern === this.movementPattern);
            
            this.movementPattern = newPattern;
            this.patternChangeCounter = 0;
            
            // Reset hover angle when switching to hover
            if (this.movementPattern === 'hover') {
                this.hoverAngle = 0;
            }
        }
    }
    
    movePatrol() {
        // Simple side-to-side with up and down movement
        this.mesh.position.x += this.horizontalSpeed * this.horizontalDirection;
        this.mesh.position.y += this.verticalSpeed * this.verticalDirection;
        
        // Change direction when hitting boundaries
        if (this.mesh.position.x > this.rightBoundary) {
            this.horizontalDirection = -1;
        } else if (this.mesh.position.x < this.leftBoundary) {
            this.horizontalDirection = 1;
        }
        
        if (this.mesh.position.y > this.topBoundary) {
            this.verticalDirection = -1;
        } else if (this.mesh.position.y < this.bottomBoundary) {
            this.verticalDirection = 1;
        }
    }
    
    moveHover() {
        // Circular hovering motion
        this.hoverAngle += this.hoverSpeed;
        
        // Calculate new position in a circular pattern
        const centerX = this.targetPosition.x;
        const centerY = this.targetPosition.y;
        
        this.mesh.position.x = centerX + this.hoverRadius * Math.cos(this.hoverAngle);
        this.mesh.position.y = centerY + this.hoverRadius * Math.sin(this.hoverAngle) * 0.5; // Elliptical
    }
    
    moveChase(playerPosition) {
        // Move toward player's x position at a slower pace
        const targetX = playerPosition.x;
        const diffX = targetX - this.mesh.position.x;
        
        // Move toward player's x position, with damping
        if (Math.abs(diffX) > 0.1) {
            this.mesh.position.x += diffX * 0.02;
        }
        
        // Keep within boundaries
        this.mesh.position.x = Math.max(this.leftBoundary, 
                               Math.min(this.rightBoundary, this.mesh.position.x));
        
        // Add slight up and down movement
        this.mesh.position.y += Math.sin(Date.now() * 0.001) * 0.05;
        
        // Keep within vertical boundaries
        this.mesh.position.y = Math.max(this.bottomBoundary, 
                               Math.min(this.topBoundary, this.mesh.position.y));
    }
    
    update(playerPosition, playerSpeed, audioManager) {
        if (!this.active) return [];
        
        // Update movement pattern
        this.updateMovementPattern();
        
        // Apply current movement pattern
        switch (this.movementPattern) {
            case 'patrol':
                this.movePatrol();
                break;
            case 'hover':
                this.moveHover();
                break;
            case 'chase':
                this.moveChase(playerPosition);
                break;
        }
        
        // Keep enemy at a fixed z-offset relative to player
        this.mesh.position.z = playerPosition.z + this.zOffset;
        
        // Update helicopter rotor or monster wings
        if (this.rotor) {
            this.rotor.rotation.y += 0.2;
        }
        
        if (this.leftWing && this.rightWing) {
            this.leftWing.rotation.z = Math.PI / 6 + Math.sin(Date.now() * 0.01) * 0.2;
            this.rightWing.rotation.z = -Math.PI / 6 - Math.sin(Date.now() * 0.01) * 0.2;
        }
        
        // Fire counter
        this.fireCounter++;
        
        // Check if we should fire
        const newMeshes = [];
        if (this.fireCounter >= this.fireRate) {
            // Fire a projectile at player's current position
            const projectileMesh = this.fireProjectile(playerPosition, audioManager);
            newMeshes.push(projectileMesh);
            this.fireCounter = 0;
            
            // Shorter delay between shots when in chase mode
            if (this.movementPattern === 'chase') {
                this.fireRate = 40;
            } else {
                this.fireRate = 60;
            }
        }
        
        // Update all projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const remove = projectile.update(playerSpeed);
            
            if (remove && this.scene) {
                this.scene.remove(projectile.mesh);
                this.projectiles.splice(i, 1);
            }
        }
        
        return newMeshes;
    }
}

export class AirObstacleManager {
    constructor(scene, audioManager) {
        this.scene = scene;
        this.audioManager = audioManager;
        this.enemy = new AirEnemy();
        this.enemy.scene = scene;
        this.scene.add(this.enemy.mesh);
        this.active = false;
        
        // Score thresholds for enemy appearance
        this.scoreThresholdAppear = 100;
        this.scoreThresholdDisappear = 2500;
        
        // Add warning message when enemy appears
        this.warningElement = document.getElementById('enemy-warning');
        this.warningShown = false;
        
        // Create warning message that will appear when obstacle is first activated
        this.createWarningMessage();
        
        // Track explosions
        this.explosions = [];
    }
    
    createWarningMessage() {
        // Create a canvas for the warning text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        // Fill with semi-transparent red background
        context.fillStyle = 'rgba(255, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        context.fillStyle = 'white';
        context.font = 'bold 36px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('WARNING! ENEMY ATTACKING!', canvas.width/2, canvas.height/2);
        
        // Create sprite from canvas
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0
        });
        
        this.warningSprite = new THREE.Sprite(material);
        this.warningSprite.scale.set(20, 5, 1);
        this.warningSprite.position.set(0, 5, 20); // Position it in front of the player
        this.scene.add(this.warningSprite);
        
        // Warning display properties
        this.warningTimer = 0;
        this.warningDuration = 120; // Show for 120 frames (about 2 seconds)
        this.warningActive = false;
    }
    
    updateWarningMessage() {
        if (this.warningActive) {
            this.warningTimer++;
            
            if (this.warningTimer <= 15) {
                // Fade in
                this.warningSprite.material.opacity = this.warningTimer / 15;
            } else if (this.warningTimer > this.warningDuration - 15) {
                // Fade out
                this.warningSprite.material.opacity = (this.warningDuration - this.warningTimer) / 15;
            }
            
            if (this.warningTimer >= this.warningDuration) {
                this.warningActive = false;
                this.warningSprite.material.opacity = 0;
            }
        }
    }
    
    showWarning() {
        this.warningActive = true;
        this.warningTimer = 0;
        this.warningShown = true;
        if (this.audioManager) {
            this.audioManager.play('projectileFire'); // Use fire sound as warning sound
        }
    }
    
    createExplosion(position) {
        const explosion = new Explosion(position, this.scene);
        this.explosions.push(explosion);
    }
    
    updateExplosions() {
        // Update and remove completed explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            const isComplete = explosion.update();
            
            if (isComplete) {
                explosion.remove();
                this.explosions.splice(i, 1);
            }
        }
    }
    
    update(playerPosition, playerSpeed, score) {
        // Check if we should activate/deactivate based on score
        if (score >= this.scoreThresholdAppear && score < this.scoreThresholdDisappear) {
            if (!this.active) {
                this.active = true;
                this.enemy.active = true;
                this.enemy.mesh.visible = true;
                
                // Set initial z-position relative to player
                this.enemy.mesh.position.z = playerPosition.z + this.enemy.zOffset;
                
                // Update target position for hover
                this.enemy.targetPosition.z = playerPosition.z + this.enemy.zOffset;
                
                // Show HUD warning
                if (this.warningElement) {
                    this.warningElement.classList.add('active');
                }
                
                if (!this.warningShown) {
                    this.showWarning();
                    this.warningShown = true;
                }
            }
        } else {
            if (this.active) {
                this.active = false;
                this.enemy.active = false;
                this.enemy.mesh.visible = false;
                
                // Hide HUD warning
                if (this.warningElement) {
                    this.warningElement.classList.remove('active');
                }
                
                // Remove all projectiles when deactivated
                for (const projectile of this.enemy.projectiles) {
                    this.scene.remove(projectile.mesh);
                }
                this.enemy.projectiles = [];
            }
            
            // Still update any remaining explosions
            this.updateExplosions();
            return;
        }
        
        // Update warning position to stay relative to player
        if (this.warningActive) {
            this.warningSprite.position.z = playerPosition.z + 20;
        }
        
        // Update warning message
        this.updateWarningMessage();
        
        // Update enemy and get any new projectiles
        const newProjectileMeshes = this.enemy.update(playerPosition, playerSpeed, this.audioManager);
        
        // Add new projectiles to scene
        for (const mesh of newProjectileMeshes) {
            this.scene.add(mesh);
        }
        
        // Check if any projectiles hit the ground
        for (let i = this.enemy.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.enemy.projectiles[i];
            
            if (projectile.mesh.position.y <= 0) {
                // Create explosion at impact position
                this.createExplosion(projectile.mesh.position.clone());
                
                // Remove projectile
                this.scene.remove(projectile.mesh);
                this.enemy.projectiles.splice(i, 1);
            }
        }
        
        // Update explosions
        this.updateExplosions();
    }
    
    checkCollision(playerBox) {
        if (!this.active) return 0;
        
        // Check each projectile for collision with player
        for (let i = this.enemy.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.enemy.projectiles[i];
            
            // Create a slightly larger box for projectile to improve hit detection
            const projectileBox = new THREE.Box3().setFromObject(projectile.mesh);
            // Expand the box slightly to increase hit chances
            projectileBox.expandByScalar(0.5);
            
            // Get distance between projectile and player for proximity check
            const projectilePos = new THREE.Vector3();
            projectileBox.getCenter(projectilePos);
            
            // Distance-based collision detection (if close enough, consider it a hit)
            const playerPos = new THREE.Vector3();
            playerBox.getCenter(playerPos);
            const distance = projectilePos.distanceTo(playerPos);
            
            // Check for collision - either box intersection or close proximity
            if (playerBox.intersectsBox(projectileBox) || distance < 2.5) {
                // Create explosion at impact position
                this.createExplosion(projectile.mesh.position.clone());
                
                // Hit by projectile - remove it
                this.scene.remove(projectile.mesh);
                this.enemy.projectiles.splice(i, 1);
                
                // Play hit sound
                if (this.audioManager) {
                    this.audioManager.play('projectileHit');
                }
                
                // Log hit for debugging
                console.log("Projectile hit player! Distance:", distance);
                
                return 10; // Return damage amount
            }
        }
        
        return 0; // No damage
    }
} 