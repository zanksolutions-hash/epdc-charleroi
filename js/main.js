(function () {
  var root = document.documentElement;
  if (!root.classList.contains('anim')) return;
  if (!window.Motion) { root.classList.remove('anim'); return; }
  window.epdcReady = true;

  var animate = Motion.animate, scroll = Motion.scroll, inView = Motion.inView, stagger = Motion.stagger;
  var EASE = [0.22, 1, 0.36, 1];
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var clamp = function (v) { return Math.min(1, Math.max(0, v)); };
  // Progression de p entre a et b, ramenée à 0-1
  var range = function (p, a, b) { return clamp((p - a) / (b - a)); };

  // Remplace chaque mot d'un élément par un span, sans toucher aux <strong> ni aux <br>
  function splitWords(el, wrap) {
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 1) { out = out.concat(splitWords(node, wrap)); return; }
      if (node.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/([ \t\r\n]+)/).forEach(function (part) {
        if (!part) return;
        if (/^[ \t\r\n]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var word = document.createElement('span');
        word.textContent = part;
        if (wrap) {
          var mask = document.createElement('span');
          mask.className = 'w';
          mask.appendChild(word);
          frag.appendChild(mask);
        } else {
          word.className = 'word';
          frag.appendChild(word);
        }
        out.push(word);
      });
      el.replaceChild(frag, node);
    });
    return out;
  }

  // Déclenche une seule fois à l'entrée dans l'écran
  function once(el, fn, amount) {
    var stop = inView(el, function () { fn(); stop(); }, { amount: amount || 0.25 });
  }

  function rise(targets, delay) {
    return animate(targets, { opacity: [0, 1], y: [32, 0] }, { duration: 0.9, ease: EASE, delay: delay || 0 });
  }

  function words(el, delay) {
    var list = el.querySelectorAll('.w > span');
    return animate(list, { y: ['115%', '0%'] }, { duration: 1, ease: EASE, delay: stagger(0.05, { startDelay: delay || 0 }) });
  }

  /* Barre de progression */
  var progress = $('.progress');
  scroll(function (p) { progress.style.transform = 'scaleX(' + p + ')'; });

  /* Accueil : les nuages montent et recouvrent le titre, puis le logo apparaît */
  var sky = $('.sky'), clouds = $('.clouds'), title = $('.hero-title'), end = $('.hero-end'), hint = $('.hint');

  function paintHero(p) {
    sky.style.transform = 'translateY(' + (-4 * p) + '%) scale(' + (1.22 - 0.22 * p) + ')';
    clouds.style.transform = 'translateY(' + (52 - 62 * p) + '%)';

    var out = range(p, 0.12, 0.42);
    title.style.opacity = 1 - out;
    title.style.transform = 'translateY(calc(-50% - ' + (90 * out) + 'px)) scale(' + (1 + 0.08 * out) + ')';
    hint.style.opacity = 1 - range(p, 0, 0.1);

    var inn = range(p, 0.45, 0.8);
    end.style.opacity = inn;
    end.style.transform = 'translate(-50%, calc(-50% + ' + (40 * (1 - inn)) + 'px)) scale(' + (0.94 + 0.06 * inn) + ')';
  }

  title.classList.add('ready');
  splitWords(title, true);
  paintHero(0);

  // Intro : le ciel se dévoile, le titre monte, les nuages se lèvent
  animate(sky, { opacity: [0, 1] }, { duration: 1.6, ease: 'easeOut' });
  title.style.opacity = 1;
  words(title, 0.3);
  animate(clouds, { opacity: [0, 1] }, { duration: 2, delay: 0.4, ease: 'easeOut' });

  scroll(paintHero, { target: $('.hero'), offset: ['start start', 'end end'] });

  /* Titres de section */
  $$('[data-split]').forEach(function (el) {
    if (el === title) return;
    splitWords(el, true);
    el.classList.add('ready');
    once(el, function () { words(el); });
  });

  /* Apparitions */
  $$('[data-r]').forEach(function (el) {
    once(el, function () { rise(el); }, 0.15);
  });
  $$('[data-stagger]').forEach(function (el) {
    once(el, function () {
      animate(Array.prototype.slice.call(el.children), { opacity: [0, 1], y: [28, 0] }, { duration: 0.8, ease: EASE, delay: stagger(0.08) });
    }, 0.1);
  });

  /* Pasteurs : l'anneau tourne avec le défilement, le couple monte dans le cercle */
  var pastors = $('.pastors'), ring = $('.ring'), couple = $('.circle img');
  scroll(function (p) {
    ring.style.transform = 'rotate(' + (p * 160 - 80) + 'deg)';
    couple.style.transform = 'translate(-50%, ' + (14 - 14 * range(p, 0, 0.6)) + '%)';
  }, { target: pastors, offset: ['start end', 'end start'] });

  /* Mission : les mots s'allument un à un */
  var statement = $('[data-scrub]');
  var litWords = splitWords(statement, false);
  scroll(function (p) {
    var lit = p * litWords.length;
    litWords.forEach(function (word, i) {
      word.style.opacity = 0.22 + 0.78 * clamp(lit - i);
    });
  }, { target: statement, offset: ['start 85%', 'end 60%'] });

  /* Bâtiment : la photo s'élargit jusqu'aux bords */
  var building = $('.building'), buildingImg = building.querySelector('img');
  var wide = function () { return innerWidth > 800 ? 12 : 6; };
  scroll(function (p) {
    var e = 1 - range(p, 0, 0.5);
    building.style.clipPath = 'inset(0 ' + wide() * e + '% round ' + 28 * e + 'px)';
    buildingImg.style.transform = 'scale(' + (1.14 - 0.14 * range(p, 0, 1)) + ')';
  }, { target: building, offset: ['start end', 'end center'] });

  /* Budget : compteurs et barre d'apport */
  var budget = $('.budget');
  once(budget, function () {
    budget.querySelectorAll('[data-count]').forEach(function (el) {
      var to = +el.dataset.count;
      animate(0, to, {
        duration: 1.8, ease: EASE,
        onUpdate: function (v) {
          el.textContent = String(Math.round(v / 1000) * 1000).replace(/\B(?=(\d{3})+$)/g, ' ') + ' €';
        }
      });
    });
    animate('.bar span', { scaleX: [0, 1] }, { duration: 1.8, delay: 0.3, ease: EASE });
  }, 0.4);

  /* Bandeau : le texte glisse avec le défilement */
  var track = $('.track');
  scroll(function (p) {
    track.style.transform = 'translateX(' + (-p * 34) + '%)';
  }, { target: $('.marquee'), offset: ['start end', 'end start'] });

  /* Contact : la ligne se trace */
  var rule = $('.rule');
  once(rule, function () {
    animate(0, 1, { duration: 1.4, ease: EASE, onUpdate: function (v) { rule.style.setProperty('--line', v); } });
  });
})();
