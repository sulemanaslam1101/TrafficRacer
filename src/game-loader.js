// Game Loader
// This script handles the start screen and initializes the game when the player clicks "Play Game"
import { CarCarousel } from './car-data.js';

document.addEventListener('DOMContentLoaded', function() {
    // Get references to UI elements
    const startScreen = document.getElementById('start-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const carSelectionScreen = document.getElementById('car-selection-screen');
    const playButton = document.getElementById('play-button');
    const scoreContainer = document.getElementById('score-container');
    const speedDisplay = document.getElementById('speed-display');
    const gameControls = document.getElementById('game-controls');
    
    // Get references to dashboard elements
    const superCarButton = document.getElementById('super-car');
    const sportCarButton = document.getElementById('sport-car');
    const muscleCarButton = document.getElementById('muscle-car');
    const settingsButton = document.getElementById('settings-button');
    const exitButton = document.getElementById('exit-button');
    
    // Get references to car selection elements
    const backButton = document.getElementById('back-to-dashboard');
    const prevButton = document.getElementById('prev-car');
    const nextButton = document.getElementById('next-car');
    const selectButton = document.getElementById('select-car');
    
    let currentCarousel = null;
    
    // Hide game UI elements initially
    scoreContainer.style.display = 'none';
    speedDisplay.style.display = 'none';
    gameControls.style.display = 'none';
    dashboardScreen.style.display = 'none';
    carSelectionScreen.style.display = 'none';
    
    // Add click event handler to the play button to show dashboard
    playButton.addEventListener('click', showDashboard);
    
    // Add click event handlers for car type selection
    superCarButton.addEventListener('click', () => showCarSelection('super'));
    sportCarButton.addEventListener('click', () => showCarSelection('sport'));
    muscleCarButton.addEventListener('click', () => showCarSelection('muscle'));
    
    // Add click handlers for car selection screen
    backButton.addEventListener('click', showDashboard);
    prevButton.addEventListener('click', () => currentCarousel?.previous());
    nextButton.addEventListener('click', () => currentCarousel?.next());
    selectButton.addEventListener('click', selectCurrentCar);
    
    // Add click handlers for dashboard buttons
    settingsButton.addEventListener('click', showSettings);
    exitButton.addEventListener('click', exitGame);
    
    function showDashboard() {
        // Hide all screens first
        startScreen.style.display = 'none';
        carSelectionScreen.style.display = 'none';
        
        // Show dashboard with fade effect
        dashboardScreen.style.display = 'block';
        dashboardScreen.style.opacity = '0';
        
        // Trigger reflow
        void dashboardScreen.offsetWidth;
        
        // Fade in dashboard
        dashboardScreen.style.transition = 'opacity 1s ease-in-out';
        dashboardScreen.style.opacity = '1';
    }
    
    function showCarSelection(carType) {
        // Fade out dashboard
        dashboardScreen.style.transition = 'opacity 1s ease-in-out';
        dashboardScreen.style.opacity = '0';
        
        setTimeout(() => {
            // Hide dashboard
            dashboardScreen.style.display = 'none';
            
            // Show car selection screen
            carSelectionScreen.style.display = 'block';
            carSelectionScreen.style.opacity = '0';
            
            // Initialize carousel
            currentCarousel = new CarCarousel(carType);
            
            // Trigger reflow
            void carSelectionScreen.offsetWidth;
            
            // Fade in car selection screen
            carSelectionScreen.style.transition = 'opacity 1s ease-in-out';
            carSelectionScreen.style.opacity = '1';
        }, 1000);
    }
    
    function selectCurrentCar() {
        if (!currentCarousel) return;
        
        const selectedCar = currentCarousel.getCurrentCar();
        if (selectedCar.status === 'Locked') {
            alert('This car is locked! Please select an available car.');
            return;
        }
        
        // Fade out car selection screen
        carSelectionScreen.style.transition = 'opacity 1s ease-in-out';
        carSelectionScreen.style.opacity = '0';
        
        setTimeout(() => {
            // Hide car selection screen
            carSelectionScreen.style.display = 'none';
            
            // Show game UI elements
            scoreContainer.style.display = 'block';
            speedDisplay.style.display = 'block';
            gameControls.style.display = 'block';
            
            // Start the game with selected car
            import('./main.js').then(module => {
                try {
                    const game = module.initializeGame({
                        type: currentCarousel.carType,
                        ...selectedCar
                    });
                    console.log(`Game started with ${selectedCar.name}!`);
                } catch (err) {
                    console.error('Error initializing game:', err);
                }
            }).catch(error => {
                console.error('Error importing game module:', error);
            });
        }, 1000);
    }
    
    function showSettings() {
        // TODO: Implement settings screen
        console.log('Settings button clicked - functionality to be implemented');
    }

    function exitGame() {
        // Show confirmation dialog
        const confirmExit = confirm('Are you sure you want to exit the game?');
        
        if (confirmExit) {
            // Fade out all screens
            startScreen.style.transition = 'opacity 1s ease-in-out';
            dashboardScreen.style.transition = 'opacity 1s ease-in-out';
            carSelectionScreen.style.transition = 'opacity 1s ease-in-out';
            scoreContainer.style.transition = 'opacity 1s ease-in-out';
            speedDisplay.style.transition = 'opacity 1s ease-in-out';
            gameControls.style.transition = 'opacity 1s ease-in-out';
            
            startScreen.style.opacity = '0';
            dashboardScreen.style.opacity = '0';
            carSelectionScreen.style.opacity = '0';
            scoreContainer.style.opacity = '0';
            speedDisplay.style.opacity = '0';
            gameControls.style.opacity = '0';
            
            // After fade out, close the window
            setTimeout(() => {
                window.close();
                
                // If window.close() doesn't work (due to browser restrictions),
                // show a message to the user
                alert('Please close the browser tab to exit the game.');
            }, 1000);
        }
    }
}); 