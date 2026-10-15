(function () {
  'use strict';
  var status = 'loading';
  var timer;
  function fail(code) {
    if (status !== 'loading') return;
    status = 'failed';
    clearTimeout(timer);
    if (window.EmpireNative && window.EmpireNative.failed) {
      window.EmpireNative.failed(code);
      return;
    }
    var boot = document.getElementById('boot-screen');
    if (boot) boot.hidden = true;
    var root = document.getElementById('root');
    if (root) {root.removeAttribute('inert');root.removeAttribute('aria-hidden');}
    if (root) root.innerHTML = '<main style="padding:28px;color:white;background:#07111b;min-height:100vh"><h1>Empire TV</h1><p>Não conseguimos concluir a abertura neste componente de exibição.</p><p>Atualize Android System WebView e Chrome. Seu progresso foi mantido.</p><button onclick="location.reload()">Tentar novamente</button><p>Diagnóstico: falha na inicialização.</p></main>';
  }
  window.EmpireStartup = {
    startedAt: Date.now(),
    startedClock: window.performance && window.performance.now ? window.performance.now() : Date.now(),
    ready: function () {
      if (status !== 'loading') return;
      status = 'ready';
      clearTimeout(timer);
      if (window.EmpireNative && window.EmpireNative.ready) window.EmpireNative.ready();
    },
    fail: fail,
    status: function () { return status; }
  };
  window.addEventListener('error', function () { fail('SCRIPT_START_FAILED'); });
  window.addEventListener('unhandledrejection', function () { fail('SCRIPT_PROMISE_FAILED'); });
  timer = setTimeout(function () { fail('SCRIPT_START_TIMEOUT'); }, 22000);

  // Older Android WebViews can parse the game but lack these newer standard methods.
  if (!Object.hasOwn) Object.hasOwn = function (value, key) {
    return Object.prototype.hasOwnProperty.call(Object(value), key);
  };
  if (!Array.prototype.at) Object.defineProperty(Array.prototype, 'at', {
    configurable: true, writable: true, value: function (index) {
      var n = Number(index) || 0;
      n = n < 0 ? Math.ceil(n) : Math.floor(n);
      if (n < 0) n += this.length;
      return this[n];
    }
  });
})();
