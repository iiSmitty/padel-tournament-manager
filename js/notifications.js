/**
 * notifications.js - Web Notifications for Padel Tournament Manager
 * MIT License (c) 2025 André Smit
 *
 * This implementation uses Web Notifications to alert users even when
 * the app is in the background or the screen is locked.
 */

// Notification state
let notificationPermission = false;
let activeNotification = null;

/**
 * Initialize notifications and request permission
 */
function initNotifications() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }

    // Check permission status
    if (Notification.permission === 'granted') {
        notificationPermission = true;
    } else if (Notification.permission !== 'denied') {
        // Add a notification permission button to the timer section
        addPermissionButton();
    }
}

/**
 * Add a permission request button to the UI
 */
function addPermissionButton() {
    const timerSection = document.querySelector('.timer-section');
    if (!timerSection) return;

    const permissionButton = document.createElement('button');
    permissionButton.className = 'timer-btn';
    permissionButton.id = 'notificationBtn';
    permissionButton.innerHTML = '🔔 Enable Notifications';
    permissionButton.addEventListener('click', requestNotificationPermission);

    // Add button in a container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.textAlign = 'center';
    buttonContainer.style.marginTop = '10px';
    buttonContainer.appendChild(permissionButton);

    // Find the wake lock button container and insert before it, or append to timer section
    const wakeLockContainer = document.querySelector('.timer-section div[style*="text-align: center"]');
    if (wakeLockContainer) {
        timerSection.insertBefore(buttonContainer, wakeLockContainer);
    } else {
        timerSection.appendChild(buttonContainer);
    }
}

/**
 * Request notification permission from the user
 */
async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            notificationPermission = true;
            const button = document.getElementById('notificationBtn');
            if (button) {
                button.innerHTML = '🔔 Notifications Enabled';
                button.classList.add('active');
                button.disabled = true;
            }

            // Show a test notification
            showNotification('Notifications Enabled', 'You will now receive alerts even when the app is in the background.');
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
}

/**
 * Show a system notification that works even when the screen is locked
 * @param {string} title - Notification title
 * @param {string} body - Notification message
 */
function showNotification(title, body) {
    // Close any existing notification
    if (activeNotification) {
        activeNotification.close();
    }

    // Check permission
    if (!notificationPermission) {
        console.log('Notification permission not granted');
        return;
    }

    // Create notification options
    const options = {
        body: body,
        icon: '/icons/padel-icon-192.png',
        badge: '/icons/padel-icon-192.png',
        vibrate: [300, 200, 300, 200, 300],
        tag: 'padel-tournament',
        renotify: true,
        requireInteraction: true // Keep notification until user interacts with it
    };

    // Create and show notification
    try {
        activeNotification = new Notification(title, options);

        // Handle notification click
        activeNotification.onclick = function() {
            window.focus();
            this.close();
        };
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

/**
 * Show a timer alert notification (for when screen is locked)
 * @param {boolean} isTestMode - Whether the alert is for test mode
 */
function showTimerNotification(isTestMode) {
    const title = isTestMode ?
        '🧪 TEST TIMER FINISHED' :
        '⏰ PADEL ROUND TIMER FINISHED';

    const body = isTestMode ?
        'Test timer has reached 15 seconds. Tap to return to the app.' :
        '10-minute round timer has finished. Time to rotate players! Tap to return to the app.';

    showNotification(title, body);
}

// Initialize notifications when the page loads
document.addEventListener('DOMContentLoaded', initNotifications);

/**
 * Add this to your updateTimerDisplay function:
 *
 * // Alert when timer reaches the limit
 * if (totalSeconds === timerLimitSeconds && timerInterval) {
 *     // Show persistent alert based on mode
 *     showPersistentAlert(isTestMode);
 *
 *     // Also show a system notification (works when screen is locked)
 *     showTimerNotification(isTestMode);
 *
 *     // Play sound and vibrate
 *     playTimerSound('buzzer');
 *     vibratePhone([300, 200, 300, 200, 300]);
 * }
 */