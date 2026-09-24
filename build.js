// books.soranoshita.com 段階1ビルドスクリプト。
// data.js を唯一の入力として、年度ページ23枚・ジャンルページ6枚・sitemap.xml・
// index.html末尾の全作品静的インデックスを作り直す。依存ライブラリ無し、node build.js で実行する。
//
// data.js を更新したら、このスクリプトを再実行するだけで全ページが揃う。
'use strict';

const fs = require('fs');
const path = require('path');
const R = require('./render.js');
const AW = require('./awards.js');

const ROOT = __dirname;
const SITE = 'https://books.soranoshita.com';
// CSSのキャッシュ対策。ビルドごとに変わるクエリを付ける(GitHub PagesのCDNが10分ほど古いCSSを返すため)
const CSS_VER = Date.now().toString(36);

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
  2022: 'https://soranoshita.com/2026/09/11/2022年本屋大賞：世界のグラデーションに気づく10冊/',
  2021: 'https://soranoshita.com/2026/09/11/2021年本屋大賞：孤独と救いの物語。/',
  2020: 'https://soranoshita.com/2026/09/11/2020年本屋大賞：傷つきながらも光を探す、心に深/',
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
<link rel="stylesheet" href="/assets/style.css?v=${CSS_VER}">`;
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

function pageShell({ head, breadcrumb, jsonLd, body, extraJsonLd, header }) {
  const jsonLdBlocks = [jsonLd, extraJsonLd].filter(Boolean)
    .map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="ja">
<head>
${head}
${jsonLdBlocks}
</head>
<body id="top">
<div class="topbar"><div class="topbar-inner"><a class="nav-logo" href="/" aria-label="トップへ戻る">本屋大賞 <span>ガイド</span></a><nav class="topbar-awards" aria-label="文学賞"><a href="/">本屋大賞</a><a href="/naoki/">直木賞</a><a href="/akutagawa/">芥川賞</a></nav><a class="topbar-index" href="/#all-index">全作品インデックス</a></div></div>
${header || miniHeaderHTML()}
${breadcrumb}
${body}
${AFFILIATE_DISCLOSURE}
${FOOTER}
<a href="#top" class="to-top-btn" id="to-top-btn" aria-label="ページの先頭へ戻る">↑</a>
<script>(function(){var b=document.getElementById("to-top-btn");if(!b)return;var u=function(){b.classList.toggle("show",window.scrollY>600)};window.addEventListener("scroll",u,{passive:true});u();b.addEventListener("click",function(e){e.preventDefault();window.scrollTo({top:0,behavior:"smooth"})});})();</script>
<script src="/data.js"></script>
<script src="/pages.js"></script>
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

// 年別ナビ。全ページ共通で、各年度ページとトップ末尾の全作品インデックスへ一段で飛べるようにする(2026-09-16 シゲ指示)。
// onIndex=true のときはトップページ内のアンカー(#all-index)へ、それ以外は /#all-index へ。
function yearNavHTML(currentYear, { onIndex = false } = {}) {
  const chips = YEARS.map(y => {
    const cls = y === currentYear ? 'chip on' : 'chip';
    return `<a class="${cls}" href="/year/${y}/">${y}</a>`;
  }).join('');
  const indexHref = onIndex ? '#all-index' : '/#all-index';
  return `<nav class="year-nav" aria-label="年別ページ">
  <span class="year-nav-label">年別</span>
  <div class="year-nav-scroll">${chips}</div>
  <a class="year-nav-index" href="${indexHref}">全${BOOKS.length}作品インデックス ↓</a>
</nav>`;
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

  const cardsHTML = books.map(b => R.cardHTML(b, { id: `r${b.rank}`, detailUrl: hasBookPage(b) ? bookPageUrl(b) : '' })).join('');

  const body = `<div class="page-h1">
  <h1>${year}年本屋大賞 全${count}作品</h1>
  <p class="page-lead">${winner ? `大賞は「${esc(winner.title)}」（${esc(winner.author)}）。` : ''}ノミネート・部門賞を含む${count}作品を掲載しています。</p>
