import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { Link } from "react-router-dom";

gsap.registerPlugin(CustomEase);

export default function BookingSuccessAnimation({ destinationName, inquiryId, travelerName, onClose }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => { document.body.style.overflow = previousOverflow; };
    CustomEase.create("bookingReveal", "0.65,0.01,0.05,0.99");
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "bookingReveal" } });
      timeline
        .fromTo(".booking-success-layer", { xPercent: 101 }, { xPercent: 0, duration: .8, stagger: .1 })
        .fromTo(".booking-success-shape", { scale: .35, opacity: 0, rotation: -18 }, { scale: 1, opacity: 1, rotation: 0, duration: .75, stagger: .08, ease: "back.out(1.6)" }, "-=.35")
        .fromTo(".booking-success-card", { y: 70, opacity: 0, scale: .94 }, { y: 0, opacity: 1, scale: 1, duration: .72 }, "-=.52")
        .fromTo(".booking-success-check-path", { strokeDasharray: 90, strokeDashoffset: 90 }, { strokeDashoffset: 0, duration: .65, ease: "power2.out" }, "-=.25")
        .fromTo(".booking-success-reveal", { yPercent: 120, rotate: 4 }, { yPercent: 0, rotate: 0, duration: .65, stagger: .07 }, "-=.45")
        .fromTo(".booking-success-actions", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }, "-=.25");
    }, containerRef);
    return () => { context.revert(); document.body.style.overflow = previousOverflow; };
  }, []);

  return <div className="booking-success-overlay" ref={containerRef} role="dialog" aria-modal="true" aria-labelledby="booking-success-title">
    <div className="booking-success-layer layer-one" />
    <div className="booking-success-layer layer-two" />
    <div className="booking-success-layer layer-three" />
    <div className="booking-success-shapes" aria-hidden="true"><span className="booking-success-shape shape-one"/><span className="booking-success-shape shape-two"/><span className="booking-success-shape shape-three"/><span className="booking-success-shape shape-four"/></div>
    <section className="booking-success-card">
      <div className="booking-success-check" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36"/><path className="booking-success-check-path" d="M23 41l11 11 24-27"/></svg></div>
      <p className="booking-success-kicker booking-success-reveal">Booking complete</p>
      <h1 id="booking-success-title" className="booking-success-reveal">Your {destinationName} journey is ready.</h1>
      <p className="booking-success-message booking-success-reveal">Thank you{travelerName ? `, ${travelerName}` : ""}, for trusting us with your journey!</p>
      <p className="booking-success-reference booking-success-reveal">Booking inquiry <strong>#{inquiryId}</strong> has been recorded successfully.</p>
      <div className="booking-success-actions"><Link className="button" to="/saved">View saved plans</Link><button type="button" onClick={onClose}>Review booking details</button></div>
    </section>
  </div>;
}
