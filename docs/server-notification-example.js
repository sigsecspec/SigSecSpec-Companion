/**
 * Server-Side Push Notification Handler
 * Example implementation for Security Companion Pro
 * Compatible with Median.co and standard web push
 */

// Example using Node.js with Express
const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// VAPID keys - Generate these using web-push library
// npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY';
const VAPID_PRIVATE_KEY = 'YOUR_VAPID_PRIVATE_KEY';
const VAPID_EMAIL = 'mailto:your-email@example.com';

// Configure web-push
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// In-memory storage (use a database in production)
const subscriptions = new Map();
const medianTokens = new Map();

/**
 * Subscribe endpoint for web push notifications
 */
app.post('/api/notifications/subscribe', async (req, res) => {
  try {
    const { subscription, userAgent, timestamp } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    
    // Generate unique ID for this subscription
    const subscriptionId = generateSubscriptionId(subscription.endpoint);
    
    // Store subscription
    subscriptions.set(subscriptionId, {
      subscription,
      userAgent,
      timestamp,
      active: true
    });
    
    // Send welcome notification
    await sendNotification(subscription, {
      title: '✅ Notifications Enabled',
      body: 'Security Companion Pro will keep you updated with important alerts.',
      icon: '/patch-bg.png',
      badge: '/patch-bg.png',
      data: {
        type: 'welcome',
        timestamp: new Date().toISOString()
      }
    });
    
    res.json({ 
      success: true, 
      subscriptionId,
      message: 'Successfully subscribed to push notifications' 
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

/**
 * Unsubscribe endpoint
 */
app.delete('/api/notifications/subscribe', (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    
    const subscriptionId = generateSubscriptionId(subscription.endpoint);
    subscriptions.delete(subscriptionId);
    
    res.json({ 
      success: true, 
      message: 'Successfully unsubscribed from push notifications' 
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * Store Median push token
 */
app.post('/api/notifications/median-token', (req, res) => {
  try {
    const { token, platform, timestamp } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Store token with metadata
    medianTokens.set(token, {
      platform,
      timestamp,
      active: true
    });
    
    res.json({ 
      success: true, 
      message: 'Median token stored successfully' 
    });
  } catch (error) {
    console.error('Median token error:', error);
    res.status(500).json({ error: 'Failed to store token' });
  }
});

/**
 * Send notification to specific user
 */
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { subscriptionId, notification } = req.body;
    
    if (!subscriptionId || !notification) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const sub = subscriptions.get(subscriptionId);
    if (!sub || !sub.active) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    await sendNotification(sub.subscription, notification);
    
    res.json({ 
      success: true, 
      message: 'Notification sent successfully' 
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

/**
 * Broadcast notification to all users
 */
app.post('/api/notifications/broadcast', async (req, res) => {
  try {
    const { notification, targetGroup } = req.body;
    
    if (!notification) {
      return res.status(400).json({ error: 'Missing notification data' });
    }
    
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };
    
    // Send to all active web push subscriptions
    for (const [id, sub] of subscriptions.entries()) {
      if (sub.active) {
        try {
          await sendNotification(sub.subscription, notification);
          results.sent++;
        } catch (error) {
          results.failed++;
          results.errors.push({ id, error: error.message });
          
          // Remove invalid subscriptions
          if (error.statusCode === 410) {
            subscriptions.delete(id);
          }
        }
      }
    }
    
    // Send to Median app users (if integrated with Median backend)
    if (medianTokens.size > 0) {
      await sendMedianNotifications(notification);
    }
    
    res.json({ 
      success: true, 
      results,
      message: `Broadcast sent to ${results.sent} devices` 
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

/**
 * Emergency alert endpoint
 */
app.post('/api/notifications/emergency', async (req, res) => {
  try {
    const { message, location, officer, priority } = req.body;
    
    const emergencyNotification = {
      title: '🚨 EMERGENCY ALERT',
      body: message || 'Officer requires immediate assistance!',
      icon: '/patch-bg.png',
      badge: '/patch-bg.png',
      vibrate: [500, 200, 500, 200, 500],
      tag: 'emergency-' + Date.now(),
      requireInteraction: true,
      priority: 'high',
      actions: [
        { action: 'respond', title: '📞 Respond' },
        { action: 'location', title: '📍 View Location' }
      ],
      data: {
        type: 'emergency',
        location,
        officer,
        timestamp: new Date().toISOString(),
        priority: priority || 'critical'
      }
    };
    
    // Broadcast to all active users
    const results = await broadcastToAll(emergencyNotification);
    
    // Log emergency alert
    console.log('[EMERGENCY]', {
      timestamp: new Date().toISOString(),
      officer,
      location,
      message,
      sent: results.sent
    });
    
    res.json({ 
      success: true, 
      results,
      message: 'Emergency alert sent to all units' 
    });
  } catch (error) {
    console.error('Emergency alert error:', error);
    res.status(500).json({ error: 'Failed to send emergency alert' });
  }
});

/**
 * Shift reminder endpoint
 */
app.post('/api/notifications/shift-reminder', async (req, res) => {
  try {
    const { officerId, shiftTime, type } = req.body;
    
    const notification = {
      title: '⏰ Shift Reminder',
      body: `Your ${type} shift starts at ${shiftTime}`,
      icon: '/patch-bg.png',
      badge: '/patch-bg.png',
      tag: 'shift-reminder',
      data: {
        type: 'shift-reminder',
        shiftTime,
        officerId
      }
    };
    
    // Send to specific officer
    const sub = findSubscriptionByOfficerId(officerId);
    if (sub) {
      await sendNotification(sub.subscription, notification);
    }
    
    res.json({ 
      success: true, 
      message: 'Shift reminder sent' 
    });
  } catch (error) {
    console.error('Shift reminder error:', error);
    res.status(500).json({ error: 'Failed to send shift reminder' });
  }
});

/**
 * Test notification endpoint
 */
app.post('/api/notifications/test', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    const testNotification = {
      title: '🛡️ Test Notification',
      body: 'This is a test from Security Companion Pro',
      icon: '/patch-bg.png',
      badge: '/patch-bg.png',
      vibrate: [200, 100, 200],
      tag: 'test-' + Date.now(),
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    };
    
    if (subscriptionId) {
      const sub = subscriptions.get(subscriptionId);
      if (sub) {
        await sendNotification(sub.subscription, testNotification);
      }
    } else {
      await broadcastToAll(testNotification);
    }
    
    res.json({ 
      success: true, 
      message: 'Test notification sent' 
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

/**
 * Helper function to send notification
 */
async function sendNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Handle expired subscriptions
    if (error.statusCode === 410) {
      console.log('Subscription expired, removing...');
      throw error;
    }
    
    return false;
  }
}

/**
 * Send notifications through Median
 */
async function sendMedianNotifications(notification) {
  // This would integrate with your Median backend
  // Example using Median's API or OneSignal/Firebase
  
  for (const [token, metadata] of medianTokens.entries()) {
    if (metadata.active) {
      // Send through Median's push service
      // Implementation depends on your Median configuration
      console.log('Sending to Median token:', token);
    }
  }
}

/**
 * Broadcast to all subscriptions
 */
async function broadcastToAll(notification) {
  const results = {
    sent: 0,
    failed: 0
  };
  
  for (const [id, sub] of subscriptions.entries()) {
    if (sub.active) {
      try {
        await sendNotification(sub.subscription, notification);
        results.sent++;
      } catch (error) {
        results.failed++;
        if (error.statusCode === 410) {
          subscriptions.delete(id);
        }
      }
    }
  }
  
  return results;
}

/**
 * Generate subscription ID
 */
function generateSubscriptionId(endpoint) {
  return Buffer.from(endpoint).toString('base64').slice(0, 16);
}

/**
 * Find subscription by officer ID (example implementation)
 */
function findSubscriptionByOfficerId(officerId) {
  // In production, this would query a database
  // linking officer IDs to subscriptions
  for (const [id, sub] of subscriptions.entries()) {
    if (sub.metadata && sub.metadata.officerId === officerId) {
      return sub;
    }
  }
  return null;
}

/**
 * Cleanup expired subscriptions
 */
setInterval(() => {
  const now = Date.now();
  for (const [id, sub] of subscriptions.entries()) {
    // Remove subscriptions older than 30 days
    const subTime = new Date(sub.timestamp).getTime();
    if (now - subTime > 30 * 24 * 60 * 60 * 1000) {
      subscriptions.delete(id);
    }
  }
}, 24 * 60 * 60 * 1000); // Run daily

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Security Companion Pro Notification Server`);
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🔔 Push notifications ready`);
});

/**
 * Example environment variables (.env file):
 * 
 * PORT=3000
 * VAPID_PUBLIC_KEY=your_public_key_here
 * VAPID_PRIVATE_KEY=your_private_key_here
 * VAPID_EMAIL=mailto:admin@securitycompanion.com
 * DATABASE_URL=mongodb://localhost:27017/security-companion
 * MEDIAN_API_KEY=your_median_api_key
 * ONESIGNAL_APP_ID=your_onesignal_app_id
 * ONESIGNAL_API_KEY=your_onesignal_api_key
 */

module.exports = app;