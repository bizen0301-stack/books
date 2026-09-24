// ジャンルページ（/genre/{slug}/）。本屋大賞・直木賞・芥川賞をまたいで並べる（2026-09-25）
// 本屋大賞は data.js の genre を対応表で読み替える。直木賞は naoki.js の genre、芥川賞はすべて純文学。
// 本屋大賞と重なる受賞作は本屋大賞のカード1枚にまとめる（直木賞・芥川賞側は出さない）。
'use strict';

const fs = require('fs');
const path = require('path');
const AW = require('./awards.js');

// URL（スラッグ）は変えない。本屋大賞の旧ジャンル名はこの表で読み替える
const GENRES = [
  { slug: 'mystery', label: 'ミステリー', desc: '謎解き・サスペンス・どんでん返し', honya: 'ミステリ' },
  { slug: 'history', label: '時代・歴史', desc: '戦国・江戸・明治と、実在の人物', honya: '歴史' },
  { slug: 'human', label: '家族・人間ドラマ', desc: '親子・夫婦・生き方の話', honya: 'ヒューマン' },
  { slug: 'romance', label: '恋愛', desc: '出会いと別れ、大人の恋', honya: null },
  { slug: 'youth', label: '青春', desc: '学校・部活・10代の日々', honya: '青春' },
  { slug: 'work', label: 'お仕事', desc: '職場と、働く人の話', honya: 'お仕事' },
  { slug: 'sf', label: 'SF・ファンタジー', desc: '少し不思議から、宇宙まで', honya: 'SF' },
  { slug: 'literary', label: '純文学', desc: '言葉と人の内側を読む', honya: null },
];

// 本屋大賞の作品を、主ジャンルとは別のジャンルにも並べるための表（2026-09-25）。恋愛の要素が物語の中心にあるもの
const HONYA_EXTRA = {
  romance: ['2025-7', '2023-1', '2021-8', '2020-1', '2016-2', '2015-9', '2011-2', '2011-10', '2010-8', '2007-2', '2006-6', '2005-4', '2005-10'],
};

function items(g, ctx) {
  const { R, BOOKS, hasBookPage, bookPageUrl } = ctx;
  const out = [];
  const extra = HONYA_EXTRA[g.slug] || [];
  if (g.honya || extra.length) {
    BOOKS.filter(b => (g.honya && b.genre === g.honya) || extra.includes(b.year + '-' + b.rank)).forEach(b => {
      const awards = ['honya'].concat((b.otherAwards || []).map(x => x.href.split('/')[1]));
      const html = R.cardHTML(b, { detailUrl: hasBookPage(b) ? bookPageUrl(b) : '' })
        .replace('<div class="year-badge">' + b.year + '年</div>', '<div class="year-badge">本屋大賞 ' + b.year + '</div>')
        .replace('<article class="card', `<article data-award="${awards.join(' ')}" data-kindle="${b.kindleAsin ? 1 : 0}" class="card`);
      out.push({ sort: b.year + 0.2, html });
    });
  }
  Object.keys(AW.AWARDS).forEach(key => {
    const A = AW.AWARDS[key];
    AW.loadArray(path.join(ctx.ROOT, A.file), A.varName)
      .filter(w => w.title && w.genre === g.slug && !w.honya)
      .forEach(w => out.push({ sort: parseInt(w.half, 10) + (/下/.test(w.half) ? 0.5 : 0), html: AW.awardCardHTML(w, key, Object.assign({}, ctx, { showAward: true })) }));
  });
  return out.sort((a, b) => b.sort - a.sort);
}

function navHTML(current, counts) {
  return `<nav class="genre-index-list" aria-label="ジャンル一覧">${GENRES.map(g => `<a class="chip${g.slug === current ? ' on' : ''}" href="/genre/${g.slug}/">${g.label}<span class="gi-n">${counts[g.slug]}</span></a>`).join('')}</nav>`;
}

function buildGenrePages(ctx) {
  const { esc, headHTML, pageShell, breadcrumbHTML, breadcrumbJsonLd, SITE } = ctx;
  const all = {};
  GENRES.forEach(g => { all[g.slug] = items(g, ctx); });
  const counts = Object.fromEntries(GENRES.map(g => [g.slug, all[g.slug].length]));
  const urls = [];
  GENRES.forEach(g => {
    const list = all[g.slug];
    const n = list.length;
    const head = headHTML({
      title: `${g.label}のおすすめ小説 ${n}冊｜本屋大賞・直木賞・芥川賞から｜文学賞ガイド`,
      description: `本屋大賞・直木賞・芥川賞の受賞作とノミネート作から、${g.label}（${g.desc}）の小説${n}冊を新しい順に。Kindle版の有無、あらすじつきで探せます。`,
      canonical: `${SITE}/genre/${g.slug}/`,
      ogTitle: `${g.label}のおすすめ小説 ${n}冊｜文学賞ガイド`,
    });
    const crumbs = [{ label: 'ホーム', url: '/' }, { label: g.label, url: `/genre/${g.slug}/` }];
    const body = `<div class="page-h1">
  <h1>${esc(g.label)}のおすすめ小説</h1>
  <p class="page-lead">${esc(g.desc)}。本屋大賞・直木賞・芥川賞から${n}冊を新しい順に並べました。</p>
</div>
${navHTML(g.slug, counts)}
<div class="flt" id="flt">
  <div class="flt-row"><span class="flt-l">賞</span><button class="chip on" data-f="all">すべて</button><button class="chip" data-f="honya">本屋大賞</button><button class="chip" data-f="naoki">直木賞</button><button class="chip" data-f="akutagawa">芥川賞</button></div>
  <div class="flt-row"><span class="flt-l">条件</span><button class="chip" data-k="1">Kindle版あり</button><span class="flt-count" id="flt-count">${n}冊</span></div>
</div>
<main class="main">
  <div class="book-grid" id="genre-grid">${list.map(x => x.html).join('')}</div>
</main>
<script>(function(){var f='all',k=false,g=document.getElementById('genre-grid'),c=document.getElementById('flt-count');function run(){var n=0;[].forEach.call(g.children,function(e){var ok=(f==='all'||(' '+e.getAttribute('data-award')+' ').indexOf(' '+f+' ')>=0)&&(!k||e.getAttribute('data-kindle')==='1');e.style.display=ok?'':'none';if(ok)n++});c.textContent=n+'冊'}document.getElementById('flt').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;if(b.dataset.f){f=b.dataset.f;[].forEach.call(this.querySelectorAll('[data-f]'),function(x){x.classList.toggle('on',x===b)})}if(b.dataset.k){k=!k;b.classList.toggle('on',k)}run()})})();</script>`;
    const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: `${g.label}のおすすめ小説`, numberOfItems: n };
    const dir = path.join(ctx.ROOT, 'genre', g.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), pageShell({ head, breadcrumb: breadcrumbHTML(crumbs), jsonLd: breadcrumbJsonLd(crumbs), extraJsonLd: itemList, body }));
    urls.push(`${SITE}/genre/${g.slug}/`);
  });
  console.log('genre/: ' + GENRES.map(g => g.label + counts[g.slug]).join(' '));
  return { urls, counts };
}

module.exports = { GENRES, buildGenrePages };
