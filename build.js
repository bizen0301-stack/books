// books.soranoshita.com 段階1ビルドスクリプト。
// data.js を唯一の入力として、年度ページ23枚・ジャンルページ6枚・sitemap.xml・
// index.html末尾の全作品静的インデックスを作り直す。依存ライブラリ無し、node build.js で実行する。
//
// data.js を更新したら、このスクリプトを再実行するだけで全ページが揃う。
'use strict';

const fs = require('fs');
const path = require('path');
const R = require('./render.js');

const ROOT = __dirname;
const SITE = 'https://books.soranoshita.com';

// --- data.js の読み込み ---
const dataSrc = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
let BOOKS;
{
  const sandbox = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', dataSrc + '\nexports.BOOKS = BOOKS;')(sandbox);
  BOOKS = sandbox.BOOKS;
}
if (!Array.isArray(BOOKS) || BOOKS.length === 0) {
  throw new Error('data.js から BOOKS を読み込めなかった');
}

const YEARS = [...new Set(BOOKS.map(b => b.year))].sort((a, b) => b - a);
const MIN_YEAR = Math.min(...YEARS);
const MAX_YEAR = Math.max(...YEARS);

// ブログ記事との相互リンク(実測で取得済み・公開中のもののみ)。
// 調査/books個別ページ生成_仕様_2026-09-10.md 4-3 と同じ内容。
const BLOG_LINKS = {
  2026: 'https://soranoshita.com/2026/06/02/2026年本屋大賞：今を映す鏡のような10冊。/',
  2025: 'https://soranoshita.com/2026/06/02/2025年本屋大賞：心に静かな灯りをともす10冊。/',
  2024: 'https://soranoshita.com/2026/06/05/2024年本屋大賞：前を向くエネルギーをくれる10冊。/',
  2023: 'https://soranoshita.com/2026/06/05/2023年本屋大賞：ページをめくる手が止まらない。/',
};

// --- 共通ページ部品 ---

const AFFILIATE_DISCLOSURE = `<div class="affiliate">
  ※ 当サイトはAmazonアソシエイト・プログラム、および楽天アフィリエイトの参加者です。リンクを経由してご購入いただくと、サイト運営者に紹介料が支払われます。<br>
  Amazonのアソシエイトとして、本屋大賞ガイドは適格販売により収入を得ています。
</div>`;

const FOOTER = `<footer>© 2026 本屋大賞受賞作ガイド</footer>`;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function headHTML({ title, description, canonical, ogTitle }) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">

<link rel="icon" href="/favicon.ico" type="image/x-icon">
<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">

<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:image" content="${SITE}/ogp.png">
<meta name="twitter:card" content="summary_large_image">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">`;
}

function breadcrumbHTML(items) {
  // items: [{label, url}]  最後の要素はリンク無しのcurrent扱い
  const parts = items.map((it, i) => {
    const isLast = i === items.length - 1;
    if (isLast) return `<span class="current">${esc(it.label)}</span>`;
    return `<a href="${it.url}">${esc(it.label)}</a><span class="sep">›</span>`;
  });
  return `<nav class="breadcrumb" aria-label="パンくずリスト">${parts.join('\n  ')}</nav>`;
}

function absUrl(u) {
  return u.startsWith('http') ? u : SITE + u;
}

function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      item: absUrl(it.url),
    })),
  };
}

function miniHeaderHTML() {
  // サイト名は<h1>にしない。このページの<h1>は本文側(.page-h1)にある一つだけにする。
  return `<header>
  <div class="hdr-inner">
    <div class="hdr-kana">全国書店員が選んだ、いちばん売りたい本</div>
    <div class="site-title"><a href="/">本屋大賞 <span>歴代全作品ガイド</span></a></div>
  </div>
</header>`;
}

