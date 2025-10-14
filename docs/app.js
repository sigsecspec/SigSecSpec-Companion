(function(){
  const globalObj = (typeof window !== 'undefined') ? window : self;

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = globalObj.atob ? globalObj.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      // Use a consistent relative scope for GitHub Pages or static hosting
      const registration = await navigator.serviceWorker.register('sw.js', { scope: './' });
      return registration;
    } catch (err) {
      console.error('Service worker registration failed:', err);
      return null;
    }
  }

  async function getReadyRegistration() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      return reg;
    } catch (e) {
      return registerServiceWorker();
    }
  }

  const PushNotifications = {
    async getPublicKey() {
      try {
        const res = await fetch('/api/vapidPublicKey', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch VAPID public key');
        const data = await res.json();
        if (!data || !data.publicKey) throw new Error('Invalid VAPID key response');
        return data.publicKey;
      } catch (err) {
        console.error('VAPID key fetch error:', err);
        throw err;
      }
    },

    async isSupported() {
      return ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);
    },

    async isSubscribed() {
      const reg = await getReadyRegistration();
      if (!reg || !reg.pushManager) return false;
      const sub = await reg.pushManager.getSubscription();
      return !!sub;
    },

    async enable() {
      if (!(await this.isSupported())) throw new Error('Push not supported');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notifications permission denied');

      const reg = await getReadyRegistration();
      if (!reg) throw new Error('Service worker not ready');

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        const vapidKey = await this.getPublicKey();
        const appServerKey = urlBase64ToUint8Array(vapidKey);
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
      }

      // Send subscription to server
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      return true;
    },

    async disable() {
      const reg = await getReadyRegistration();
      if (!reg) return false;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        return true;
      }
      return false;
    },

    async sendTest(message) {
      const body = { title: 'Security Companion', body: message || 'Test push from Security Companion' };
      const res = await fetch('/api/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to send test notification');
      return true;
    }
  };

  // Expose globally
  globalObj.PushNotifications = PushNotifications;

  // Auto-register SW on load
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      registerServiceWorker();
    });
  }
})();
