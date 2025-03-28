// Car data for each category
export const carData = {
    super: [
        {
            name: "Lamborghini Aventador",
            price: "$500,000",
            image: "assets/Car Images/Super cars/super-car-1.jpeg",
            status: "Available",
            specs: {
                speed: 2.0,
                acceleration: 0.08,
                handling: 0.25,
                braking: 0.15
            }
        },
        {
            name: "Ferrari LaFerrari",
            price: "$1,500,000",
            image: "assets/Car Images/Super cars/super-car-2.jpeg",
            status: "Locked",
            specs: {
                speed: 2.2,
                acceleration: 0.09,
                handling: 0.3,
                braking: 0.2
            }
        },
        // Add more super cars here
    ],
    sport: [
        {
            name: "Porsche 911",
            price: "$150,000",
            image: "assets/Car Images/Sports cars/sports-car-1.jpeg",
            status: "Available",
            specs: {
                speed: 1.8,
                acceleration: 0.07,
                handling: 0.2,
                braking: 0.12
            }
        },
        {
            name: "Nissan GT-R",
            price: "$120,000",
            image: "assets/Car Images/Sports cars/sports-car-2.jpeg",
            status: "Locked",
            specs: {
                speed: 1.7,
                acceleration: 0.065,
                handling: 0.18,
                braking: 0.1
            }
        },
        // Add more sport cars here
    ],
    muscle: [
        {
            name: "Ford Mustang GT",
            price: "$75,000",
            image: "assets/Car Images/Muscle cars/muscle-car-1.jpeg",
            status: "Available",
            specs: {
                speed: 1.6,
                acceleration: 0.06,
                handling: 0.15,
                braking: 0.08
            }
        },
        {
            name: "Dodge Challenger",
            price: "$80,000",
            image: "assets/Car Images/Muscle cars/muscle-car-2.jpeg",
            status: "Locked",
            specs: {
                speed: 1.65,
                acceleration: 0.062,
                handling: 0.16,
                braking: 0.09
            }
        },
        // Add more muscle cars here
    ]
};

// Carousel management class
export class CarCarousel {
    constructor(carType) {
        this.carType = carType;
        this.cars = carData[carType];
        this.currentIndex = 0;
        this.setupCarousel();
    }

    setupCarousel() {
        const carousel = document.querySelector('.carousel');
        const title = document.querySelector('.carousel-title');
        
        // Update title
        title.textContent = `Select Your ${this.carType.charAt(0).toUpperCase() + this.carType.slice(1)} Car`;
        
        // Clear existing items
        carousel.innerHTML = '';
        
        // Add car items
        this.cars.forEach((car, index) => {
            const item = document.createElement('div');
            item.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            item.dataset.type = this.carType;
            item.dataset.index = index;
            
            item.innerHTML = `
                <div class="car-image-container">
                    <img src="${car.image}" alt="${car.name}" class="car-image">
                </div>
                <div class="car-info">
                    <div class="car-name">${car.name}</div>
                    <div class="car-price">${car.price}</div>
                    <div class="car-status ${car.status.toLowerCase()}">${car.status}</div>
                    <div class="car-specs">
                        <div class="spec">Speed: ${car.specs.speed}</div>
                        <div class="spec">Acceleration: ${car.specs.acceleration}</div>
                        <div class="spec">Handling: ${car.specs.handling}</div>
                        <div class="spec">Braking: ${car.specs.braking}</div>
                    </div>
                </div>
            `;
            
            // Position the car in the carousel
            const angle = (index * (360 / this.cars.length));
            const radius = 400; // Adjust this value to change the carousel size
            item.style.transform = `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px)`;
            
            carousel.appendChild(item);
        });
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.cars.length;
        this.updateCarousel();
    }

    previous() {
        this.currentIndex = (this.currentIndex - 1 + this.cars.length) % this.cars.length;
        this.updateCarousel();
    }

    updateCarousel() {
        const carousel = document.querySelector('.carousel');
        const angle = -(this.currentIndex * (360 / this.cars.length));
        carousel.style.transform = `rotateY(${angle}deg)`;
        
        // Update active state
        document.querySelectorAll('.carousel-item').forEach((item, index) => {
            item.classList.toggle('active', index === this.currentIndex);
        });
    }

    getCurrentCar() {
        return this.cars[this.currentIndex];
    }
} 