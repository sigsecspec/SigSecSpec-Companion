# 🔔 Push Notifications Setup Guide
## Security Companion Pro - Elite Edition

This guide will help you set up push notifications for your Security Companion Pro app, both for web browsers and Median.co native apps.

---

## 📱 For Median.co Integration

### Step 1: Enable Push Notifications in Median

1. Log into your Median.co dashboard
2. Navigate to **App Features** → **Push Notifications**
3. Enable push notifications for your app
4. Choose your notification service:
   - **OneSignal** (Recommended)
   - **Firebase Cloud Messaging**
   - **Custom Server**

### Step 2: Configure OneSignal (Recommended)

1. Create a OneSignal account at https://onesignal.com
2. Create a new app in OneSignal
3. Get your OneSignal App ID and REST API Key
4. In Median dashboard:
   - Enter your OneSignal App ID
   - Configure notification icons and colors
   - Set default notification sound

### Step 3: Update JavaScript Code

Replace the VAPID key in `push-notifications.js`:

```javascript
// Line 8 in push-notifications.js
this.vapidPublicKey = 'YOUR_ONESIGNAL_VAPID_KEY';
```

### Step 4: Median-Specific Code

The app already includes Median detection and integration:

```javascript
// Automatic Median detection
if (window.MedianCo || window.webkit?.messageHandlers?.median) {
  // Median environment detected
  this.initMedianNotifications();
}
```

---

## 🌐 For Web Browser Push Notifications

### Step 1: Generate VAPID Keys

Install web-push globally:
```bash
npm install -g web-push
```

Generate VAPID keys:
```bash
web-push generate-vapid-keys
```

This will output:
```
Public Key: BKd0F3H4...
Private Key: GJlI8W7...
```

### Step 2: Update Frontend Code

Update `push-notifications.js` with your public key:
```javascript
// Line 8
this.vapidPublicKey = 'YOUR_PUBLIC_VAPID_KEY_HERE';
```

### Step 3: Set Up Backend Server

1. Install dependencies:
```bash
npm init -y
npm install express web-push body-parser cors dotenv
```

2. Create `.env` file:
```env
PORT=3000
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:admin@yourdomain.com
```

3. Use the provided `server-notification-example.js` as your backend

4. Start the server:
```bash
node server-notification-example.js
```

### Step 4: Update Server Endpoint

Update the server endpoint in `push-notifications.js`:
```javascript
// Line 9
this.serverEndpoint = 'https://your-server.com/api/notifications/subscribe';
```

---

## 🚀 Testing Push Notifications

### Test in Browser

1. Open the app in Chrome/Edge/Firefox
2. Click the notification bell icon (🔔)
3. Click "Enable Push Notifications"
4. Allow notifications when prompted
5. Click "Test Alert" to send a test notification

### Test in Median App

1. Install your Median app on device
2. Open the app
3. The app will automatically request permission
4. Send test notification from Median dashboard

### Test Emergency Alert

1. Click the red emergency button (🚨)
2. Confirm the emergency alert
3. All connected devices will receive the alert

---

## 📡 API Endpoints

### Subscribe to Notifications
```http
POST /api/notifications/subscribe
Content-Type: application/json

{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Send Notification
```http
POST /api/notifications/send
Content-Type: application/json

{
  "subscriptionId": "abc123",
  "notification": {
    "title": "Security Alert",
    "body": "New incident reported",
    "icon": "/patch-bg.png",
    "data": {
      "type": "alert",
      "url": "/incident.html"
    }
  }
}
```

### Emergency Broadcast
```http
POST /api/notifications/emergency
Content-Type: application/json

{
  "message": "Officer requires assistance!",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "officer": "Officer Smith",
  "priority": "critical"
}
```

---

## 🎨 Customizing Notifications

### Notification Options

```javascript
{
  title: '🛡️ Security Alert',          // Notification title
  body: 'Alert message here',          // Main content
  icon: '/patch-bg.png',                // Icon (192x192px recommended)
  badge: '/badge-icon.png',             // Small icon (96x96px)
  image: '/notification-image.jpg',     // Large image
  vibrate: [200, 100, 200],            // Vibration pattern
  sound: '/notification.mp3',           // Custom sound (Median only)
  requireInteraction: true,             // Keep notification visible
  tag: 'unique-tag',                   // Group notifications
  renotify: true,                      // Alert again for same tag
  silent: false,                       // Silent notification
  actions: [                           // Action buttons
    {
      action: 'view',
      title: 'View Alert',
      icon: '/view-icon.png'
    }
  ],
  data: {                              // Custom data
    type: 'emergency',
    id: '12345'
  }
}
```

### Notification Types

1. **Emergency Alerts** - Red, high priority, persistent
2. **Shift Reminders** - Blue, medium priority
3. **System Updates** - Green, low priority
4. **Incident Reports** - Yellow, medium priority

---

## 🔒 Security Best Practices

1. **Always use HTTPS** - Push notifications require secure origins
2. **Validate subscriptions** - Check endpoint validity before storing
3. **Rate limiting** - Implement rate limits to prevent spam
4. **Authentication** - Secure your API endpoints with authentication
5. **Data encryption** - Encrypt sensitive data in notifications
6. **User consent** - Always get explicit user permission
7. **Cleanup** - Remove expired subscriptions regularly

---

## 🐛 Troubleshooting

### "Notifications blocked"
- User has blocked notifications in browser/device settings
- Guide user to: Settings → Site Settings → Notifications → Allow

### "Service Worker not registered"
- Check if site is served over HTTPS
- Verify sw.js is in the root directory
- Check browser console for errors

### "Push subscription failed"
- VAPID keys may be incorrect
- Server endpoint may be unreachable
- Check network connectivity

### Median-specific issues
- Ensure push notifications are enabled in Median dashboard
- Verify OneSignal/Firebase configuration
- Check app permissions on device

---

## 📚 Additional Resources

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Median Push Notifications](https://median.co/docs/push-notifications)
- [OneSignal Documentation](https://documentation.onesignal.com)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## 💬 Support

For issues or questions:
- Check browser console for errors
- Review server logs
- Test with the provided test endpoints
- Contact Median support for app-specific issues

---

## ✅ Checklist

- [ ] Generated VAPID keys
- [ ] Updated public key in frontend
- [ ] Set up backend server
- [ ] Configured Median dashboard (if using)
- [ ] Tested in browser
- [ ] Tested in Median app (if using)
- [ ] Implemented error handling
- [ ] Set up monitoring/logging
- [ ] Deployed to production

---

*Built with ❤️ by the Security Companion Pro Team*