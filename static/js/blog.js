/* ============================================================
   blog.js — Medium blog integration for sam.rayatnia.me
   Fetches feed via rss2json, sanitises with DOMPurify,
   caches in sessionStorage, runs on both list & post pages.
   ============================================================ */
(() => {
  'use strict';

  // ── Config ─────────────────────────────────────────────────────────────────
  const MEDIUM_FEED  = 'https://medium.com/feed/@rayatnia';
  const API_URL      = 'https://api.rss2json.com/v1/api.json?rss_url='
                     + encodeURIComponent(MEDIUM_FEED) + '&count=20';
  const CACHE_KEY    = 'blog_feed_v1';
  const CACHE_TTL    = 15 * 60 * 1000; // 15 minutes
  const PAGE_SIZE    = 6;

  const GRADIENTS = [
    ['from-blue-500',    'to-indigo-600'],
    ['from-indigo-500',  'to-purple-600'],
    ['from-purple-500',  'to-pink-600'],
    ['from-pink-500',    'to-rose-600'],
    ['from-cyan-500',    'to-blue-600'],
    ['from-emerald-500', 'to-teal-600'],
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeHref(url) {
    try {
      const u = new URL(url);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
    } catch (_) { return '#'; }
  }

  function readingTime(html) {
    const words = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
    return Math.max(1, Math.ceil(words / 200));
  }

  function formatDate(str) {
    return new Date(str).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  function extractThumb(content) {
    const m = content.match(/<img[^>]+src="([^"]+)"/);
    return m ? m[1] : null;
  }

  function plainExcerpt(html, max = 160) {
    const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return txt.length > max ? txt.slice(0, max - 1) + '\u2026' : txt;
  }

  function sanitize(html) {
    if (typeof DOMPurify === 'undefined') return '';
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS:  ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
      FORBID_ATTR:  ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
                     'onblur', 'onchange', 'onsubmit'],
    });
  }

  // ── Feed fetch with cache ───────────────────────────────────────────────────

  async function fetchFeed() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) return data;
      }
    } catch (_) { /* ignore corrupt cache */ }

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.status !== 'ok') throw new Error('Feed: ' + (json.message || 'unknown error'));

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: json, ts: Date.now() }));
    } catch (_) { /* ignore quota errors */ }

    return json;
  }

  // ── Skeleton card ──────────────────────────────────────────────────────────

  function buildSkeleton() {
    const el = document.createElement('div');
    el.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse';
    el.innerHTML = `
      <div class="h-48 bg-gray-200"></div>
      <div class="p-6 space-y-3">
        <div class="h-4 bg-gray-200 rounded-lg w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded-lg w-1/2"></div>
        <div class="h-3 bg-gray-200 rounded-lg w-full mt-4"></div>
        <div class="h-3 bg-gray-200 rounded-lg w-5/6"></div>
        <div class="h-3 bg-gray-200 rounded-lg w-4/6"></div>
        <div class="flex justify-between pt-3 border-t border-gray-100 mt-2">
          <div class="h-3 bg-gray-200 rounded w-24"></div>
          <div class="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>`;
    return el;
  }

  // ── Post card ──────────────────────────────────────────────────────────────

  function buildCard(post, idx) {
    const thumb   = extractThumb(post.content);
    const excerpt = plainExcerpt(post.description || post.content);
    const mins    = readingTime(post.content);
    const date    = formatDate(post.pubDate);
    const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
    const href    = 'blog-post.html?link=' + encodeURIComponent(post.link);
    const tags    = (post.categories || []).slice(0, 3);

    const card = document.createElement('a');
    card.href      = href;
    card.className = 'group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden '
                   + 'hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col';

    // ── Thumbnail ──
    const thumbDiv = document.createElement('div');
    thumbDiv.className = `relative h-48 bg-gradient-to-br ${gFrom} ${gTo} overflow-hidden flex-shrink-0`;

    if (thumb) {
      const img = document.createElement('img');
      img.src     = thumb;
      img.alt     = post.title;
      img.loading = 'lazy';
      img.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500';
      img.addEventListener('error', () => img.remove());
      thumbDiv.appendChild(img);
    }

    if (tags.length) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'absolute bottom-3 left-3 flex flex-wrap gap-1';
      tags.forEach(tag => {
        const span = document.createElement('span');
        span.className   = 'px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-medium capitalize';
        span.textContent = tag.replace(/-/g, ' ');
        tagsDiv.appendChild(span);
      });
      thumbDiv.appendChild(tagsDiv);
    }

    card.appendChild(thumbDiv);

    // ── Body ──
    const body = document.createElement('div');
    body.className = 'p-6 flex flex-col flex-1';

    const title = document.createElement('h3');
    title.className   = 'text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors';
    title.textContent = post.title;
    body.appendChild(title);

    const exc = document.createElement('p');
    exc.className   = 'text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-1';
    exc.textContent = excerpt;
    body.appendChild(exc);

    const meta = document.createElement('div');
    meta.className = 'flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100';
    const dateSpan = document.createElement('span');
    dateSpan.textContent = date;
    const minsSpan = document.createElement('span');
    minsSpan.textContent = mins + ' min read';
    meta.appendChild(dateSpan);
    meta.appendChild(minsSpan);
    body.appendChild(meta);

    card.appendChild(body);
    return card;
  }

  // ── Tag pill ───────────────────────────────────────────────────────────────

  function buildTagPill(label, tag, active) {
    const btn = document.createElement('button');
    btn.type         = 'button';
    btn.dataset.tag  = tag;
    btn.textContent  = label;
    btn.className    = 'px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap capitalize '
                     + (active
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700');
    return btn;
  }

  // ── Blog list page ─────────────────────────────────────────────────────────

  async function initList() {
    const grid        = document.getElementById('blog-grid');
    const loadMoreBtn = document.getElementById('load-more');
    const errorDiv    = document.getElementById('blog-error');
    const emptyDiv    = document.getElementById('blog-empty');
    const tagBar      = document.getElementById('tag-bar');
    const countEl     = document.getElementById('post-count');

    if (!grid) return;

    let allPosts = [], filtered = [], shown = 0;

    // Show skeletons
    for (let i = 0; i < PAGE_SIZE; i++) grid.appendChild(buildSkeleton());

    function updateCount() {
      if (countEl) countEl.textContent = shown + ' of ' + filtered.length + ' posts';
    }

    function renderBatch() {
      const batch = filtered.slice(shown, shown + PAGE_SIZE);
      batch.forEach((post, i) => grid.appendChild(buildCard(post, shown + i)));
      shown += batch.length;
      updateCount();
      if (shown >= filtered.length) loadMoreBtn.classList.add('hidden');
      else loadMoreBtn.classList.remove('hidden');
    }

    function applyFilter(tag) {
      filtered = tag ? allPosts.filter(p => (p.categories || []).includes(tag)) : allPosts;
      shown    = 0;
      grid.innerHTML = '';

      // Update pill states
      document.querySelectorAll('[data-tag]').forEach(el => {
        const active = el.dataset.tag === (tag || '');
        el.className = el.className
          .replace(/bg-blue-600|text-white|bg-gray-100|text-gray-600/g, '').trim()
          + ' ' + (active
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700');
      });

      if (filtered.length === 0) {
        emptyDiv && emptyDiv.classList.remove('hidden');
        loadMoreBtn.classList.add('hidden');
        updateCount();
        return;
      }
      emptyDiv && emptyDiv.classList.add('hidden');
      renderBatch();
    }

    try {
      const feed = await fetchFeed();
      allPosts = feed.items || [];
      grid.innerHTML = '';

      if (allPosts.length === 0) {
        emptyDiv && emptyDiv.classList.remove('hidden');
        loadMoreBtn.classList.add('hidden');
        return;
      }

      // Build tag pills
      if (tagBar) {
        const allTags = [...new Set(allPosts.flatMap(p => p.categories || []))]
          .filter(Boolean).sort();

        tagBar.appendChild(buildTagPill('All', '', true));
        allTags.forEach(t => tagBar.appendChild(buildTagPill(t.replace(/-/g, ' '), t, false)));

        tagBar.addEventListener('click', e => {
          const btn = e.target.closest('[data-tag]');
          if (!btn) return;
          applyFilter(btn.dataset.tag || null);
        });
      }

      filtered = allPosts;
      renderBatch();
      loadMoreBtn.addEventListener('click', renderBatch);

    } catch (err) {
      grid.innerHTML = '';
      errorDiv && errorDiv.classList.remove('hidden');
      loadMoreBtn.classList.add('hidden');
      console.error('[Blog]', err);
    }
  }

  // ── Blog post page ─────────────────────────────────────────────────────────

  async function initPost() {
    const container = document.getElementById('post-container');
    if (!container) return;

    const loadingEl = document.getElementById('post-loading');
    const errorEl   = document.getElementById('post-error');
    const params    = new URLSearchParams(location.search);
    const postLink  = params.get('link');

    if (!postLink) { location.href = 'blog.html'; return; }

    try {
      const feed = await fetchFeed();
      const post = (feed.items || []).find(p => p.link === postLink);
      if (!post) throw new Error('Post not found');

      loadingEl && loadingEl.classList.add('hidden');
      document.title = post.title + ' | Sam Rayatnia';
      renderPost(post, container);

    } catch (err) {
      loadingEl && loadingEl.classList.add('hidden');
      errorEl  && errorEl.classList.remove('hidden');
      console.error('[Blog]', err);
    }
  }

  function renderPost(post, container) {
    const mins        = readingTime(post.content);
    const date        = formatDate(post.pubDate);
    const tags        = post.categories || [];
    const safeContent = sanitize(post.content);
    const mediumHref  = safeHref(post.link);

    // Header
    const header = document.createElement('div');
    header.className = 'mb-8';

    // Tags
    if (tags.length) {
      const tagRow = document.createElement('div');
      tagRow.className = 'flex flex-wrap gap-2 mb-4';
      tags.forEach(t => {
        const span = document.createElement('span');
        span.className   = 'px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize';
        span.textContent = t.replace(/-/g, ' ');
        tagRow.appendChild(span);
      });
      header.appendChild(tagRow);
    }

    // Title
    const h1 = document.createElement('h1');
    h1.className   = 'text-3xl sm:text-4xl font-bold text-gray-900 mb-5 leading-tight';
    h1.textContent = post.title;
    header.appendChild(h1);

    // Meta row
    const meta = document.createElement('div');
    meta.className = 'flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-8';

    const dateEl = document.createElement('span');
    dateEl.textContent = date;
    meta.appendChild(dateEl);

    meta.insertAdjacentHTML('beforeend', '<span class="text-gray-300">·</span>');

    const minsEl = document.createElement('span');
    minsEl.textContent = mins + ' min read';
    meta.appendChild(minsEl);

    meta.insertAdjacentHTML('beforeend', '<span class="text-gray-300">·</span>');

    const extLink = document.createElement('a');
    extLink.href      = mediumHref;
    extLink.target    = '_blank';
    extLink.rel       = 'noopener noreferrer';
    extLink.className = 'inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium';
    extLink.innerHTML = 'Read on Medium <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">'
                      + '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" '
                      + 'd="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>';
    meta.appendChild(extLink);

    header.appendChild(meta);

    // Divider
    const divider = document.createElement('div');
    divider.className = 'w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full';
    header.appendChild(divider);

    container.appendChild(header);

    // Article content
    const article = document.createElement('div');
    article.className = 'prose-content';
    article.innerHTML = safeContent;

    // Make all links in article open in new tab safely
    article.querySelectorAll('a').forEach(a => {
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
    });
    // Lazy-load images in article
    article.querySelectorAll('img').forEach(img => {
      img.loading = 'lazy';
      img.style.maxWidth = '100%';
    });

    container.appendChild(article);

    // Footer CTA
    const cta = document.createElement('div');
    cta.className = 'mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center';
    cta.innerHTML = `
      <a href="${escapeHtml(mediumHref)}" target="_blank" rel="noopener noreferrer"
         class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        Continue reading on Medium
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
        </svg>
      </a>
      <a href="blog.html"
         class="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to all posts
      </a>`;
    container.appendChild(cta);
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('blog-grid'))      initList();
    if (document.getElementById('post-container')) initPost();
  });

})();
