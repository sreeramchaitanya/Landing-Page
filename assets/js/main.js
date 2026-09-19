/* main.js — core interactions (works even if CDNs fail) */
(function () {
"use strict";
var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
var touch = matchMedia("(hover: none)").matches;
if (reduced) document.body.classList.add("no-motion");

/* Smooth anchors */
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener("click", function (e) {
    var id = a.getAttribute("href");
    if (id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      if (window.__lenis) window.__lenis.scrollTo(id, { offset: -90, duration: 1.4 });
      else document.querySelector(id).scrollIntoView({ behavior: "smooth" });
      var m = document.getElementById("mmenu"); if (m) m.hidden = true;
    }
  });
});

/* Mobile menu */
var burger = document.getElementById("burger"), mmenu = document.getElementById("mmenu");
burger.addEventListener("click", function(){ mmenu.hidden = !mmenu.hidden; });

/* Custom cursor dot + Click-to-view circle on work images */
var cur = document.getElementById("cursor");
var vc = document.getElementById("viewCursor");
if (!touch) {
  addEventListener("mousemove", function(e){
    cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px";
    if (vc && vc.classList.contains("show")) {
      vc.style.left = e.clientX + "px"; vc.style.top = e.clientY + "px";
    }
  }, { passive: true });
  document.querySelectorAll("a, button, .proj, .hscroll figure, .svc-list li").forEach(function(el){
    el.addEventListener("mouseenter", function(){ cur.classList.add("big"); });
    el.addEventListener("mouseleave", function(){ cur.classList.remove("big"); });
  });
  if (vc) {
    document.querySelectorAll(".pimg, .himg").forEach(function(zone){
      zone.addEventListener("mouseenter", function(e){
        vc.style.left = e.clientX + "px"; vc.style.top = e.clientY + "px";
        vc.classList.add("show");
        cur.classList.add("hide");
      });
      zone.addEventListener("mousemove", function(e){
        vc.style.left = e.clientX + "px"; vc.style.top = e.clientY + "px";
      });
      zone.addEventListener("mouseleave", function(){
        vc.classList.remove("show");
        cur.classList.remove("hide");
      });
    });
  }
}

/* Progress bar */
var pf = document.getElementById("progressFill");
addEventListener("scroll", function(){
  var h = document.documentElement.scrollHeight - innerHeight;
  pf.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
}, { passive: true });

/* Counters */
var cio = new IntersectionObserver(function(es){
  es.forEach(function(en){
    if (!en.isIntersecting) return;
    cio.unobserve(en.target);
    var end = +en.target.dataset.n, t0 = null;
    function step(t){
      if (!t0) t0 = t;
      var v = Math.min(end, Math.floor((t - t0) / 1400 * end));
      en.target.textContent = v;
      if (v < end) requestAnimationFrame(step);
    }
    reduced ? en.target.textContent = end : requestAnimationFrame(step);
  });
}, { threshold: .5 });
document.querySelectorAll(".count").forEach(function(c){ cio.observe(c); });

/* Hero mouse tilt */
var zone = document.getElementById("tiltZone");
if (zone && !touch && !reduced) {
  var raf = null;
  zone.addEventListener("mousemove", function(e){
    var r = zone.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - .5,
        y = (e.clientY - r.top) / r.height - .5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function(){
      zone.querySelectorAll("[data-depth]").forEach(function(el){
        var d = +el.dataset.depth || 12;
        el.style.translate = (x * d) + "px " + (y * d) + "px";
      });
    });
  });
  zone.addEventListener("mouseleave", function(){
    zone.querySelectorAll("[data-depth]").forEach(function(el){ el.style.translate = "0 0"; });
  });
}

