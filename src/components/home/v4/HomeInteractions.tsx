/**
 * The homepage's whole client behaviour outside the lead forms, as one small inline script:
 *  - GA4 cta_click for every [data-cta] link (same event and parameters as TrackedCta),
 *  - [data-prefill]: attaches that course to the hero form (the event HomeHeroForm already listens for),
 *  - [data-plan] ("Send me the plan"): hands over to the WhatsApp widget, which collects name and
 *    phone, saves the lead (formType whatsapp_widget, attribution, consent, GA4 generate_lead) and
 *    opens WhatsApp. Until the widget is ready the link is a plain wa.me link, so it never dead-ends.
 * Plain DOM, no framework code: nothing to hydrate, so no main-thread cost beyond one click handler.
 */
const SCRIPT = `(function(){
  document.addEventListener('click', function(e){
    var t = e.target && e.target.closest ? e.target.closest('[data-cta]') : null;
    if (!t) return;
    try {
      if (window.gtag) window.gtag('event', 'cta_click', {
        cta_id: t.getAttribute('data-cta'),
        location: t.getAttribute('data-loc') || '',
        destination: t.getAttribute('href') || '',
        page_path: location.pathname
      });
    } catch (_) {}
    var course = t.getAttribute('data-prefill');
    if (course) window.dispatchEvent(new CustomEvent('coss:prefill-course', { detail: { course: course } }));
    if (t.hasAttribute('data-plan') && window.__cossWaReady) {
      e.preventDefault();
      var picked = document.querySelector('input[name="finder-interest"]:checked');
      var suggested = picked ? picked.getAttribute('data-course') : '';
      window.dispatchEvent(new CustomEvent('coss:open-whatsapp', { detail: { origin: 'widget', course: suggested || '' } }));
    }
  }, true);
})();`;

export default function HomeInteractions() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
