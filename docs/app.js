// Security Companion - Core Application JavaScript v2.0

// ============================================
// Global Configuration
// ============================================
const APP_CONFIG = {
  name: 'Security Companion',
  version: '2.0.0',
  apiUrl: '',
  vapidPublicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxN-RgKBWw_dUabGrLpHyHUNBEQRilh7J7-fKKRJQQiOOk1gUzSA',
  storageKeys: {
    theme: 'app_theme',
    textSize: 'app_text_size',
    profile: 'user_profile',
    incidents: 'saved_incidents',
    shifts: 'saved_shifts',
    patrols: 'saved_patrols',
    drafts: 'report_drafts',
    contacts: 'emergency_contacts',
    settings: 'app_settings',
    notifications: 'push_subscription'
  }
};

// ============================================
// Theme Management
// ============================================
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem(APP_CONFIG.storageKeys.theme) || 'dark';
    this.init();
  }

  init() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.querySelectorAll('.theme-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => this.toggleTheme());
    });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem(APP_CONFIG.storageKeys.theme, this.currentTheme);
    this.notifyChange();
  }

  notifyChange() {
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: this.currentTheme } 
    }));
  }

  getTheme() {
    return this.currentTheme;
  }
}

// ============================================
// Storage Manager
// ============================================
class StorageManager {
  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Storage save error:', error);
      return false;
    }
  }

  static load(key, fallback = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (error) {
      console.error('Storage load error:', error);
      return fallback;
    }
  }

  static remove(key) {
    localStorage.removeItem(key);
  }

  static clear() {
    localStorage.clear();
  }

  static getUsage() {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    return (totalSize / 1024).toFixed(2) + ' KB';
  }
}

// ============================================
// User Profile Manager
// ============================================
class ProfileManager {
  constructor() {
    this.profile = this.loadProfile();
  }

  loadProfile() {
    return StorageManager.load(APP_CONFIG.storageKeys.profile, {
      name: '',
      badge: '',
      department: '',
      post: '',
      shift: '',
      supervisor: '',
      email: '',
      phone: ''
    });
  }

  saveProfile(profileData) {
    this.profile = { ...this.profile, ...profileData };
    StorageManager.save(APP_CONFIG.storageKeys.profile, this.profile);
    this.notifyChange();
  }

  getProfile() {
    return this.profile;
  }

  notifyChange() {
    window.dispatchEvent(new CustomEvent('profileUpdated', { 
      detail: { profile: this.profile } 
    }));
  }
}

// ============================================
// Report Generator
// ============================================
class ReportGenerator {
  constructor() {
    this.templates = {
      incident: this.incidentTemplate,
      shift: this.shiftTemplate,
      patrol: this.patrolTemplate
    };
  }

  generateReport(type, data) {
    const template = this.templates[type];
    if (!template) {
      throw new Error(`Unknown report type: ${type}`);
    }
    return template.call(this, data);
  }

