/**
 * audio-utils.js - Audio and vibration utilities for Padel Tournament Manager
 * MIT License (c) 2025 André Smit
 */

/**
 * Play a sound for various actions using Web Audio API
 * @param {string} action - The action type ('start', 'pause', 'finish', 'buzzer')
 */
function playTimerSound(action) {
    try {
        // Create audio context for sound generation
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different frequencies for different actions
        switch(action) {
            case 'start':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'pause':
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'finish':
                // Play ascending notes for completion
                [523, 659, 784].forEach((freq, index) => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);

                    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                    gain.gain.setValueAtTime(0.2, audioContext.currentTime + index * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (index * 0.15) + 0.2);

                    osc.start(audioContext.currentTime + index * 0.15);
                    osc.stop(audioContext.currentTime + (index * 0.15) + 0.2);
                });
                break;
            case 'buzzer':
                // Enhanced buzzer sound for better notification when screen is locked
                [600, 600, 600, 600, 600].forEach((freq, index) => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);

                    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                    // Increased volume for better audibility
                    gain.gain.setValueAtTime(0.5, audioContext.currentTime + index * 0.2);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (index * 0.2) + 0.15);

                    osc.start(audioContext.currentTime + index * 0.2);
                    osc.stop(audioContext.currentTime + (index * 0.2) + 0.15);
                });

                // Play a second wave of sounds for the buzzer after a delay
                // This helps ensure it's heard even when screen is locked
                setTimeout(() => {
                    try {
                        const ac = new (window.AudioContext || window.webkitAudioContext)();
                        [600, 400, 600].forEach((freq, index) => {
                            const osc = ac.createOscillator();
                            const gain = ac.createGain();
                            osc.connect(gain);
                            gain.connect(ac.destination);

                            osc.frequency.setValueAtTime(freq, ac.currentTime);
                            gain.gain.setValueAtTime(0.5, ac.currentTime + index * 0.2);
                            gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + (index * 0.2) + 0.15);

                            osc.start(ac.currentTime + index * 0.2);
                            osc.stop(ac.currentTime + (index * 0.2) + 0.15);
                        });
                    } catch (error) {
                        console.log('Secondary audio not supported:', error);
                    }
                }, 1000);
                break;
        }
    } catch (error) {
        console.log('Audio not supported:', error);
    }
}

/**
 * Vibrate the device with a specific pattern
 * @param {number[]} pattern - Vibration pattern in milliseconds
 */
function vibratePhone(pattern) {
    try {
        if (navigator.vibrate) {
            // Try the requested pattern
            navigator.vibrate(pattern);

            // For important notifications (like buzzer), use a stronger pattern
            if (pattern.length > 3) {
                // Wait a moment and vibrate again for extra notification
                setTimeout(() => {
                    try {
                        navigator.vibrate([300, 200, 300]);
                    } catch (error) {
                        console.log('Secondary vibration not supported:', error);
                    }
                }, 1500);
            }
        } else {
            console.log('Vibration not supported on this device');
        }
    } catch (error) {
        console.log('Vibration error:', error);
    }
}