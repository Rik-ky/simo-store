(() => {
  const D = window.SIMO;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const main = $("#main");
  const money = n => D.currency + Number(n).toLocaleString("en-NG");
  const art = s => D.artworks.find(a => a.slug === s);
  const prod = s => D.products.find(p => p.slug === s);
  const artImg = a => `assets/art/${a}.jpg`;
  const pImg = (p, a) => `assets/products/${p}-${a}.jpg`;
  const fb = a => `onerror="this.onerror=null;this.src='${artImg(a)}'"`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  $("#yr").textContent = new Date().getFullYear();

  // ---------- cart ----------
  let cart = JSON.parse(localStorage.getItem("simo_cart") || "[]");
  const save = () => { localStorage.setItem("simo_cart", JSON.stringify(cart)); renderCart(); };
  const unit = it => {
    const p = prod(it.p); let price = p.price;
    if (p.options && p.options.surcharge) price += p.options.surcharge[p.options.values.indexOf(it.opt)] || 0;
    return price;
  };
  const total = () => cart.reduce((s, it) => s + unit(it) * it.q, 0);
  const count = () => cart.reduce((s, it) => s + it.q, 0);
  function add(p, a, opt = "", q = 1) {
    const ex = cart.find(it => it.p === p && it.a === a && it.opt === opt);
    ex ? ex.q += q : cart.push({ p, a, opt, q });
    save(); toast(`${prod(p).name} — ${art(a).name} added to cart`);
  }
  function renderCart() {
    $("#cartCount").textContent = count();
    const body = $("#cartBody"), ft = $("#cartFt");
    if (!cart.length) {
      body.innerHTML = `<div class="empty"><h3 class="h-m">Your cart is empty</h3><p>Maybe it's a good moment to bring some art home?</p><a href="#/shop" class="btn" data-close>Continue shopping</a></div>`;
      ft.style.display = "none"; return;
    }
    ft.style.display = "";
    body.innerHTML = cart.map((it, i) => `
      <div class="ci">
        <img src="${pImg(it.p, it.a)}" ${fb(it.a)} alt="">
        <div><h4>${prod(it.p).name}</h4><small>${art(it.a).name}${it.opt ? " · " + esc(it.opt) : ""}</small>
          <div class="qty"><button data-dec="${i}">−</button><span>${it.q}</span><button data-inc="${i}">+</button></div></div>
        <div style="text-align:right"><div>${money(unit(it) * it.q)}</div><button class="ci__rm" data-rm="${i}">Remove</button></div>
      </div>`).join("");
    ft.innerHTML = `<div class="tot"><span>Total</span><span>${money(total())}</span></div>
      <small class="mute">Delivery is arranged with you on WhatsApp after ordering.</small>
      <a href="#/checkout" class="btn btn--block" data-close>Check out</a>`;
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-inc],[data-dec],[data-rm],[data-close],[data-add]");
    if (!t) return;
    if (t.dataset.inc) cart[t.dataset.inc].q++;
    if (t.dataset.dec) { const i = t.dataset.dec; cart[i].q--; if (cart[i].q < 1) cart.splice(i, 1); }
    if (t.dataset.rm) cart.splice(t.dataset.rm, 1);
    if (t.dataset.inc || t.dataset.dec || t.dataset.rm) { save(); if (location.hash.startsWith("#/checkout")) route(); }
    if (t.hasAttribute("data-close")) closeCart();
    if (t.dataset.add) {
      e.preventDefault(); const [p, a] = t.dataset.add.split("|");
      const P = prod(p);
      if (P.options) { location.hash = `#/p/${p}/${a}`; return; }
      add(p, a); openCart();
    }
  });
  const openCart = () => document.body.classList.add("cart-open");
  const closeCart = () => document.body.classList.remove("cart-open");
  $("#cartBtn").onclick = openCart; $("#cartClose").onclick = closeCart; $("#scrim").onclick = closeCart;
  $("#burger").onclick = () => document.body.classList.toggle("nav-open");
  addEventListener("keydown", e => e.key === "Escape" && closeCart());

  let tt; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 2400); }

  // ---------- components ----------
  const card = (p, a, tag = "") => {
    const P = prod(p), A = art(a);
    return `<a class="card rv" href="#/p/${p}/${a}">
      <div class="card__img">${tag}
        <img loading="lazy" src="${pImg(p, a)}" ${fb(a)} alt="${P.name} — ${A.name}">
        <img loading="lazy" class="alt" src="${artImg(a)}" alt="">
        <span class="card__quick" data-add="${p}|${a}" title="Add to cart">+</span>
      </div>
      <div class="card__meta"><b>${P.name}</b><span>${money(P.price)}</span></div>
      <div class="card__sub">${A.name}</div></a>`;
  };

  // ---------- pages ----------
  function home() {
    const best = [["framed-art", "august-meeting"], ["t-shirt", "a-true-mother"], ["tote-bag", "local-hair-braider"], ["mug", "agony"],
      ["hoodie", "obioma"], ["phone-case", "heavy-is-the-head"], ["sticker", "agony"], ["calendar", "a-true-mother"]];
    return `
    <section class="hero">
      <video autoplay muted loop playsinline poster="assets/hero-poster.jpg"><source src="assets/hero.mp4" type="video/mp4"></video>
      <div class="hero__c"><h1 class="h-xl">The wait is over.<br>Shop now.</h1><a href="#/shop" class="btn btn--light">See products</a></div>
    </section>

    <section class="claim wrap rv"><p>Got a wall? We've got art for it.
      <a href="#/shop/framed-art">Prints<span class="thumb" style="background-image:url(${artImg("heavy-is-the-head")})"></span></a>,
      <a href="#/shop/t-shirt">tees</a>, <a href="#/shop/tote-bag">totes</a> and
      <a href="#/shop/sticker">stickers<span class="thumb" style="background-image:url(${artImg("agony")})"></span></a>.
      Six original works. That's it.</p></section>

    <section class="wrap sec--tight">
      <div class="feat">
        <a class="feat__img rv" href="#/p/framed-art/a-true-mother"><img src="${pImg("framed-art", "a-true-mother")}" ${fb("a-true-mother")} alt="A True Mother framed print"></a>
        <div class="feat__side">
          <div class="disc rv"><div class="disc__ic">%</div><div><b>Free sticker with every order</b><div class="mute">Order two or more objects and we'll slip a sticker of your choice in the bag.</div></div></div>
          ${card("hoodie", "a-true-mother", '<span class="card__tag card__tag--y">New</span>')}
        </div>
      </div>
    </section>

    <section class="wrap sec">
      <div class="row-hd"><h2 class="h-l rv">This section speaks for itself.</h2></div>
      <div class="cols">${D.artworks.map(a => `<a class="col rv" href="#/art/${a.slug}"><div class="col__img"><img loading="lazy" src="${artImg(a.slug)}" alt="${a.name}"></div><span>${a.name}</span></a>`).join("")}</div>
    </section>

    <section class="wrap">
      <div class="promo rv"><img loading="lazy" src="${pImg("tote-bag", "local-hair-braider")}" ${fb("local-hair-braider")} alt="">
        <div class="promo__c"><h2 class="h-l">Carry the art.</h2><p>Totes, tees and hoodies printed with the works. Made to be worn to the market, the meeting, and everywhere after.</p><a href="#/shop/tote-bag" class="btn btn--light">See products</a></div></div>
    </section>

    <section class="wrap sec">
      <div class="row-hd"><h2 class="h-l rv">Discover our bestsellers.</h2><a href="#/shop" class="link-u">View all</a></div>
      <div class="grid">${best.map(([p, a], i) => card(p, a, i === 0 ? '<span class="card__tag">Bestseller</span>' : "")).join("")}</div>
    </section>

    <section class="wrap">
      <div class="bundle rv">
        <div class="bundle__img"><img loading="lazy" src="${pImg("mug", "heavy-is-the-head")}" ${fb("heavy-is-the-head")} alt=""><img loading="lazy" src="${pImg("notepad", "heavy-is-the-head")}" ${fb("heavy-is-the-head")} alt=""></div>
        <div class="bundle__c"><span class="badge">Gift idea</span><h2 class="h-l">Keep one, gift one.</h2><p class="mute" style="font-size:18px">Pair a mug with a notepad from the same work. A small gallery for the desk. That's it.</p>
          <div><button class="btn" id="bundleBtn">Add both to cart</button></div></div>
      </div>
    </section>

    <section class="wrap sec">
      <div class="row-hd"><h2 class="h-l rv">Nothing to add. The works speak.</h2><a href="#/works" class="link-u">Discover all works</a></div>
      <div class="stories">${["a-true-mother", "obioma", "local-hair-braider"].map(s => { const a = art(s); return `<a class="story rv" href="#/art/${s}"><div class="story__img"><img loading="lazy" src="${artImg(s)}" alt=""></div><small>SIMO, ${a.year}</small><h3>${a.name}</h3></a>`; }).join("")}</div>
    </section>

    <section class="wrap sec--tight">
      <div class="nums">
        <div class="num rv"><b>6</b><p>original works. Each one with a story behind it.</p></div>
        <div class="num rv"><b>11</b><p>everyday objects to carry them in. And counting.</p></div>
        <div class="num rv"><b>1</b><p>artist, who reads every order personally on WhatsApp.</p></div>
      </div>
    </section>`;
  }

  function shop(filterP, filterA) {
    const items = [];
    D.artworks.forEach(a => D.products.forEach(p => {
      if ((!filterP || p.slug === filterP) && (!filterA || a.slug === filterA)) items.push([p.slug, a.slug]);
    }));
    const title = filterA ? art(filterA).name : filterP ? prod(filterP).name + "s" : "All products";
    const A = filterA && art(filterA);
    return `<section class="wrap">
      <div class="crumbs"><a href="#/">Home</a> / <a href="#/shop">Shop</a>${filterP || filterA ? " / " + title : ""}</div>
      <h1 class="h-xl" style="margin:8px 0 ${A ? 16 : 40}px">${title}</h1>
      ${A ? `<p class="mute" style="max-width:640px;font-size:18px;margin-bottom:40px">${A.blurb}</p>` : ""}
      <div class="chips"><a class="chip ${!filterP && !filterA ? "on" : ""}" href="#/shop">All</a>
        ${D.products.map(p => `<a class="chip ${filterP === p.slug ? "on" : ""}" href="#/shop/${p.slug}">${p.name}</a>`).join("")}</div>
      <div class="chips" style="margin-top:-20px">${D.artworks.map(a => `<a class="chip ${filterA === a.slug ? "on" : ""}" href="#/art/${a.slug}">${a.name}</a>`).join("")}</div>
      <p class="mute" style="margin-bottom:20px">${items.length} products</p>
      <div class="grid">${items.map(([p, a]) => card(p, a)).join("")}</div>
    </section><div class="sec--tight"></div>`;
  }

  function pdp(p, a) {
    const P = prod(p), A = art(a);
    if (!P || !A) return notFound();
    const others = D.products.filter(x => x.slug !== p).slice(0, 4);
    const opt = P.options;
    return `<section class="wrap">
      <div class="crumbs"><a href="#/">Home</a> / <a href="#/shop/${p}">${P.name}s</a> / ${A.name}</div>
      <div class="pdp">
        <div class="pdp__gal">
          <img src="${pImg(p, a)}" ${fb(a)} alt="${P.name} — ${A.name}">
          <img loading="lazy" src="${artImg(a)}" alt="${A.name} original artwork" style="object-fit:contain">
          <img loading="lazy" src="${pImg(others[0].slug, a)}" ${fb(a)} alt="">
        </div>
        <div class="pdp__info">
          <div><span class="mute">${A.name}</span><h1 class="h-l" style="margin-top:6px">${P.name}</h1></div>
          <div class="price" id="price">${money(P.price)}</div>
          <p>${P.desc}</p>
          <div><span class="lbl">Artwork — ${A.name}</span>
            <div class="swatches">${D.artworks.map(x => `<a class="sw ${x.slug === a ? "on" : ""}" href="#/p/${p}/${x.slug}" title="${x.name}"><img src="${artImg(x.slug)}" alt="${x.name}"></a>`).join("")}</div></div>
          ${opt ? `<div><span class="lbl">${opt.label}</span>${opt.type === "select"
            ? `<div class="opts">${opt.values.map((v, i) => `<button class="opt ${i === 0 ? "on" : ""}" data-v="${v}">${v.split(" ")[0]}</button>`).join("")}</div>`
            : `<input class="inp" id="optTxt" placeholder="${opt.placeholder}">`}</div>` : ""}
          <div class="buyrow">
            <div class="qty"><button id="qm">−</button><span id="qv">1</span><button id="qp">+</button></div>
            <button class="btn" id="addBtn">Add to cart</button>
          </div>
          <button class="btn btn--accent btn--block" id="buyBtn">Buy now</button>
          <div class="acc">
            <details open><summary>About the work</summary><p>${A.blurb}</p></details>
            <details><summary>Delivery</summary><p>Every order is confirmed personally by the artist on WhatsApp. Delivery across Nigeria and international shipping are arranged with you directly.</p></details>
            <details><summary>Payment</summary><p>No card needed here. Once your order arrives on WhatsApp, the artist will send payment details and confirm your total including delivery.</p></details>
          </div>
        </div>
      </div>
      <div class="row-hd"><h2 class="h-l">Same work, other objects.</h2></div>
      <div class="grid">${others.map(x => card(x.slug, a)).join("")}</div>
    </section><div class="sec--tight"></div>`;
  }

  function bindPdp(p, a) {
    const P = prod(p); let q = 1;
    let sel = P.options && P.options.type === "select" ? P.options.values[0] : "";
    const upd = () => { $("#qv").textContent = q; $("#price").textContent = money(unit({ p, opt: sel }) * q); };
    $("#qm").onclick = () => { q = Math.max(1, q - 1); upd(); };
    $("#qp").onclick = () => { q++; upd(); };
    $$(".opt").forEach(b => b.onclick = () => { $$(".opt").forEach(x => x.classList.remove("on")); b.classList.add("on"); sel = b.dataset.v; upd(); });
    const getOpt = () => {
      if (P.options && P.options.type === "text") {
        const v = $("#optTxt").value.trim();
        if (!v) { $("#optTxt").focus(); $("#optTxt").style.borderColor = "#c0392b"; toast("Please enter your phone model"); return null; }
        return v;
      }
      return sel;
    };
    $("#addBtn").onclick = () => { const o = getOpt(); if (o === null) return; add(p, a, o, q); openCart(); };
    $("#buyBtn").onclick = () => { const o = getOpt(); if (o === null) return; add(p, a, o, q); location.hash = "#/checkout"; };
  }

  function works() {
    return `<section class="wrap"><div class="crumbs"><a href="#/">Home</a> / Works</div>
      <h1 class="h-xl" style="margin:8px 0 48px">Works.</h1>
      ${D.artworks.map(a => `<div class="work rv"><div class="work__img"><img loading="lazy" src="${artImg(a.slug)}" alt="${a.name}"></div>
        <div class="work__c"><small class="mute">SIMO, ${a.year} · Digital painting</small><h2 class="h-l">${a.name}</h2><p style="font-size:18px">${a.blurb}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#/art/${a.slug}">Shop this work</a><a class="btn btn--light" style="border:1px solid var(--line)" href="#/p/framed-art/${a.slug}">Framed print</a></div></div></div>`).join("")}
    </section>`;
  }

  function about() {
    return `<section class="wrap"><div class="crumbs"><a href="#/">Home</a> / About</div>
      <h1 class="h-xl" style="margin:8px 0 40px;max-width:1200px">Everyday people. Bold colour. Objects you'll use every day.</h1>
      <div class="feat" style="margin-bottom:64px"><div class="feat__img"><img src="${artImg("local-hair-braider")}" alt=""></div>
      <div class="feat__side" style="justify-content:center;gap:24px;font-size:19px;padding:24px">
        <p>SIMO is the shop of a Nigerian digital artist painting the people who hold our communities together: the braider, the tailor, the hawker-mother, the women of the August meeting.</p>
        <p>Every work is turned into a small family of objects, from stickers to framed prints, so the art can live on your wall, your desk, your phone and your back.</p>
        <p class="mute">How ordering works: add what you love to your cart, fill in your name, address and email, and your order is sent straight to the artist on WhatsApp. Payment and delivery are confirmed with you personally. That's it.</p>
        <div><a class="btn" href="#/shop">See products</a></div></div></div>
    </section>`;
  }

  function checkout() {
    if (!cart.length) return `<section class="wrap done"><h1 class="h-l">Your cart is empty.</h1><p class="mute" style="margin:16px 0 28px">Maybe it's a good moment to bring some art home?</p><a class="btn" href="#/shop">Continue shopping</a></section>`;
    return `<section class="wrap"><div class="crumbs"><a href="#/">Home</a> / Checkout</div>
      <div class="co">
        <div><h1 class="h-l" style="margin-bottom:8px">Checkout</h1><p class="mute" style="margin-bottom:32px">Fill in your details. Your order will be sent straight to the artist on WhatsApp, who will confirm payment and delivery with you.</p>
          <form id="coForm" novalidate>
            <div class="field"><label for="fName">Full name</label><input class="inp" id="fName" autocomplete="name" required><div class="err">Please enter your name</div></div>
            <div class="field"><label for="fEmail">Email</label><input class="inp" id="fEmail" type="email" autocomplete="email" required><div class="err">Please enter a valid email</div></div>
            <div class="field"><label for="fPhone">Phone <i>(optional)</i></label><input class="inp" id="fPhone" type="tel" autocomplete="tel" placeholder="+234 …"></div>
            <div class="field"><label for="fAddr">Delivery address</label><textarea class="ta" id="fAddr" autocomplete="street-address" placeholder="Street, city, state, country" required></textarea><div class="err">Please enter your delivery address</div></div>
            <div class="field"><label for="fNote">Note <i>(optional)</i></label><input class="inp" id="fNote" placeholder="Anything the artist should know?"></div>
            <button class="btn btn--wa" type="submit">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.2-.3-.3-.6-.4M12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.9 9.9 0 1 1 12 21.8M20.5 3.5A11.8 11.8 0 0 0 1.9 17.8L.2 24l6.3-1.7A11.8 11.8 0 0 0 24 12a11.7 11.7 0 0 0-3.5-8.5"/></svg>
              Place order via WhatsApp</button>
            <p class="note">🔒 No payment is taken on this site. WhatsApp will open with your order filled in. Just tap send.</p>
          </form></div>
        <aside class="co__sum"><h3 class="h-m" style="margin-bottom:8px">Order summary</h3>
          ${cart.map((it, i) => `<div class="ci"><img src="${pImg(it.p, it.a)}" ${fb(it.a)} alt=""><div><h4>${prod(it.p).name} × ${it.q}</h4><small>${art(it.a).name}${it.opt ? " · " + esc(it.opt) : ""}</small></div><div>${money(unit(it) * it.q)}</div></div>`).join("")}
          <div class="tot" style="margin-top:20px"><span>Subtotal</span><span>${money(total())}</span></div>
          <small class="mute">Delivery fee confirmed on WhatsApp.</small></aside>
      </div></section>`;
  }

  function bindCheckout() {
    const f = $("#coForm"); if (!f) return;
    const saved = JSON.parse(localStorage.getItem("simo_customer") || "{}");
    ["fName", "fEmail", "fPhone", "fAddr"].forEach(id => saved[id] && ($("#" + id).value = saved[id]));
    f.onsubmit = e => {
      e.preventDefault();
      const v = id => $("#" + id).value.trim();
      const checks = { fName: v("fName").length > 1, fEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("fEmail")), fAddr: v("fAddr").length > 5 };
      let ok = true;
      Object.entries(checks).forEach(([id, good]) => { $("#" + id).closest(".field").classList.toggle("bad", !good); if (!good) ok = false; });
      if (!ok) { $(".field.bad .inp, .field.bad .ta").focus(); return; }
      localStorage.setItem("simo_customer", JSON.stringify({ fName: v("fName"), fEmail: v("fEmail"), fPhone: v("fPhone"), fAddr: v("fAddr") }));
      const ref = "SIMO-" + Date.now().toString(36).toUpperCase().slice(-6);
      const lines = cart.map((it, i) => `${i + 1}. ${prod(it.p).name} — "${art(it.a).name}"${it.opt ? " (" + it.opt + ")" : ""} × ${it.q} = ${money(unit(it) * it.q)}`);
      const msg = [
        `*NEW SIMO ORDER* — ${ref}`, "",
        ...lines, "",
        `*Subtotal:* ${money(total())}`, "",
        `*Name:* ${v("fName")}`,
        `*Email:* ${v("fEmail")}`,
        `*Phone:* ${v("fPhone") || "—"}`,
        `*Address:* ${v("fAddr")}`,
        v("fNote") ? `*Note:* ${v("fNote")}` : "",
      ].filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");
      const url = `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(msg)}`;
      sessionStorage.setItem("simo_last", JSON.stringify({ ref, url }));
      cart = []; save();
      location.hash = "#/thanks";
      const w = window.open(url, "_blank");
      if (!w) location.href = url;
    };
  }

  function thanks() {
    const last = JSON.parse(sessionStorage.getItem("simo_last") || "null");
    return `<section class="wrap done"><div class="tick">✓</div><h1 class="h-l">Almost there.</h1>
      <p style="font-size:18px;margin:16px 0 8px">Your order ${last ? `<b>${last.ref}</b>` : ""} has been prepared in WhatsApp.</p>
      <p class="mute" style="margin-bottom:28px">Tap <b>send</b> in WhatsApp to deliver it to the artist. You'll get a reply with payment and delivery details.</p>
      ${last ? `<a class="btn btn--wa" style="max-width:360px;margin:0 auto 12px" href="${last.url}" target="_blank" rel="noopener">Open WhatsApp again</a>` : ""}
      <div><a class="link-u" href="#/shop">Continue shopping</a></div></section>`;
  }

  const notFound = () => `<section class="wrap done"><h1 class="h-l">Page not found.</h1><p style="margin:24px 0"><a class="btn" href="#/">Back home</a></p></section>`;

  // ---------- router ----------
  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    document.body.classList.remove("nav-open"); closeCart(); $("#toast").classList.remove("on");
    let html, after;
    switch (parts[0]) {
      case undefined: html = home(); after = () => { const b = $("#bundleBtn"); if (b) b.onclick = () => { add("mug", "heavy-is-the-head"); add("notepad", "heavy-is-the-head"); openCart(); }; }; break;
      case "shop": html = shop(parts[1]); break;
      case "art": html = shop(null, parts[1]); break;
      case "p": html = pdp(parts[1], parts[2]); after = () => prod(parts[1]) && art(parts[2]) && bindPdp(parts[1], parts[2]); break;
      case "works": html = works(); break;
      case "about": html = about(); break;
      case "checkout": html = checkout(); after = bindCheckout; break;
      case "thanks": html = thanks(); break;
      default: html = notFound();
    }
    main.innerHTML = html;
    after && after();
    $$(".hdr__nav a").forEach(a => a.classList.toggle("on", location.hash.startsWith(a.getAttribute("href"))));
    window.scrollTo(0, 0);
    observe();
  }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  const observe = () => $$(".rv:not(.in)").forEach(el => io.observe(el));
  addEventListener("scroll", () => $("#hdr").classList.toggle("scrolled", scrollY > 10), { passive: true });
  addEventListener("hashchange", route);
  renderCart(); route();
})();
