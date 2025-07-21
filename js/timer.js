/**
 * timer.js - Timer functionality for Padel Tournament Manager
 * MIT License (c) 2025 André Smit
 */

// Timer state variables - initialized from the main script
let timerInterval = null;
let roundStartTime = null;
let totalTournamentStartTime = null;
let roundDurations = [];
let isPaused = false;

// Test mode variables
let isTestMode = false;
const NORMAL_TIMER_LIMIT = 10 * 60; // 10 minutes in seconds
const TEST_TIMER_LIMIT = 15; // 15 seconds for testing

// Alert state
let activeAlert = null;
let alertInterval = null;
let snoozeCount = 0;
const MAX_SNOOZES = 3;

/**
 * Start the round timer
 */
function startRoundTimer() {
    if (!roundStartTime) {
        roundStartTime = Date.now();
    }

    isPaused = false;

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(updateTimerDisplay, 1000);

    // Update button states
    document.getElementById('startTimerBtn').classList.add('active');
    document.getElementById('pauseTimerBtn').classList.remove('active');

    // Play sound and vibrate
    playTimerSound('start');
    vibratePhone([100]);

    updateTimerDisplay();
}

/**
 * Pause the round timer
 */
function pauseRoundTimer() {
    isPaused = true;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Update button states
    document.getElementById('startTimerBtn').classList.remove('active');
    document.getElementById('pauseTimerBtn').classList.add('active');

    // Play sound and vibrate
    playTimerSound('pause');
    vibratePhone([150, 100, 150]);
}

/**
 * Reset the round timer
 */
function resetRoundTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    roundStartTime = null;
    isPaused = false;

    // Update button states
    document.getElementById('startTimerBtn').classList.remove('active');
    document.getElementById('pauseTimerBtn').classList.remove('active');

    document.getElementById('timerDisplay').textContent = '00:00';
    updateTimerStats();
}

/**
 * Finish the current round and record its duration
 */
function finishRound() {
    if (roundStartTime) {
        const roundDuration = Date.now() - roundStartTime;
        roundDurations[currentRoundIndex] = roundDuration;

        pauseRoundTimer();

        // Play completion sound and vibrate
        playTimerSound('finish');
        vibratePhone([200, 100, 200, 100, 200]);

        updateTimerStats();
        saveTournamentData();
    }
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
    if (!roundStartTime) return;

    const elapsed = Date.now() - roundStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    document.getElementById('timerDisplay').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Check timer limit based on mode
    const timerLimitSeconds = isTestMode ? TEST_TIMER_LIMIT : NORMAL_TIMER_LIMIT;
    const totalSeconds = minutes * 60 + seconds;

    // Alert when timer reaches the limit
    if (totalSeconds === timerLimitSeconds && timerInterval) {
        // Show persistent alert based on mode
        showPersistentAlert(isTestMode);

        // Also show a system notification (works when screen is locked)
        if (typeof showTimerNotification === 'function') {
            showTimerNotification(isTestMode);
        }

        // Play sound and vibrate
        playTimerSound('buzzer');
        vibratePhone([300, 200, 300, 200, 300]);
    }

    updateTimerStats();
}

/**
 * Update timer statistics (average round time, total time, estimated finish)
 */
