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

        // Fire ball core - make it larger and more fiery
        const coreGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF2200,
            emissive: 0xFF2200,
            emissiveIntensity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        projectile.add(core);

        // Outer glow - make it larger
        const glowGeometry = new THREE.SphereGeometry(1.2, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF6600,
            transparent: true,
            opacity: 0.5
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        projectile.add(glow);

        // Fire trail - make it larger and more dramatic
        const trailGeometry = new THREE.ConeGeometry(0.7, 2.2, 8);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF6600,
            transparent: true,
            opacity: 0.7
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.z = -1.4;
        trail.rotation.x = Math.PI;
        projectile.add(trail);

        // Add additional embers/sparks for a more dynamic fire effect
        for (let i = 0; i < 5; i++) {
            const emberGeometry = new THREE.SphereGeometry(0.3, 6, 6);
            const emberMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFAA00,
                transparent: true,
                opacity: 0.6
            });
            const ember = new THREE.Mesh(emberGeometry, emberMaterial);
            
            // Random positions around the core
            ember.position.set(
                (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 0.8
            );
            projectile.add(ember);
        }

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

        // Always create the dragon monster (no helicopter option)
        this.createMonster(enemy);
        
        return enemy;
    }

    createMonster(group) {
        // Body - changed to blue color to match dragon image
        const bodyGeometry = new THREE.SphereGeometry(2, 8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0088FF, // Changed from red to blue
            roughness: 0.5,
            metalness: 0.2,
            emissive: 0x003366,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        // Eyes (add two glowing eyes)
        const eyeGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFF6600, // Orange eyes
            emissive: 0xFF6600,
            emissiveIntensity: 0.8
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.8, 0.6, 1.5);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.8, 0.6, 1.5);
        group.add(rightEye);

        // Wings - make them larger and more dragon-like
        const wingGeometry = new THREE.BoxGeometry(5, 0.2, 2);
        const wingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0088FF, // Match body color
            roughness: 0.7,
            transparent: true,
            opacity: 0.9
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(3.5, 0, 0);
        leftWing.rotation.z = Math.PI / 6;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(-3.5, 0, 0);
        rightWing.rotation.z = -Math.PI / 6;
        group.add(rightWing);

        // Mouth/fire emitter - make it more prominent
        const mouthGeometry = new THREE.ConeGeometry(0.8, 1.5, 8);
        const mouthMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFF3300,
            emissive: 0xFF3300,
            emissiveIntensity: 0.6
        });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.5, 2);
        mouth.rotation.x = -Math.PI / 2;
        group.add(mouth);
        
        // Add a glowing tip to the weapon to make it more visible
        const weaponTipGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const weaponTipMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 1.0
        });
        const weaponTip = new THREE.Mesh(weaponTipGeometry, weaponTipMaterial);
        weaponTip.position.set(0, -0.5, 2.7);
        group.add(weaponTip);
        
        // Horns - make them longer and darker
        const hornGeometry = new THREE.ConeGeometry(0.3, 2, 8);
        const hornMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000,
            emissive: 0x222222,
            emissiveIntensity: 0.2
        });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(1, 1.5, 0.5);
        leftHorn.rotation.x = -Math.PI / 4;
        group.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(-1, 1.5, 0.5);
        rightHorn.rotation.x = -Math.PI / 4;
        group.add(rightHorn);

        // Add spikes along the back
        for (let i = 0; i < 5; i++) {
            const spikeGeometry = new THREE.ConeGeometry(0.2, 0.8, 6);
            const spikeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x003366,
                roughness: 0.5
            });
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            spike.position.set(0, 1.2, -i * 0.6);
            spike.rotation.x = Math.PI / 3;
            group.add(spike);
        }

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
        
        // Animate dragon wings
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
        this.scoreThresholdAppear = 300;
        this.scoreThresholdDisappear = 1600;
        
        // Add warning message when enemy appears
        this.warningElement = document.getElementById('enemy-warning');
        this.warningShown = false;
        
        // Track explosions
        this.explosions = [];
    }
    
    showWarning() {
        // Only handle showing the HTML warning
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
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            const remove = explosion.update();
            
            if (remove) {
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