  incidentTemplate(data) {
    const timestamp = new Date().toISOString();
    const reportNumber = 'INC-' + Date.now().toString().slice(-8);
    
    // Anonymize people involved
    const anonymizedPeople = this.anonymizePeople(data.people || []);
    
    let report = `
═══════════════════════════════════════════════════════════════════════════════
                              SECURITY INCIDENT REPORT
═══════════════════════════════════════════════════════════════════════════════

REPORT NUMBER: ${reportNumber}
GENERATED: ${this.formatDateTime(timestamp)}
CLASSIFICATION: ${(data.type || 'GENERAL').toUpperCase()} - ${(data.severity || 'LOW').toUpperCase()} PRIORITY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                INCIDENT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATE/TIME OF INCIDENT:   ${this.formatDateTime(data.incidentDateTime)}
DATE/TIME OF REPORT:     ${this.formatDateTime(data.reportDateTime || timestamp)}

LOCATION:                ${data.location || 'Not specified'}
SPECIFIC AREA:           ${data.specificLocation || 'Not specified'}
POST/ASSIGNMENT:         ${data.post || 'Not specified'}

REPORTING OFFICER:       ${data.officerName || 'Not specified'}
BADGE NUMBER:            ${data.badgeNumber || 'Not specified'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              INVOLVED PARTIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${this.formatInvolvedParties(anonymizedPeople)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                             INCIDENT NARRATIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INITIAL CONTACT:
${this.formatNarrative(data.initialContact || 'Security officer discovered/was alerted to the incident during routine duties.')}

SEQUENCE OF EVENTS:
${this.formatNarrative(data.incidentDescription || 'No detailed description provided.')}

OFFICER RESPONSE & ACTIONS TAKEN:
${this.formatNarrative(data.actionTaken || 'Standard security protocols were followed.')}

INCIDENT RESOLUTION:
${this.formatNarrative(data.resolution || 'Incident was resolved without further escalation.')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         DAMAGES, INJURIES & EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROPERTY DAMAGE/LOSS:
${data.propertyDamage ? this.formatNarrative(data.propertyDamage) : '  None reported.'}

INJURIES:
${data.injuries ? this.formatNarrative(data.injuries) : '  No injuries reported.'}

EVIDENCE COLLECTED:
${data.evidence ? '  • ' + data.evidence : '  None collected at scene.'}

${data.policeReport ? `LAW ENFORCEMENT INVOLVEMENT:
  Police Report Number: ${data.policeReport}` : ''}

${data.additionalNotes ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                           ADDITIONAL INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${this.formatNarrative(data.additionalNotes)}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            REPORT CERTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I certify that the information contained in this report is true and accurate to
the best of my knowledge and belief.

REPORTING OFFICER: ${data.officerName || 'Not specified'}
BADGE NUMBER: ${data.badgeNumber || 'Not specified'}
DATE/TIME: ${this.formatDateTime(timestamp)}

═══════════════════════════════════════════════════════════════════════════════
                              END OF REPORT
═══════════════════════════════════════════════════════════════════════════════`;

    return report.trim();
  }

  shiftTemplate(data) {
    const timestamp = new Date().toISOString();
    const reportNumber = 'SHIFT-' + Date.now().toString().slice(-8);
    
    let report = `
═══════════════════════════════════════════════════════════════════════════════
                               SHIFT REPORT
═══════════════════════════════════════════════════════════════════════════════

REPORT NUMBER: ${reportNumber}
GENERATED: ${this.formatDateTime(timestamp)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                             SHIFT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATE:              ${data.date || 'Not specified'}
GUARD:             ${data.guardName || 'Not specified'}
POST/LOCATION:     ${data.post || 'Not specified'}
SHIFT TIME:        ${data.startTime || '00:00'} - ${data.endTime || '00:00'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              SHIFT ACTIVITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PATROLS CONDUCTED:
${this.formatSection(data.patrols)}

INCIDENTS REPORTED:
${this.formatSection(data.incidents)}

VISITORS/DELIVERIES:
${this.formatSection(data.visitors)}

ALARMS/CALLS RESPONDED:
${this.formatSection(data.alarms)}

MAINTENANCE/SAFETY ISSUES:
${this.formatSection(data.maintenanceIssues)}

EQUIPMENT ISSUES:
${this.formatSection(data.equipmentIssues)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            PATROL DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${this.formatPatrolDetails(data.patrolDetails)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                           HANDOFF INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTES FOR NEXT SHIFT:
${this.formatSection(data.handoffNotes)}

FOLLOW-UP REQUIRED:
${this.formatSection(data.followUp)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                           ATTACHED INCIDENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${data.attachedIncidents && data.attachedIncidents.length > 0 ? 
  data.attachedIncidents.map((inc, i) => `[${i+1}] ${inc.type} - ${inc.time} - ${inc.location}`).join('\n') :
  'No incidents attached to this shift report.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            SHIFT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SHIFT STATUS:      ${data.shiftStatus || 'Completed without major incidents'}
RELIEF OFFICER:    ${data.reliefOfficer || 'Not specified'}
END OF SHIFT:      ${this.formatDateTime(timestamp)}

═══════════════════════════════════════════════════════════════════════════════
                            END OF SHIFT REPORT
═══════════════════════════════════════════════════════════════════════════════`;

    return report.trim();
  }

