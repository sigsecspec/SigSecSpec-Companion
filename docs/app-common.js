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

// Modern Particle System for Dynamic Backgrounds
function createParticleSystem() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: -1;
    opacity: 0.6;
  `;
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  const particleCount = 50;
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.height;
    }
    
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = -10;
      this.size = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 2;
      this.speedY = Math.random() * 3 + 1;
      this.opacity = Math.random() * 0.5 + 0.2;
      this.color = this.getRandomColor();
    }
    
    getRandomColor() {
      const colors = [
        'rgba(0, 212, 255, ',
        'rgba(139, 92, 246, ',
        'rgba(244, 114, 182, ',
        'rgba(16, 185, 129, ',
        'rgba(124, 58, 237, '
      ];
      return colors[Math.floor(Math.random() * colors.length)] + this.opacity + ')';
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.y > canvas.height + 10) {
        this.reset();
      }
      
      if (this.x < -10 || this.x > canvas.width + 10) {
        this.x = Math.random() * canvas.width;
      }
    }
    
    draw() {
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  function initParticles() {
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    requestAnimationFrame(animate);
  }
  
  resizeCanvas();
  initParticles();
  animate();
  
  window.addEventListener('resize', resizeCanvas);
}

// Floating Action Button with Modern Interactions
function createFloatingActionButton() {
  const fab = document.querySelector('.emergency-btn-fixed');
  if (fab) {
    // Add magnetic effect
    fab.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 60;
      
      if (distance < maxDistance) {
        const strength = (maxDistance - distance) / maxDistance;
        const moveX = (x / distance) * strength * 8;
        const moveY = (y / distance) * strength * 8;
        
        this.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
      }
    });
    
    fab.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
    
    // Add ripple effect on click
    fab.addEventListener('click', function(e) {
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: fabRipple 0.6s linear;
        pointer-events: none;
        width: 100px;
        height: 100px;
        left: 50%;
        top: 50%;
        margin-left: -50px;
        margin-top: -50px;
      `;
      
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }
}

// Enhanced touch feedback with modern interactions
function addTouchFeedback() {
  document.querySelectorAll('.mobile-card, .touch-btn').forEach(element => {
    // Enhanced touch start with haptic feedback
    element.addEventListener('touchstart', function(e) {
      this.style.transform = 'scale(0.97)';
      this.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    });
    
    // Enhanced touch end with spring animation
    element.addEventListener('touchend', function(e) {
      setTimeout(() => {
        this.style.transform = '';
        this.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      }, 50);
    });

    // Enhanced ripple effect with multiple colors
    element.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      // Determine ripple color based on element type
      let rippleColor = 'rgba(255, 255, 255, 0.3)';
      if (this.classList.contains('primary')) {
        rippleColor = 'rgba(255, 255, 255, 0.4)';
      } else if (this.classList.contains('success')) {
        rippleColor = 'rgba(255, 255, 255, 0.35)';
      } else if (this.classList.contains('danger')) {
        rippleColor = 'rgba(255, 255, 255, 0.4)';
      }
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, ${rippleColor} 0%, transparent 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: enhancedRipple 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        z-index: 1000;
      `;
      
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 800);
    });

    // Add magnetic hover effect for buttons
    if (element.classList.contains('touch-btn')) {
      element.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const distance = Math.sqrt(x * x + y * y);
        const maxDistance = 50;
        
        if (distance < maxDistance) {
          const strength = (maxDistance - distance) / maxDistance;
          const moveX = (x / distance) * strength * 3;
          const moveY = (y / distance) * strength * 3;
          
          this.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.02)`;
        }
      });
      
      element.addEventListener('mouseleave', function() {
        this.style.transform = '';
      });
    }
  });
}

