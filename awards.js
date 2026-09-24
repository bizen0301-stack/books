// 本屋大賞以外の文学賞の一覧ページ（2026-09-24〜）。build.js から呼ぶ。
// 1つの賞 = データファイル1つ（例: naoki.js の NAOKI）＋一覧ページ1枚（/naoki/）。
// 受賞作の事実（回・年・作者・作品・出版社）は日本文学振興会の公式一覧から取った。
// 作品ページは作らない。本屋大賞でも上位に入った作品だけ、本屋大賞側の作品ページ・年度ページへリンクする。
'use strict';

const fs = require('fs');
const path = require('path');

function loadArray(file, name) {
  const src = fs.readFileSync(file, 'utf8');
  const box = {};
  new Function('exports', src + `\nexports.v = ${name};`)(box);
  return box.v;
}

// 賞ごとの設定。あとから芥川賞などを足すときは、ここに1件足してデータファイルを置く。
const AWARDS = {
  naoki: {
    file: 'naoki.js',
    varName: 'NAOKI',
    name: '直木賞',
    fullName: '直木三十五賞',
    kana: '作家が選ぶ、エンターテインメント小説の賞',
    lead: '直木賞（直木三十五賞）は、日本文学振興会が年に2回選ぶ文学賞です。新進・中堅の作家によるエンターテインメント作品の単行本が対象です。',
  },
};

function halfLabel(h) {
  // 公式一覧の「2026上」→「2026年上半期」
  const m = String(h).match(/^(\d{4})(上|下)$/);
  return m ? `${m[1]}年${m[2]}半期` : h;
}

function decadeOf(h) {
  const y = parseInt(String(h).slice(0, 4), 10);
  return Math.floor(y / 10) * 10;
}