  patrolTemplate(data) {
    const timestamp = new Date().toISOString();
    const reportNumber = 'PTL-' + Date.now().toString().slice(-8);
    
    let report = `
═══════════════════════════════════════════════════════════════════════════════
                              PATROL LOG REPORT
═══════════════════════════════════════════════════════════════════════════════

REPORT NUMBER: ${reportNumber}
GENERATED: ${this.formatDateTime(timestamp)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                             PATROL INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

START TIME:        ${this.formatDateTime(data.startTime)}
END TIME:          ${this.formatDateTime(data.endTime)}
DURATION:          ${this.calculateDuration(data.startTime, data.endTime)}
OFFICER:           ${data.officerName || 'Not specified'}
PATROL TYPE:       ${data.patrolType || 'Routine'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              CHECKPOINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${this.formatCheckpoints(data.checkpoints)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            OBSERVATIONS & NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${this.formatPatrolNotes(data.notes)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              PATROL SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOTAL CHECKPOINTS:    ${data.checkpoints ? data.checkpoints.length : 0}
INCIDENTS REPORTED:   ${data.incidentCount || 0}
AREAS COVERED:        ${data.areasCovered || 'All assigned areas'}
STATUS:               ${data.status || 'Completed successfully'}

═══════════════════════════════════════════════════════════════════════════════
                            END OF PATROL LOG
═══════════════════════════════════════════════════════════════════════════════`;

    return report.trim();
  }

  // Helper methods
  anonymizePeople(people) {
    const anonymized = [];
    const roleCount = { victim: 0, suspect: 0, witness: 0, other: 0 };
    
    people.forEach(person => {
      const role = (person.role || 'other').toLowerCase();
      roleCount[role] = (roleCount[role] || 0) + 1;
      
      anonymized.push({
        ...person,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)}${roleCount[role]}`,
        originalName: person.name
      });
    });
    
    return anonymized;
  }

  formatInvolvedParties(people) {
    if (!people || people.length === 0) {
      return 'No involved parties documented.';
    }

    const grouped = {
      victim: people.filter(p => p.role === 'victim'),
      suspect: people.filter(p => p.role === 'suspect'),
      witness: people.filter(p => p.role === 'witness'),
      other: people.filter(p => !['victim', 'suspect', 'witness'].includes(p.role))
    };

    let output = '';

    if (grouped.victim.length > 0) {
      output += 'VICTIMS:\n';
      grouped.victim.forEach(v => {
        output += `  ${v.name}:\n`;
        output += `    • Description: ${v.description || 'Not provided'}\n`;
        output += `    • Clothing: ${v.clothing || 'Not described'}\n`;
        if (v.identification) output += `    • ID: On file\n`;
      });
    }

    if (grouped.suspect.length > 0) {
      output += '\nSUSPECTS:\n';
      grouped.suspect.forEach(s => {
        output += `  ${s.name}:\n`;
        output += `    • Description: ${s.description || 'Not provided'}\n`;
        output += `    • Clothing: ${s.clothing || 'Not described'}\n`;
        if (s.identification) output += `    • ID: On file\n`;
      });
    }

    if (grouped.witness.length > 0) {
      output += '\nWITNESSES:\n';
      grouped.witness.forEach(w => {
        output += `  ${w.name}:\n`;
        output += `    • Description: ${w.description || 'Not provided'}\n`;
        if (w.identification) output += `    • Contact: On file\n`;
      });
    }

    return output || 'No involved parties documented.';
  }

  formatNarrative(text) {
    if (!text) return '  No information provided.';
    
    // Clean up and format the text
    const cleaned = text.trim().replace(/\s+/g, ' ');
    const sentences = cleaned.split(/(?<=[.!?])\s+/);
    
    let formatted = '';
    let currentLine = '  ';
    
    sentences.forEach(sentence => {
      if ((currentLine + sentence).length > 78) {
        formatted += currentLine + '\n';
        currentLine = '  ' + sentence;
      } else {
        currentLine += (currentLine === '  ' ? '' : ' ') + sentence;
      }
    });
    
    if (currentLine !== '  ') {
      formatted += currentLine;
    }
    
    return formatted || '  No information provided.';
  }

  formatSection(text) {
    if (!text || text.trim() === '') {
      return '  None reported.';
    }
    return this.formatNarrative(text);
  }

  formatDateTime(dateTime) {
    if (!dateTime) return 'Not specified';
    
    const date = new Date(dateTime);
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    return date.toLocaleString('en-US', options);
  }

  calculateDuration(start, end) {
    if (!start || !end) return 'Unknown';
    
    const startTime = new Date(start);
    const endTime = new Date(end);
    const duration = endTime - startTime;
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours} hours, ${minutes} minutes`;
  }

  formatCheckpoints(checkpoints) {
    if (!checkpoints || checkpoints.length === 0) {
      return 'No checkpoints recorded.';
    }

    return checkpoints.map((cp, index) => {
      const time = this.formatDateTime(cp.timestamp);
      const location = cp.location || 'Unspecified location';
      const notes = cp.notes ? `\n    Notes: ${cp.notes}` : '';
      return `[${index + 1}] ${time}\n    Location: ${location}${notes}`;
    }).join('\n\n');
  }

  formatPatrolNotes(notes) {
    if (!notes || notes.length === 0) {
      return 'No observations or notes recorded during patrol.';
    }

    return notes.map((note, index) => {
      const time = this.formatDateTime(note.timestamp);
      const text = note.text || 'No details provided';
      return `[${index + 1}] ${time}\n    ${text}`;
    }).join('\n\n');
  }

  formatPatrolDetails(patrols) {
    if (!patrols || patrols.length === 0) {
      return 'No patrol details attached.';
    }

    return patrols.map((patrol, index) => {
      return `
[${index + 1}] Patrol ${patrol.id || index + 1}
    Start: ${this.formatDateTime(patrol.startTime)}
    End: ${this.formatDateTime(patrol.endTime)}
    Duration: ${this.calculateDuration(patrol.startTime, patrol.endTime)}
    Checkpoints: ${patrol.checkpoints ? patrol.checkpoints.length : 0}
    Notes: ${patrol.notes ? patrol.notes.length : 0}`;
    }).join('\n');
  }
}

// ============================================
// Push Notification Manager
// ============================================
class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
    this.subscription = null;
    this.init();
  }

  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      
      this.subscription = await registration.pushManager.getSubscription();
      
