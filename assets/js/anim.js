/* anim.js — GSAP motion layer (progressive enhancement only) */
(function () {
"use strict";
if (!window.gsap || !window.ScrollTrigger) return;
gsap.registerPlugin(ScrollTrigger);
if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll(".reveal").forEach(function(el){ el.style.opacity = 1; el.style.transform = "none"; });
  return;
}
var mobile = matchMedia("(max-width: 960px)").matches;

/* Lenis smooth scroll */
try {
  if (window.Lenis) {
    var lenis = new Lenis({ duration: 1.15 });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    (function raf(t){ lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }
} catch (e) {}

/* Split hero title into words */
try {
  if (window.SplitType) {
    new SplitType("#heroTitle", { types: "words", tagName: "span" });
    gsap.from("#heroTitle .word", { y: 90, opacity: 0, rotateX: 25, stagger: .07, duration: .9, ease: "power4.out", delay: .15 });
  }
} catch (e) {}

/* Section headings + reveals */
gsap.utils.toArray(".split").forEach(function(h){
  if (h.id === "heroTitle") return;
  gsap.from(h, { y: 50, opacity: 0, duration: .9, ease: "power3.out",
    scrollTrigger: { trigger: h, start: "top 86%" } });
});
gsap.utils.toArray(".reveal").forEach(function(el){
  gsap.to(el, { opacity: 1, y: 0, duration: .8, ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 90%" } });
});

/* Parallax: hero layers drift apart on scroll */
gsap.to(".hero-bg", { yPercent: 14, ease: "none",
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
gsap.to(".hero-word", { xPercent: -12, ease: "none",
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1.2 } });
gsap.to(".hero-form", { y: -60, ease: "none",
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
gsap.from(".hero-form", { y: 70, opacity: 0, duration: 1, ease: "power3.out", delay: .2 });

/* Generic parallax hooks */
gsap.utils.toArray("[data-speed]").forEach(function(el){
  gsap.to(el, { y: (+el.dataset.speed || -8) * 10, ease: "none",
    scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: 1 } });
});
var aboutImg = document.querySelector("[data-para-img]");
if (aboutImg) gsap.fromTo(aboutImg, { yPercent: -8 }, { yPercent: 8, ease: "none",
  scrollTrigger: { trigger: ".about-photo", start: "top bottom", end: "bottom top", scrub: 1 } });

/* Work rows: numerals drift, images shown full-frame (no crop - parallax disabled for 16:9) */
gsap.utils.toArray(".proj").forEach(function(row){
  gsap.from(row.querySelector(".pnum"), { xPercent: -18, opacity: 0, duration: .8, ease: "power3.out",
    scrollTrigger: { trigger: row, start: "top 86%" } });
});

/* Horizontal strip: gentle entrance (strip itself is drag-scrollable) */
var track = document.getElementById("hTrack");
if (track) gsap.from("#hTrack figure", { x: 60, opacity: 0, stagger: .08, duration: .7, ease: "power3.out",
  scrollTrigger: { trigger: ".hscroll", start: "top 85%" } });

/* Marquee follows scroll velocity */
var mq = document.getElementById("mqTrack"), mx = 0, dir = -1, sp = 1.3;
(function tick(){
  mx += dir * sp;
  if (mx < -mq.scrollWidth / 2) mx = 0;
  if (mx > 0) mx = -mq.scrollWidth / 2;
  mq.style.transform = "translateX(" + mx + "px)";
  requestAnimationFrame(tick);
})();
ScrollTrigger.create({ onUpdate: function(s){
  dir = s.direction === 1 ? -1 : 1;
  sp = 1.3 + Math.min(Math.abs(s.getVelocity()) / 1600, 4);
}});

/* Process bar fills */
var steps = gsap.utils.toArray(".steps li");
steps.forEach(function(st, i){
  ScrollTrigger.create({ trigger: st, start: "top 70%",
    onEnter: function(){
      var f = (i + 1) / steps.length;
      document.getElementById("procFill").style.transform = "scaleX(" + f + ")";
      st.style.setProperty("--p", 1);
    }});
});

/* Footer drift */
gsap.to(".foot-big", { xPercent: -3, ease: "none",
  scrollTrigger: { trigger: "footer", start: "top bottom", end: "bottom bottom", scrub: 1 } });

addEventListener("load", function(){ ScrollTrigger.refresh(); });
})();
