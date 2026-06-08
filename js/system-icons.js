const ICONS = {
  icon_hp: { src: 'assets/icons/icon_hp.svg', fallback: '❤️' },
  icon_exp: { src: 'assets/icons/icon_exp.svg', fallback: '⭐' },
};

/** @param {'icon_hp'|'icon_exp'|string} id */
export function renderSystemIcon(id) {
  const meta = ICONS[id] ?? { fallback: '•' };
  const span = document.createElement('span');
  span.className = 'system-icon';
  span.setAttribute('aria-hidden', 'true');

  if (meta.src) {
    const img = document.createElement('img');
    img.className = 'system-icon-img';
    img.src = meta.src;
    img.alt = '';
    img.addEventListener('error', () => {
      img.replaceWith(document.createTextNode(meta.fallback ?? '•'));
    });
    span.appendChild(img);
  } else {
    span.textContent = meta.fallback ?? '•';
  }

  return span;
}
