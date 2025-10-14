'use strict';

// Minimal Express server to handle Web Push subscription and send test notifications.
// For local demos: node docs/api-server.js

const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;
const DATA_FILE = path.join(__dirname, 'subscriptions.json');

// Generate or read VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let vapidKeys = null;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  vapidKeys = { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY };
} else {
  // Generate once per boot; for persistence use env vars in production
  vapidKeys = webpush.generateVAPIDKeys();
  console.log('[webpush] Generated ephemeral VAPID keys for local dev');
}

webpush.setVapidDetails('mailto:admin@example.com', vapidKeys.publicKey, vapidKeys.privateKey);

// Load persisted subscriptions if present
function loadSubscriptions() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveSubscriptions(list) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
  } catch {}
}

let subscriptions = loadSubscriptions();

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/vapidPublicKey', (_req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  const exists = subscriptions.find((s) => s.endpoint === sub.endpoint);
  if (!exists) {
    subscriptions.push(sub);
    saveSubscriptions(subscriptions);
  }
  res.json({ ok: true });
});

app.post('/api/send-test', async (req, res) => {
  const payload = JSON.stringify({
    title: (req.body && req.body.title) || 'Security Companion',
    body: (req.body && req.body.body) || 'Test push from Security Companion',
  });

  // Broadcast to all current subscriptions
  const results = await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
        return { endpoint: sub.endpoint, ok: true };
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription is gone; prune it
          subscriptions = subscriptions.filter((s) => s.endpoint !== sub.endpoint);
          saveSubscriptions(subscriptions);
        }
        return { endpoint: sub.endpoint, ok: false, error: err.message };
      }
    })
  );

  res.json({ ok: true, results });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
  console.log('Public VAPID key:', vapidKeys.publicKey);
});
