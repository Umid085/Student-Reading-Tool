// Auto-dismiss messages after 4 seconds
document.querySelectorAll('.message').forEach(function(el) {
  setTimeout(function() { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }, 4000);
  el.style.transition = 'opacity 0.3s';
});
