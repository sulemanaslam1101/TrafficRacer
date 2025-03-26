import * as THREE from 'three';

class Coin {
    constructor(position) {
        this.mesh = this.createCoinMesh();
        this.mesh.position.copy(position);
        this.rotationSpeed = 0.03;
        this.collected = false;
        this.scoreText = null;
        this.scoreTextMaterial = null;
        this.initialZ = position.z; // Store initial Z position
    }

    createCoinMesh() {
        const coin = new THREE.Group();

        // Create a golden coin using a cylinder
        const coinGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
        const coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.3,
            emissive: 0x332200,
            emissiveIntensity: 0.2
        });
        const coinMesh = new THREE.Mesh(coinGeometry, coinMaterial);
        coinMesh.rotation.x = Math.PI / 2; // Make coin face the player
        coin.add(coinMesh);

        // Add edge detail
        const edgeGeometry = new THREE.TorusGeometry(1, 0.2, 16, 32);
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0xDAA520,
            metalness: 0.8,
            roughness: 0.3
        });
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.rotation.x = Math.PI / 2;
        coin.add(edge);

        // Create a simple circle for the dollar sign
        const circleGeometry = new THREE.CircleGeometry(0.5, 32);
        const circleMaterial = new THREE.MeshStandardMaterial({
            color: 0xDAA520,
            metalness: 0.8,
            roughness: 0.3,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.position.set(0, 0, 0.15);
        circle.rotation.x = Math.PI / 2;
        coin.add(circle);
        
        coin.position.y = 1; // Lift coin off the ground
        return coin;
    }

    showScoreText() {
        if (!this.scoreText) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 50;
            context.fillStyle = '#ffffff';
            context.font = 'bold 36px Arial';
            context.fillText('+10', 25, 35);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true
            });
            this.scoreText = new THREE.Sprite(material);
            this.scoreText.scale.set(2, 1, 1);
            this.scoreText.position.copy(this.mesh.position);
            this.scoreText.position.y += 2;
        }
        return this.scoreText;
    }

    update(roadSpeed) {
        if (!this.collected) {
            this.mesh.rotation.y += this.rotationSpeed;
            // Compensate for road movement to keep coin stationary relative to the road
            this.mesh.position.z -= roadSpeed;
            this.initialZ -= roadSpeed;
        } else if (this.scoreText) {
            this.scoreText.position.y += 0.2;
            this.scoreText.material.opacity -= 0.04;
            if (this.scoreText.material.opacity <= 0) {
                return true;
            }
        }
        return false;
    }
}

export class CoinManager {
    constructor(scene, audioManager) {
        this.scene = scene;
        this.audioManager = audioManager;
        this.coins = [];
        this.spawnInterval = 120;
        this.spawnCounter = 0;
        this.maxCoins = 5;
        this.lanes = [-6, -2, 2, 6];
    }

    spawnCoin() {
        if (this.coins.length >= this.maxCoins) return;

        const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
        const position = new THREE.Vector3(
            lane,
            1,
            40 + Math.random() * 40
        );

        const coin = new Coin(position);
        this.coins.push(coin);
        this.scene.add(coin.mesh);
    }

    checkCollision(playerBox) {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (!coin.collected) {
                const coinBox = new THREE.Box3().setFromObject(coin.mesh);
                if (playerBox.intersectsBox(coinBox)) {
                    coin.collected = true;
                    const scoreText = coin.showScoreText();
                    this.scene.add(scoreText);
                    coin.mesh.visible = false;
                    return true;
                }
            }
        }
        return false;
    }

    update(roadSpeed) {
        this.spawnCounter++;
        if (this.spawnCounter >= this.spawnInterval) {
            this.spawnCoin();
            this.spawnCounter = 0;
        }

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const shouldRemove = coin.update(roadSpeed);
            
            if (shouldRemove || coin.mesh.position.z < -40) {
                this.scene.remove(coin.mesh);
                if (coin.scoreText) {
                    this.scene.remove(coin.scoreText);
                }
                this.coins.splice(i, 1);
            }
        }
    }
} 