// Add enhanced ripple animation CSS and modern effects
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
      
      @keyframes enhancedRipple {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        50% {
          transform: scale(2);
          opacity: 0.5;
        }
        100% {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      @keyframes fabRipple {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        100% {
          transform: scale(2);
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
      
      .parallax-element {
        transform-style: preserve-3d;
        transition: transform 0.1s ease-out;
      }
      
      .tilt-element {
        transform-style: preserve-3d;
        transition: transform 0.2s ease-out;
      }
      
      @keyframes morphCard {
        0% { border-radius: 20px; }
        50% { border-radius: 30px 10px 30px 10px; }
        100% { border-radius: 20px; }
      }
      
      .morphing-card {
        animation: morphCard 4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }
}

// Next-Gen Loading States with Modern Animations
function showLoadingState(element, text = 'Loading...', type = 'spinner') {
  if (element) {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
    element.setAttribute('data-original-content', element.innerHTML);
    
    let loader = '';
    switch (type) {
      case 'modern':
        loader = '<div class="modern-spinner"></div>';
        break;
      case 'pulse':
        loader = `
          <div class="pulse-loader">
            <div class="pulse-dot"></div>
            <div class="pulse-dot"></div>
            <div class="pulse-dot"></div>
          </div>
        `;
        break;
      case 'skeleton':
        loader = createSkeletonLoader(element);
        break;
      default:
        loader = '<div class="loading-spinner"></div>';
    }
    
    element.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
        ${loader}
        ${text ? `<span>${text}</span>` : ''}
      </div>
    `;
  }
}

function hideLoadingState(element) {
  if (element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
    
    const originalContent = element.getAttribute('data-original-content');
    if (originalContent) {
      element.innerHTML = originalContent;
      element.removeAttribute('data-original-content');
    }
  }
}

function createSkeletonLoader(element) {
  const rect = element.getBoundingClientRect();
  const lines = Math.max(2, Math.floor(rect.height / 30));
  
  let skeleton = '<div class="skeleton-card">';
  for (let i = 0; i < lines; i++) {
    const width = i === lines - 1 ? '60%' : '100%';
    skeleton += `<div class="skeleton-text" style="width: ${width}"></div>`;
  }
  skeleton += '</div>';
  
  return skeleton;
}

// Progressive Loading with Skeleton Screens
function showSkeletonScreen(container, count = 3) {
  const skeletonHTML = Array(count).fill().map(() => `
    <div class="skeleton-card">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <div class="skeleton-avatar"></div>
        <div style="flex: 1;">
          <div class="skeleton-text large"></div>
          <div class="skeleton-text small"></div>
        </div>
      </div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text small"></div>
    </div>
  `).join('');
  
  container.innerHTML = skeletonHTML;
}

// Modern Loading Overlay
function showLoadingOverlay(message = 'Loading...') {
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;
  
  overlay.innerHTML = `
    <div class="modern-spinner" style="margin-bottom: 2rem;"></div>
    <div style="color: white; font-size: 1.2rem; font-weight: 600;">${message}</div>
    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-top: 0.5rem;">Please wait...</div>
  `;
  
  document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
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

// Staggered animation for elements
function addStaggeredAnimations() {
  const elements = document.querySelectorAll('.mobile-card, .feature-grid > *, .nav-item');
  elements.forEach((element, index) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, index * 100 + 200);
  });
}

// Parallax effect for background elements
function addParallaxEffect() {
  let ticking = false;
  
  function updateParallax() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax-element');
    
    parallaxElements.forEach((element, index) => {
      const speed = 0.5 + (index * 0.1);
      const yPos = -(scrolled * speed);
      element.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
    
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick);
}

// Intersection Observer for animations on scroll
function addScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  document.querySelectorAll('.mobile-card, .touch-btn').forEach(el => {
    observer.observe(el);
  });
}

// Modern Tilt Effects for Interactive Elements
function addTiltEffects() {
  document.querySelectorAll('.mobile-card.interactive').forEach(card => {
    card.classList.add('tilt-element');
    
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / centerY * -10;
      const rotateY = (x - centerX) / centerX * 10;
      
      this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });
}

// Morphing Card Effects
function addMorphingCards() {
  document.querySelectorAll('.mobile-card').forEach((card, index) => {
    // Add random morphing animation with delays
    if (index % 3 === 0) {
      setTimeout(() => {
        card.classList.add('morphing-card');
      }, index * 500);
    }
  });
}

// Initialize common functionality with modern features
function initializeCommonFeatures() {
  // Initialize theme and text size
  initTheme();
  initTextSize();
  
  // Load officer name
  loadOfficerName();
  
  // Update time display
  updateTime();
  setInterval(updateTime, 1000);
  
  // Add modern UI features
  createParticleSystem();
  createFloatingActionButton();
  addTouchFeedback();
  addRippleStyles();
  addStaggeredAnimations();
  addParallaxEffect();
  addScrollAnimations();
  addTiltEffects();
  addMorphingCards();
  
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
    showNotification('Connection restored', 'success');
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
    document.body.classList.add('offline');
    showNotification('Connection lost - working offline', 'warning');
  });
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCommonFeatures);

// Enhanced notification system
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type} slide-up`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${getNotificationIcon(type)}</span>
      <span class="notification-message">${message}</span>
    </div>
  `;
  
  // Add notification styles if not already present
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--gradient-glass);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 1rem;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 8px 32px var(--shadow);
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .notification.show {
        transform: translateX(0);
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      
      .notification-icon {
        font-size: 1.2rem;
      }
      
      .notification-message {
        color: var(--text-primary);
        font-weight: 500;
      }
      
      .notification-success {
        border-left: 4px solid var(--success);
      }
      
      .notification-warning {
        border-left: 4px solid var(--warning);
      }
      
      .notification-error {
        border-left: 4px solid var(--error);
      }
      
      .notification-info {
        border-left: 4px solid var(--info);
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Auto remove
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

function getNotificationIcon(type) {
  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  };
  return icons[type] || icons.info;
}

// Export functions for global use - Next-Gen Security App
window.SecurityApp = {
  // Core functionality
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
  initializeCommonFeatures,
  showNotification,
  
  // Modern UI features
  createParticleSystem,
  createFloatingActionButton,
  addStaggeredAnimations,
  addParallaxEffect,
  addScrollAnimations,
  addTiltEffects,
  addMorphingCards,
  
  // Advanced loading states
  showLoadingState,
  hideLoadingState,
  showSkeletonScreen,
  showLoadingOverlay,
  hideLoadingOverlay,
  
  // Enhanced interactions
  addTouchFeedback,
  addRippleStyles
};