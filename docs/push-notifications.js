/**
 * Professional Push Notification System
 * Security Companion App - Elite Edition
 * Built for Median.co integration
 */

class PushNotificationManager {
  constructor() {
    this.vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with your VAPID key
    this.serverEndpoint = '/api/notifications/subscribe'; // Your server endpoint
    this.isSupported = this.checkSupport();
    this.permission = Notification.permission;
    this.subscription = null;
    this.init();
  }

  /**
   * Check if push notifications are supported
   */
  checkSupport() {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  /**
   * Initialize the push notification system
   */
  async init() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return;
    }

    // Check for Median.co environment
    if (window.MedianCo || window.webkit?.messageHandlers?.median) {
      this.initMedianNotifications();
    }

    // Register service worker if not already registered
    const registration = await this.registerServiceWorker();
    if (registration) {
      this.subscription = await registration.pushManager.getSubscription();
      this.updateUI();
    }
  }

  /**
   * Initialize Median-specific notification handling
   */
  initMedianNotifications() {
    // Median.co specific initialization
    if (window.median) {
      // Request permission through Median
      window.median.notification.request({
        callback: (status) => {
          this.permission = status;
          this.updateUI();
        }
      });

      // Listen for Median push tokens
      window.median.pushNotification.register({
        callback: (data) => {
          if (data.token) {
            this.sendTokenToServer(data.token, 'median');
          }
        }
      });
    }
  }

  /**
   * Register the service worker
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission() {
    if (!this.isSupported) {
      this.showUnsupportedMessage();
      return false;
    }

    try {
      // For Median.co app
      if (window.median) {
        return new Promise((resolve) => {
          window.median.notification.request({
            callback: (status) => {
              this.permission = status;
              this.updateUI();
              resolve(status === 'granted');
            }
          });
        });
      }

      // For regular web browser
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.updateUI();
      
      if (permission === 'granted') {
        await this.subscribeUser();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeUser() {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Convert VAPID key to Uint8Array
      const convertedVapidKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      this.subscription = subscription;
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      this.updateUI();
      this.showSuccessMessage();
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      this.showErrorMessage();
      return null;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeUser() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        await this.removeSubscriptionFromServer(this.subscription);
        this.subscription = null;
        this.updateUI();
        this.showUnsubscribeMessage();
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch(this.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      // Store locally for retry
      this.storeSubscriptionLocally(subscription);
    }
  }

  /**
   * Send Median token to server
   */
  async sendTokenToServer(token, platform) {
    try {
      const response = await fetch('/api/notifications/median-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          platform: platform,
          timestamp: new Date().toISOString()
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  /**
   * Remove subscription from server
   */
  async removeSubscriptionFromServer(subscription) {
    try {
      await fetch(this.serverEndpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  /**
   * Store subscription locally for retry
   */
  storeSubscriptionLocally(subscription) {
    localStorage.setItem('pendingSubscription', JSON.stringify({
      subscription: subscription.toJSON(),
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Retry sending stored subscriptions
   */
  async retryPendingSubscriptions() {
    const pending = localStorage.getItem('pendingSubscription');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        await this.sendSubscriptionToServer(data.subscription);
        localStorage.removeItem('pendingSubscription');
      } catch (error) {
        console.error('Error retrying subscription:', error);
      }
    }
  }

  /**
   * Send a test notification
   */
  async sendTestNotification() {
    if (this.permission !== 'granted') {
      await this.requestPermission();
      return;
    }

    // For Median.co
    if (window.median) {
      window.median.notification.send({
        title: '🛡️ Security Alert Test',
        body: 'This is a test notification from Security Companion',
        sound: 'default',
        badge: 1
      });
      return;
    }

    // For web
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification('🛡️ Security Alert Test', {
      body: 'This is a test notification from Security Companion',
      icon: '/patch-bg.png',
      badge: '/patch-bg.png',
      vibrate: [200, 100, 200],
      tag: 'test-notification',
      requireInteraction: false,
      actions: [
        { action: 'view', title: 'View Alert' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Send emergency notification
   */
  async sendEmergencyNotification(data) {
    const notificationData = {
      title: '🚨 EMERGENCY ALERT',
      body: data.message || 'Emergency assistance required immediately!',
      icon: '/patch-bg.png',
      badge: '/patch-bg.png',
      vibrate: [500, 200, 500, 200, 500],
      tag: 'emergency-alert',
      requireInteraction: true,
      priority: 'high',
      actions: [
        { action: 'respond', title: '📞 Respond', icon: '/patch-bg.png' },
        { action: 'locate', title: '📍 Location', icon: '/patch-bg.png' }
      ],
      data: {
        type: 'emergency',
        location: data.location,
        timestamp: new Date().toISOString(),
        officer: data.officer
      }
    };

    // For Median.co
    if (window.median) {
      window.median.notification.send({
        ...notificationData,
        sound: 'alarm.mp3',
        priority: 'critical'
      });
      return;
    }

    // For web
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(notificationData.title, notificationData);
  }

  /**
   * Update UI based on permission status
   */
  updateUI() {
    const statusElement = document.getElementById('notification-status');
    const toggleButton = document.getElementById('notification-toggle');
    
    if (!statusElement || !toggleButton) return;

    if (!this.isSupported) {
      statusElement.textContent = 'Not Supported';
      statusElement.className = 'status-text error';
      toggleButton.disabled = true;
      return;
    }

    switch (this.permission) {
      case 'granted':
        statusElement.textContent = this.subscription ? 'Enabled' : 'Permission Granted';
        statusElement.className = 'status-text success';
        toggleButton.textContent = this.subscription ? '🔔 Disable Notifications' : '🔔 Enable Notifications';
        toggleButton.disabled = false;
        break;
      case 'denied':
        statusElement.textContent = 'Blocked';
        statusElement.className = 'status-text error';
        toggleButton.textContent = '🔕 Notifications Blocked';
        toggleButton.disabled = true;
        break;
      default:
        statusElement.textContent = 'Not Enabled';
        statusElement.className = 'status-text warning';
        toggleButton.textContent = '🔔 Enable Notifications';
        toggleButton.disabled = false;
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage() {
    this.showToast('✅ Push notifications enabled successfully!', 'success');
  }

  /**
   * Show error message
   */
  showErrorMessage() {
    this.showToast('❌ Failed to enable push notifications', 'error');
  }

  /**
   * Show unsubscribe message
   */
  showUnsubscribeMessage() {
    this.showToast('🔕 Push notifications disabled', 'info');
  }

  /**
   * Show unsupported message
   */
  showUnsupportedMessage() {
    this.showToast('⚠️ Push notifications not supported on this device', 'warning');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-up`;
    toast.textContent = message;
    
    const container = document.getElementById('toast-container') || document.body;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Convert VAPID key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Handle incoming push message
   */
  static handlePushMessage(event) {
    const data = event.data ? event.data.json() : {};
    
    const options = {
      body: data.body || 'New notification from Security Companion',
      icon: data.icon || '/patch-bg.png',
      badge: data.badge || '/patch-bg.png',
      vibrate: data.vibrate || [200, 100, 200],
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {},
      image: data.image,
      timestamp: Date.now()
    };

    return self.registration.showNotification(
      data.title || '🛡️ Security Companion',
      options
    );
  }

  /**
   * Handle notification click
   */
  static handleNotificationClick(event) {
    event.notification.close();

    const action = event.action;
    const notification = event.notification;
    const data = notification.data || {};

    let url = '/';

    if (action === 'respond' && data.type === 'emergency') {
      url = `/emergency.html?id=${data.id}`;
    } else if (action === 'locate') {
      url = `/location.html?lat=${data.location?.lat}&lng=${data.location?.lng}`;
    } else if (action === 'view') {
      url = data.url || '/';
    }

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          // Check if app window is already open
          for (const client of windowClients) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if not found
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
}

// Initialize on page load
let pushManager;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pushManager = new PushNotificationManager();
  });
} else {
  pushManager = new PushNotificationManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PushNotificationManager;
}