function pageShell({ head, breadcrumb, jsonLd, body, extraJsonLd }) {
  const jsonLdBlocks = [jsonLd, extraJsonLd].filter(Boolean)
    .map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="ja">
<head>
${head}
${jsonLdBlocks}
</head>
<body>
${miniHeaderHTML()}
${breadcrumb}
${body}
${AFFILIATE_DISCLOSURE}
${FOOTER}
<script src="/data.js"></script>
<script src="/render.js"></script>
</body>
</html>
`;
}

function yearPagerHTML(year) {
  const prevYear = year - 1;
  const nextYear = year + 1;
  const prev = prevYear >= MIN_YEAR
    ? `<a href="/year/${prevYear}/">← ${prevYear}年</a>`
    : `<span class="disabled">← ${prevYear}年</span>`;
  const next = nextYear <= MAX_YEAR
    ? `<a href="/year/${nextYear}/">${nextYear}年 →</a>`
    : `<span class="disabled">${nextYear}年 →</span>`;
  return `<div class="year-pager">${prev}${next}</div>`;
}

function blogCrosslinkHTML(year) {
  const url = BLOG_LINKS[year];
  if (!url) return '';
  return `<div class="blog-crosslink">📖 ブログ「あの空の下」に、${year}年本屋大賞の紹介記事があります → <a href="${url}">読む</a></div>`;
}

// --- 年度ページ ---

function buildYearPage(year) {
  const books = BOOKS.filter(b => b.year === year).sort((a, b) => a.rank - b.rank);
  const winner = books.find(b => b.rank === 1);
  const count = books.length;

  const head = headHTML({
    title: `${year}年本屋大賞 全${count}作品 受賞・ノミネート一覧｜本屋大賞ガイド`,
    description: `${year}年本屋大賞の受賞作${winner ? '「' + winner.title + '」' : ''}を含む、全${count}作品のあらすじ・ジャンル・映像化情報をまとめました。Amazon・Kindle・楽天ブックスからすぐ購入できます。`,
    canonical: `${SITE}/year/${year}/`,
    ogTitle: `${year}年本屋大賞 全${count}作品｜本屋大賞ガイド`,
  });

  const breadcrumbItems = [
    { label: 'ホーム', url: '/' },
    { label: `${year}年`, url: `/year/${year}/` },
  ];

  const cardsHTML = books.map(b => R.cardHTML(b, { id: `r${b.rank}` })).join('');

  const body = `<div class="page-h1">
  <h1>${year}年本屋大賞 全${count}作品</h1>
  <p class="page-lead">${winner ? `大賞は「${esc(winner.title)}」（${esc(winner.author)}）。` : ''}ノミネート・部門賞を含む${count}作品を掲載しています。</p>
</div>
${blogCrosslinkHTML(year)}
<main class="main">
  <div class="book-grid">${cardsHTML}</div>
</main>
${yearPagerHTML(year)}`;

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${year}年本屋大賞 全${count}作品`,
    itemListElement: books.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.title,
      url: `${SITE}/year/${year}/#r${b.rank}`,
    })),
  };

  return pageShell({
    head,
    breadcrumb: breadcrumbHTML(breadcrumbItems),
    jsonLd: breadcrumbJsonLd(breadcrumbItems),
    extraJsonLd: itemListJsonLd,
    body,
  });
}

// --- ジャンルページ ---

function genreIndexNavHTML(currentSlug) {
  const links = Object.entries(R.GENRE_SLUGS).map(([label, slug]) => {
    const cls = slug === currentSlug ? 'chip on' : 'chip';
    return `<a class="${cls}" href="/genre/${slug}/">${esc(label)}</a>`;
  }).join('\n  ');
  return `<nav class="genre-index-list" aria-label="ジャンル一覧">${links}</nav>`;
}

