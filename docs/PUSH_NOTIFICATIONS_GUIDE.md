# Push Notifications Implementation Guide

## Overview

The Security Companion app now includes a comprehensive push notification system that enables real-time alerts and communications. This guide explains how to implement and deploy the notification system.

## Features

### ✅ Client-Side Features
- **Automatic Permission Request**: App requests notification permissions on first load
- **Service Worker Integration**: Handles background notifications seamlessly
- **VAPID Key Support**: Secure push notification delivery
- **Local Notifications**: Test notifications without server
- **Notification Status Display**: Real-time status in the UI
- **Professional Icons**: Uses patch-bg.png for all notification icons
- **Rich Notifications**: Supports actions, badges, and custom data

### ✅ Server-Side Features
- **Express.js Server**: Complete Node.js implementation
- **Subscription Management**: Handles client subscriptions
- **Notification Templates**: Pre-built templates for security scenarios
- **Bulk Notifications**: Send to all subscribers
- **Error Handling**: Automatic cleanup of invalid subscriptions
- **Health Monitoring**: API endpoints for monitoring

## Quick Start

### 1. Client Setup (Already Implemented)

The client-side code is already integrated into `index.html`:

```javascript
// Automatic initialization
initializePushNotifications();

// Test notification
sendTestNotification();
```

### 2. Server Setup

1. **Install Dependencies**:
```bash
npm install web-push express cors body-parser
```

2. **Generate VAPID Keys**:
Visit https://vapidkeys.com/ to generate your keys

3. **Deploy Server**:
Use the provided `push-server-example.js` and deploy to:
- Heroku
- AWS Lambda
- Google Cloud Functions
- Your own server

4. **Update Client Configuration**:
Replace the demo VAPID key in `index.html` with your public key:
```javascript
const vapidPublicKey = 'YOUR_PUBLIC_VAPID_KEY_HERE';
```

## API Endpoints

### Subscription Management
```
POST /api/subscribe
- Registers a new push subscription
- Body: PushSubscription object
```

### Send Notifications
```
POST /api/send-notification
- Sends custom notification to all subscribers
- Body: { title, body, icon, badge, url, tag }

POST /api/emergency-alert
- Sends emergency alert
- Body: { message }

POST /api/patrol-reminder
- Sends patrol reminder
- Body: { message }
```

### Monitoring
```
GET /api/health
- Returns server status and subscriber count

GET /api/subscribers
- Returns current subscriber count
```

## Notification Types

### 🚨 Emergency Alert
```javascript
{
  title: '🚨 EMERGENCY ALERT',
  body: 'Emergency situation reported. All units respond.',
  tag: 'emergency',
  requireInteraction: true
}
```

### 🚶 Patrol Update
```javascript
{
  title: '🚶 Patrol Update',
  body: 'Patrol checkpoint reminder - Check in required',
  tag: 'patrol'
}
```

### 📝 Incident Report
```javascript
{
  title: '📝 Incident Report',
  body: 'New incident reported in your area',
  tag: 'incident'
}
```

### ⏰ Shift Reminder
```javascript
{
  title: '⏰ Shift Reminder',
  body: 'Shift change in 30 minutes',
  tag: 'shift'
}
```

### 🚔 Backup Request
```javascript
{
  title: '🚔 Backup Requested',
  body: 'Backup assistance requested at your location',
  tag: 'backup',
  requireInteraction: true
}
```

## Testing

### Local Testing
1. Open the app in a browser that supports push notifications (Chrome, Firefox, Edge)
2. Allow notifications when prompted
3. Click the "🔔" button in the notification status section
4. You should see a test notification

### Server Testing
```bash
# Send emergency alert
curl -X POST https://your-server.com/api/emergency-alert \
  -H "Content-Type: application/json" \
  -d '{"message": "Test emergency alert"}'

# Send custom notification
curl -X POST https://your-server.com/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Security Alert",
    "body": "Suspicious activity detected in Zone A",
    "tag": "security"
  }'
```

## Security Considerations

### VAPID Keys
- Keep your private VAPID key secure
- Never expose it in client-side code
- Rotate keys periodically
- Use environment variables for production

### Subscription Storage
- Store subscriptions in a secure database
- Implement user authentication
- Clean up expired subscriptions
- Monitor for abuse

### Content Validation
- Validate all notification content
- Sanitize user inputs
- Implement rate limiting
- Log all notification activities

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best experience |
| Firefox | ✅ Full | Full feature support |
| Safari | ⚠️ Limited | iOS 16.4+ only |
| Edge | ✅ Full | Chromium-based |

## Deployment Checklist

- [ ] Generate production VAPID keys
- [ ] Set up secure server hosting
- [ ] Configure SSL/HTTPS
- [ ] Set up database for subscriptions
- [ ] Implement user authentication
- [ ] Add monitoring and logging
- [ ] Test on multiple devices
- [ ] Configure rate limiting
- [ ] Set up backup systems
- [ ] Document API for team

## Troubleshooting

### Common Issues

**Notifications not appearing**:
- Check browser permissions
- Verify VAPID keys match
- Ensure HTTPS is enabled
- Check service worker registration

**Server errors**:
- Verify subscription format
- Check VAPID key configuration
- Monitor server logs
- Validate JSON payloads

**Performance issues**:
- Implement subscription cleanup
- Use database indexing
- Add caching layer
- Monitor memory usage

## Advanced Features

### Scheduled Notifications
Implement cron jobs or scheduled tasks to send:
- Shift reminders
- Patrol checkpoints
- Daily briefings
- Weekly reports

### Geolocation Integration
Combine with GPS for:
- Location-based alerts
- Proximity notifications
- Zone-specific messages
- Emergency response coordination

### Analytics
Track notification:
- Delivery rates
- Click-through rates
- User engagement
- Performance metrics

## Support

For technical support or questions:
1. Check the browser console for errors
2. Verify network connectivity
3. Test with different browsers
4. Review server logs
5. Check VAPID key configuration

## License

This implementation is part of the Security Companion app and follows the same licensing terms.