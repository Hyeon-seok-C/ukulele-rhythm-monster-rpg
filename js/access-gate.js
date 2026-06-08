(function () {
  var gateEl = document.getElementById('access-gate');
  var cfg = window.ACCESS_GATE_CONFIG || {};
  var pin = (gateEl && gateEl.getAttribute('data-pin')) || cfg.pin || 'voxhyeon';
  var STORAGE_KEY = cfg.storageKey || 'ukulele-rhythm-monster-auth';

  function isLocalDev() {
    if (location.protocol === 'file:') return true;
    var host = location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  }

  function needsGate() {
    if (isLocalDev()) return false;
    return location.protocol === 'https:' || location.protocol === 'http:';
  }

  function isAuthed() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setAuthed() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (e) { /* ignore */ }
  }

  function showGame() {
    var gate = document.getElementById('access-gate');
    var app = document.getElementById('app');
    document.documentElement.classList.remove('access-gate-pending');
    if (gate) gate.hidden = true;
    if (app) app.style.display = '';
  }

  function showGate() {
    var gate = document.getElementById('access-gate');
    var app = document.getElementById('app');
    document.documentElement.classList.add('access-gate-pending');
    if (app) app.style.display = 'none';
    if (gate) gate.hidden = false;
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function wireGate() {
    var input = document.getElementById('access-gate-input');
    var submit = document.getElementById('access-gate-submit');
    var error = document.getElementById('access-gate-error');
    var expected = normalize(pin);

    function tryUnlock() {
      if (!input) return;
      if (normalize(input.value) === expected) {
        setAuthed();
        if (error) error.classList.add('hidden');
        showGame();
        return;
      }
      if (error) error.classList.remove('hidden');
      input.select();
      input.focus();
    }

    if (submit) submit.addEventListener('click', tryUnlock);
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') tryUnlock();
      });
    }
  }

  function init() {
    if (!needsGate() || isAuthed()) {
      showGame();
      return;
    }
    showGate();
    wireGate();
    var input = document.getElementById('access-gate-input');
    if (input) input.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
