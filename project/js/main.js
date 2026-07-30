/* ═══════════════════════════════════════════════
   PolariScope · 课题详情页 —— 交互脚本
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ---------- 视角切换（访客/成员/负责人） ---------- */
  const body = document.body;
  document.querySelectorAll('[data-set-role]').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.setRole;
      body.setAttribute('data-role', role);
      document.querySelectorAll('[data-set-role]').forEach(b => b.classList.toggle('is-active', b === btn));
      // 隐藏访客/成员场景下的 owner-only banner
      document.querySelectorAll('.readonly-banner').forEach(b => {
        const showRoles = (b.dataset.show || '').split(/\s+/);
        b.hidden = !showRoles.includes(role);
      });
      // 隐藏访客不可见的 tab
      const activeTab = document.querySelector('.tabbar__tab.is-active');
      document.querySelectorAll('.tabbar__tab').forEach(t => {
        const roles = t.dataset.tabRoles;
        if (roles) {
          const allowed = roles.split(/\s+/).includes(role);
          t.style.display = allowed ? '' : 'none';
          if (!allowed && t === activeTab) {
            // fall back to first visible tab
            const fallback = document.querySelector('.tabbar__tab:not([style*="none"])');
            if (fallback) fallback.click();
          }
        }
      });
    });
  });

  // 初始化 banner 显示
  (function initBanners() {
    const role = body.dataset.role;
    document.querySelectorAll('.readonly-banner').forEach(b => {
      const showRoles = (b.dataset.show || '').split(/\s+/);
      b.hidden = !showRoles.includes(role);
    });
    document.querySelectorAll('.tabbar__tab[data-tab-roles]').forEach(t => {
      const allowed = t.dataset.tabRoles.split(/\s+/).includes(role);
      t.style.display = allowed ? '' : 'none';
    });
  })();

  /* ---------- Tab 切换 ---------- */
  document.querySelectorAll('.tabbar__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.tabbar__tab').forEach(t => t.classList.toggle('is-active', t === tab));
      document.querySelectorAll('.tabpanel').forEach(p => {
        const match = p.id === 'panel-' + target;
        p.classList.toggle('is-active', match);
        p.hidden = !match;
      });
    });
  });

  /* ---------- 简介展开 ---------- */
  const descToggle = document.getElementById('desc-toggle');
  const heroDesc = document.getElementById('hero-desc');
  if (descToggle && heroDesc) {
    heroDesc.style.maxHeight = '5.2em';
    heroDesc.style.overflow = 'hidden';
    heroDesc.style.transition = 'max-height .3s ease';
    descToggle.addEventListener('click', () => {
      const expanded = descToggle.getAttribute('aria-expanded') === 'true';
      descToggle.setAttribute('aria-expanded', String(!expanded));
      heroDesc.style.maxHeight = expanded ? '5.2em' : '40em';
      descToggle.innerHTML = expanded
        ? '展开完整简介 <i class="fa-solid fa-chevron-down"></i>'
        : '收起简介 <i class="fa-solid fa-chevron-up"></i>';
    });
  }

  /* ---------- Modal ---------- */
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.openModal;
      const modal = document.getElementById(id);
      if (modal) modal.hidden = false;
    });
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) modal.hidden = true;
    });
  });
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) m.hidden = true;
    });
  });

  /* ---------- 原布局对照层 ---------- */
  const toggleCmp = document.getElementById('toggle-compare');
  const cmpOverlay = document.getElementById('compare-overlay');
  const closeCmp = document.getElementById('close-compare');
  if (toggleCmp && cmpOverlay) {
    toggleCmp.addEventListener('click', () => { cmpOverlay.hidden = false; });
  }
  if (closeCmp && cmpOverlay) {
    closeCmp.addEventListener('click', () => { cmpOverlay.hidden = true; });
  }

  /* ---------- Esc 关闭 ---------- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not([hidden])').forEach(m => m.hidden = true);
      if (cmpOverlay && !cmpOverlay.hidden) cmpOverlay.hidden = true;
    }
  });
})();