// ctx は build.js から渡す共通部品（headHTML・pageShell・breadcrumb 関連・R・SITE・本屋大賞の作品）
function buildAwardPage(key, ctx) {
  const A = AWARDS[key];
  const { esc, headHTML, pageShell, breadcrumbHTML, breadcrumbJsonLd, R, SITE, BOOKS, hasBookPage, bookPageUrl } = ctx;
  const list = loadArray(path.join(ctx.ROOT, A.file), A.varName);
  const winners = list.filter(w => w.title);
  const rounds = new Set(list.map(w => w.kai));
  const none = list.filter(w => !w.title).length;
  const latest = list.reduce((a, b) => (b.kai > a.kai ? b : a));
  const first = list.reduce((a, b) => (b.kai < a.kai ? b : a));

  // 本屋大賞と重なる作品
  const honya = w => w.honya ? BOOKS.find(b => b.year === w.honya.year && b.rank === w.honya.rank) : null;
  const honyaLabel = b => b.rank === 1 ? `${b.year}年本屋大賞 大賞` : `${b.year}年本屋大賞 ${b.rank}位`;
  const honyaHref = b => hasBookPage(b) ? bookPageUrl(b) : `/year/${b.year}/#r${b.rank}`;

  function rowHTML(w) {
    const hb = honya(w);
    const buy = {
      title: w.title, author: w.author,
      kindleAsin: w.kindleAsin, amazonAsin: w.amazonAsin,
    };
    const btns = [
      w.kindleAsin ? `<a class="btn-link btn-kindle" href="${R.getAmazonKindleLink(buy)}" target="_blank" rel="noopener">📱 Kindle版</a>` : '',
      `<a class="btn-link btn-paper" href="${R.getAmazonPaperLink(buy)}" target="_blank" rel="noopener">📖 ${w.amazonAsin ? '紙の本' : 'Amazonで探す'}</a>`,
      `<a class="btn-link btn-rakuten" href="${R.getRakutenLink(w.title, w.author, null)}" target="_blank" rel="noopener">🔴 楽天ブックス</a>`,
    ].join('');
    const cover = w.coverImg
      ? '<div class="aw-cover"><img src="' + esc(w.coverImg) + '" alt="『' + esc(w.title) + '』の表紙" loading="lazy" width="72" height="105"></div>'
      : '<div class="aw-cover aw-ph" aria-hidden="true"><span class="aw-ph-title">' + esc(w.title) + '</span><span class="aw-ph-author">' + esc(w.author) + '</span></div>';
    return `<li class="aw-row" id="k${w.kai}${w.sub ? '-' + w.sub : ''}">
  ${cover}
  <div class="aw-body">
    <p class="aw-meta">第${w.kai}回（${halfLabel(w.half)}）</p>
    <p class="aw-title">${esc(w.title)}</p>
    <p class="aw-author">${esc(w.author)}${w.pub ? `<span class="aw-pub">／${esc(w.pub)}</span>` : ''}</p>
    ${w.note ? `<p class="aw-note">${esc(w.note)}</p>` : ''}
    ${hb ? `<p class="aw-honya"><a href="${honyaHref(hb)}">${honyaLabel(hb)}にも選ばれています →</a></p>` : ''}
    <div class="aw-btns">${btns}</div>
  </div>
</li>`;
  }

  // 年代ごと（新しい順）。受賞作なしの回は、年代の末尾にまとめて書く
  const decades = [...new Set(list.map(w => decadeOf(w.half)))].sort((a, b) => b - a);
  const sections = decades.map(d => {
    const ws = winners.filter(w => decadeOf(w.half) === d).sort((a, b) => b.kai - a.kai);
    const nones = list.filter(w => !w.title && decadeOf(w.half) === d).sort((a, b) => b.kai - a.kai);
    const noneHTML = nones.length ? `<p class="aw-none">受賞作なし：${nones.map(w => `第${w.kai}回（${halfLabel(w.half)}）`).join('、')}</p>` : '';
    return `<section class="aw-decade" id="d${d}">
  <h2>${d}年代 <span>${ws.length}作</span></h2>
  <ul class="aw-list">${ws.map(rowHTML).join('\n')}</ul>
  ${noneHTML}
</section>`;
  }).join('\n');

  const jump = decades.map(d => `<a class="chip" href="#d${d}">${d}年代</a>`).join('');

  const both = winners.filter(w => honya(w)).sort((a, b) => b.kai - a.kai);
  const bothHTML = both.length ? `<section class="aw-both">
  <h2>本屋大賞でも上位に入った${A.name}受賞作</h2>
  <p>書店員が選ぶ本屋大賞と、作家が選考委員を務める${A.name}。選ぶ人も基準も違う2つの賞で、どちらにも名前が挙がった作品です。</p>
  <ul>${both.map(w => { const b = honya(w); return `<li><a href="#k${w.kai}${w.sub ? '-' + w.sub : ''}">『${esc(w.title)}』${esc(w.author)}</a>：${A.name} 第${w.kai}回／<a href="${honyaHref(b)}">${honyaLabel(b)}</a></li>`; }).join('')}</ul>
</section>` : '';

  const kindleCount = winners.filter(w => w.kindleAsin).length;
  const title = `${A.name} 歴代受賞作一覧（第1回〜第${latest.kai}回）｜Kindleで読める作品も｜本屋大賞ガイド`;
  const head = headHTML({
    title,
    description: `${A.name}（${A.fullName}）の第1回（${first.half.slice(0, 4)}年）から第${latest.kai}回（${halfLabel(latest.half)}）までの全受賞作${winners.length}作。Kindle版の有無、本屋大賞でも上位に入った作品がひと目で分かります。`,
    canonical: `${SITE}/${key}/`,
    ogTitle: `${A.name} 歴代受賞作一覧（全${winners.length}作）`,
  });
  const crumbs = [{ label: 'ホーム', url: '/' }, { label: `${A.name} 歴代受賞作`, url: `/${key}/` }];

  const body = `<div class="page-h1">
  <h1>${A.name} 歴代受賞作一覧</h1>
  <p class="page-lead">${A.lead}${first.half.slice(0, 4)}年の第1回から、${halfLabel(latest.half)}の第${latest.kai}回まで、受賞した${winners.length}作を新しい順に並べました（受賞作なしの回が${none}回あります）。</p>
  <p class="page-lead">いまKindle版で読める作品は${winners.length}作中${kindleCount}作です。${both.length ? `本屋大賞でも上位に入った${both.length}作には印を付けています。` : ''}</p>
</div>
<nav class="year-nav aw-jump" aria-label="年代別"><span class="year-nav-label">年代</span><div class="year-nav-scroll">${jump}</div></nav>
<main class="main aw-main">
${bothHTML}
${sections}
<p class="aw-source">受賞作・回・出版社（掲載誌）は、主催する<a href="https://bungakushinko.or.jp/award/${key}/list.html" target="_blank" rel="noopener">日本文学振興会の受賞者一覧</a>で確かめました（${ctx.checkedOn}）。Kindle版の有無は同じ日にAmazonで確認したもので、変わることがあります。</p>
</main>`;

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${A.name} 歴代受賞作`,
    itemListElement: winners.sort((a, b) => b.kai - a.kai).slice(0, 100).map((w, i) => ({
      '@type': 'ListItem', position: i + 1, name: w.title,
      url: `${SITE}/${key}/#k${w.kai}${w.sub ? '-' + w.sub : ''}`,
    })),
  };

  const header = `<header>
  <div class="hdr-inner">
    <div class="hdr-kana">${A.kana}</div>
    <div class="site-title"><a href="/${key}/">${A.name} <span>歴代受賞作ガイド</span></a></div>
  </div>
</header>`;
  const html = pageShell({ header, head, breadcrumb: breadcrumbHTML(crumbs), jsonLd: breadcrumbJsonLd(crumbs), extraJsonLd: itemList, body });
  const dir = path.join(ctx.ROOT, key);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`${key}/: 受賞${winners.length}作（Kindle ${kindleCount}、本屋大賞と重なる ${both.length}）`);
  return `${SITE}/${key}/`;
}

// 本屋大賞の作品に「ほかに取った賞」を付けるための対応表。キーは「年-順位」
function crossRefs(ROOT) {
  const map = {};
  Object.entries(AWARDS).forEach(([key, A]) => {
    loadArray(path.join(ROOT, A.file), A.varName).filter(w => w.honya).forEach(w => {
      const k = w.honya.year + '-' + w.honya.rank;
      (map[k] = map[k] || []).push({ label: `${A.name} 第${w.kai}回`, href: `/${key}/#k${w.kai}${w.sub ? '-' + w.sub : ''}` });
    });
  });
  return map;
}

module.exports = { AWARDS, buildAwardPage, crossRefs };
