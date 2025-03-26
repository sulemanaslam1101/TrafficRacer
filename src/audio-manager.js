export class AudioManager {
    constructor() {
        this.sounds = {};
        this.loadSounds();
    }

    loadSounds() {
        // Create and preload our audio elements
        this.sounds = {
            projectileFire: this.createAudio('https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3', 0.4),
            projectileHit: this.createAudio('https://assets.mixkit.co/active_storage/sfx/566/566-preview.mp3', 0.5),
            coinCollect: this.createAudio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3', 0.4),
            crash: this.createAudio('https://assets.mixkit.co/active_storage/sfx/235/235-preview.mp3', 0.6)
        };
    }

    createAudio(src, volume = 1.0) {
        const audio = new Audio(src);
        audio.volume = volume;
        return audio;
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            // Clone the audio to allow overlapping sounds
            const sound = this.sounds[soundName].cloneNode();
            sound.play().catch(e => {
                // Silently fail - browser might require user interaction first
                console.log('Audio play failed:', e);
            });
        }
    }
} 