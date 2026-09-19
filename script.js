/* ============================================================
   script.js — OlyChatbot Widget (lightweight floating assistant)
   Dark "Agenciy" styling + lime glow, opens a chat panel.
   Loaded by every page. Initializes on DOM-ready so it works
   regardless of script placement / defer / server timing.

   Knowledge base: answers questions from baza-index.json
   (generated from the markdown files in /baza by
   build-knowledge-index.js). Grounded, cited responses with a
   graceful fallback to the contact form when nothing matches.
   ============================================================ */
(function () {
  'use strict';

  if (window.__olyChatbotReady) return;
  window.__olyChatbotReady = true;

  var LIME = '#c9f24b';
  var BG = '#060607';
  var SURFACE = '#101014';
  var LINE = 'rgba(255,255,255,.12)';
  var TEXT = '#f4f5f1';
  var MUTED = '#9a9da4';

  var INDEX_URL = 'baza-index.json';
  var knowledge = null; // [{source, heading, text, norm}]

  // Polish stopwords — ignored when scoring so common words do not
  // dominate the match.
  var STOP = {};
  ('co to jest jak sie i w na z do o a czy dla po za nie ktory ktora ktore ' +
   'gdzie kiedy ile jaki jaka jakie cena ceny oraz lub albo').split(' ')
    .forEach(function (w) { STOP[w] = true; });

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k === 'class') node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  // Normalize Polish diacritics so search matches "zoladek" -> "żołądek".
  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
      .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
      .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Load the knowledge index once.
  function loadKnowledge(cb) {
    if (knowledge) { cb(); return; }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', INDEX_URL, true);
    xhr.onload = function () {
      try {
        var data = JSON.parse(xhr.responseText);
        knowledge = data && data.chunks ? data.chunks : [];
      } catch (e) { knowledge = []; }
      cb();
    };
    xhr.onerror = function () { knowledge = []; cb(); };
    xhr.send();
  }

  // Return the best matching chunks for a query.
  function search(query, topK) {
    topK = topK || 3;
    var qwords = normalize(query).split(' ').filter(function (w) {
      return w.length >= 2 && !STOP[w];
    });
    if (!qwords.length) return [];

    var scored = [];
    for (var i = 0; i < knowledge.length; i++) {
      var c = knowledge[i];
      var head = normalize(c.heading);
      var body = c.norm || '';
      var compact = body.replace(/ /g, '');
      var src = normalize(String(c.source).replace(/\.md$/i, '')).replace(/ /g, '');
      var matched = 0, headHits = 0, srcHits = 0;

      for (var j = 0; j < qwords.length; j++) {
        var w = qwords[j];
        if (src.indexOf(w) !== -1) { srcHits++; matched++; }
        if (head.indexOf(w) !== -1) { matched++; headHits++; }
        else if (body.indexOf(w) !== -1) { matched++; }
        else if (w.length >= 5 && compact.indexOf(w) !== -1) { matched++; }
      }

      var accept = matched >= 2 || headHits >= 1 || srcHits >= 1 ||
                   (matched === 1 && qwords[0].length >= 5);
      if (accept) {
        var lenBonus = Math.min(6, Math.floor((c.text || '').length / 200));
        scored.push({ chunk: c, score: matched * 10 + headHits * 5 + srcHits * 20 + lenBonus });
      }
    }

    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, topK).map(function (r) { return r.chunk; });
  }

  // Strip markdown syntax for a clean, readable answer.
  function clean(text) {
    return String(text || '')
      .replace(/^#{1,4}\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '• ')
      .replace(/\|/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Build a grounded answer from the top matching chunks.
  function answerFromKnowledge(query) {
    var hits = search(query, 3);
    if (!hits.length) return null;

    var parts = [];
    var seen = {};
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i];
      var snippet = clean(h.text);
      if (!snippet || snippet.length < 40 || seen[h.source]) continue;
      seen[h.source] = true;
      var cite = String(h.source).replace(/\.md$/i, '');
      parts.push(snippet + '\n\n(Źródło: ' + cite + ')');
    }
    if (!parts.length) return null;
    return parts.join('\n\n');
  }

  function init() {
    var launcher = el('button', {
      class: 'oly-launcher', type: 'button',
      'aria-label': 'Otwórz czat z asystentem', title: 'Rozmowa Chat'
    });
    launcher.innerHTML =
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    var panel = el('div', { class: 'oly-panel', 'aria-hidden': 'true' });

    var header = el('div', { class: 'oly-head' });
    header.appendChild(el('span', { class: 'oly-dot' }));
    header.appendChild(el('strong', { text: 'HomoHumanicus · Asystent' }));
    var closeBtn = el('button', { class: 'oly-close', type: 'button', 'aria-label': 'Zamknij czat', text: '\u00d7' });
    header.appendChild(closeBtn);

    var body = el('div', { class: 'oly-body' });
    body.appendChild(el('p', {
      class: 'oly-msg oly-bot',
      html: 'Cze\u015b\u0107! Jestem asystentem Homohumanicus. Pomog\u0119 Ci dobra\u0107 technologi\u0119 wellness i odpowiedzie\u0107 na pytania.'
    }));

    var footer = el('div', { class: 'oly-foot' });
    var input = el('input', { type: 'text', placeholder: 'Napisz wiadomo\u015b\u0107\u2026', 'aria-label': 'Wiadomo\u015b\u0107 do asystenta' });
    var sendBtn = el('button', { type: 'button', class: 'oly-send', 'aria-label': 'Wy\u015blij', text: '\u2192' });
    footer.appendChild(input);
    footer.appendChild(sendBtn);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);

    var css = [
      '.oly-launcher{position:fixed;right:18px;bottom:18px;z-index:99998;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;background:' + LIME + ';color:#0a0a0c;display:grid;place-items:center;box-shadow:0 0 30px rgba(201,242,75,.4);transition:transform .18s}',
      '.oly-launcher:hover{transform:translateY(-3px)}',
      '.oly-panel{position:fixed;right:18px;bottom:88px;z-index:99999;width:min(360px,calc(100vw - 36px));height:min(520px,70vh);display:flex;flex-direction:column;background:' + SURFACE + ';border:1px solid ' + LINE + ';border-radius:20px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.6);opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;transition:opacity .2s,transform .2s}',
      '.oly-panel.oly-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}',
      '.oly-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid ' + LINE + ';background:' + BG + ';color:' + TEXT + ';font:600 15px/1 "DM Sans",Arial,sans-serif}',
      '.oly-dot{width:10px;height:10px;border-radius:50%;background:' + LIME + ';box-shadow:0 0 12px rgba(201,242,75,.7)}',
      '.oly-close{margin-left:auto;border:none;background:transparent;color:' + MUTED + ';font-size:22px;cursor:pointer;line-height:1}',
      '.oly-close:hover{color:' + TEXT + '}',
      '.oly-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:' + BG + '}',
      '.oly-msg{max-width:82%;padding:10px 14px;border-radius:16px;font:400 14px/1.5 "DM Sans",Arial,sans-serif;white-space:pre-wrap;word-wrap:break-word}',
      '.oly-bot{background:' + SURFACE + ';color:' + TEXT + ';border:1px solid ' + LINE + ';border-bottom-left-radius:4px;align-self:flex-start}',
      '.oly-user{background:' + LIME + ';color:#0a0a0c;border-bottom-right-radius:4px;align-self:flex-end}',
      '.oly-foot{display:flex;gap:8px;padding:12px;border-top:1px solid ' + LINE + ';background:' + SURFACE + '}',
      '.oly-foot input{flex:1;background:' + BG + ';border:1px solid ' + LINE + ';border-radius:12px;color:' + TEXT + ';padding:11px 13px;font:400 14px "DM Sans",Arial,sans-serif;outline:none}',
      '.oly-foot input:focus{border-color:' + LIME + '}',
      '.oly-send{border:none;cursor:pointer;background:' + LIME + ';color:#0a0a0c;width:42px;height:42px;border-radius:12px;font-size:18px;font-weight:700;flex:none}',
      '.oly-typing{color:' + MUTED + ';font-style:italic}'
    ].join('');

    var styleTag = el('style');
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    function setOpen(open) {
      panel.classList.toggle('oly-open', open);
      panel.setAttribute('aria-hidden', String(!open));
      if (open) setTimeout(function () { input.focus(); }, 120);
    }

    launcher.addEventListener('click', function () {
      setOpen(!panel.classList.contains('oly-open'));
    });
    closeBtn.addEventListener('click', function () { setOpen(false); });

    function addBotMessage(html) {
      var p = el('p', { class: 'oly-msg oly-bot', html: html });
      body.appendChild(p);
      body.scrollTop = body.scrollHeight;
      return p;
    }

    function botReply(query) {
      var typing = addBotMessage('<span class="oly-typing">…</span>');
      loadKnowledge(function () {
        var answer = answerFromKnowledge(query);
        var html;
        if (answer) {
          html = answer.replace(/\n/g, '<br>');
        } else {
          html = 'Dzi\u0119ki za wiadomo\u015b\u0107! Nie znalaz\u0142em tej informacji w mojej bazie wiedzy. Aby\u015bmy mogli Ci pom\u00f3c, przejd\u017a do formularza kontaktowego \u2014 tam odpowiemy indywidualnie i dobierzemy technologi\u0119 do Twoich potrzeb.';
        }
        typing.innerHTML = html;
        body.scrollTop = body.scrollHeight;
      });
    }

    function send() {
      var val = input.value.trim();
      if (!val) return;
      body.appendChild(el('p', { class: 'oly-msg oly-user', text: val }));
      input.value = '';
      body.scrollTop = body.scrollHeight;
      setTimeout(function () { botReply(val); }, 300);
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') send();
    });
  }

  // Initialize as soon as the DOM is ready (body must exist).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