/* Drag-to-scroll for the More-work strip */
var strip = document.getElementById("hTrack");
if (strip) {
  var down = false, sx = 0, sl = 0, moved = 0;
  strip.addEventListener("pointerdown", function(e){
    down = true; moved = 0; sx = e.clientX; sl = strip.scrollLeft;
    strip.classList.add("dragging");
    try { strip.setPointerCapture(e.pointerId); } catch (err) {}
  });
  strip.addEventListener("pointermove", function(e){
    if (!down) return;
    var dx = e.clientX - sx;
    moved = Math.max(moved, Math.abs(dx));
    strip.scrollLeft = sl - dx;
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function(ev){
    strip.addEventListener(ev, function(){ down = false; strip.classList.remove("dragging"); });
  });
  strip.addEventListener("click", function(e){
    if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  strip.querySelectorAll("img").forEach(function(img){ img.draggable = false; });

  /* Arrows + dots for the strip */
  var prev = document.getElementById("hPrev"),
      next = document.getElementById("hNext"),
      dotsBox = document.getElementById("hDots"),
      cards = Array.prototype.slice.call(strip.querySelectorAll("figure"));
  function step(){ var c = cards[0]; return c ? c.offsetWidth + 18 : 320; }
  function maxI(){ return Math.max(0, Math.round((strip.scrollWidth - strip.clientWidth) / step())); }
  function curI(){ return Math.min(maxI(), Math.round(strip.scrollLeft / step())); }
  function renderDots(){
    dotsBox.innerHTML = "";
    cards.forEach(function(_, i){
      var d = document.createElement("i");
      if (i === curI()) d.classList.add("on");
      d.addEventListener("click", function(){ strip.scrollTo({ left: i * step(), behavior: "smooth" }); });
      dotsBox.appendChild(d);
    });
    prev.disabled = strip.scrollLeft <= 4;
    next.disabled = strip.scrollLeft >= strip.scrollWidth - strip.clientWidth - 4;
  }
  prev.addEventListener("click", function(){ strip.scrollBy({ left: -step(), behavior: "smooth" }); });
  next.addEventListener("click", function(){ strip.scrollBy({ left: step(), behavior: "smooth" }); });
  var dT = null;
  strip.addEventListener("scroll", function(){
    if (dT) return;
    dT = requestAnimationFrame(function(){ dT = null; renderDots(); });
  }, { passive: true });
  addEventListener("resize", renderDots);
  renderDots();
}

/* Testimonial slider: 3-up pager with arrows, dots, swipe */
(function(){
  var slider = document.getElementById("tSlider");
  if (!slider) return;
  var track = document.getElementById("tTrack"),
      slides = Array.prototype.slice.call(track.querySelectorAll(".tslide")),
      dotsBox = document.getElementById("tDots"),
      prev = document.getElementById("tPrev"),
      next = document.getElementById("tNext"),
      GAP = 22, i = 0;
  function perView(){ return innerWidth >= 960 ? 3 : innerWidth >= 640 ? 2 : 1; }
  function maxI(){ return Math.max(0, slides.length - perView()); }
  function go(n){
    i = Math.max(0, Math.min(maxI(), n));
    var w = slides[0] ? slides[0].offsetWidth + GAP : 0;
    track.style.transform = "translateX(-" + (i * w) + "px)";
    Array.prototype.forEach.call(dotsBox.children, function(d, k){
      d.classList.toggle("on", k === i);
    });
    prev.disabled = i === 0;
    next.disabled = i === maxI();
  }
  function build(){
    dotsBox.innerHTML = "";
    for (var k = 0; k <= maxI(); k++) {
      (function(k){
        var d = document.createElement("i");
        if (k === i) d.classList.add("on");
        d.addEventListener("click", function(){ go(k); });
        dotsBox.appendChild(d);
      })(k);
    }
    go(i);
  }
  prev.addEventListener("click", function(){ go(i - 1); });
  next.addEventListener("click", function(){ go(i + 1); });
  var sx = null;
  track.addEventListener("pointerdown", function(e){ sx = e.clientX; });
  track.addEventListener("pointerup", function(e){
    if (sx === null) return;
    var dx = e.clientX - sx; sx = null;
    if (dx < -40) go(i + 1); else if (dx > 40) go(i - 1);
  });
  addEventListener("resize", build);
  build();
})();

/* Site preview pop-up: image click opens website in modal with close button */
(function(){
  var modal = document.getElementById("siteModal");
  if (!modal) return;
  var backdrop = document.getElementById("siteModalBackdrop"),
      frame = document.getElementById("siteModalFrame"),
      frameWrap = frame.parentElement,
      title = document.getElementById("siteModalTitle"),
      openBtn = document.getElementById("siteModalOpen"),
      closeBtn = document.getElementById("siteModalClose"),
      loader = document.getElementById("siteModalLoader"),
      lastFocus = null;

  function getLabel(link){
    var card = link.closest("article, figure");
    if (card) {
      var h = card.querySelector("h3");
      if (h && h.textContent.trim()) return h.textContent.trim();
      var cap = card.querySelector("figcaption");
      if (cap && cap.textContent.trim()) return cap.textContent.trim();
    }
    var img = link.querySelector("img");
    if (img && img.alt) return img.alt;
    return link.getAttribute("aria-label") || "Website preview";
  }

  function openSite(url, label){
    lastFocus = document.activeElement;
    title.textContent = label;
    frame.setAttribute("title", label);
    openBtn.href = url;
    frameWrap.classList.remove("loaded");
    frame.removeAttribute("src");
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    if (window.__lenis && window.__lenis.stop) window.__lenis.stop();
    // set src after paint so loader shows
    requestAnimationFrame(function(){ frame.src = url; });
    closeBtn.focus({ preventScroll: true });
    // hide hover "click to view" circle under modal
    var vc = document.getElementById("viewCursor");
    if (vc) vc.classList.remove("show");
  }

  function closeSite(){
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    frame.removeAttribute("src");
    if (window.__lenis && window.__lenis.start) window.__lenis.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  frame.addEventListener("load", function(){ frameWrap.classList.add("loaded"); });
  closeBtn.addEventListener("click", closeSite);
  backdrop.addEventListener("click", closeSite);
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && !modal.hidden) closeSite();
  });

  document.querySelectorAll(".pimg, .himg").forEach(function(link){
    link.addEventListener("click", function(e){
      var url = link.getAttribute("href");
      if (!url || url.charAt(0) === "#") return;
      e.preventDefault();
      openSite(url, getLabel(link));
    });
  });
})();

/* FAQ accordion */
document.querySelectorAll(".acc-item").forEach(function(item){
  var btn = item.querySelector("button"), body = item.querySelector(".acc-body");
  btn.addEventListener("click", function(){
    var open = item.classList.contains("open");
    document.querySelectorAll(".acc-item.open").forEach(function(o){
      o.classList.remove("open"); o.querySelector(".acc-body").style.maxHeight = "0px";
    });
    if (!open) { item.classList.add("open"); body.style.maxHeight = body.scrollHeight + "px"; }
  });
});
var first = document.querySelector(".acc-item");
if (first) { first.classList.add("open"); first.querySelector(".acc-body").style.maxHeight = first.querySelector(".acc-body").scrollHeight + "px"; }

/* Click ripple on every button (no movement, just light) */
document.querySelectorAll(".btn").forEach(function(b){
  b.addEventListener("pointerdown", function(e){
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
    var rip = document.createElement("span");
    rip.className = "ripple";
    rip.style.width = rip.style.height = s + "px";
    rip.style.left = (e.clientX - r.left - s / 2) + "px";
    rip.style.top = (e.clientY - r.top - s / 2) + "px";
    b.appendChild(rip);
    setTimeout(function(){ rip.remove(); }, 650);
  });
});

/* Bespoke dropdown (synced to hidden select for validation + payload) */
(function(){
  var dd = document.getElementById("typeDD");
  if (!dd) return;
  var btn = document.getElementById("ddBtn"),
      val = document.getElementById("ddVal"),
      list = document.getElementById("ddList"),
      real = document.getElementById("fType");
  function close(){ dd.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  btn.addEventListener("click", function(e){
    e.stopPropagation();
    var open = dd.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  list.querySelectorAll("li").forEach(function(li){
    li.addEventListener("click", function(){
      real.value = li.dataset.v;
      val.textContent = li.dataset.v;
      btn.classList.add("picked");
      list.querySelectorAll("li").forEach(function(x){ x.classList.toggle("sel", x === li); });
      close();
    });
  });
  document.addEventListener("click", function(e){ if (!dd.contains(e.target)) close(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") close(); });
})();

/* Future ad-tracking hooks (Meta Pixel / GA4) — guarded no-ops until real IDs are installed.
   WhatsApp click = Contact. Successful form submit = Lead (fired on thank-you.html).
   Each fires at most once per user action; nothing loads until you paste real snippets. */
(function(){
  function fireContact(){
    try {
      if (typeof window.fbq === "function") window.fbq("track", "Contact");
      if (typeof window.gtag === "function") window.gtag("event", "contact");
    } catch (e) {}
  }
  document.querySelectorAll('a[href*="wa.me"]').forEach(function(a){
    a.addEventListener("click", fireContact);
  });
})();

/* Forward facebook/instagram UTM params through the thank-you redirect so Lead attribution survives */
function __utmQs(){
  try {
    var src = new URLSearchParams(location.search), out = [];
    ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(function(k){
      var v = src.get(k); if (v) out.push(k + "=" + encodeURIComponent(v));
    });
    return out.length ? "&" + out.join("&") : "";
  } catch (e) { return ""; }
}

/* Hero quick-quote form -> Web3Forms */
(function(){
  var form = document.getElementById("heroForm");
  if (!form) return;
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var n = document.getElementById("hName").value.trim(),
        ph = document.getElementById("hPhone").value.trim(),
        need = (form.querySelector('input[name="hneed"]:checked') || {}).value || "Website",
        note = document.getElementById("hNote"),
        label = document.getElementById("hSendTxt"),
        btn = document.getElementById("hSend");
    if (!n || !ph) { note.textContent = "Please add your name and mobile number."; return; }
    if (form.dataset.submitting === "1") return;
    form.dataset.submitting = "1";
    label.textContent = "Sending…";
    btn.disabled = true;
    note.textContent = "";
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: "4bcf34b1-e9c8-439d-af41-97988397dac3",
        subject: "Hero quote request — portfolio site",
        from_name: "Hero quick-quote form",
        name: n, phone: ph, project_type: need,
        message: "Quick quote request (" + need + ") from hero form.",
        botcheck: form.querySelector('[name="botcheck"]').checked ? "on" : ""
      })
    }).then(function(r){ return r.json(); }).then(function(data){
      if (!data.success) throw new Error("send failed");
      label.textContent = "Quote requested ✓";
      note.textContent = "Thanks " + n.split(" ")[0] + "! Taking you to the confirmation page…";
      var first = n.split(" ")[0] || "";
      setTimeout(function(){
        window.location.href = "thank-you.html?name=" + encodeURIComponent(first) + "&from=hero&need=" + encodeURIComponent(need) + __utmQs();
      }, 700);
      form.reset();
    }).catch(function(){
      form.dataset.submitting = "0";
      label.textContent = "Get my quote →";
      btn.disabled = false;
      note.textContent = "Hmm, that didn't send — WhatsApp me: +91 73565 70390.";
    });
  });
})();

/* Lead form -> Web3Forms with morphing submit (pill → spinner circle → arrow circle) */
var form = document.getElementById("leadForm");
if (form) {
form.addEventListener("submit", function(e){
  e.preventDefault();
  var n = document.getElementById("fName").value.trim(),
      em = document.getElementById("fEmail").value.trim(),
      ph = document.getElementById("fPhone").value.trim(),
      t = document.getElementById("fType").value,
      d = document.getElementById("fDesc").value.trim(),
      note = document.getElementById("formNote"),
      btn = form.querySelector('button[type="submit"]'),
      label = document.getElementById("sendTxt");
  if (!n || !em || !t || !d) { note.textContent = "Please fill every field."; return; }
  if (form.dataset.submitting === "1") return;
  form.dataset.submitting = "1";
  var fullW = btn.offsetWidth;
  btn.style.width = fullW + "px";
  void btn.offsetWidth;
  btn.classList.add("is-loading");
  btn.disabled = true;
  note.textContent = "";
  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      access_key: "4bcf34b1-e9c8-439d-af41-97988397dac3",
      subject: "New project enquiry — portfolio site",
      from_name: "Portfolio contact form",
      name: n, email: em, phone: ph || "—", project_type: t, message: d,
      botcheck: form.querySelector('[name="botcheck"]').checked ? "on" : ""
    })
  }).then(function(r){ return r.json(); }).then(function(data){
    if (data.success) {
      btn.classList.remove("is-loading");
      btn.classList.add("is-done");
      note.textContent = "Thank you, " + n.split(" ")[0] + "! Taking you to the confirmation page…";
      var first = n.split(" ")[0] || "";
      setTimeout(function(){
        window.location.href = "thank-you.html?name=" + encodeURIComponent(first) + "&from=contact&need=" + encodeURIComponent(t) + __utmQs();
      }, 900);
    } else {
      throw new Error((data && data.message) || "send failed");
    }
  }).catch(function(){
    form.dataset.submitting = "0";
    btn.classList.remove("is-loading");
    btn.style.width = "";
    label.textContent = "Send enquiry →";
    btn.disabled = false;
    note.textContent = "Couldn't send just now — please WhatsApp me instead: +91 73565 70390.";
  });
});
}
})();