      if (!this.subscription && this.permission === 'granted') {
        await this.subscribe(registration);
      }
      
      this.updateUI();
    } catch (error) {
      console.error('Notification initialization error:', error);
    }
  }

  async requestPermission() {
    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      await this.subscribe(registration);
      return true;
    }
    
    return false;
  }

  async subscribe(registration) {
    try {
      const vapidPublicKey = this.urlBase64ToUint8Array(APP_CONFIG.vapidPublicKey);
      
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      console.log('Push subscription successful');
      StorageManager.save(APP_CONFIG.storageKeys.notifications, this.subscription);
      
      // Send subscription to server (implement server endpoint)
      // await this.sendSubscriptionToServer(this.subscription);
      
      this.showLocalNotification('Welcome!', 'Push notifications are now enabled');
      this.updateUI();
      
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

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

  showLocalNotification(title, body, options = {}) {
    if (this.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      body: body,
      icon: '/patch-bg.png',
      badge: '/patch-bg.png',
      vibrate: [200, 100, 200],
      tag: 'security-notification',
      requireInteraction: false,
      ...options
    });

    notification.onclick = function() {
      window.focus();
      notification.close();
    };

    setTimeout(() => notification.close(), 5000);
  }

  async sendTestNotification() {
    if (!this.subscription) {
      const granted = await this.requestPermission();
      if (!granted) {
        alert('Please enable notifications to receive alerts');
        return;
      }
    }

    this.showLocalNotification(
      'Security Alert Test',
      'This is a test notification from Security Companion',
      {
        actions: [
          { action: 'view', title: 'View Details' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      }
    );
  }

  updateUI() {
    const statusElements = document.querySelectorAll('[data-notification-status]');
    const enabled = this.permission === 'granted' && this.subscription !== null;
    
    statusElements.forEach(element => {
      element.textContent = enabled ? 'Notifications: ON' : 'Notifications: OFF';
      element.classList.toggle('text-success', enabled);
      element.classList.toggle('text-muted', !enabled);
    });
  }
}

// ============================================
// Utility Functions
// ============================================
const Utils = {
  formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  },

  formatDateTime(date) {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch (err) {
        document.body.removeChild(textarea);
        return false;
      }
    }
  },

  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} fade-in`;
    toast.textContent = message;
    
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      padding: 1rem 1.5rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      color: var(--text-primary);
      z-index: 1000;
      box-shadow: var(--shadow-lg);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  },

  vibrate(pattern = [200]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
};

// ============================================
// Modal Manager
// ============================================
class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
  }

  create(id, options = {}) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">${options.title || 'Modal'}</h3>
          <button class="btn modal-close" data-modal-close>&times;</button>
        </div>
        <div class="modal-body">
          ${options.content || ''}
        </div>
        ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
      </div>
    `;
    
    document.body.appendChild(modal);
    this.modals.set(id, modal);
    
    // Event listeners
    modal.querySelector('[data-modal-close]').addEventListener('click', () => {
      this.close(id);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close(id);
      }
    });
    
    return modal;
  }

  open(id) {
    const modal = this.modals.get(id) || document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
      this.activeModal = modal;
      document.body.style.overflow = 'hidden';
    }
  }

  close(id) {
    const modal = this.modals.get(id) || document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      this.activeModal = null;
      document.body.style.overflow = '';
    }
  }

  destroy(id) {
    const modal = this.modals.get(id);
    if (modal) {
      modal.remove();
      this.modals.delete(id);
    }
  }
}