function buildGenrePage(genreLabel, slug) {
  const books = BOOKS
    .filter(b => b.genre === genreLabel)
    .sort((a, b) => b.year - a.year || a.rank - b.rank);
  const count = books.length;

  const head = headHTML({
    title: `${genreLabel}のおすすめ本屋大賞作品 全${count}冊｜本屋大賞ガイド`,
    description: `本屋大賞の受賞・ノミネート作品から「${genreLabel}」に分類される全${count}冊。あらすじ・映像化情報付きで、Amazon・Kindle・楽天ブックスからすぐ購入できます。`,
    canonical: `${SITE}/genre/${slug}/`,
    ogTitle: `${genreLabel}の本屋大賞作品 全${count}冊｜本屋大賞ガイド`,
  });

  const breadcrumbItems = [
    { label: 'ホーム', url: '/' },
    { label: genreLabel, url: `/genre/${slug}/` },
  ];

  const cardsHTML = books.map(b => R.cardHTML(b)).join('');

  const body = `<div class="page-h1">
  <h1>${esc(genreLabel)}の本屋大賞作品 全${count}冊</h1>
  <p class="page-lead">本屋大賞の歴代受賞・ノミネート作品から、ジャンル「${esc(genreLabel)}」に当てはまる作品を集めました。</p>
</div>
${genreIndexNavHTML(slug)}
<main class="main">
  <div class="book-grid">${cardsHTML}</div>
</main>`;

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${genreLabel}の本屋大賞作品`,
    itemListElement: books.slice(0, 100).map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.title,
      url: `${SITE}/year/${b.year}/#r${b.rank}`,
    })),
  };

  return pageShell({
    head,
    breadcrumb: breadcrumbHTML(breadcrumbItems),
    jsonLd: breadcrumbJsonLd(breadcrumbItems),
    extraJsonLd: itemListJsonLd,
    body,
  });
}

// --- トップページ末尾の全作品静的インデックス ---

function buildAllIndexBlock() {
  const byYear = {};
  BOOKS.forEach(b => { (byYear[b.year] = byYear[b.year] || []).push(b); });
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  const sections = years.map(y => {
    const items = byYear[y].sort((a, b) => a.rank - b.rank).map(b => {
      const label = b.rank <= 10 ? `${b.rank}位` : (b.rank === 11 ? '翻訳賞' : '発掘賞');
      return `<li><a href="/year/${y}/#r${b.rank}">${esc(b.title)} — ${esc(b.author)}（${label}）</a></li>`;
    }).join('\n      ');
    return `    <h3>${y}年</h3>
    <ul>
      ${items}
    </ul>`;
  }).join('\n');

  return `<nav class="all-index" aria-label="全${BOOKS.length}作品インデックス">
    <h2>全${BOOKS.length}作品インデックス</h2>
${sections}
  </nav>`;
}

function injectAllIndex() {
  const p = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(p, 'utf8');
  const startMarker = '<!-- ALL_INDEX_START -->';
  const endMarker = '<!-- ALL_INDEX_END -->';
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx < 0 || endIdx < 0) {
    throw new Error('index.html に ALL_INDEX_START/END マーカーが無い');
  }
  const block = buildAllIndexBlock();
  const before = html.slice(0, startIdx + startMarker.length);
  const after = html.slice(endIdx);
  html = before + '\n' + block + '\n' + after;
  fs.writeFileSync(p, html);
  console.log('index.html: 全作品インデックスを注入（' + BOOKS.length + '件）');
}

// --- sitemap.xml ---

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [`${SITE}/`];
  YEARS.forEach(y => urls.push(`${SITE}/year/${y}/`));
  Object.keys(R.GENRE_SLUGS).forEach(label => urls.push(`${SITE}/genre/${R.GENRE_SLUGS[label]}/`));

  const body = urls.map(u => `  <url>
    <loc>${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u === `${SITE}/` ? '1.0' : '0.7'}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  console.log('sitemap.xml:', urls.length, '件');
}

// --- 実行 ---

function main() {
  fs.mkdirSync(path.join(ROOT, 'year'), { recursive: true });
  YEARS.forEach(y => {
    const dir = path.join(ROOT, 'year', String(y));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildYearPage(y));
  });
  console.log('year/: ' + YEARS.length + 'ページ生成');

  fs.mkdirSync(path.join(ROOT, 'genre'), { recursive: true });
  Object.entries(R.GENRE_SLUGS).forEach(([label, slug]) => {
    const dir = path.join(ROOT, 'genre', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildGenrePage(label, slug));
  });
  console.log('genre/: ' + Object.keys(R.GENRE_SLUGS).length + 'ページ生成');

  injectAllIndex();
  buildSitemap();

  console.log('完了。');
}

main();
