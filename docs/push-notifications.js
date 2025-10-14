/**
 * Security Companion - Professional Push Notification System
 * Enhanced push notifications for security guard operations
 */

class SecurityNotificationManager {
  constructor() {
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxN-RgKBWw_dUabGrLpHyHUNBEQRilh7J7-fKKRJQQiOOk1gUzSA';
  }

  // Initialize the notification system
  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('sw.js');
      console.log('ServiceWorker registered:', registration);

      // Check existing subscription
      this.subscription = await registration.pushManager.getSubscription();
      
      if (!this.subscription) {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await this.subscribeToPush(registration);
        } else {
          console.log('Notification permission denied');
          return false;
        }
      } else {
        console.log('Already subscribed to push notifications');
      }

      this.updateUI(true);
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      this.updateUI(false);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(registration) {
    try {
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('Push subscription successful:', this.subscription);
      
      // Store subscription locally (in real app, send to server)
      localStorage.setItem('pushSubscription', JSON.stringify(this.subscription));
      
      // Send welcome notification
      this.showLocalNotification(
        'Security Companion Ready!',
        'Push notifications are now enabled for security alerts',
        { tag: 'welcome' }
      );

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show local notification
  showLocalNotification(title, body, options = {}) {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const defaultOptions = {
      icon: 'patch-bg.png',
      badge: 'patch-bg.png',
      vibrate: [200, 100, 200],
      tag: 'security-notification',
      requireInteraction: false,
      data: {
        timestamp: Date.now(),
        url: '/'
      }
    };

    const notification = new Notification(title, {
      ...defaultOptions,
      body,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      if (options.data?.url) {
        window.location.href = options.data.url;
      }
      notification.close();
    };

    // Auto-close after 10 seconds unless requireInteraction is true
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }

    return notification;
  }

  // Send emergency alert
  sendEmergencyAlert(location = null, message = 'Emergency assistance required') {
    const alertData = {
      type: 'emergency',
      title: '🚨 EMERGENCY ALERT',
      body: message,
      location: location,
      timestamp: new Date().toISOString(),
      officerId: localStorage.getItem('officerName') || 'Unknown Officer'
    };

    // Show local notification immediately
    this.showLocalNotification(
      alertData.title,
      alertData.body,
      {
        tag: 'emergency',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: { type: 'emergency', url: '/?emergency=true' }
      }
    );

    // In a real app, this would send to your server
    console.log('Emergency alert sent:', alertData);
    
    // Store locally for demo
    const alerts = JSON.parse(localStorage.getItem('emergencyAlerts') || '[]');
    alerts.unshift(alertData);
    localStorage.setItem('emergencyAlerts', JSON.stringify(alerts.slice(0, 50)));

    return alertData;
  }

  // Send incident notification
  sendIncidentNotification(incidentType, location, severity = 'Medium') {
    const notificationData = {
      type: 'incident',
      title: `📝 ${incidentType} Reported`,
      body: `Location: ${location} | Severity: ${severity}`,
      timestamp: new Date().toISOString(),
      data: {
        type: 'incident',
        url: '/incident.html',
        incidentType,
        location,
        severity
      }
    };

    this.showLocalNotification(
      notificationData.title,
      notificationData.body,
      {
        tag: 'incident',
        data: notificationData.data
      }
    );

    return notificationData;
  }

  // Send patrol reminder
  sendPatrolReminder(area, timeRemaining) {
    const notificationData = {
      type: 'patrol',
      title: '🚶 Patrol Reminder',
      body: `Time to patrol ${area}. ${timeRemaining} remaining in shift.`,
      data: {
        type: 'patrol',
        url: '/patrol.html?start=true',
        area
      }
    };

    this.showLocalNotification(
      notificationData.title,
      notificationData.body,
      {
        tag: 'patrol-reminder',
        data: notificationData.data
      }
    );

    return notificationData;
  }

  // Send shift notification
  sendShiftNotification(type, message) {
    const titles = {
      'start': '📍 Shift Starting',
      'end': '📋 Shift Ending',
      'break': '☕ Break Time',
      'overtime': '⏰ Overtime Alert'
    };

    const notificationData = {
      type: 'shift',
      title: titles[type] || '📋 Shift Update',
      body: message,
      data: {
        type: 'shift',
        url: '/shift.html',
        shiftType: type
      }
    };

    this.showLocalNotification(
      notificationData.title,
      notificationData.body,
      {
        tag: 'shift-update',
        data: notificationData.data
      }
    );

    return notificationData;
  }

  // Test notification
  sendTestNotification() {
    const testMessages = [
      'Security system test - all systems operational',
      'Radio check - communication systems active',
      'Equipment check reminder - daily inspection due',
      'Patrol checkpoint - perimeter security verified',
      'Shift update - all areas secure'
    ];

    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];

    this.showLocalNotification(
      'Security Companion Test',
      randomMessage,
      {
        tag: 'test',
        data: { type: 'test', url: '/' }
      }
    );
  }

  // Update UI elements
  updateUI(enabled) {
    const statusElements = document.querySelectorAll('[data-notification-status]');
    statusElements.forEach(element => {
      element.textContent = enabled ? 'Notifications: ON' : 'Notifications: OFF';
      element.style.color = enabled ? 'var(--success)' : 'var(--text-muted)';
    });

    const toggleButtons = document.querySelectorAll('[data-notification-toggle]');
    toggleButtons.forEach(button => {
      button.textContent = enabled ? 'Enabled' : 'Enable';
      button.className = enabled ? 'touch-btn primary' : 'touch-btn';
    });
  }

  // Get subscription status
  isSubscribed() {
    return this.subscription !== null;
  }

  // Unsubscribe from notifications
  async unsubscribe() {
    if (this.subscription) {
      try {
        await this.subscription.unsubscribe();
        this.subscription = null;
        localStorage.removeItem('pushSubscription');
        this.updateUI(false);
        console.log('Unsubscribed from push notifications');
        return true;
      } catch (error) {
        console.error('Failed to unsubscribe:', error);
        return false;
      }
    }
    return true;
  }

  // Schedule periodic notifications (for demo purposes)
  schedulePeriodicNotifications() {
    // Equipment check reminder (every 8 hours)
    setInterval(() => {
      if (this.isSubscribed()) {
        this.showLocalNotification(
          '🎒 Equipment Check Reminder',
          'Time for your daily equipment inspection',
          {
            tag: 'equipment-reminder',
            data: { type: 'reminder', url: '/?equipment=true' }
          }
        );
      }
    }, 8 * 60 * 60 * 1000);

    // Patrol reminder (every 2 hours during active shift)
    setInterval(() => {
      if (this.isSubscribed() && this.isOnDuty()) {
        this.sendPatrolReminder('assigned areas', this.getTimeRemaining());
      }
    }, 2 * 60 * 60 * 1000);
  }

  // Helper methods
  isOnDuty() {
    // Check if officer is currently on duty
    const status = localStorage.getItem('dutyStatus');
    return status === 'on-duty';
  }

  getTimeRemaining() {
    // Calculate time remaining in shift
    const shiftEnd = localStorage.getItem('shiftEndTime');
    if (!shiftEnd) return 'Unknown time';
    
    const now = new Date();
    const end = new Date(shiftEnd);
    const diff = end - now;
    
    if (diff <= 0) return 'Shift ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
}

// Global notification manager instance
window.securityNotifications = new SecurityNotificationManager();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.securityNotifications.initialize();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityNotificationManager;
}