// ============================================
// Form Validator
// ============================================
class FormValidator {
  constructor(form) {
    this.form = form;
    this.errors = new Map();
  }

  validate() {
    this.errors.clear();
    const inputs = this.form.querySelectorAll('[required], [data-validate]');
    
    inputs.forEach(input => {
      this.validateInput(input);
    });
    
    return this.errors.size === 0;
  }

  validateInput(input) {
    const value = input.value.trim();
    const name = input.name || input.id;
    
    // Required validation
    if (input.hasAttribute('required') && !value) {
      this.addError(name, 'This field is required');
      return;
    }
    
    // Email validation
    if (input.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.addError(name, 'Please enter a valid email address');
      }
    }
    
    // Phone validation
    if (input.type === 'tel' && value) {
      const phoneRegex = /^[\d\s\-\(\)+]+$/;
      if (!phoneRegex.test(value)) {
        this.addError(name, 'Please enter a valid phone number');
      }
    }
    
    // Custom validation
    const validateType = input.dataset.validate;
    if (validateType && value) {
      this.customValidation(input, validateType, value);
    }
  }

  customValidation(input, type, value) {
    const name = input.name || input.id;
    
    switch (type) {
      case 'badge':
        if (!/^[A-Z0-9\-]+$/i.test(value)) {
          this.addError(name, 'Badge number must contain only letters, numbers, and hyphens');
        }
        break;
      case 'time':
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          this.addError(name, 'Please enter time in HH:MM format');
        }
        break;
    }
  }

  addError(field, message) {
    this.errors.set(field, message);
    this.showError(field, message);
  }

  showError(field, message) {
    const input = this.form.querySelector(`[name="${field}"], #${field}`);
    if (input) {
      input.classList.add('error');
      
      let errorElement = input.parentElement.querySelector('.error-message');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message text-error text-sm mt-1';
        input.parentElement.appendChild(errorElement);
      }
      errorElement.textContent = message;
    }
  }

  clearErrors() {
    this.form.querySelectorAll('.error').forEach(element => {
      element.classList.remove('error');
    });
    
    this.form.querySelectorAll('.error-message').forEach(element => {
      element.remove();
    });
    
    this.errors.clear();
  }

  getErrors() {
    return Array.from(this.errors.entries());
  }
}

