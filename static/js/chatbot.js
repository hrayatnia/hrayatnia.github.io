(function () {
  'use strict';

  // ─── Document URLs to fetch for profile context ───────────────────────────
  // All paths are resolved relative to the site root at runtime.
  var PROFILE_URLS = [
    'profile.html',
    'experience.html',
    'education.html',
    'skills.html'
  ];

  var SYSTEM_PREFIX = [
    'You are a helpful AI assistant embedded in Sam Rayatnia\'s personal portfolio website.',
    'You ONLY answer questions about Sam Rayatnia based on the content extracted from his website pages listed below.',
    'If asked about anything unrelated to Sam\'s profile, politely decline and redirect.',
    'Be concise, friendly, and professional.',
    '',
    '# Content extracted from sam.rayatnia.me'
  ].join('\n');

  // ─── HTML widget ──────────────────────────────────────────────────────────
  var WIDGET_HTML = '<div id="cb-root" style="position:fixed;bottom:24px;right:24px;z-index:9999;font-family:Inter,\'Segoe UI\',Roboto,sans-serif;">'
    // Toggle button
    + '<button id="cb-toggle" aria-label="Open chat" style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3a86ff,#6366f1);border:none;cursor:pointer;box-shadow:0 4px 20px rgba(58,134,255,0.45);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;padding:0;">'
      + '<svg id="cb-ico-open" width="26" height="26" fill="none" stroke="#fff" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>'
      + '<svg id="cb-ico-close" width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24" style="display:none;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>'
    + '</button>'
    // Panel
    + '<div id="cb-panel" style="display:none;flex-direction:column;position:absolute;bottom:68px;right:0;width:360px;max-width:calc(100vw - 40px);height:520px;background:#fff;border-radius:18px;box-shadow:0 12px 56px rgba(30,41,59,0.22);overflow:hidden;">'
      // Header
      + '<div style="background:linear-gradient(135deg,#3a86ff,#6366f1);padding:14px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0;">'
        + '<div style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
          + '<svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>'
        + '</div>'
        + '<div>'
          + '<div style="color:#fff;font-weight:700;font-size:14px;line-height:1.2;">Ask about Sam</div>'
          + '<div style="color:rgba(255,255,255,.75);font-size:11px;margin-top:2px;">Powered by Gemini AI · free tier</div>'
        + '</div>'
        + '<button id="cb-settings-btn" aria-label="Settings" title="Change API key" style="margin-left:auto;background:rgba(255,255,255,.18);border:none;cursor:pointer;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;">'
          + '<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>'
        + '</button>'
      + '</div>'
      // Messages area
      + '<div id="cb-msgs" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f5f7ff;"></div>'
      // API-key setup panel
      + '<div id="cb-api-setup" style="display:none;padding:14px 16px;background:#fff;border-top:1px solid #e5e7eb;">'
        + '<p style="font-size:13px;color:#6b7280;margin:0 0 8px;line-height:1.45;">Enter your free <a id="cb-api-link" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:#3a86ff;text-decoration:underline;">Google Gemini API key</a> to start chatting:</p>'
        + '<div style="display:flex;gap:8px;">'
          + '<input id="cb-api-input" type="password" placeholder="AIzaSy..." autocomplete="off" style="flex:1;padding:8px 11px;border:1.5px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;font-family:inherit;background:#fff;color:#111;"/>'
          + '<button id="cb-api-save" style="background:#3a86ff;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;">Save</button>'
        + '</div>'
        + '<p style="font-size:11px;color:#9ca3af;margin:7px 0 0;line-height:1.4;">Key is stored only in your browser\'s localStorage. Not sent anywhere except Google.</p>'
      + '</div>'
      // Input area
      + '<div id="cb-input-area" style="display:none;padding:10px 14px;background:#fff;border-top:1px solid #e5e7eb;flex-shrink:0;">'
        + '<div style="display:flex;gap:8px;align-items:flex-end;">'
          + '<textarea id="cb-input" rows="1" placeholder="Ask about Sam\'s experience, skills…" style="flex:1;padding:8px 12px;border:1.5px solid #d1d5db;border-radius:10px;font-size:14px;resize:none;min-height:40px;max-height:96px;outline:none;font-family:inherit;line-height:1.45;color:#111;background:#fff;overflow-y:auto;transition:border-color .2s;"></textarea>'
          + '<button id="cb-send" aria-label="Send" style="background:#3a86ff;color:#fff;border:none;border-radius:10px;padding:0;width:42px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s,opacity .2s;">'
            + '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>'
          + '</button>'
        + '</div>'
      + '</div>'
    + '</div>'
  + '</div>';

  // ─── ChatBot singleton ────────────────────────────────────────────────────
  window.ChatBot = {
    isOpen: false,
    history: [],          // {role, parts:[{text}]}
    _context: null,       // fetched + extracted text, set after _contextPromise resolves
    _contextPromise: null,

    init: function () {
      document.body.insertAdjacentHTML('beforeend', WIDGET_HTML);
      this._injectStyles();
      this._bindEvents();
      this._addWelcome();
      // Kick off background fetch of all profile pages
      this._contextPromise = this._fetchContext();
    },

    // Fetch each profile page, strip non-content elements, return combined plain text
    _fetchContext: function () {
      var self = this;
      // Build absolute base URL (handles subdirectory deployments too)
      var base = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');

      var fetches = PROFILE_URLS.map(function (path) {
        var url = base + path;
        return fetch(url)
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
          })
          .then(function (html) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            // Strip chrome elements so only readable content remains
            doc.querySelectorAll('nav, script, style, svg, button, noscript').forEach(function (el) {
              el.remove();
            });
            var text = (doc.body.textContent || doc.body.innerText || '')
              .replace(/[ \t]+/g, ' ')          // collapse horizontal whitespace
              .replace(/\n{3,}/g, '\n\n')        // collapse blank lines
              .trim();
            return '### ' + url + '\n\n' + text;
          })
          .catch(function () { return ''; }); // never block the UI on a failed fetch
      });

      return Promise.all(fetches).then(function (sections) {
        var combined = SYSTEM_PREFIX + '\n\n' + sections.filter(Boolean).join('\n\n---\n\n');
        self._context = combined;
        return combined;
      });
    },

    _injectStyles: function () {
      var s = document.createElement('style');
      s.textContent = [
        '@keyframes cb-bounce{0%,80%,100%{opacity:.25;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}',
        '@keyframes cb-fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
        '#cb-toggle:hover{transform:scale(1.08)!important;box-shadow:0 6px 28px rgba(58,134,255,.55)!important}',
        '#cb-send:hover:not(:disabled){background:#2656a6!important}',
        '#cb-send:disabled{opacity:.45!important;cursor:not-allowed!important}',
        '#cb-input:focus{border-color:#3a86ff!important}',
        '#cb-api-input:focus{border-color:#3a86ff!important}',
        '#cb-msgs::-webkit-scrollbar{width:4px}',
        '#cb-msgs::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px}',
        // neutralise global `a::after` from style.css
        '#cb-root a::after{display:none!important;content:""!important}',
        '#cb-root button::after{display:none!important}'
      ].join('');
      document.head.appendChild(s);
    },

    _bindEvents: function () {
      var self = this;
      document.getElementById('cb-toggle').addEventListener('click', function () { self.toggle(); });
      document.getElementById('cb-send').addEventListener('click', function () { self.send(); });
      document.getElementById('cb-api-save').addEventListener('click', function () { self.saveKey(); });
      document.getElementById('cb-settings-btn').addEventListener('click', function () { self.showKeySetup(); });

      var ta = document.getElementById('cb-input');
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self.send(); }
      });
      ta.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 96) + 'px';
      });
    },

    _addWelcome: function () {
      this._appendMsg(
        'Hi! I\'m Sam\'s AI assistant. Ask me anything about his background, experience, skills, or education!',
        'bot'
      );
    },

    toggle: function () {
      this.isOpen = !this.isOpen;
      var panel = document.getElementById('cb-panel');
      var iconOpen = document.getElementById('cb-ico-open');
      var iconClose = document.getElementById('cb-ico-close');
      if (this.isOpen) {
        panel.style.display = 'flex';
        iconOpen.style.display = 'none';
        iconClose.style.display = 'block';
        this._checkKey();
        var inp = document.getElementById('cb-input');
        setTimeout(function () { if (inp.offsetParent) inp.focus(); }, 80);
      } else {
        panel.style.display = 'none';
        iconOpen.style.display = 'block';
        iconClose.style.display = 'none';
      }
    },

    _checkKey: function () {
      var hasKey = !!localStorage.getItem('gemini_api_key');
      document.getElementById('cb-api-setup').style.display = hasKey ? 'none' : 'block';
      document.getElementById('cb-input-area').style.display = hasKey ? 'block' : 'none';
    },

    showKeySetup: function () {
      document.getElementById('cb-api-setup').style.display = 'block';
      document.getElementById('cb-input-area').style.display = 'none';
    },

    saveKey: function () {
      var val = (document.getElementById('cb-api-input').value || '').trim();
      if (!val) return;
      localStorage.setItem('gemini_api_key', val);
      document.getElementById('cb-api-input').value = '';
      document.getElementById('cb-api-setup').style.display = 'none';
      document.getElementById('cb-input-area').style.display = 'block';
      document.getElementById('cb-input').focus();
    },

    send: function () {
      var ta = document.getElementById('cb-input');
      var text = (ta.value || '').trim();
      if (!text) return;

      var key = localStorage.getItem('gemini_api_key');
      if (!key) { this._checkKey(); return; }

      ta.value = '';
      ta.style.height = 'auto';

      this._appendMsg(text, 'user');
      this.history.push({ role: 'user', parts: [{ text: text }] });

      var sendBtn = document.getElementById('cb-send');
      sendBtn.disabled = true;
      var typingId = this._appendTyping();
      var self = this;

      // Wait for profile pages to finish loading, then call Gemini
      var ready = this._contextPromise || Promise.resolve();
      ready
        .then(function () { return self._callGemini(key); })
        .then(function (reply) {
          self._removeEl(typingId);
          self._appendMsg(reply, 'bot');
          self.history.push({ role: 'model', parts: [{ text: reply }] });
        })
        .catch(function (err) {
          self._removeEl(typingId);
          var msg = (err.message && (err.message.indexOf('API_KEY') !== -1 || err.message.indexOf('400') !== -1 || err.message.indexOf('403') !== -1))
            ? 'Invalid or expired API key. Click the ⚙ icon to update it.'
            : 'Something went wrong. Please try again.';
          self._appendMsg(msg, 'bot', true);
        })
        .then(function () { sendBtn.disabled = false; });
    },

    _callGemini: function (apiKey) {
      var context = this._context || SYSTEM_PREFIX;
      var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + encodeURIComponent(apiKey);
      var body = {
        system_instruction: { parts: [{ text: context }] },
        contents: this.history,
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
      };
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) {
            throw new Error((data.error && data.error.message) || ('HTTP ' + res.status));
          }
          var text = data.candidates
            && data.candidates[0]
            && data.candidates[0].content
            && data.candidates[0].content.parts
            && data.candidates[0].content.parts[0]
            && data.candidates[0].content.parts[0].text;
          return text || 'No response received.';
        });
      });
    },

    _appendMsg: function (text, role, isError) {
      var wrap = document.getElementById('cb-msgs');
      var d = document.createElement('div');
      d.style.cssText = role === 'user'
        ? 'background:#3a86ff;color:#fff;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13.5px;line-height:1.5;max-width:82%;align-self:flex-end;word-break:break-word;animation:cb-fadein .18s ease;'
        : 'background:' + (isError ? '#fef2f2' : '#fff') + ';color:' + (isError ? '#dc2626' : '#374151') + ';border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:13.5px;line-height:1.5;max-width:82%;box-shadow:0 1px 5px rgba(0,0,0,.07);word-break:break-word;animation:cb-fadein .18s ease;';
      d.innerHTML = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      wrap.appendChild(d);
      wrap.scrollTop = wrap.scrollHeight;
      return d;
    },

    _appendTyping: function () {
      var wrap = document.getElementById('cb-msgs');
      var d = document.createElement('div');
      var id = 'cb-typing-' + Date.now();
      d.id = id;
      d.style.cssText = 'background:#fff;border-radius:14px 14px 14px 4px;padding:10px 15px;max-width:60px;box-shadow:0 1px 5px rgba(0,0,0,.07);display:flex;gap:5px;align-items:center;';
      d.innerHTML = [0, 200, 400].map(function (delay) {
        return '<span style="width:7px;height:7px;background:#9ca3af;border-radius:50%;animation:cb-bounce 1.2s ease-in-out ' + delay + 'ms infinite;display:inline-block;"></span>';
      }).join('');
      wrap.appendChild(d);
      wrap.scrollTop = wrap.scrollHeight;
      return id;
    },

    _removeEl: function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    }
  };

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.ChatBot.init(); });
  } else {
    window.ChatBot.init();
  }
}());
