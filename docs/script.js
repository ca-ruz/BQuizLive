// Card zoom modal
function openCardModal(card) {
  const isLn      = card.classList.contains('ln-card');
  const isFeature = card.classList.contains('feature');
  const glowRgb   = isLn ? '255,119,0' : isFeature ? '76,201,240' : '57,255,20';
  const textColor  = isFeature ? 'rgba(76,201,240,.85)' : isLn ? 'var(--text)' : 'rgba(57,255,20,.7)';
  const titleColor = isFeature ? 'var(--purple)' : isLn ? 'var(--orange)' : 'var(--text)';

  const icon  = card.querySelector('.icon')?.innerText || '';
  const badge = card.querySelector('.ln-badge')?.innerText || '';
  const title = card.querySelector('strong, h3')?.innerText || '';
  const desc  = card.querySelector('p')?.innerText || '';
  const items = [...card.querySelectorAll('ul li')].map(li => `<li>${li.innerText}</li>`).join('');
  const code  = card.querySelector('pre')?.innerText || '';

  const overlay = document.createElement('div');
  overlay.className = 'card-modal-overlay';
  overlay.innerHTML = `
    <div class="card-modal-box" style="border-color:rgba(${glowRgb},.55);box-shadow:0 0 60px rgba(${glowRgb},${isLn ? '.45' : '.18'}),0 0 120px rgba(${glowRgb},${isLn ? '.2' : '.07'})">
      ${icon  ? `<div class="modal-icon">${icon}</div>` : ''}
      ${badge ? `<div class="modal-badge">${badge}</div>` : ''}
      ${title ? `<div class="modal-title" style="color:${titleColor}">${title}</div>` : ''}
      ${desc  ? `<div class="modal-desc" style="color:${textColor}">${desc}</div>` : ''}
      ${items ? `<ul class="modal-list" style="color:${textColor}">${items}</ul>` : ''}
      ${code  ? `<div class="modal-code">${code}</div>` : ''}
      <div class="card-modal-hint">clic en cualquier lugar para cerrar · esc</div>
    </div>`;

  function close() { overlay.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e) { if (e.key === 'Escape') close(); }
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);

  overlay.querySelectorAll('.modal-code').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      navigator.clipboard.writeText(el.innerText).then(() => {
        el.classList.add('copied');
        setTimeout(() => el.classList.remove('copied'), 1000);
      });
    });
  });
}

document.querySelectorAll('.demo-card, .feature, .ln-card').forEach(card => {
  card.addEventListener('click', () => openCardModal(card));
});

document.querySelectorAll('pre, code').forEach(el => {
  el.addEventListener('click', e => {
    e.stopPropagation();
    navigator.clipboard.writeText(el.innerText).then(() => {
      el.classList.add('copied');
      setTimeout(() => el.classList.remove('copied'), 1000);
    });
  });
});