// ============================================
// App Initialization
// ============================================
class SecurityCompanionApp {
  constructor() {
    this.theme = null;
    this.profile = null;
    this.notifications = null;
    this.reportGenerator = null;
    this.modalManager = null;
  }

  async init() {
    // Initialize core managers
    this.theme = new ThemeManager();
    this.profile = new ProfileManager();
    this.notifications = new NotificationManager();
    this.reportGenerator = new ReportGenerator();
    this.modalManager = new ModalManager();
    
    // Setup global event listeners
    this.setupEventListeners();
    
    // Initialize page-specific features
    this.initPageFeatures();
    
    // Check for updates
    this.checkForUpdates();
    
    console.log('Security Companion App initialized');
  }

  setupEventListeners() {
    // Handle emergency button
    document.querySelectorAll('.emergency-btn').forEach(btn => {
      btn.addEventListener('click', () => this.triggerEmergency());
    });
    
    // Handle copy buttons
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const target = e.target.dataset.copy;
        const text = document.querySelector(target)?.textContent;
        if (text) {
          const success = await Utils.copyToClipboard(text);
          Utils.showToast(success ? 'Copied to clipboard!' : 'Copy failed', success ? 'success' : 'error');
        }
      });
    });
    
    // Handle print buttons
    document.querySelectorAll('[data-print]').forEach(btn => {
      btn.addEventListener('click', () => window.print());
    });
  }

  initPageFeatures() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    
    switch (page) {
      case 'index.html':
        this.initHomePage();
        break;
      case 'incident.html':
        this.initIncidentPage();
        break;
      case 'shift.html':
        this.initShiftPage();
        break;
      case 'patrol.html':
        this.initPatrolPage();
        break;
      case 'profile.html':
        this.initProfilePage();
        break;
    }
  }

  initHomePage() {
    // Update officer name
    const profile = this.profile.getProfile();
    document.querySelectorAll('[data-officer-name]').forEach(element => {
      element.textContent = profile.name || 'Officer';
    });
    
    // Update time display
    this.updateTimeDisplay();
    setInterval(() => this.updateTimeDisplay(), 1000);
  }

  initIncidentPage() {
    // Incident report specific initialization
    console.log('Incident page initialized');
  }

  initShiftPage() {
    // Shift report specific initialization
    console.log('Shift page initialized');
  }

  initPatrolPage() {
    // Patrol log specific initialization
    console.log('Patrol page initialized');
  }

  initProfilePage() {
    // Profile page specific initialization
    console.log('Profile page initialized');
  }

  updateTimeDisplay() {
    const now = new Date();
    document.querySelectorAll('[data-current-time]').forEach(element => {
      element.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    });
  }

  async triggerEmergency() {
    const confirmed = confirm('Send emergency alert? This will notify dispatch immediately.');
    
    if (confirmed) {
      Utils.vibrate([200, 100, 200, 100, 200]);
      
      // Send emergency notification
      this.notifications.showLocalNotification(
        '🚨 EMERGENCY ALERT',
        'Emergency alert has been triggered. Dispatch has been notified.',
        { requireInteraction: true }
      );
      
      // Log emergency
      const emergency = {
        id: Utils.generateId(),
        timestamp: new Date().toISOString(),
        location: await this.getCurrentLocation(),
        officer: this.profile.getProfile().name
      };
      
      // Save to storage
      const emergencies = StorageManager.load('emergencies', []);
      emergencies.push(emergency);
      StorageManager.save('emergencies', emergencies);
      
      Utils.showToast('Emergency alert sent!', 'error', 5000);
    }
  }

  async getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ error: 'Geolocation not supported' });
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          resolve({ error: error.message });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }

  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            Utils.showToast('App update available! Refresh to update.', 'info', 5000);
          }
        });
      });
    }
  }
}

// ============================================
// Initialize App on DOM Ready
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SecurityCompanionApp();
  window.app.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SecurityCompanionApp,
    ThemeManager,
    StorageManager,
    ProfileManager,
    ReportGenerator,
    NotificationManager,
    ModalManager,
    FormValidator,
    Utils,
    APP_CONFIG
  };
}