/* PSSYCCO — official price list and discount rules (COP).
   Single source of truth for /shop/ and /shop/contrato.html. Edit prices here only. */
(function(){
  var MEMBERSHIPS = {
    leaders:   { emoji:'🧭', name:'leaders',   monthly:4500000, sub:'creative strategy & pre-production',
                 bullets:['annual narrative','quarterly, monthly and weekly campaigns','ai brand identity system','annual brand archive','your ai agency executes the production'] },
    ultimate:  { emoji:'⚡', name:'ultimate',  monthly:7000000, sub:'leaders + end-to-end ai production',
                 tag:'most popular',
                 bullets:['everything included in leaders','48 shorts · 24 photo studios / year','4 brand films / year','12 graphics + 48 clips / year','integrated ai and non-ai production'] },
    signature: { emoji:'🎥', name:'signature', monthly:9000000, sub:'leaders + ultimate + end-to-end non-ai production',
                 bullets:['everything included in leaders and ultimate','12 non-ai “signature” commercials / year','one dedicated filming day per month','interviews, testimonials, events, bts','production expenses covered by the brand'] }
  };

  /* pay ahead: minimum term is 3 months */
  var TERMS = [ { months:3, off:0 }, { months:6, off:0.05 }, { months:12, off:0.10 } ];

  /* every unit of a product is one joker card */
  var PRODUCTS = [
    { id:'whitesheet',  group:'ideas', name:'the white sheet', price:5000000, max:12,
      unit:['white sheet','white sheets'], icon:'sheet',
      spec:'one campaign, from blank page to brief',
      text:'The creative direction of one campaign: concept, scripts, storyboards, visual references and AI prompts, ready to produce.' },
    { id:'identity',    group:'ideas', name:'ai brand identity system', price:7000000, max:3,
      unit:['system','systems'], icon:'identity',
      spec:'your brand’s proprietary ai system',
      text:'The documentation of your brand’s AI methodology: creative standards, visual language, prompting system, character consistency and production workflows.' },

    { id:'register3d',  group:'ideas', name:'3d product register', price:1800000, max:12,
      unit:['3d register','3d registers'], icon:'cube',
      spec:'digital future / one product',
      text:'A 3D register of one of your brand’s products, built for AI prompting so it can appear in any scene with full fidelity.' },

    { id:'clip',        group:'pieces', name:'ai clip', price:350000, max:48,
      unit:['clip','clips'], icon:'clip',
      spec:'2 shots / one idea / 10 seconds',
      text:'The shortest of the five products. Not every story needs a beginning and an end — sometimes a single moment is enough.' },
    { id:'short',       group:'pieces', name:'ai short', price:750000, max:48,
      unit:['short','shorts'], icon:'short',
      spec:'4 shots / compact storytelling',
      text:'A condensed cinematic experience that tells a meaningful story in concise, carefully crafted cinematic language.' },
    { id:'photostudio', group:'pieces', name:'ai photo studio', price:750000, max:24,
      unit:['photo studio','photo studios'], icon:'photostudio',
      spec:'5 images / editorial standard',
      text:'Art direction, typography and composition combined to communicate concepts that photography alone cannot express.' },
    { id:'brandfilm',   group:'pieces', name:'ai brand film', price:5170000, max:12,
      unit:['brand film','brand films'], icon:'brandfilm',
      spec:'multiple shots / immersive storytelling',
      text:'The most ambitious expression of your brand: a cinematic production about vision, emotion and identity.' },
    { id:'signature',   group:'pieces', name:'non-ai signature video', price:4500000, max:12,
      unit:['signature video','signature videos'], icon:'signature',
      spec:'one filming day / real people, real places',
      text:'Interviews, teams, projects, events, testimonials. One filming day becomes a full content capture session. Post-production not included.' }

  ];


  /* the production layer: attached to a specific piece, never sold alone.
     not jokers (they don't count toward bundles); members still take 10% off. */
  var ADDONS = [
    { id:'own',        name:'your own material', short:'your material', price:0, toggle:true,
      unit:['your material','your material'], icon:'material',
      text:'The default for every piece. You send the footage, photos and references you already have; we elevate them in post-production.' },
    { id:'dayU',       name:'unconventional filming day', short:'unconventional day', price:750000, from:true, max:7,
      unit:['unconventional day','unconventional days'], icon:'dayU',
      text:'One photographer, light setup — for moments that need to be captured, not staged. Starting price per day; production costs are borne by the client.' },
    { id:'dayT',       name:'traditional filming day', short:'traditional day', price:1830000, from:true, max:7,
      unit:['traditional day','traditional days'], icon:'dayT',
      text:'A full crew, anywhere in Colombia. The day rate is a starting price: all production costs — locations, talent, wardrobe, art direction, travel and permits — are borne by the client and quoted in advance.' }
  ];

  /* bundles work in steps: each joker takes the discount of its own place in the hand.
     your most valuable pieces count first (full price); the 3rd–5th joker are 11% off,
     the 6th–8th 22%, the 9th–12th 33%. a hand holds 12 jokers; from the 13th on, list price.
     adding a piece therefore always raises the total. */
  var BUNDLES = [ { cards:9, off:0.33 }, { cards:6, off:0.22 }, { cards:3, off:0.11 } ];
  var HAND_MAX = 12;
  function rateAt(k){ if (k > HAND_MAX) return 0; for (var i=0;i<BUNDLES.length;i++) if (k >= BUNDLES[i].cards) return BUNDLES[i].off; return 0; }
  var MEMBER_OFF = 0.10;

  function bundleFor(cards){
    for (var i=0;i<BUNDLES.length;i++) if (cards >= BUNDLES[i].cards) return BUNDLES[i];
    return { cards:0, off:0 };
  }
  function nextBundle(cards){
    for (var i=BUNDLES.length-1;i>=0;i--) if (cards < BUNDLES[i].cards) return BUNDLES[i];
    return null;
  }

  /* cart = { items:{id:qty}, membership:'ultimate'|null, term:12, ownMaterial:bool }
     memberPlan = plan of a signed-in member (or null) */
  function addonById(id){ return ADDONS.filter(function(a){ return a.id===id; })[0]; }

  /* cart = { items:{id:qty}, addons:{pieceId:{own:1, dayT:2, ...}}, membership, term } */
  function quote(cart, memberPlan){
    var lines = [], cards = 0, sub = 0, addonLines = [], addonSub = 0;
    PRODUCTS.forEach(function(p){
      var q = (cart.items && cart.items[p.id]) || 0;
      if (q > 0){
        var line = { p:p, qty:q, total:p.price*q, addons:[] };
        var att = (cart.addons && cart.addons[p.id]) || {};
        ADDONS.forEach(function(a){
          var n = att[a.id] || 0;
          if (n > 0){ var al = { a:a, parent:p, qty:n, total:a.price*n }; line.addons.push(al); addonLines.push(al); addonSub += al.total; }
        });
        lines.push(line); cards += q; sub += p.price*q;
      }
    });
    var b = bundleFor(Math.min(cards, HAND_MAX));
    var units = [];
    lines.forEach(function(l){ for (var i=0;i<l.qty;i++) units.push(l.p.price); });
    units.sort(function(a,b){ return b-a; });
    var bundleOff = 0;
    units.forEach(function(price, i){ bundleOff += price * rateAt(i+1); });
    bundleOff = Math.round(bundleOff);
    var isMember = !!(memberPlan || cart.membership);
    var memberOff = (isMember && (cards > 0 || addonSub > 0)) ? MEMBER_OFF : 0;
    var productsOff = bundleOff + Math.round(sub * memberOff);
    var addonsOff = Math.round(addonSub * memberOff);
    var productsTotal = sub - productsOff + addonSub - addonsOff;

    var m = null;
    if (cart.membership && MEMBERSHIPS[cart.membership]){
      var plan = MEMBERSHIPS[cart.membership];
      var term = TERMS.filter(function(t){ return t.months === cart.term; })[0] || TERMS[2];
      var gross = plan.monthly * term.months;
      var termOff = Math.round(gross * term.off);
      m = { key:cart.membership, plan:plan, term:term, gross:gross, off:termOff, total:gross-termOff };
    }
    return {
      lines:lines, cards:cards, subtotal:sub,
      addonLines:addonLines, addonSub:addonSub, addonsOff:addonsOff,
      bundle:b, next: cards < HAND_MAX ? nextBundle(cards) : null, nextRate: rateAt(cards+1), handMax:HAND_MAX, over: Math.max(0, cards-HAND_MAX),
      bundleRate: sub ? bundleOff/sub : 0, memberOff:memberOff, memberSource: memberPlan ? 'account' : (cart.membership ? 'cart' : null),
      productsOff:productsOff + addonsOff, bundleOffAmount:bundleOff, memberOffAmount:Math.round(sub*memberOff)+addonsOff,
      productsTotal:productsTotal,
      membership:m,
      total: productsTotal + (m ? m.total : 0)
    };
  }

  function cop(n){
    return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function unitLabel(p, q){ return (p.toggle ? '' : q + ' ') + (q === 1 ? p.unit[0] : p.unit[1]); }

  var CART_KEY = 'pssycco.cart.v1';
  function loadCart(){
    try {
      var c = JSON.parse(localStorage.getItem(CART_KEY));
      if (c && c.items){
        Object.keys(c.items).forEach(function(id){ if (!PRODUCTS.some(function(p){ return p.id===id; })) delete c.items[id]; });
        c.addons = c.addons || {}; delete c.ownMaterial;
        return c;
      }
    } catch(e){}
    return { items:{}, addons:{}, membership:null, term:12 };
  }
  function saveCart(c){ try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch(e){} }

  window.PSSYCCO_PRICING = {
    MEMBERSHIPS:MEMBERSHIPS, TERMS:TERMS, PRODUCTS:PRODUCTS, ADDONS:ADDONS, addonById:addonById, BUNDLES:BUNDLES, HAND_MAX:HAND_MAX, rateAt:rateAt, MEMBER_OFF:MEMBER_OFF,
    quote:quote, cop:cop, unitLabel:unitLabel, loadCart:loadCart, saveCart:saveCart,
    byId: function(id){ return PRODUCTS.filter(function(p){ return p.id===id; })[0]; }
  };
})();
