import * as THREE from 'three';
import { Game } from './game.js';

// Initialize the game
const container = document.getElementById('game-container');
const game = new Game(container);

// Start the game loop
game.start(); 