</div>
${yearNavHTML(year)}
${blogCrosslinkHTML(year)}
<main class="main">
  <div class="book-grid">${cardsHTML}</div>
</main>
${yearPagerHTML(year)}
${yearNavHTML(year)}`;

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

// --- 作品ページ（段階2） ---
// content/{年}-{順位2桁}.md がある作品だけページを作る。無い作品は年度ページのアンカーのまま。
// 本文は「世の中の受け止め方(出典つき)」＋「運営者の視点(空なら欄ごと出さない)」(2026-09-16 シゲ指示)。

const CONTENT_DIR = path.join(ROOT, 'content');

function bookSlug(b) {
  return String(b.year) + '-' + String(b.rank).padStart(2, '0');
}
function bookPageUrl(b) {
  return '/books/' + bookSlug(b) + '/';
}
function bookContentPath(b) {
  return path.join(CONTENT_DIR, bookSlug(b) + '.md');
}
function hasBookPage(b) {
  return fs.existsSync(bookContentPath(b));
}

function rankLabel(r) {
  if (r === 1) return '大賞';
  if (r === 11) return '翻訳賞';
  if (r === 12) return '発掘賞';
  return r + '位';
}

// content/*.md の最小限のパーサ。フロントマター(key: value)＋ "## " 見出しで節を分ける。
function parseContent(md) {
  const meta = {};
  let body = md;
  const fm = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    fm[1].split('\n').forEach(l => {
      const m = l.match(/^([\w-]+):\s*(.*)$/);
      if (m) meta[m[1]] = m[2].trim();
    });
    body = md.slice(fm[0].length);
  }
  const sections = [];
  let cur = null;
  body.split('\n').forEach(line => {
    const h = line.match(/^## (.+)$/);
    if (h) { cur = { title: h[1].trim(), lines: [] }; sections.push(cur); return; }
    if (cur) cur.lines.push(line);
  });
  sections.forEach(s => { s.text = s.lines.join('\n').trim(); });
  return { meta, sections };
}

function inlineMd(s) {
  s = esc(s);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/(^|[^"'>])(https?:\/\/[^\s<]+)/g, (m, pre, url) => pre + '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>');
  return s;
}

// 段落・箇条書き・表だけを扱う。それ以外の記法は使わない前提。
function blockMd(text) {
  const out = [];
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(rows[0]);
      const bodyRows = rows.slice(1).filter(r => !/^\|[\s:|-]+\|$/.test(r));
      out.push('<div class="table-wrap"><table><thead><tr>' + head.map(c => '<th>' + inlineMd(c) + '</th>').join('') + '</tr></thead><tbody>'
        + bodyRows.map(r => '<tr>' + cells(r).map(c => '<td>' + inlineMd(c) + '</td>').join('') + '</tr>').join('')
        + '</tbody></table></div>');
      continue;
    }
    if (/^- /.test(line)) {
      const items = [];
      while (i < lines.length && /^- /.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      out.push('<ul>' + items.map(t => '<li>' + inlineMd(t) + '</li>').join('') + '</ul>');
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('|') && !/^- /.test(lines[i])) { para.push(lines[i]); i++; }
    out.push('<p>' + inlineMd(para.join(' ')) + '</p>');
  }
  return out.join('\n');
}

function buyButtonsHTML(b) {
  const audible = b.audible ? '<a class="btn-link btn-audible" href="' + R.getAmazonAudibleLink(b) + '" target="_blank" rel="noopener">🎧 Audible版</a>' : '';
  return '<div class="buy-buttons">'
    + '<a class="btn-link btn-kindle" href="' + R.getAmazonKindleLink(b) + '" target="_blank" rel="noopener">📱 Kindle版</a>'
    + '<a class="btn-link btn-rakuten" href="' + R.getRakutenLink(b.title, b.author, b) + '" target="_blank" rel="noopener">🔴 楽天ブックス</a>'
    + audible
    + '<a class="btn-link btn-paper" href="' + R.getAmazonPaperLink(b) + '" target="_blank" rel="noopener">📖 紙の本</a>'
    + '</div>';
}

function buildBookPage(b) {
  const md = fs.readFileSync(bookContentPath(b), 'utf8').replace(/\r\n/g, '\n');
  const { meta, sections } = parseContent(md);
  const sec = name => sections.find(s => s.title === name);
  const label = rankLabel(b.rank);
  const awardLabel = b.rank === 1 ? '大賞受賞作' : label;
  const url = bookPageUrl(b);
  const sameYear = BOOKS.filter(x => x.year === b.year && x !== b).sort((x, y) => x.rank - y.rank);
  const sameGenre = BOOKS.filter(x => x.genre === b.genre && x !== b && x.rank === 1).sort((x, y) => y.year - x.year).slice(0, 6);
  const genreSlug = R.GENRE_SLUGS[b.genre];

  const head = headHTML({
    title: b.title + '（' + b.author + '）あらすじ・感想｜' + b.year + '年本屋大賞 ' + awardLabel + '｜本屋大賞ガイド',
    description: b.year + '年本屋大賞 ' + awardLabel + '『' + b.title + '』（' + b.author + '）。あらすじ、YouTubeや読書サイトの感想から見た読者の受け止め方、分かれる点、Audible版のナレーター、同じ年のノミネート作。Kindle・楽天ブックス・Audibleへのリンク付き。',
    canonical: SITE + url,
    ogTitle: b.title + '｜' + b.year + '年本屋大賞 ' + awardLabel,
  });

  const breadcrumbItems = [
    { label: 'ホーム', url: '/' },
    { label: b.year + '年', url: '/year/' + b.year + '/' },
    { label: b.title, url: url },
  ];

  const cover = R.coverUrlFor(b);
  const coverHTML = cover
    ? '<img src="' + cover + '" alt="' + esc(b.title) + '">'
    : '<div class="book-cover-ph"><span>' + esc(b.title) + '</span></div>';

  const reception = sec('読者の受け止め方');
  const split = sec('分かれる点');
  const author = sec('著者が語っていること');
  const owner = sec('運営者の視点');
  const audible = sec('Audibleで聴く');
  const sources = sec('出典');
  const mentioned = sec('こんなところでも紹介されています');

  const parts = [];
  parts.push('<div class="book-hero">'
    + '<div class="book-cover">' + coverHTML + '</div>'
    + '<div class="book-info">'
    + '<div class="book-award"><a href="/year/' + b.year + '/">' + b.year + '年本屋大賞</a> ' + esc(label) + (b.otherAwards ? b.otherAwards.map(x => '　／　<a href="' + x.href + '">' + esc(x.label) + '</a>受賞').join('') : '') + '</div>'
    + '<h1>' + esc(b.title) + '</h1>'
    + '<div class="book-meta">' + esc(b.author) + ' 著' + (b.genre ? '　／　<a href="/genre/' + genreSlug + '/">' + esc(b.genre) + '</a>' : '') + (b.media ? '　／　🎬 ' + esc(b.media) : '') + '</div>'
    + (b.synopsis ? '<p class="book-synopsis">' + esc(b.synopsis) + '</p>' : '')
    + buyButtonsHTML(b)
    + '</div></div>');

  if (reception) {
    parts.push('<section class="book-section"><h2>読者の受け止め方</h2>' + blockMd(reception.text) + '</section>');
  }
  if (split) {
    parts.push('<section class="book-section"><h2>分かれる点</h2>' + blockMd(split.text) + '</section>');
  }
  if (author) {
    parts.push('<section class="book-section"><h2>著者が語っていること</h2>' + blockMd(author.text) + '</section>');
  }
  if (owner && owner.text) {
    parts.push('<section class="book-section book-owner"><h2>運営者の視点</h2>' + blockMd(owner.text) + '</section>');
  }

  // 聴く・読む導線
  const listen = [];
  if (b.audible) listen.push('この作品はAudibleで聴けます（' + (meta.researched ? meta.researched.replace(/-/g, '/') : '') + '時点）。本屋大賞の受賞作でAudibleにあるものの一覧は、ブログ<a href="https://soranoshita.com/2026/09/16/honya-taisho-audible/">本屋大賞の受賞作、Audibleで聴けるのは14作品</a>にまとめています。');
  if (BLOG_LINKS[b.year]) listen.push('ブログ「あの空の下」に<a href="' + BLOG_LINKS[b.year] + '">' + b.year + '年本屋大賞の紹介記事</a>があります。');
  if (listen.length) parts.push('<div class="blog-crosslink">📖 ' + listen.join('<br>') + '</div>');

  // 同じ年
  parts.push('<section class="book-section"><h2>' + b.year + '年の他のノミネート作</h2>'
    + '<ul class="book-list">' + sameYear.map(x => '<li><a href="' + (hasBookPage(x) ? bookPageUrl(x) : '/year/' + b.year + '/#r' + x.rank) + '">' + esc(x.title) + '</a> — ' + esc(x.author) + '（' + esc(rankLabel(x.rank)) + '）</li>').join('') + '</ul>'
    + '<p class="book-more"><a href="/year/' + b.year + '/">' + b.year + '年の全' + (sameYear.length + 1) + '作品を見る →</a></p></section>');

  if (sameGenre.length) {
    parts.push('<section class="book-section"><h2>同じジャンル「' + esc(b.genre) + '」の大賞受賞作</h2>'
      + '<ul class="book-list">' + sameGenre.map(x => '<li><a href="' + (hasBookPage(x) ? bookPageUrl(x) : '/year/' + x.year + '/#r' + x.rank) + '">' + esc(x.title) + '</a> — ' + esc(x.author) + '（' + x.year + '年）</li>').join('') + '</ul>'
      + '<p class="book-more"><a href="/genre/' + genreSlug + '/">ジャンル「' + esc(b.genre) + '」の全作品を見る →</a></p></section>');
  }

  // Audible版とナレーター(末尾近くに独立した節。SEOと「あの声の人」の引っかかり用。2026-09-16 シゲ指示)
  if (audible && audible.text) {
    parts.push('<section class="book-section book-audible" id="audible"><h2>『' + esc(b.title) + '』をAudibleで聴く</h2>' + blockMd(audible.text)
      + (b.audible ? '<p class="book-more"><a href="' + R.getAmazonAudibleLink(b) + '" target="_blank" rel="noopener">Audible版『' + esc(b.title) + '』をAmazonで見る →</a></p>' : '')
      + '</section>');
  }

  if (mentioned && mentioned.text) {
    parts.push('<section class="book-section book-mentioned"><h2>こんなところでも紹介されています</h2>' + blockMd(mentioned.text) + '</section>');
  }

  if (sources) {
    parts.push('<section class="book-section book-sources"><h2>出典</h2><p class="book-note">受け止め方のまとめは、次の動画を' + (meta.researched || '') + 'に視聴・確認したものです。引用ではなく要約であり、「多い」「少ない」はこの' + (meta.sources || '') + '本の中での数です。</p>' + blockMd(sources.text) + '</section>');
  }

  const body = '<div class="book-page">\n' + yearNavHTML(b.year) + '\n' + parts.join('\n') + '\n</div>\n' + yearPagerHTML(b.year);

  const bookJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: b.title,
    author: { '@type': 'Person', name: b.author },
    url: SITE + url,
  };
  if (b.isbn) bookJsonLd.isbn = b.isbn;
  if (cover) bookJsonLd.image = cover;

  return pageShell({
    head,
    breadcrumb: breadcrumbHTML(breadcrumbItems),
    jsonLd: breadcrumbJsonLd(breadcrumbItems),
    extraJsonLd: bookJsonLd,
    body,
  });
}

function buildBookPages() {
  const made = [];
  BOOKS.forEach(b => {
    if (!hasBookPage(b)) return;
    const dir = path.join(ROOT, 'books', bookSlug(b));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildBookPage(b));
    made.push(b);
  });
  // ブラウザ側(トップのJS描画)がカードに「詳しく見る」を出せるよう、ページのある作品を書き出す
  const map = {};
  made.forEach(b => { map[b.year + '-' + b.rank] = bookPageUrl(b); });
  fs.writeFileSync(path.join(ROOT, 'pages.js'), 'const BOOK_PAGES = ' + JSON.stringify(map) + ';\n');
  console.log('books/: ' + made.length + 'ページ生成');
  return made;
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

  const cardsHTML = books.map(b => R.cardHTML(b, { detailUrl: hasBookPage(b) ? bookPageUrl(b) : '' })).join('');

  const body = `<div class="page-h1">
  <h1>${esc(genreLabel)}の本屋大賞作品 全${count}冊</h1>
  <p class="page-lead">本屋大賞の歴代受賞・ノミネート作品から、ジャンル「${esc(genreLabel)}」に当てはまる作品を集めました。</p>