function updateTimerStats() {
    // Average round time
    const completedRounds = roundDurations.filter(d => d > 0);
    if (completedRounds.length > 0) {
        const avgMs = completedRounds.reduce((sum, duration) => sum + duration, 0) / completedRounds.length;
        const avgMinutes = Math.floor(avgMs / 60000);
        const avgSeconds = Math.floor((avgMs % 60000) / 1000);
        document.getElementById('avgRoundTime').textContent =
            `${avgMinutes.toString().padStart(2, '0')}:${avgSeconds.toString().padStart(2, '0')}`;
    } else {
        document.getElementById('avgRoundTime').textContent = '--:--';
    }

    // Total tournament time
    if (totalTournamentStartTime) {
        const totalElapsed = Date.now() - totalTournamentStartTime;
        const totalMinutes = Math.floor(totalElapsed / 60000);
        const totalSeconds = Math.floor((totalElapsed % 60000) / 1000);
        document.getElementById('totalTournamentTime').textContent =
            `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;
    }

    // Estimated finish time
    if (completedRounds.length > 0) {
        const avgRoundMs = completedRounds.reduce((sum, duration) => sum + duration, 0) / completedRounds.length;
        const remainingRounds = rounds.length - currentRoundIndex - 1;
        const estimatedRemainingMs = remainingRounds * avgRoundMs;

        // Add current round time if running
        let currentRoundMs = 0;
        if (roundStartTime) {
            currentRoundMs = Date.now() - roundStartTime;
        }

        const estimatedTotalRemainingMs = estimatedRemainingMs + (avgRoundMs - currentRoundMs);
        const estimatedFinishTime = new Date(Date.now() + estimatedTotalRemainingMs);

        document.getElementById('estimatedFinish').textContent =
            estimatedFinishTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
    } else {
        document.getElementById('estimatedFinish').textContent = '--:--';
    }
}

/**
 * Toggle between normal and test mode (15 seconds vs 10 minutes)
 */
function toggleTestMode() {
    isTestMode = !isTestMode;

    // Update the button appearance
    const testModeBtn = document.getElementById('testModeBtn');
    if (isTestMode) {
        testModeBtn.classList.add('active');
        testModeBtn.innerHTML = '🧪 Test Mode ON (15s)';
        alert('Test mode activated! Timer will buzz after 15 seconds instead of 10 minutes.');
    } else {
        testModeBtn.classList.remove('active');
        testModeBtn.innerHTML = '🧪 Test Mode';
        alert('Test mode deactivated. Timer will buzz after 10 minutes (normal mode).');
    }

    // Reset the timer when switching modes
    resetRoundTimer();
}

/**
 * Shows a persistent alert that requires manual dismissal
 * This will continue to play sounds and vibrate until dismissed
 */
function showPersistentAlert(isTestMode) {
    // Clear any existing alert
    clearPersistentAlert();

    // Create alert container
    const alertContainer = document.createElement('div');
    alertContainer.className = 'persistent-alert';
    alertContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: fadeIn 0.5s ease-out;
    `;

    // Create alert content
    const alertContent = document.createElement('div');
    alertContent.style.cssText = `
        background-color: #ff4d4d;
        border-radius: 15px;
        padding: 30px;
        text-align: center;
        max-width: 90%;
        box-shadow: 0 0 30px rgba(255, 77, 77, 0.7);
        border: 3px solid white;
    `;

    // Alert title
    const alertTitle = document.createElement('h2');
    alertTitle.style.cssText = `
        color: white;
        font-size: 28px;
        margin: 0 0 20px 0;
    `;
    alertTitle.innerHTML = isTestMode ?
        '🧪 TEST TIMER FINISHED 🧪' :
        '⏰ TIME IS UP! ⏰';

    // Alert message
    const alertMessage = document.createElement('p');
    alertMessage.style.cssText = `
        color: white;
        font-size: 20px;
        margin: 0 0 30px 0;
    `;
    alertMessage.innerHTML = isTestMode ?
        'Test timer has reached 15 seconds.' :
        'The 10-minute round timer has finished.';

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 15px;
        flex-wrap: wrap;
    `;

    // Dismiss button
    const dismissButton = document.createElement('button');
    dismissButton.style.cssText = `
        background-color: white;
        color: #ff4d4d;
        border: none;
        border-radius: 25px;
        padding: 12px 25px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 150px;
    `;
    dismissButton.innerHTML = 'DISMISS';
    dismissButton.addEventListener('click', clearPersistentAlert);

    // Snooze button
    const snoozeButton = document.createElement('button');
    snoozeButton.style.cssText = `
        background-color: rgba(255, 255, 255, 0.3);
        color: white;
        border: 2px solid white;
        border-radius: 25px;
        padding: 12px 25px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 150px;
    `;
    snoozeButton.innerHTML = 'SNOOZE (30s)';
    snoozeButton.addEventListener('click', snoozeAlert);

    // Add everything to the DOM
    buttonContainer.appendChild(dismissButton);
    buttonContainer.appendChild(snoozeButton);
    alertContent.appendChild(alertTitle);
    alertContent.appendChild(alertMessage);
    alertContent.appendChild(buttonContainer);
    alertContainer.appendChild(alertContent);
    document.body.appendChild(alertContainer);

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // Start pulsing animation
    alertContent.style.animation = 'pulse 1.5s infinite';

    // Store reference to alert elements
    activeAlert = {
        container: alertContainer,
        style: style
    };

    // Play sound repeatedly
    playAlertSound();
    alertInterval = setInterval(playAlertSound, 3000);

    // Prevent accidental dismissal with a confirmation if clicked outside
    alertContainer.addEventListener('click', function(e) {
        if (e.target === alertContainer) {
            if (confirm('Are you sure you want to dismiss the alert?')) {
                clearPersistentAlert();
            }
        }
    });

    // Function to play the alert sound and vibration
    function playAlertSound() {
        playTimerSound('buzzer');
        vibratePhone([300, 200, 300, 200, 300]);
    }
}

/**
 * Clears the persistent alert
 */
function clearPersistentAlert() {
    if (activeAlert) {
        // Stop the sound interval
        if (alertInterval) {
            clearInterval(alertInterval);
            alertInterval = null;
        }

        // Remove elements
        if (activeAlert.container && activeAlert.container.parentNode) {
            activeAlert.container.parentNode.removeChild(activeAlert.container);
        }
        if (activeAlert.style && activeAlert.style.parentNode) {
            activeAlert.style.parentNode.removeChild(activeAlert.style);
        }

        // Reset alert state
        activeAlert = null;
        snoozeCount = 0;
    }
}

/**
 * Snoozes the alert for 30 seconds
 */
function snoozeAlert() {
    snoozeCount++;

    if (snoozeCount > MAX_SNOOZES) {
        alert('Maximum snooze count reached. The alert will be dismissed.');
        clearPersistentAlert();
        return;
    }

    // Clear current alert
    clearPersistentAlert();

    // Show snooze notification
    const snoozeNotification = document.createElement('div');
    snoozeNotification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #2196F3;
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        font-size: 18px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 5px 20px rgba(33, 150, 243, 0.5);
    `;
    snoozeNotification.innerHTML = `⏰ Alert snoozed for 30 seconds (${snoozeCount}/${MAX_SNOOZES})`;
    document.body.appendChild(snoozeNotification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        if (snoozeNotification.parentNode) {
            snoozeNotification.parentNode.removeChild(snoozeNotification);
        }
    }, 3000);

    // Set timeout to show alert again
    setTimeout(() => {
        showPersistentAlert(isTestMode);
    }, 30000);
}