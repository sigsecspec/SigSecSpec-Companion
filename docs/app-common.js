/**
 * Security Companion - Common Functionality
 * Shared JavaScript functions across all pages
 */

// Theme management
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Send notification about theme change
  if (window.securityNotifications) {
    window.securityNotifications.showLocalNotification(
      'Theme Changed',
      `Switched to ${newTheme} mode`,
      { tag: 'theme-change', requireInteraction: false }
    );
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// Text size management
function toggleTextSize() {
  document.body.classList.toggle('text-lg');
  const isLarge = document.body.classList.contains('text-lg');
  localStorage.setItem('largeText', isLarge);
  
  // Update button text if it exists
  const textSizeBtn = document.querySelector('[aria-label="Toggle text size"]');
  if (textSizeBtn) {
    textSizeBtn.textContent = isLarge ? 'A-' : 'A+';
  }
}

function initTextSize() {
  if (localStorage.getItem('largeText') === 'true') {
    document.body.classList.add('text-lg');
    const textSizeBtn = document.querySelector('[aria-label="Toggle text size"]');
    if (textSizeBtn) {
      textSizeBtn.textContent = 'A-';
    }
  }
}

// Time display
function updateTime() {
  const timeElements = document.querySelectorAll('#currentTime');
  const now = new Date();
  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  timeElements.forEach(element => {
    element.textContent = timeString;
  });
}

// Officer name management
function loadOfficerName() {
  const name = localStorage.getItem('officerName') || 'Officer';
  const nameElements = document.querySelectorAll('#officerName');
  nameElements.forEach(element => {
    if (element.tagName === 'INPUT') {
      element.value = name;
    } else {
      element.textContent = name;
    }
  });
}

// Enhanced touch feedback
function addTouchFeedback() {
  document.querySelectorAll('.mobile-card, .touch-btn').forEach(element => {
    // Touch start
    element.addEventListener('touchstart', function(e) {
      this.style.transform = 'scale(0.98)';
      this.style.transition = 'transform 0.1s ease';
    });
    
    // Touch end
    element.addEventListener('touchend', function(e) {
      setTimeout(() => {
        this.style.transform = '';
        this.style.transition = '';
      }, 150);
    });

    // Add ripple effect
    element.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        z-index: 1000;
      `;
      
      this.style.position = 'relative';
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// Add ripple animation CSS
function addRippleStyles() {
  if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid var(--text-muted);
        border-radius: 50%;
        border-top-color: var(--accent-primary);
        animation: spin 1s ease-in-out infinite;
        margin-left: 8px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Enhanced loading states
function showLoadingState(element, text = 'Loading...') {
  if (element) {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
    element.innerHTML += `<div class="loading-spinner"></div>`;
    
    if (text) {
      element.setAttribute('data-original-text', element.textContent);
      element.textContent = text;
    }
  }
}

function hideLoadingState(element) {
  if (element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
    const spinner = element.querySelector('.loading-spinner');
    if (spinner) spinner.remove();
    
    const originalText = element.getAttribute('data-original-text');
    if (originalText) {
      element.textContent = originalText;
      element.removeAttribute('data-original-text');
    }
  }
}

// Navigation helpers
function setActiveNavItem(pageId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeItem = document.querySelector(`.nav-item[href="${pageId}.html"], .nav-item[href="${pageId}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
}

// Storage helpers
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save to storage:', error);
    return false;
  }
}

function loadFromStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return defaultValue;
  }
}

// Form validation helpers
function validateRequired(fields) {
  const errors = [];
  
  fields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element && !element.value.trim()) {
      errors.push(fieldId);
      element.style.borderColor = 'var(--error)';
    } else if (element) {
      element.style.borderColor = '';
    }
  });
  
  return errors;
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.style.borderColor = 'var(--error)';
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error text-sm mt-1';
    errorDiv.style.color = 'var(--error)';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
    
    // Remove error after 5 seconds
    setTimeout(() => {
      field.style.borderColor = '';
      errorDiv.remove();
    }, 5000);
  }
}

// URL parameter helpers
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function setUrlParameter(name, value) {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  window.history.replaceState({}, '', url);
}

// Device capabilities
function getDeviceInfo() {
  return {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    hasTouch: 'ontouchstart' in window,
    hasGeolocation: 'geolocation' in navigator,
    hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    hasNotifications: 'Notification' in window,
    hasServiceWorker: 'serviceWorker' in navigator,
    isOnline: navigator.onLine,
    userAgent: navigator.userAgent
  };
}

// Emergency functions
function handleEmergencyParameter() {
  if (getUrlParameter('emergency') === 'true') {
    // Auto-trigger emergency modal
    setTimeout(() => {
      const emergencyModal = document.getElementById('emergencyModal');
      if (emergencyModal) {
        emergencyModal.classList.remove('hidden');
        emergencyModal.classList.add('flex');
      }
    }, 500);
  }
}

function handleCheckInParameter() {
  if (getUrlParameter('checkin') === 'true') {
    // Auto-trigger check-in
    setTimeout(() => {
      if (typeof checkIn === 'function') {
        checkIn();
      }
    }, 500);
  }
}

// Initialize common functionality
function initializeCommonFeatures() {
  // Initialize theme and text size
  initTheme();
  initTextSize();
  
  // Load officer name
  loadOfficerName();
  
  // Update time display
  updateTime();
  setInterval(updateTime, 1000);
  
  // Add touch feedback
  addTouchFeedback();
  addRippleStyles();
  
  // Handle URL parameters
  handleEmergencyParameter();
  handleCheckInParameter();
  
  // Set active navigation item
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  setActiveNavItem(currentPage);
  
  // Add online/offline status handling
  window.addEventListener('online', () => {
    console.log('App is online');
    document.body.classList.remove('offline');
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
    document.body.classList.add('offline');
  });
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCommonFeatures);

// Export functions for global use
window.SecurityApp = {
  toggleTheme,
  toggleTextSize,
  updateTime,
  loadOfficerName,
  saveToStorage,
  loadFromStorage,
  validateRequired,
  showFieldError,
  getUrlParameter,
  setUrlParameter,
  getDeviceInfo,
  initializeCommonFeatures
};