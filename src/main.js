import * as THREE from 'three';
import { Game } from './game.js';

// Create and export a function to initialize the game
export function initializeGame(carData) {
    // Initialize the game with the selected car data
    const container = document.getElementById('game-container');
    const game = new Game(container, carData);
    
    // Start the game loop
    game.start();
    
    return game;
}

// The carData parameter will now contain:
// {
//     type: 'super' | 'sport' | 'muscle',
//     name: string,
//     price: string,
//     image: string,
//     specs: {
//         speed: number,
//         acceleration: number,
//         handling: number,
//         braking: number
//     }
// } 