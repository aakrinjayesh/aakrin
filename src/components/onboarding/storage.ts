// Shared by the onboarding component and the inline pre-paint script in the root layout.

/**
 * Set once a visitor skips, closes or completes the onboarding. It no longer stops the guide
 * opening on "/" (it opens on every visit); it only decides whether reopening it from a
 * button later plays the full fly-in.
 */
export const ONBOARDING_SEEN_KEY = "aakrin_onboarding_seen_v1";
export const ONBOARDING_SOUND_KEY = "aakrin_onboarding_sound";
/** Added to <html> before first paint when the onboarding should open on load. */
export const ONBOARDING_PENDING_CLASS = "onb-pending";

/**
 * Runs in <head> before the page paints, so the homepage never flashes behind the
 * onboarding. Opens on every visit to "/" (product decision 2026-10-09: Nova is the default
 * landing experience; "Skip & explore" goes to the website), always at /start, and with
 * ?onboarding=1. Crawlers and link-preview bots are not shown the overlay (they get the
 * homepage), which keeps it from acting as an intrusive interstitial for search.
 */
export const onboardingPrePaintScript = `(function(){try{
var d=document.documentElement,p=location.pathname,f=/[?&]onboarding=1/.test(location.search);
var bot=/bot|crawler|spider|slurp|lighthouse|facebookexternalhit|embedly|preview/i.test(navigator.userAgent);
if(f||p==="/start"||(p==="/"&&!bot))d.classList.add(${JSON.stringify(ONBOARDING_PENDING_CLASS)});
}catch(e){}})();`;
