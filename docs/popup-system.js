/**
 * Standardized Custom Popup System for Security Companion
 * Replaces all system popups (alert, confirm, prompt) with custom styled popups
 * that match the app's design system and are properly centered
 */

class CustomPopupSystem {
  constructor() {
    this.activePopup = null;
    this.popupQueue = [];
    this.init();
  }

  init() {
    // Create popup container if it doesn't exist
    if (!document.getElementById('customPopupContainer')) {
      this.createPopupContainer();
    }
    
    // Override native functions
    this.overrideNativeFunctions();
    
    // Add keyboard event listeners
    this.addKeyboardListeners();
  }

  createPopupContainer() {
    const container = document.createElement('div');
    container.id = 'customPopupContainer';
    container.innerHTML = `
      <div id="customPopupBackdrop" class="custom-popup-backdrop hidden">
        <div id="customPopupModal" class="custom-popup-modal">
          <div class="custom-popup-header">
            <h3 id="customPopupTitle" class="custom-popup-title"></h3>
            <button id="customPopupClose" class="custom-popup-close" aria-label="Close">✕</button>
          </div>
          <div id="customPopupContent" class="custom-popup-content"></div>
          <div id="customPopupActions" class="custom-popup-actions"></div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    
    // Add event listeners
    document.getElementById('customPopupClose').addEventListener('click', () => this.closePopup());
    document.getElementById('customPopupBackdrop').addEventListener('click', (e) => {
      if (e.target === document.getElementById('customPopupBackdrop')) {
        this.closePopup();
      }
    });
  }

  overrideNativeFunctions() {
    // Store original functions
    window._originalAlert = window.alert;
    window._originalConfirm = window.confirm;
    window._originalPrompt = window.prompt;
    
    // Override with custom implementations
    window.alert = (message) => this.showAlert(message);
    window.confirm = (message) => this.showConfirm(message);
    window.prompt = (message, defaultValue) => this.showPrompt(message, defaultValue);
  }

  addKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      if (this.activePopup && e.key === 'Escape') {
        e.preventDefault();
        this.closePopup();
      }
    });
  }

  showAlert(message, title = '⚠️ Alert') {
    return new Promise((resolve) => {
      this.showPopup({
        title,
        content: `<p class="custom-popup-message">${this.escapeHtml(message)}</p>`,
        actions: [
          {
            text: 'OK',
            class: 'touch-btn primary',
            onclick: () => {
              this.closePopup();
              resolve();
            }
          }
        ],
        type: 'alert'
      });
    });
  }

  showConfirm(message, title = '❓ Confirm') {
    return new Promise((resolve) => {
      this.showPopup({
        title,
        content: `<p class="custom-popup-message">${this.escapeHtml(message)}</p>`,
        actions: [
          {
            text: 'Cancel',
            class: 'touch-btn',
            onclick: () => {
              this.closePopup();
              resolve(false);
            }
          },
          {
            text: 'OK',
            class: 'touch-btn primary',
            onclick: () => {
              this.closePopup();
              resolve(true);
            }
          }
        ],
        type: 'confirm'
      });
    });
  }

  showPrompt(message, defaultValue = '', title = '✏️ Input Required') {
    return new Promise((resolve) => {
      const inputId = 'customPromptInput';
      this.showPopup({
        title,
        content: `
          <p class="custom-popup-message">${this.escapeHtml(message)}</p>
          <input type="text" id="${inputId}" class="form-input custom-popup-input" value="${this.escapeHtml(defaultValue)}" placeholder="Enter value...">
        `,
        actions: [
          {
            text: 'Cancel',
            class: 'touch-btn',
            onclick: () => {
              this.closePopup();
              resolve(null);
            }
          },
          {
            text: 'OK',
            class: 'touch-btn primary',
            onclick: () => {
              const input = document.getElementById(inputId);
              const value = input ? input.value : '';
              this.closePopup();
              resolve(value);
            }
          }
        ],
        type: 'prompt',
        onShow: () => {
          // Focus input and select text
          setTimeout(() => {
            const input = document.getElementById(inputId);
            if (input) {
              input.focus();
              input.select();
            }
          }, 100);
        }
      });
    });
  }

  showCustomPopup(title, content, actions = [], options = {}) {
    return new Promise((resolve) => {
      this.showPopup({
        title,
        content,
        actions: actions.map(action => ({
          ...action,
          onclick: () => {
            this.closePopup();
            resolve(action.value || action.text);
          }
        })),
        type: 'custom',
        ...options
      });
    });
  }

  showNotification(message, type = 'info', duration = 3000) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    const colors = {
      success: 'var(--success)',
      error: 'var(--error)',
      warning: 'var(--warning)',
      info: 'var(--info)'
    };

    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.innerHTML = `
      <div class="custom-notification-content">
        <span class="custom-notification-icon">${icons[type] || icons.info}</span>
        <span class="custom-notification-message">${this.escapeHtml(message)}</span>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--glass-bg-strong);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      padding: 1rem;
      box-shadow: 0 8px 32px var(--shadow-strong);
      z-index: 10000;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      max-width: 300px;
      border-left: 4px solid ${colors[type] || colors.info};
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
    });

    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);

    // Click to dismiss
    notification.addEventListener('click', () => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
  }

  showPopup(config) {
    if (this.activePopup) {
      this.popupQueue.push(config);
      return;
    }

    this.activePopup = config;
    
    const backdrop = document.getElementById('customPopupBackdrop');
    const modal = document.getElementById('customPopupModal');
    const title = document.getElementById('customPopupTitle');
    const content = document.getElementById('customPopupContent');
    const actions = document.getElementById('customPopupActions');
    const closeBtn = document.getElementById('customPopupClose');

    // Set content
    title.textContent = config.title || 'Notification';
    content.innerHTML = config.content || '';
    
    // Set actions
    actions.innerHTML = '';
    if (config.actions && config.actions.length > 0) {
      config.actions.forEach(action => {
        const button = document.createElement('button');
        button.className = action.class || 'touch-btn';
        button.textContent = action.text || 'OK';
        button.addEventListener('click', action.onclick);
        actions.appendChild(button);
      });
    }

    // Show/hide close button
    closeBtn.style.display = config.hideClose ? 'none' : 'block';

    // Add type-specific styling
    modal.className = `custom-popup-modal ${config.type ? 'popup-' + config.type : ''}`;

    // Show popup
    backdrop.classList.remove('hidden');
    backdrop.classList.add('show');
    
    // Add animation
    modal.style.transform = 'scale(0.9) translateY(20px)';
    modal.style.opacity = '0';
    
    requestAnimationFrame(() => {
      modal.style.transform = 'scale(1) translateY(0)';
      modal.style.opacity = '1';
    });

    // Call onShow callback
    if (config.onShow) {
      setTimeout(config.onShow, 100);
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  closePopup() {
    if (!this.activePopup) return;

    const backdrop = document.getElementById('customPopupBackdrop');
    const modal = document.getElementById('customPopupModal');

    // Animate out
    modal.style.transform = 'scale(0.9) translateY(20px)';
    modal.style.opacity = '0';

    setTimeout(() => {
      backdrop.classList.add('hidden');
      backdrop.classList.remove('show');
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      this.activePopup = null;
      
      // Process queue
      if (this.popupQueue.length > 0) {
        const nextPopup = this.popupQueue.shift();
        setTimeout(() => this.showPopup(nextPopup), 100);
      }
    }, 200);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility methods for common popup types
  showSuccess(message, title = '✅ Success') {
    return this.showAlert(message, title);
  }

  showError(message, title = '❌ Error') {
    return this.showAlert(message, title);
  }

  showWarning(message, title = '⚠️ Warning') {
    return this.showAlert(message, title);
  }

  showInfo(message, title = 'ℹ️ Information') {
    return this.showAlert(message, title);
  }

  // Emergency alert with special styling
  showEmergencyConfirm(message, title = '🚨 Emergency Alert') {
    return new Promise((resolve) => {
      this.showPopup({
        title,
        content: `<p class="custom-popup-message emergency-message">${this.escapeHtml(message)}</p>`,
        actions: [
          {
            text: 'Cancel',
            class: 'touch-btn',
            onclick: () => {
              this.closePopup();
              resolve(false);
            }
          },
          {
            text: 'Send Alert',
            class: 'touch-btn danger',
            onclick: () => {
              this.closePopup();
              resolve(true);
            }
          }
        ],
        type: 'emergency'
      });
    });
  }
}

// CSS Styles for the popup system
const popupStyles = `
<style>
.custom-popup-backdrop {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.65) !important;
  backdrop-filter: saturate(150%) blur(8px) !important;
  -webkit-backdrop-filter: saturate(150%) blur(8px) !important;
  z-index: 10000 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 1rem !important;
  animation: popupFadeIn 0.2s ease !important;
}

.custom-popup-backdrop.hidden {
  display: none !important;
}

.custom-popup-modal {
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.95) 0%, rgba(44, 44, 44, 0.92) 100%),
              linear-gradient(180deg, rgba(156, 175, 136, 0.04), transparent) !important;
  backdrop-filter: saturate(180%) blur(20px) !important;
  -webkit-backdrop-filter: saturate(180%) blur(20px) !important;
  border: 1px solid rgba(192, 192, 192, 0.12) !important;
  border-radius: var(--radius-2xl) !important;
  width: 100% !important;
  max-width: 420px !important;
  max-height: calc(100vh - 2rem) !important;
  overflow-y: auto !important;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 8px 24px rgba(0, 0, 0, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  transform-origin: center !important;
}

.custom-popup-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 1.25rem 1.5rem 0 1.5rem !important;
  margin-bottom: 1rem !important;
}

.custom-popup-title {
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  color: var(--text-primary) !important;
  margin: 0 !important;
  flex: 1 !important;
}

.custom-popup-close {
  background: none !important;
  border: none !important;
  color: var(--text-secondary) !important;
  font-size: 1.25rem !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  border-radius: var(--radius-sm) !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 32px !important;
  height: 32px !important;
}

.custom-popup-close:hover {
  background: var(--bg-tertiary) !important;
  color: var(--text-primary) !important;
  transform: scale(1.1) !important;
}

.custom-popup-content {
  padding: 0 1.5rem !important;
  margin-bottom: 1.5rem !important;
}

.custom-popup-message {
  color: var(--text-secondary) !important;
  line-height: 1.6 !important;
  font-size: 0.9375rem !important;
  margin: 0 !important;
}

.custom-popup-input {
  margin-top: 1rem !important;
  width: 100% !important;
}

.custom-popup-actions {
  display: flex !important;
  gap: 0.75rem !important;
  padding: 0 1.5rem 1.5rem 1.5rem !important;
  justify-content: flex-end !important;
}

.custom-popup-actions .touch-btn {
  min-width: 80px !important;
}

/* Type-specific styles */
.popup-emergency .custom-popup-title {
  color: var(--error) !important;
}

.popup-emergency .custom-popup-modal {
  border-left: 4px solid var(--error) !important;
}

.emergency-message {
  color: var(--error) !important;
  font-weight: 600 !important;
}

.popup-alert .custom-popup-title {
  color: var(--warning) !important;
}

.popup-confirm .custom-popup-title {
  color: var(--info) !important;
}

.popup-prompt .custom-popup-title {
  color: var(--accent-primary) !important;
}

/* Notification styles */
.custom-notification {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif !important;
}

.custom-notification-content {
  display: flex !important;
  align-items: center !important;
  gap: 0.75rem !important;
}

.custom-notification-icon {
  font-size: 1.125rem !important;
  flex-shrink: 0 !important;
}

.custom-notification-message {
  color: var(--text-primary) !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  line-height: 1.4 !important;
}

/* Animations */
@keyframes popupFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .custom-popup-modal {
    max-width: calc(100vw - 1rem) !important;
    margin: 0.5rem !important;
  }
  
  .custom-popup-header {
    padding: 1rem 1.25rem 0 1.25rem !important;
  }
  
  .custom-popup-content {
    padding: 0 1.25rem !important;
  }
  
  .custom-popup-actions {
    padding: 0 1.25rem 1.25rem 1.25rem !important;
    flex-direction: column !important;
  }
  
  .custom-popup-actions .touch-btn {
    width: 100% !important;
  }
}

@media (max-width: 480px) {
  .custom-popup-backdrop {
    padding: 0.5rem !important;
  }
  
  .custom-popup-modal {
    max-width: calc(100vw - 0.5rem) !important;
  }
}
</style>
`;

// Initialize the popup system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add styles to head
  document.head.insertAdjacentHTML('beforeend', popupStyles);
  
  // Initialize popup system
  window.customPopups = new CustomPopupSystem();
  
  // Make it globally available for convenience
  window.showAlert = (message, title) => window.customPopups.showAlert(message, title);
  window.showConfirm = (message, title) => window.customPopups.showConfirm(message, title);
  window.showPrompt = (message, defaultValue, title) => window.customPopups.showPrompt(message, defaultValue, title);
  window.showNotification = (message, type, duration) => window.customPopups.showNotification(message, type, duration);
  window.showCustomPopup = (title, content, actions, options) => window.customPopups.showCustomPopup(title, content, actions, options);
  window.showSuccess = (message, title) => window.customPopups.showSuccess(message, title);
  window.showError = (message, title) => window.customPopups.showError(message, title);
  window.showWarning = (message, title) => window.customPopups.showWarning(message, title);
  window.showInfo = (message, title) => window.customPopups.showInfo(message, title);
  window.showEmergencyConfirm = (message, title) => window.customPopups.showEmergencyConfirm(message, title);
});