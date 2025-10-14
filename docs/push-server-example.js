// Push Notification Server Example
// This is a Node.js server example for sending push notifications
// You would deploy this to your server (e.g., Heroku, AWS, etc.)

const webpush = require('web-push');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// VAPID Keys - Generate your own at https://vapidkeys.com/
const vapidKeys = {
  publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxN-RgKBWw_dUabGrLpHyHUNBEQRilh7J7-fKKRJQQiOOk1gUzSA',
  privateKey: 'your-private-key-here' // Keep this secret!
};

// Configure web-push
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Store subscriptions (use a database in production)
let subscriptions = [];

// Endpoint to receive subscription from client
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  
  // Validate subscription
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  
  // Store subscription (use database in production)
  subscriptions.push(subscription);
  
  console.log('New subscription:', subscription.endpoint);
  res.status(201).json({ message: 'Subscription saved' });
});

// Endpoint to send notifications
app.post('/api/send-notification', async (req, res) => {
  const { title, body, icon, badge, url, tag } = req.body;
  
  const notificationPayload = JSON.stringify({
    title: title || 'Security Companion',
    body: body || 'New notification',
    icon: icon || 'patch-bg.png',
    badge: badge || 'patch-bg.png',
    url: url || '/',
    tag: tag || 'general'
  });
  
  const promises = subscriptions.map(subscription => {
    return webpush.sendNotification(subscription, notificationPayload)
      .catch(error => {
        console.error('Error sending notification:', error);
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          const index = subscriptions.indexOf(subscription);
          if (index > -1) {
            subscriptions.splice(index, 1);
          }
        }
      });
  });
  
  try {
    await Promise.all(promises);
    res.json({ 
      message: `Notification sent to ${subscriptions.length} subscribers`,
      sent: subscriptions.length 
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Predefined notification templates for security scenarios
const notificationTemplates = {
  emergency: {
    title: '🚨 EMERGENCY ALERT',
    body: 'Emergency situation reported. All units respond.',
    tag: 'emergency',
    requireInteraction: true
  },
  patrol: {
    title: '🚶 Patrol Update',
    body: 'Patrol checkpoint reminder - Check in required',
    tag: 'patrol'
  },
  incident: {
    title: '📝 Incident Report',
    body: 'New incident reported in your area',
    tag: 'incident'
  },
  shift: {
    title: '⏰ Shift Reminder',
    body: 'Shift change in 30 minutes',
    tag: 'shift'
  },
  backup: {
    title: '🚔 Backup Requested',
    body: 'Backup assistance requested at your location',
    tag: 'backup',
    requireInteraction: true
  }
};

// Quick notification endpoints
app.post('/api/emergency-alert', (req, res) => {
  const notification = {
    ...notificationTemplates.emergency,
    body: req.body.message || notificationTemplates.emergency.body
  };
  
  sendToAllSubscribers(notification);
  res.json({ message: 'Emergency alert sent' });
});

app.post('/api/patrol-reminder', (req, res) => {
  const notification = {
    ...notificationTemplates.patrol,
    body: req.body.message || notificationTemplates.patrol.body
  };
  
  sendToAllSubscribers(notification);
  res.json({ message: 'Patrol reminder sent' });
});

async function sendToAllSubscribers(notification) {
  const payload = JSON.stringify(notification);
  
  const promises = subscriptions.map(subscription => {
    return webpush.sendNotification(subscription, payload)
      .catch(error => {
        console.error('Error sending notification:', error);
        if (error.statusCode === 410) {
          const index = subscriptions.indexOf(subscription);
          if (index > -1) {
            subscriptions.splice(index, 1);
          }
        }
      });
  });
  
  await Promise.all(promises);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    subscribers: subscriptions.length,
    timestamp: new Date().toISOString()
  });
});

// Get subscription count
app.get('/api/subscribers', (req, res) => {
  res.json({ count: subscriptions.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Push notification server running on port ${PORT}`);
  console.log(`Subscribers: ${subscriptions.length}`);
});

// Example usage:
// 
// 1. Install dependencies:
//    npm install web-push express cors body-parser
//
// 2. Generate VAPID keys at https://vapidkeys.com/
//
// 3. Update vapidKeys with your keys
//
// 4. Deploy to your server
//
// 5. Update your client app to use your server URL instead of localhost
//
// Example client code to subscribe:
/*
async function subscribeToNotifications() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'your-public-vapid-key'
  });
  
  await fetch('https://your-server.com/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
}
*/

// Example to send notification from server:
/*
curl -X POST https://your-server.com/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Security Alert",
    "body": "Suspicious activity detected in Zone A",
    "tag": "security"
  }'
*/