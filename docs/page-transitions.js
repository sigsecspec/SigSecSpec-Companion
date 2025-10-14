/**
 * Page Transition System - Sleek Navigation Experience
 * Handles smooth transitions between pages with loading animations
 */

class PageTransitions {
  constructor() {
    this.isTransitioning = false;
    this.transitionDuration = 400; // milliseconds
    this.init();
  }

  init() {
    this.createTransitionOverlay();
    this.attachNavigationListeners();
    this.animatePageLoad();
  }

  createTransitionOverlay() {
    // Create transition overlay if it doesn't exist
    if (!document.getElementById('pageTransitionOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'pageTransitionOverlay';
      overlay.className = 'page-transition-overlay';
      overlay.innerHTML = `
        <div class="page-transition-content">
          <div class="page-transition-logo">
            <img src="patch-bg.png" alt="Security Logo" style="width: 100%; height: 100%; object-fit: contain; filter: brightness(1.1);">
          </div>
          <div class="page-transition-text">Security Companion</div>
          <div class="page-transition-subtitle">Loading...</div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  }

  attachNavigationListeners() {
    // Handle navigation links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (link && this.shouldTransition(link)) {
        e.preventDefault();
        this.navigateWithTransition(link.href);
      }
    });

    // Handle nav item clicks with animation
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem) {
        navItem.classList.add('nav-item-clicked');
        setTimeout(() => {
          navItem.classList.remove('nav-item-clicked');
        }, 200);
      }
    });
  }

  shouldTransition(link) {
    const href = link.getAttribute('href');
    
    // Skip if it's an external link, anchor, or special link
    if (!href || 
        href.startsWith('#') || 
        href.startsWith('mailto:') || 
        href.startsWith('tel:') || 
        href.startsWith('http') || 
        link.target === '_blank' ||
        this.isTransitioning) {
      return false;
    }

    // Skip if it's the current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const targetPage = href.split('/').pop();
    if (currentPage === targetPage) {
      return false;
    }

    return true;
  }

  async navigateWithTransition(url) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    try {
      // Show transition overlay
      await this.showTransition();
      
      // Add page exit animation
      document.body.classList.add('page-exit');
      
      // Wait for exit animation
      await this.delay(150);
      
      // Navigate to new page
      window.location.href = url;
      
    } catch (error) {
      console.error('Navigation transition error:', error);
      // Fallback to normal navigation
      window.location.href = url;
    }
  }

  showTransition() {
    return new Promise((resolve) => {
      const overlay = document.getElementById('pageTransitionOverlay');
      if (overlay) {
        overlay.classList.add('active');
        setTimeout(resolve, 100);
      } else {
        resolve();
      }
    });
  }

  hideTransition() {
    return new Promise((resolve) => {
      const overlay = document.getElementById('pageTransitionOverlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
          this.isTransitioning = false;
          resolve();
        }, this.transitionDuration);
      } else {
        this.isTransitioning = false;
        resolve();
      }
    });
  }

  animatePageLoad() {
    // Add page content class for animation
    document.body.classList.add('page-content');
    
    // Hide transition overlay if it's showing
    setTimeout(() => {
      this.hideTransition();
    }, 100);

    // Animate elements in sequence
    this.animateElementsSequentially();
  }

  animateElementsSequentially() {
    const elements = [
      '.app-header',
      '.main-content',
      '.bottom-nav',
      '.emergency-btn-fixed'
    ];

    elements.forEach((selector, index) => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.animationDelay = `${index * 0.1}s`;
      }
    });

    // Animate mobile cards with stagger effect
    const cards = document.querySelectorAll('.mobile-card');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${0.4 + (index * 0.1)}s`;
      card.classList.add('fade-in');
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public method to trigger transition programmatically
  static navigate(url) {
    if (window.pageTransitions) {
      window.pageTransitions.navigateWithTransition(url);
    } else {
      window.location.href = url;
    }
  }
}

// Enhanced navigation functions for better UX
function enhanceNavigation() {
  // Add loading states to buttons
  document.addEventListener('click', (e) => {
    const button = e.target.closest('.touch-btn, .mobile-card.interactive');
    if (button && button.tagName === 'A') {
      button.style.opacity = '0.7';
      button.style.transform = 'scale(0.98)';
    }
  });

  // Add hover effects for desktop
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mouseenter', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem && !navItem.classList.contains('active')) {
        navItem.style.transform = 'translateY(-2px)';
      }
    }, true);

    document.addEventListener('mouseleave', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem && !navItem.classList.contains('active')) {
        navItem.style.transform = '';
      }
    }, true);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize page transitions
  window.pageTransitions = new PageTransitions();
  
  // Enhance navigation
  enhanceNavigation();
  
  // Add smooth scrolling to page
  document.documentElement.style.scrollBehavior = 'smooth';
});

// Handle page visibility changes for better performance
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause animations when page is hidden
    document.body.style.animationPlayState = 'paused';
  } else {
    // Resume animations when page is visible
    document.body.style.animationPlayState = 'running';
  }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PageTransitions;
}