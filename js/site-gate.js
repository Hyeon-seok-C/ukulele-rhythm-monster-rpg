import { ACCESS_CODE } from './site-config.js';

const STORAGE_KEY = 'rmrpg_access_ok';

/** @returns {Promise<void>} */
export function ensureSiteAccess() {
  const code = (ACCESS_CODE || '').trim();
  if (!code) return Promise.resolve();
  if (sessionStorage.getItem(STORAGE_KEY) === code) return Promise.resolve();

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'site-gate-overlay';
    overlay.innerHTML = `
      <div class="site-gate-box">
        <h2>🔒 리듬 몬스터 RPG</h2>
        <p>접속 코드를 입력하세요.</p>
        <input type="password" class="site-gate-input" id="site-gate-input" autocomplete="off" />
        <button type="button" class="btn btn-primary btn-lg" id="site-gate-btn">들어가기</button>
        <p class="site-gate-hint" id="site-gate-hint" hidden>코드가 맞지 않습니다.</p>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#site-gate-input');
    const btn = overlay.querySelector('#site-gate-btn');
    const hint = overlay.querySelector('#site-gate-hint');

    /** @param {string} value */
    function tryEnter(value) {
      if (value.trim() !== code) {
        hint.hidden = false;
        input?.focus();
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, code);
      overlay.remove();
      resolve();
    }

    btn?.addEventListener('click', () => tryEnter(input?.value ?? ''));
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryEnter(input.value);
    });
    input?.focus();
  });
}
