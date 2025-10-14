/**
 * Common Emergency Functions for Security Companion
 * Include this script and add the emergency modal HTML to any page
 * Requires: popup-system.js
 */

// Emergency functions
function triggerEmergency() {
  document.getElementById('emergencyModal').classList.remove('hidden');
  document.getElementById('emergencyModal').classList.add('flex');
}

function cancelEmergency() {
  document.getElementById('emergencyModal').classList.add('hidden');
  document.getElementById('emergencyModal').classList.remove('flex');
}

function confirmEmergency() {
  navigator.geolocation?.getCurrentPosition(
    (position) => {
      const location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
      if (window.securityNotifications) {
        window.securityNotifications.sendEmergencyAlert(location, 'Emergency assistance required - immediate response needed');
      }
    },
    () => {
      if (window.securityNotifications) {
        window.securityNotifications.sendEmergencyAlert(null, 'Emergency assistance required - location unavailable');
      }
    }
  );
  
  navigator.vibrate && navigator.vibrate([200, 100, 200, 100, 200]);
  showSuccess('Emergency alert sent to dispatch!');
  cancelEmergency();
}

// Emergency Modal HTML Template
const EMERGENCY_MODAL_HTML = `
<!-- Emergency Modal -->
<div id="emergencyModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
  <div class="mobile-card max-w-sm mx-4">
    <h3 class="text-xl font-bold text-red-500 mb-4">🚨 Emergency Alert</h3>
    <p class="mb-6">This will send an emergency alert to dispatch and your supervisor. Continue?</p>
    <div class="flex gap-3">
      <button class="touch-btn flex-1" onclick="cancelEmergency()">Cancel</button>
      <button class="touch-btn danger flex-1" onclick="confirmEmergency()">Send Alert</button>
    </div>
  </div>
</div>
`;

// Auto-add emergency modal if it doesn't exist
document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('emergencyModal')) {
    document.body.insertAdjacentHTML('beforeend', EMERGENCY_MODAL_HTML);
  }
});