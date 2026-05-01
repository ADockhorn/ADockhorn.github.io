(function () {
  async function loadIncludes() {
    const slots = document.querySelectorAll('[data-include]');
    await Promise.all(Array.from(slots).map(async (slot) => {
      const name = slot.getAttribute('data-include');
      try {
        const res = await fetch(`partials/${name}.html`);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const html = await res.text();
        const tmp = document.createElement('div');
        tmp.innerHTML = html.trim();
        const replacement = tmp.firstElementChild || document.createTextNode(html);
        slot.replaceWith(replacement);
      } catch (err) {
        console.error(`Failed to load partial "${name}":`, err);
      }
    }));
    document.dispatchEvent(new CustomEvent('partials:loaded'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadIncludes);
  } else {
    loadIncludes();
  }
})();