</div>
${genreIndexNavHTML(slug)}
${yearNavHTML(null)}
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
      const href = hasBookPage(b) ? bookPageUrl(b) : `/year/${y}/#r${b.rank}`;
      return `<li><a href="${href}">${esc(b.title)} — ${esc(b.author)}（${label}）</a></li>`;
    }).join('\n      ');
    return `    <h3 id="idx-${y}"><a href="/year/${y}/">${y}年</a><a class="idx-goto" href="/year/${y}/">年度ページを見る →</a></h3>
    <ul>
      ${items}
    </ul>`;
  }).join('\n');

  // 年ごとの見出しへ飛ぶ帯。長い一覧の中で目的の年へ一段で移動できるようにする
  const jump = years.map(y => `<a href="#idx-${y}">${y}</a>`).join('');

  return `<nav class="all-index" id="all-index" aria-label="全${BOOKS.length}作品インデックス">
    <h2>全${BOOKS.length}作品インデックス</h2>
    <p class="all-index-note">年をクリックすると、その年の一覧へ移動します。見出しの年からは年度ページへ飛べます。</p>
    <div class="all-index-jump">${jump}</div>
${sections}
    <p class="all-index-top"><a href="#top">↑ ページの先頭へ</a></p>
  </nav>`;
}

function injectYearNav(html) {
  const startMarker = '<!-- YEAR_NAV_START -->';
  const endMarker = '<!-- YEAR_NAV_END -->';
  const s = html.indexOf(startMarker);
  const e = html.indexOf(endMarker);
  if (s < 0 || e < 0) throw new Error('index.html に YEAR_NAV_START/END マーカーが無い');
  return html.slice(0, s + startMarker.length) + '\n' + yearNavHTML(null, { onIndex: true }) + '\n' + html.slice(e);
}

