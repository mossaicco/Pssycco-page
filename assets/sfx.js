/* PSSYCCO — gluey button sounds. Synthesised with WebAudio: no audio files.
   Press = a soft squish going down, release = a sticky pop coming back up.
   Remembers the on/off choice. Starts only after the first tap (browser rule). */
(function(){
  var KEY = 'pssycco.sfx', on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch(e){}
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null, master = null;
  if (!AC) return;

  function boot(){
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.55;
    var comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
  }

  /* one glue-blob: a sine that glides, wobbles and is squeezed through a wet low-pass */
  function blob(o){
    if (!on || !ctx) return;
    var t = ctx.currentTime + (o.delay || 0), dur = o.dur || 0.12;
    var osc = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur * 0.9);
    lfo.frequency.value = o.wob || 38; lg.gain.value = o.f0 * (o.wobDepth || 0.06);   // the "wet" wobble
    lfo.connect(lg); lg.connect(osc.frequency);
    lp.type = 'lowpass'; lp.Q.value = 7;
    lp.frequency.setValueAtTime(o.c0 || 900, t);
    lp.frequency.exponentialRampToValueAtTime(o.c1 || 2200, t + dur);
    var v = (o.vol || 0.22);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(lp); lp.connect(g); g.connect(master);
    osc.start(t); lfo.start(t); osc.stop(t + dur + 0.03); lfo.stop(t + dur + 0.03);
  }
  function jitter(f){ return f * (0.96 + Math.random() * 0.08); }

  var SOUNDS = {
    press:  function(){ blob({ f0:jitter(300), f1:jitter(150), dur:0.09, c0:1400, c1:500, vol:0.2 }); },
    release:function(){ blob({ f0:jitter(210), f1:jitter(480), dur:0.14, c0:600, c1:2600, vol:0.2, wob:46 }); },
    add:    function(){ blob({ f0:jitter(260), f1:jitter(620), dur:0.13, vol:0.22 }); blob({ f0:jitter(520), f1:jitter(980), dur:0.1, delay:0.07, vol:0.12, wobDepth:0.03 }); },
    remove: function(){ blob({ f0:jitter(520), f1:jitter(190), dur:0.15, c0:2200, c1:500, vol:0.2 }); },
    tab:    function(){ blob({ f0:jitter(240), f1:jitter(380), dur:0.1, vol:0.2 }); blob({ f0:jitter(380), f1:jitter(300), dur:0.09, delay:0.06, vol:0.12 }); },
    open:   function(){ blob({ f0:jitter(180), f1:jitter(540), dur:0.22, c0:500, c1:2800, vol:0.22, wob:30 }); },
    swatch: function(){ blob({ f0:jitter(420), f1:jitter(700), dur:0.08, vol:0.18, wobDepth:0.1 }); },
    hover:  function(){ blob({ f0:jitter(900), f1:jitter(1100), dur:0.04, c0:1800, c1:2400, vol:0.04, wobDepth:0.02 }); }
  };

  function kind(el){
    var cls = el.className && el.className.baseVal === undefined ? String(el.className) : '';
    var op = el.getAttribute('data-op');
    if (el.closest('.tint-row')) return 'swatch';
    if (el.closest('.site-tabs')) return 'tab';
    if (op === 'inc' || /\bplus\b/.test(cls)) return 'add';
    if (op === 'dec' || /\bminus\b|\brm\b/.test(cls) || /remove|empty|undo|close/i.test((el.id||'') + (el.getAttribute('aria-label')||'') + (el.textContent||'').slice(0,14))) return 'remove';
    if (/open|hand|drawer|fold|toggle/i.test((el.id||'') + cls + (el.getAttribute('data-fold')!==null?'fold':''))) return 'open';
    return 'release';
  }
  var PICK = 'button, a[href], [role="button"], summary, select, .chip, label.opt, input[type="range"]';

  document.addEventListener('pointerdown', function(e){
    var el = e.target.closest && e.target.closest(PICK);
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('#sfx-btn')) return;
    boot(); if (!ctx) return;
    SOUNDS.press();
  }, true);
  document.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest(PICK);
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('#sfx-btn')) return;
    boot(); if (!ctx) return;
    var k = kind(el);
    setTimeout(function(){ SOUNDS[k](); }, 45);   // lands just after the press: squish → pop
  }, true);
  var lastHover = 0;
  if (window.matchMedia && window.matchMedia('(hover:hover)').matches){
    document.addEventListener('pointerover', function(e){
      if (!ctx) return;
      var el = e.target.closest && e.target.closest('.chip, .tab, .site-tabs a, .menu .piece button, .tint-row button');
      if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
      var n = performance.now(); if (n - lastHover < 90) return; lastHover = n; SOUNDS.hover();
    });
  }

  /* little on/off switch, bottom-left next to the colour drop when there is one */
  function mount(){
    var css = document.createElement('style');
    css.textContent = '#sfx-btn{position:fixed; left:18px; bottom:18px; z-index:80; width:30px; height:30px; border-radius:50%; border:1px solid rgba(51,53,47,0.18); background:rgba(250,249,245,0.85); backdrop-filter:blur(6px); cursor:pointer; padding:0; display:grid; place-items:center; color:#878a80; opacity:.7; transition:opacity .25s ease, transform .18s ease;}'
      + '#sfx-btn:hover{opacity:1;} #sfx-btn:active{transform:translateY(2px);} #sfx-btn svg{width:15px; height:15px; fill:none; stroke:currentColor; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round;}'
      + '#sfx-btn .waves{opacity:1;} #sfx-btn.off .waves{opacity:0;} #sfx-btn .slash{opacity:0;} #sfx-btn.off .slash{opacity:1;}'
      + 'body.has-tint #sfx-btn{left:68px;} @media (max-width:700px){#sfx-btn{left:12px; bottom:12px;} body.has-tint #sfx-btn{left:56px; bottom:14px;}} @media print{#sfx-btn{display:none;}}';
    document.head.appendChild(css);
    if (document.getElementById('tint')) document.body.classList.add('has-tint');
    var b = document.createElement('button');
    b.id = 'sfx-btn'; b.type = 'button'; b.className = on ? '' : 'off';
    b.setAttribute('aria-label', 'button sounds'); b.setAttribute('aria-pressed', on); b.title = 'sounds';
    b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path class="waves" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/><path class="slash" d="M16 9l5 6M21 9l-5 6"/></svg>';
    b.addEventListener('click', function(){
      on = !on; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch(e){}
      b.className = on ? '' : 'off'; b.setAttribute('aria-pressed', on);
      if (on){ boot(); setTimeout(SOUNDS.add, 30); }
    });
    document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