function injectAllIndex() {
  const p = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(p, 'utf8');
  html = injectYearNav(html);
  html = html.replace(/href="assets\/style\.css(\?v=[^"]*)?"/, 'href="assets/style.css?v=' + CSS_VER + '"');
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

const AWARD_URLS = [];

// --- sitemap.xml ---

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [`${SITE}/`];
  YEARS.forEach(y => urls.push(`${SITE}/year/${y}/`));
  Object.keys(R.GENRE_SLUGS).forEach(label => urls.push(`${SITE}/genre/${R.GENRE_SLUGS[label]}/`));
  BOOKS.filter(hasBookPage).forEach(b => urls.push(SITE + bookPageUrl(b)));
  AWARD_URLS.forEach(u => urls.push(u));

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
  const XREF = AW.crossRefs(ROOT);
  BOOKS.forEach(b => { const x = XREF[b.year + '-' + b.rank]; if (x) b.otherAwards = x; });
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

  buildBookPages();
  AWARD_URLS.push(...Object.keys(AW.AWARDS).map(k => AW.buildAwardPage(k, { esc, headHTML, pageShell, breadcrumbHTML, breadcrumbJsonLd, R, SITE, BOOKS, hasBookPage, bookPageUrl, ROOT, checkedOn: '2026年9月24日' })));
  injectAllIndex();
  buildSitemap();

  console.log('完了。');
}

main();
