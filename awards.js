// 本屋大賞以外の文学賞の一覧ページ（2026-09-24〜）。build.js から呼ぶ。
// 1つの賞 = データファイル1つ（例: naoki.js の NAOKI）＋一覧ページ1枚（/naoki/）。
// 受賞作の事実（回・年・作者・作品・出版社）は日本文学振興会の公式一覧から取った。
// 作品ページは content/{賞}-{回}(-{sub}).md がある受賞作だけ作る（/naoki/175/ など、2026-09-27〜）。
// 本屋大賞でも上位に入った作品は作らず、本屋大賞側の作品ページへリンクする。
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
    who: '作家が選考委員を務める',
    file: 'naoki.js',
    varName: 'NAOKI',
    name: '直木賞',
    fullName: '直木三十五賞',
    kana: '作家が選ぶ、エンターテインメント小説の賞',
    lead: '直木賞（直木三十五賞）は、日本文学振興会が年に2回選ぶ文学賞です。新進・中堅の作家によるエンターテインメント作品の単行本が対象です。',
    source: { url: 'https://bungakushinko.or.jp/award/naoki/list.html', name: '日本文学振興会の受賞者一覧', what: '受賞作・回・出版社（掲載誌）' },
    listNote: '2000年以降の作品には短い紹介を付けました。',
    blog: true,
  },
  akutagawa: {
    who: '作家が選考委員を務める',
    file: 'akutagawa.js',
    varName: 'AKUTAGAWA',
    name: '芥川賞',
    fullName: '芥川龍之介賞',
    kana: '新人の純文学に贈られる賞',
    lead: '芥川賞（芥川龍之介賞）は、日本文学振興会が年に2回選ぶ文学賞です。雑誌に発表された、新進作家による純文学の中編・短編が対象です。',
    source: { url: 'https://bungakushinko.or.jp/award/akutagawa/list.html', name: '日本文学振興会の受賞者一覧', what: '受賞作・回・出版社（掲載誌）' },
    listNote: '2000年以降の作品には短い紹介を付けました。',
    blog: true,
  },
  // 2026-09-27〜。年1回。回と年は新潮社の一覧のとおり（第14回は2002年の表記）
  yamamoto: {
    who: '作家が選考委員を務める',
    file: 'yamamoto.js',
    varName: 'YAMAMOTO',
    name: '山本周五郎賞',
    fullName: '山本周五郎賞',
    kana: '「物語」の面白さに贈られる賞',
    lead: '山本周五郎賞は、新潮文芸振興会が主催し、1988年から年に1回選ばれている文学賞です。すぐれた物語性をもつ小説・文芸書が対象で、ミステリーや時代小説、恋愛小説まで幅広い作品が受賞しています。',
    source: { url: 'https://www.shinchosha.co.jp/prizes/yamamotosho/archive.html', name: '新潮社の「山本周五郎賞 過去の受賞作」', what: '受賞作・回・年' },
    listNote: 'すべての作品に短い紹介を付けました。',
    blog: false,
  },
  // ミステリーの賞（2026-09-27〜）。/mystery/ にまとめの入口を置く。group: 'mystery'
  honkaku: {
    who: '本格ミステリ作家クラブの会員が投票で選ぶ',
    file: 'honkaku.js',
    varName: 'HONKAKU',
    name: '本格ミステリ大賞',
    fullName: '本格ミステリ大賞（小説部門）',
    kana: '本格ミステリの書き手たちが、投票で選ぶ賞',
    lead: '本格ミステリ大賞は、本格ミステリ作家クラブが2001年に始めた賞です。会員の投票で、その年のすぐれた本格ミステリを選びます。このページでは小説部門の受賞作を載せています。',
    source: { url: 'http://honkaku.com/taishou.html', name: '本格ミステリ作家クラブの「本格ミステリ大賞」のページ', what: '受賞作・回・年' },
    listNote: 'すべての作品に短い紹介を付けました。',
    group: 'mystery',
    checkedOn: '2026年9月27日',
  },
  suikyo: {
    who: 'ミステリー作家が選ぶ',
    file: 'suikyo.js',
    varName: 'SUIKYO',
    name: '日本推理作家協会賞',
    fullName: '日本推理作家協会賞（長編部門）',
    kana: 'ミステリー作家が選ぶ、その年のすぐれた作品',
    lead: '日本推理作家協会賞は、1948年に「探偵作家クラブ賞」として始まった、ミステリーの賞のなかでも長い歴史をもつ賞です。前年に発表された作品から毎年選ばれます。このページでは、長編（いまの「長編および連作短編集部門」）の受賞作を載せています。',
    source: { url: 'http://www.mystery.or.jp/search/prize?prize=1', name: '日本推理作家協会の「推理作家協会賞一覧」', what: '受賞作・回・年' },
    listNote: '第5回から第28回までは部門を分けずに選ばれていたため、この一覧には入れていません。2000年以降の作品を中心に、短い紹介を付けました。',
    group: 'mystery',
    checkedOn: '2026年9月27日',
  },
  ranpo: {
    who: 'まだ世に出ていない原稿から選ぶ',
    file: 'ranpo.js',
    varName: 'RANPO',
    name: '江戸川乱歩賞',
    fullName: '江戸川乱歩賞',
    kana: 'ミステリー作家への登竜門',
    lead: '江戸川乱歩賞は、江戸川乱歩の寄付をもとに1955年に始まり、日本推理作家協会が選んでいる賞です。第3回からは、まだ発表されていない長編ミステリーを募集する新人賞になり、多くの作家がこの賞からデビューしました。第1回は中島河太郎の『探偵小説辞典』、第2回は早川書房の「ハヤカワ・ポケット・ミステリ」の刊行に贈られたため、この一覧は第3回から載せています。',
    source: { url: 'http://www.mystery.or.jp/search/prize?prize=2', name: '日本推理作家協会の「江戸川乱歩賞一覧」', what: '受賞作・回・年' },
    listNote: '2000年以降の作品を中心に、短い紹介を付けました。',
    group: 'mystery',
    checkedOn: '2026年9月27日',
  },
};

// マンガ大賞（2026-09-28〜）。回ではなく「マンガ大賞2026」のように年で呼ぶ（yearNamed）。kai は通し番号
AWARDS.manga = {
  who: '書店員など、マンガ好きの有志が選ぶ',
  file: 'manga.js',
  varName: 'MANGA',
  name: 'マンガ大賞',
  fullName: 'マンガ大賞',
  kana: '「いちばん人に薦めたい」マンガを選ぶ賞',
  lead: 'マンガ大賞は、書店員をはじめとするマンガ好きの有志が選考員になり、2008年から毎年選ばれている賞です。前の年に出た単行本のうち、最大8巻までの作品が対象で、「いま、いちばん人に薦めたいマンガ」を選びます。',
  source: { url: 'https://www.mangataisho.com/archives/', name: 'マンガ大賞公式サイトの「過去のマンガ大賞・ノミネート作品」', what: '受賞作・年' },
  listNote: 'Kindle版・紙の本のボタンは、どれも第1巻につながります。',
  yearNamed: true,
  checkedOn: '2026年9月28日',
  // 大賞以外の二次選考作品（2008〜2026年、200作）。作品ページは作らず、大賞作のページ（/manga/{年}/）に順位つきで並べる
  nominees: { file: 'manga-nominees.js', varName: 'MANGA_NOMINEES', source2026: { url: 'https://natalie.mu/comic/news/665435', name: 'コミックナタリーの結果発表記事（2026年3月26日）' } },
};

// --- ノミネート作（マンガ大賞、2026-09-28〜） ---
// 同じ作品を年をまたいで数えるための名前。表記ゆれは ALIAS で寄せる
const NOM_ALIAS = { 'とめはねっ!鈴里高校書道部': 'とめはねっ!' };
function nomKey(t) { const k = String(t).normalize('NFKC').replace(/[s　~～]/g, ''); return NOM_ALIAS[k] || k; }
function loadNominees(key, ROOT) {
  const A = AWARDS[key];
  return A.nominees ? loadArray(path.join(ROOT, A.nominees.file), A.nominees.varName) : [];
}
// 大賞作とノミネート作をまとめて、作品ごとに「何年に何位」を集める
function nomHistory(key, ROOT) {
  const list = loadArray(path.join(ROOT, AWARDS[key].file), AWARDS[key].varName).filter(w => w.title);
  const map = {};
  list.forEach(w => (map[nomKey(w.title)] = map[nomKey(w.title)] || []).push({ year: +w.kai, rank: 1, w }));
  loadNominees(key, ROOT).forEach(n => (map[nomKey(n.title)] = map[nomKey(n.title)] || []).push({ year: n.year, rank: n.rank, n }));
  Object.values(map).forEach(v => v.sort((a, b) => a.year - b.year));
  return map;
}
// 1年分のノミネート作の表。大賞作ページと一覧ページで使う
function nomineeTableHTML(key, year, ctx) {
  const A = AWARDS[key];
  const { esc, R } = ctx;
  const noms = loadNominees(key, ctx.ROOT).filter(n => n.year === year).sort((a, b) => a.rank - b.rank);
  if (!noms.length) return '';
  const hist = nomHistory(key, ctx.ROOT);
  const rows = noms.map(n => {
    const h = hist[nomKey(n.title)].filter(x => x.year !== year);
    const win = h.find(x => x.rank === 1);
    const other = h.filter(x => x.rank !== 1).map(x => x.year + '年' + x.rank + '位');
    const notes = [];
    if (win) notes.push('<a href="' + (hasWorkPage(key, win.w, ctx.ROOT) ? workPageUrl(key, win.w) : '/' + key + '/#k' + workSlug(win.w)) + '">' + win.year + '年に大賞</a>');
    if (other.length) notes.push('ほかに' + other.join('・') + 'でノミネート');
    const b = { title: n.title, author: n.author };
    return '<tr><td class="nom-rank">' + n.rank + '位</td><td><span class="nom-title">' + esc(n.title) + '</span><br><span class="nom-author">' + esc(n.author) + '</span>' + (notes.length ? '<br><span class="nom-note">' + notes.join('／') + '</span>' : '') + '</td>'
      + '<td class="nom-links"><a href="' + R.getAmazonKindleLink(b) + '" target="_blank" rel="noopener">Kindle</a><a href="' + R.getRakutenLink(n.title, n.author, null) + '" target="_blank" rel="noopener">楽天</a></td></tr>';
  }).join('');
  const src = year === 2026 && A.nominees.source2026 ? A.nominees.source2026 : A.source;
  return '<section class="book-section" id="nominees"><h2>' + A.name + year + ' ノミネート作（大賞のほか' + noms.length + '作）</h2>'
    + '<p>大賞とともに二次選考に残った作品です。順位は<a href="' + src.url + '" target="_blank" rel="noopener">' + src.name + '</a>によります（同じ順位は同率）。リンクはKindle版・楽天ブックスの検索結果につながります。</p>'
    + '<div class="table-wrap"><table class="nom-table"><thead><tr><th>順位</th><th>作品・作者</th><th>探す</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
}

// 賞のまとめの入口（/mystery/）。group が同じ賞を並べる
const GROUPS = {
  mystery: {
    slug: 'mystery',
    name: 'ミステリーの賞',
    h1: 'ミステリーの賞 歴代受賞作ガイド',
    title: 'ミステリーの賞 歴代受賞作一覧｜本格ミステリ大賞・日本推理作家協会賞・江戸川乱歩賞｜文学賞ガイド',
    description: '本格ミステリ大賞・日本推理作家協会賞（長編）・江戸川乱歩賞の歴代受賞作をまとめました。2つ以上の賞に選ばれたミステリー、Kindle版の有無、あらすじと読者の感想も。',
    lead: 'ミステリーの賞は、選ぶ人と選び方がそれぞれ違います。本格ミステリ作家クラブの会員が投票で選ぶ本格ミステリ大賞、ミステリー作家がその年の作品から選ぶ日本推理作家協会賞、まだ世に出ていない原稿から新人を選ぶ江戸川乱歩賞。3つの賞の受賞作を、ここから探せます。',
  },
};

// 「第175回」または「マンガ大賞2026」の年の部分
function roundLabel(A, w) { return A.yearNamed ? String(w.half).slice(0, 4) + '年' : '第' + w.kai + '回'; }
function awardLabel(A, w) { return A.yearNamed ? A.name + String(w.half).slice(0, 4) : A.name + ' 第' + w.kai + '回'; }
function halfLabel(h) {
  // 公式一覧の「2026上」→「2026年上半期」
  const m = String(h).match(/^(\d{4})(上|下)$/);
  if (/^\d{4}$/.test(String(h))) return h + '年';
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

  const rowHTML = w => awardCardHTML(w, key, ctx);

  // 年代ごと（新しい順）。受賞作なしの回は、年代の末尾にまとめて書く
  const decades = [...new Set(list.map(w => decadeOf(w.half)))].sort((a, b) => b - a);
  const sections = decades.map(d => {
    const ws = winners.filter(w => decadeOf(w.half) === d).sort((a, b) => b.kai - a.kai);
    const nones = list.filter(w => !w.title && decadeOf(w.half) === d).sort((a, b) => b.kai - a.kai);
    const noneHTML = nones.length ? `<p class="aw-none">受賞作なし：${nones.map(w => `第${w.kai}回（${halfLabel(w.half)}）`).join('、')}</p>` : '';
    return `<section class="aw-decade" id="d${d}">
  <h2>${d}年代 <span>${ws.length}作</span></h2>
  <div class="book-grid">${ws.map(rowHTML).join('\n')}</div>
  ${noneHTML}
</section>`;
  }).join('\n');

  const jump = decades.map(d => `<a class="chip" href="#d${d}">${d}年代</a>`).join('');

  const both = winners.filter(w => honya(w)).sort((a, b) => b.kai - a.kai);
  const bothHTML = both.length ? `<section class="aw-both" id="both">
  <h2>本屋大賞でも上位に入った${A.name}受賞作</h2>
  <p>書店員が選ぶ本屋大賞と、${A.who || ""}${A.name}。選ぶ人も基準も違う2つの賞で、どちらにも名前が挙がった作品です。</p>
  <ul>${both.map(w => { const b = honya(w); return `<li><a href="#k${w.kai}${w.sub ? '-' + w.sub : ''}">『${esc(w.title)}』${esc(w.author)}</a>：${awardLabel(A, w)}／<a href="${honyaHref(b)}">${honyaLabel(b)}</a></li>`; }).join('')}</ul>
</section>` : '';

  const dbl = winners.filter(w => w.also).sort((a, b) => b.kai - a.kai);
  const dblHTML = dbl.length ? `<section class="aw-both" id="double">
  <h2>${dbl.map(w => AWARDS[w.also[0].key].name).filter((x, i, a) => a.indexOf(x) === i).join('・')}とダブル受賞した${A.name}受賞作</h2>
  <ul>${dbl.map(w => w.also.map(x => `<li><a href="#k${workSlug(w)}">『${esc(w.title)}』${esc(w.author)}</a>：${awardLabel(A, w)}／<a href="${otherHref(x, ctx.ROOT)}">${AWARDS[x.key].name} 第${x.kai}回</a></li>`).join('')).join('')}</ul>
</section>` : '';

  const kindleCount = winners.filter(w => w.kindleAsin).length;
  const noms = A.nominees ? loadNominees(key, ctx.ROOT) : [];
  let nomHTML = '';
  if (noms.length) {
    const hist = nomHistory(key, ctx.ROOT);
    const page = w => hasWorkPage(key, w, ctx.ROOT) ? workPageUrl(key, w) : '/' + key + '/#k' + workSlug(w);
    const years = [...new Set(noms.map(n => n.year))].sort((a, b) => b - a);
    const yearLinks = years.map(y => { const w = winners.find(x => +x.kai === y); return '<li><a href="' + (w && hasWorkPage(key, w, ctx.ROOT) ? workPageUrl(key, w) + '#nominees' : '#k' + y) + '">' + A.name + y + '</a>：' + noms.filter(n => n.year === y).length + '作（大賞は『' + esc(w ? w.title : '') + '』）</li>'; }).join('');
    const entries = Object.values(hist);
    const later = entries.filter(v => v.some(x => x.rank === 1) && v.some(x => x.rank !== 1 && x.year < v.find(y => y.rank === 1).year))
      .map(v => { const win = v.find(x => x.rank === 1); return { win, before: v.filter(x => x.rank !== 1 && x.year < win.year) }; })
      .sort((a, b) => b.win.year - a.win.year);
    const laterHTML = later.map(({ win, before }) => '<li><a href="' + page(win.w) + '">『' + esc(win.w.title) + '』' + esc(win.w.author) + '</a>：' + before.map(x => x.year + '年' + x.rank + '位').join('、') + ' → ' + win.year + '年に大賞</li>').join('');
    const many = entries.filter(v => !v.some(x => x.rank === 1) && v.length >= 3)
      .map(v => ({ n: v[v.length - 1].n, v }))
      .sort((a, b) => b.v.length - a.v.length || b.v[b.v.length - 1].year - a.v[a.v.length - 1].year);
    const manyHTML = many.map(({ n, v }) => '<li>『' + esc(n.title) + '』' + esc(n.author) + '：' + v.map(x => x.year + '年' + x.rank + '位').join('、') + '（' + v.length + '回）</li>').join('');
    nomHTML = '<section class="aw-both" id="nominees">'
      + '<h2>年ごとのノミネート作</h2>'
      + '<p>' + A.name + 'では、一次選考で票を集めた10作ほどが二次選考にノミネートされ、そのなかから大賞が選ばれます。' + years[years.length - 1] + '〜' + years[0] + '年のノミネート作は全' + noms.length + '作。年ごとの順位は、各年の大賞作のページに載せています。</p>'
      + '<ul>' + yearLinks + '</ul></section>'
      + (laterHTML ? '<section class="aw-both" id="nominated-then-won"><h2>ノミネートのあと、大賞を取った作品</h2><p>一度は大賞を逃し、翌年以降にあらためて選ばれた作品です。</p><ul>' + laterHTML + '</ul></section>' : '')
      + (manyHTML ? '<section class="aw-both" id="nominated-often"><h2>3回以上ノミネートされた作品</h2><p>大賞には届かなかったものの、何年にもわたって選考員に推された作品です。</p><ul>' + manyHTML + '</ul></section>' : '');
  }
  const title = `${A.name} ${noms.length ? '歴代大賞作・ノミネート作' : '歴代受賞作'}一覧（${A.yearNamed ? first.half + '〜' + latest.half + '年' : '第' + first.kai + '回〜第' + latest.kai + '回'}）｜Kindleで読める作品も｜文学賞ガイド`;
  const head = headHTML({
    title,
    description: `${A.name}${A.fullName !== A.name ? `（${A.fullName}）` : ""}の${A.yearNamed ? first.half + '年から' + latest.half + '年' : '第' + first.kai + '回（' + first.half.slice(0, 4) + '年）から第' + latest.kai + '回（' + halfLabel(latest.half) + '）'}までの全受賞作${winners.length}作${noms.length ? `と、ノミネート作${noms.length}作の順位` : ''}。Kindle版の有無、本屋大賞でも上位に入った作品${dbl.length ? 'や直木賞とのダブル受賞作' : ''}がひと目で分かります。`,
    canonical: `${SITE}/${key}/`,
    ogTitle: `${A.name} 歴代受賞作一覧（全${winners.length}作）`,
  });
  const crumbs = [{ label: 'ホーム', url: '/' }].concat(A.group ? [{ label: GROUPS[A.group].name, url: '/' + A.group + '/' }] : [], [{ label: `${A.name} 歴代受賞作`, url: `/${key}/` }]);

  const body = `<div class="page-h1">
  <h1>${A.name} 歴代受賞作一覧</h1>
  <p class="page-lead">${A.yearNamed ? first.half + '年〜' + latest.half + '年' : '第' + first.kai + '回（' + first.half.slice(0, 4) + '年）〜第' + latest.kai + '回（' + halfLabel(latest.half) + '）'}の全${winners.length}作。Kindle版は${kindleCount}作${both.length ? `。<a href="#both">本屋大賞とも重なる${both.length}作 ↓</a>` : ''}${noms.length ? `。<a href="#nominees">ノミネート作${noms.length}作 ↓</a>` : ''}</p>
</div>
<nav class="year-nav aw-jump" aria-label="年代別"><span class="year-nav-label">年代</span><div class="year-nav-scroll">${jump}</div></nav>
<main class="main aw-main">
${sections}
${bothHTML}
${dblHTML}
${nomHTML}
<section class="aw-about">
  <h2>${A.name}とは</h2>
  <p>${A.lead}このページでは、受賞作を新しい順に年代ごとに並べています${none ? `（受賞作なしの回が${none}回あります）` : ''}。${A.listNote}</p>
</section>
${A.blog ? '<div class="blog-crosslink">📖 ブログ「あの空の下」に、本屋大賞と直木賞・芥川賞の両方に選ばれた12作を紹介した記事があります → <a href="https://soranoshita.com/2026/09/25/honya-taisho-naoki-akutagawa/">読む</a></div>' : ''}
<p class="aw-source">${A.source.what}は、<a href="${A.source.url}" target="_blank" rel="noopener">${A.source.name}</a>で確かめました（${A.checkedOn || ctx.checkedOn}）。Kindle版の有無は同じ日にAmazonで確認したもので、変わることがあります。</p>
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

// 賞の受賞作1件のカード。一覧ページとジャンルページで共用する
function awardCardHTML(w, key, ctx) {
const A = AWARDS[key];
const { esc, R, BOOKS, hasBookPage, bookPageUrl } = ctx;
const honya = x => x.honya ? BOOKS.find(b => b.year === x.honya.year && b.rank === x.honya.rank) : null;
const honyaLabel = b => b.rank === 1 ? `${b.year}年本屋大賞 大賞` : `${b.year}年本屋大賞 ${b.rank}位`;
const honyaHref = b => hasBookPage(b) ? bookPageUrl(b) : `/year/${b.year}/#r${b.rank}`;
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
  // 本屋大賞のカード（render.js の cardHTML）と同じ作り。書影が無いときは同じ書名・著者のプレースホルダーを出す
  const img = w.coverImg ? `<img src="${esc(w.coverImg)}" alt="『${esc(w.title)}』の表紙" loading="lazy">` : '';
  const h = w.half.match(/^(\d{4})(上|下)$/);
  return `<article data-award="${key}${A.group ? ' ' + A.group : ''}" data-kindle="${w.kindleAsin ? 1 : 0}" data-sort="${parseInt(w.half, 10) + (/下/.test(w.half) ? 0.5 : 0)}" class="card aw-card${hb ? ' aw-both-card' : ''}" id="k${w.kai}${w.sub ? '-' + w.sub : ''}">
<div class="cover-wrap">
  <div class="rank-badge rn">${A.yearNamed ? (ctx.showAward ? A.name : '大賞') : (ctx.showAward ? A.name + ' ' : '') + '第' + w.kai + '回'}</div>
  <div class="year-badge">${h ? h[1] + '年' + h[2] : esc(halfLabel(w.half))}</div>
  <div class="placeholder"><span class="placeholder-title">${esc(w.title)}</span><span class="placeholder-author">${esc(w.author)}</span></div>
  ${img}
</div>
<div class="card-body">
  ${hb || w.also || alsoOf(key, w, ctx.ROOT).length ? `<div class="tag-container">${hb ? `<a class="genre-badge aw-honya-badge" href="${honyaHref(hb)}">${honyaLabel(hb)}</a>` : ''}${(w.also || []).map(x => `<a class="genre-badge aw-honya-badge" href="${otherHref(x, ctx.ROOT)}">${AWARDS[x.key].name} 第${x.kai}回</a>`).join('')}${alsoOf(key, w, ctx.ROOT).map(x => `<a class="genre-badge aw-honya-badge" href="${x.href}">${x.label}</a>`).join('')}</div>` : ''}
  <div class="book-title">${ctx.ROOT && hasWorkPage(key, w, ctx.ROOT) ? `<a href="${workPageUrl(key, w)}">${esc(w.title)}</a>` : esc(w.title)}</div>
  <div class="book-author">${esc(w.author)} 著${w.pub ? `（${esc(w.pub)}）` : ''}</div>
  ${w.note ? `<p class="synopsis">${esc(w.note)}</p>` : ''}
</div>
<div class="card-foot">${ctx.ROOT && hasWorkPage(key, w, ctx.ROOT) ? `<a class="aw-more" href="${workPageUrl(key, w)}">あらすじ・感想を見る →</a>` : ''}<div class="aw-btns">${btns}</div></div>
</article>`;
}

// --- 受賞作の作品ページ（2026-09-27〜） ---
function workSlug(w) { return String(w.kai) + (w.sub ? '-' + w.sub : ''); }
function workContentPath(key, w, ROOT) { return path.join(ROOT, 'content', key + '-' + workSlug(w) + '.md'); }
function workPageUrl(key, w) { return '/' + key + '/' + workSlug(w) + '/'; }
function hasWorkPage(key, w, ROOT) { return !!w.title && !w.honya && !w.also && fs.existsSync(workContentPath(key, w, ROOT)); }
// also の相手（例: 直木賞 第169回）へのリンク。作品ページがあればそちら
function otherHref(x, ROOT) {
  const ow = loadArray(path.join(ROOT, AWARDS[x.key].file), AWARDS[x.key].varName).find(o => o.kai === x.kai && (o.sub || 0) === (x.sub || 0));
  return ow && ROOT && hasWorkPage(x.key, ow, ROOT) ? workPageUrl(x.key, ow) : '/' + x.key + '/#k' + x.kai + (x.sub ? '-' + x.sub : '');
}
// 逆向き：ほかの賞の also がこの作品を指しているもの（直木賞のカードに「山本周五郎賞 第36回」を出す）
function alsoOf(key, w, ROOT) {
  if (!ROOT) return [];
  const out = [];
  Object.entries(AWARDS).forEach(([k, A]) => {
    if (k === key) return;
    loadArray(path.join(ROOT, A.file), A.varName).filter(o => (o.also || []).some(x => x.key === key && x.kai === w.kai && (x.sub || 0) === (w.sub || 0)))
      .forEach(o => out.push({ label: awardLabel(A, o), href: '/' + k + '/#k' + workSlug(o) }));
  });
  return out;
}

function buildWorkPage(key, w, list, ctx) {
  const A = AWARDS[key];
  const { esc, headHTML, pageShell, breadcrumbHTML, breadcrumbJsonLd, R, SITE, parseContent, blockMd } = ctx;
  const md = fs.readFileSync(workContentPath(key, w, ctx.ROOT), 'utf8').replace(/\r\n/g, '\n');
  const { meta, sections } = parseContent(md);
  const sec = name => sections.find(s => s.title === name);
  const url = workPageUrl(key, w);
  const round = A.yearNamed ? String(w.half) : '第' + w.kai + '回（' + halfLabel(w.half) + '）';
  const head = headHTML({
    title: w.title + '（' + w.author + '）あらすじ・感想｜' + (A.yearNamed ? awardLabel(A, w) + (A.nominees ? ' 大賞・ノミネート作' : ' 大賞') : A.name + ' ' + round) + '｜文学賞ガイド',
    description: (A.yearNamed ? awardLabel(A, w) + ' 大賞' : A.name + round + '受賞作') + '『' + w.title + '』（' + w.author + '）。あらすじ、読者の受け止め方、分かれる点' + (A.nominees && loadNominees(key, ctx.ROOT).some(n => n.year === +w.kai) ? '。同じ年のノミネート作の順位も' : '') + '。Kindle・楽天ブックスへのリンク付き。',
    canonical: SITE + url,
    ogTitle: w.title + '｜' + awardLabel(A, w),
  });
  const crumbs = [{ label: 'ホーム', url: '/' }].concat(A.group ? [{ label: GROUPS[A.group].name, url: '/' + A.group + '/' }] : [], [{ label: A.name + ' 歴代受賞作', url: '/' + key + '/' }, { label: w.title, url }]);
  const buy = { title: w.title, author: w.author, kindleAsin: w.kindleAsin, amazonAsin: w.amazonAsin, audibleAsin: meta.audibleAsin, audible: !!meta.audibleAsin };
  const btns = '<div class="buy-buttons">'
    + (w.kindleAsin ? '<a class="btn-link btn-kindle" href="' + R.getAmazonKindleLink(buy) + '" target="_blank" rel="noopener">📱 Kindle版</a>' : '')
    + '<a class="btn-link btn-rakuten" href="' + R.getRakutenLink(w.title, w.author, null) + '" target="_blank" rel="noopener">🔴 楽天ブックス</a>'
    + (meta.audibleAsin ? '<a class="btn-link btn-audible" href="' + R.getAmazonAudibleLink(buy) + '" target="_blank" rel="noopener">🎧 Audible版</a>' : '')
    + '<a class="btn-link btn-paper" href="' + R.getAmazonPaperLink(buy) + '" target="_blank" rel="noopener">📖 ' + (w.amazonAsin ? '紙の本' : 'Amazonで探す') + '</a>'
    + '</div>';
  const cover = w.coverImg
    ? '<img src="' + esc(w.coverImg) + '" alt="' + esc(w.title) + '">'
    : '<div class="book-cover-ph"><span>' + esc(w.title) + '</span></div>';
  const parts = [];
  parts.push('<div class="book-hero"><div class="book-cover">' + cover + '</div><div class="book-info">'
    + '<div class="book-award"><a href="/' + key + '/#k' + workSlug(w) + '">' + (A.yearNamed ? esc(awardLabel(A, w)) + ' 大賞' : A.name + ' ' + esc(round)) + '</a>' + alsoOf(key, w, ctx.ROOT).map(x => '　／　<a href="' + x.href + '">' + esc(x.label) + '</a>受賞').join('') + '</div>'
    + '<h1>' + esc(w.title) + '</h1>'
    + '<div class="book-meta">' + esc(w.author) + ' 著' + (w.pub ? '　／　' + esc(w.pub) : '') + '</div>'
    + (w.note ? '<p class="book-synopsis">' + esc(w.note) + '</p>' : '')
    + btns + '</div></div>');
  [['読者の受け止め方'], ['分かれる点'], ['著者が語っていること'], ['運営者の視点', 'book-owner']].forEach(([name, cls]) => {
    const x = sec(name);
    if (x && x.text) parts.push('<section class="book-section' + (cls ? ' ' + cls : '') + '"><h2>' + name + '</h2>' + blockMd(x.text) + '</section>');
  });
  if (A.nominees) parts.push(nomineeTableHTML(key, +w.kai, ctx));
  const same = list.filter(x => x.kai === w.kai && x.title && x !== w);
  const near = list.filter(x => x.title && x.kai !== w.kai && Math.abs(x.kai - w.kai) <= 2).sort((a, b) => b.kai - a.kai);
  const link = x => hasWorkPage(key, x, ctx.ROOT) ? workPageUrl(key, x) : '/' + key + '/#k' + workSlug(x);
  const li = x => '<li><a href="' + link(x) + '">' + esc(x.title) + '</a> — ' + esc(x.author) + '（' + (A.yearNamed ? x.half + '年' : '第' + x.kai + '回') + '）</li>';
  if (same.length) parts.push('<section class="book-section"><h2>同じ回の' + A.name + '受賞作</h2><ul class="book-list">' + same.map(li).join('') + '</ul></section>');
  parts.push('<section class="book-section"><h2>' + (A.yearNamed ? '前後の年の' : '前後の回の') + A.name + '受賞作</h2><ul class="book-list">' + near.map(li).join('') + '</ul>'
    + '<p class="book-more"><a href="/' + key + '/">' + A.name + 'の歴代受賞作をすべて見る →</a></p></section>');
  const audible = sec('Audibleで聴く');
  if (audible && audible.text) parts.push('<section class="book-section book-audible" id="audible"><h2>『' + esc(w.title) + '』をAudibleで聴く</h2>' + blockMd(audible.text)
    + (meta.audibleAsin ? '<p class="book-more"><a href="' + R.getAmazonAudibleLink(buy) + '" target="_blank" rel="noopener">Audible版『' + esc(w.title) + '』をAmazonで見る →</a></p>' : '') + '</section>');
  const mentioned = sec('こんなところでも紹介されています');
  if (mentioned && mentioned.text) parts.push('<section class="book-section book-mentioned"><h2>こんなところでも紹介されています</h2>' + blockMd(mentioned.text) + '</section>');
  parts.push('<p class="aw-source">' + A.source.what + 'は<a href="' + A.source.url + '" target="_blank" rel="noopener">' + A.source.name + '</a>によります。感想のまとめは' + esc(meta.researched || '') + 'に確認したものです。</p>');
  const body = '<div class="book-page">\n' + parts.join('\n') + '\n</div>';
  const bookJsonLd = { '@context': 'https://schema.org', '@type': 'Book', name: w.title, author: { '@type': 'Person', name: w.author }, url: SITE + url };
  if (w.isbn) bookJsonLd.isbn = w.isbn;
  if (w.coverImg) bookJsonLd.image = w.coverImg;
  const header = '<header>\n  <div class="hdr-inner">\n    <div class="hdr-kana">' + A.kana + '</div>\n    <div class="site-title"><a href="/' + key + '/">' + A.name + ' <span>歴代受賞作ガイド</span></a></div>\n  </div>\n</header>';
  return pageShell({ header, head, breadcrumb: breadcrumbHTML(crumbs), jsonLd: breadcrumbJsonLd(crumbs), extraJsonLd: bookJsonLd, body });
}

function buildWorkPages(key, ctx) {
  const A = AWARDS[key];
  const list = loadArray(path.join(ctx.ROOT, A.file), A.varName);
  const urls = [];
  list.filter(w => hasWorkPage(key, w, ctx.ROOT)).forEach(w => {
    const dir = path.join(ctx.ROOT, key, workSlug(w));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildWorkPage(key, w, list, ctx));
    urls.push(ctx.SITE + workPageUrl(key, w));
  });
  console.log(key + '/: 作品ページ ' + urls.length + '件');
  return urls;
}


// 本屋大賞の作品に「ほかに取った賞」を付けるための対応表。キーは「年-順位」
function crossRefs(ROOT) {
  const map = {};
  Object.entries(AWARDS).forEach(([key, A]) => {
    loadArray(path.join(ROOT, A.file), A.varName).filter(w => w.honya).forEach(w => {
      const k = w.honya.year + '-' + w.honya.rank;
      (map[k] = map[k] || []).push({ label: awardLabel(A, w), href: `/${key}/#k${w.kai}${w.sub ? '-' + w.sub : ''}` });
    });
  });
  return map;
}

function buildGroupPage(gkey, ctx) {
  const G = GROUPS[gkey];
  const { esc, headHTML, pageShell, breadcrumbHTML, breadcrumbJsonLd, SITE, BOOKS, hasBookPage, bookPageUrl } = ctx;
  const keys = Object.keys(AWARDS).filter(k => AWARDS[k].group === gkey);
  const lists = Object.fromEntries(keys.map(k => [k, loadArray(path.join(ctx.ROOT, AWARDS[k].file), AWARDS[k].varName)]));
  const cv = u => (u || '').replace(/zoom=\d/, 'zoom=1');
  const href = (k, w) => hasWorkPage(k, w, ctx.ROOT) ? workPageUrl(k, w) : '/' + k + '/#k' + workSlug(w);
  const panels = keys.map(k => {
    const A = AWARDS[k], L = lists[k].filter(w => w.title);
    const top = Math.max(...L.map(w => w.kai));
    const lw = L.filter(w => w.kai === top)[0];
    const first = L.reduce((a, b) => (b.kai < a.kai ? b : a));
    return `<section class="hub-panel"><h2><a href="/${k}/">${A.name}</a></h2><p class="hub-who">${esc(A.kana)}</p><a class="hub-latest" href="${href(k, lw)}">${lw.coverImg ? `<img src="${esc(cv(lw.coverImg))}" alt="『${esc(lw.title)}』の表紙">` : `<span class="hub-ph"><span>${esc(lw.title)}</span></span>`}<span class="hub-latest-txt"><span class="hub-latest-label">第${lw.kai}回（${lw.half}年）</span><span class="hub-latest-title">${esc(lw.title)}</span><span class="hub-latest-author">${esc(lw.author)}</span></span></a><p class="hub-count">第${first.kai}回〜第${top}回　受賞${L.length}作</p><p class="hub-main"><a href="/${k}/">${A.name}の一覧を見る →</a></p></section>`;
  }).join('');
  // 2つ以上の賞に選ばれた作品：このグループの賞どうし、またはほかの賞（本屋大賞・直木賞など）と重なるもの
  const multi = [];
  keys.forEach(k => lists[k].filter(w => w.title && (w.also || w.honya)).forEach(w => {
    const labels = [AWARDS[k].name + ' 第' + w.kai + '回'];
    (w.also || []).forEach(x => labels.push(AWARDS[x.key].name + ' 第' + x.kai + '回'));
    let link = href(k, w);
    if (w.also) link = otherHref(w.also[0], ctx.ROOT);
    if (w.honya) { const b = BOOKS.find(b => b.year === w.honya.year && b.rank === w.honya.rank); if (b) { labels.push(b.year + '年本屋大賞 ' + (b.rank === 1 ? '大賞' : b.rank + '位')); link = hasBookPage(b) ? bookPageUrl(b) : '/year/' + b.year + '/#r' + b.rank; } }
    multi.push({ w, labels, link, y: parseInt(w.half, 10) });
  }));
  const seen = new Set();
  const multiList = multi.sort((a, b) => b.y - a.y).filter(m => { const t = m.w.title.normalize('NFKC'); if (seen.has(t)) return false; seen.add(t); return true; });
  const multiHTML = multiList.length ? `<section class="aw-both" id="multi">
  <h2>2つ以上の賞に選ばれたミステリー</h2>
  <p>選ぶ人も基準も違う賞で、どちらにも選ばれた作品です。迷ったときの一冊目に。</p>
  <ul>${multiList.map(m => `<li><a href="${m.link}">『${esc(m.w.title)}』${esc(m.w.author)}</a>：${m.labels.map(esc).join('／')}</li>`).join('')}</ul>
</section>` : '';
  const head = headHTML({ title: G.title, description: G.description, canonical: SITE + '/' + G.slug + '/', ogTitle: G.h1 });
  const crumbs = [{ label: 'ホーム', url: '/' }, { label: G.name, url: '/' + G.slug + '/' }];
  const body = `<div class="page-h1">
  <h1>${G.h1}</h1>
  <p class="page-lead">${G.lead}</p>
</div>
<main class="main aw-main">
<div class="hub-grid hub-grid-3">${panels}</div>
${multiHTML}
<section class="aw-about">
  <h2>3つの賞の違い</h2>
  ${keys.map(k => `<p><strong><a href="/${k}/">${AWARDS[k].name}</a></strong>　${AWARDS[k].lead}</p>`).join('\n  ')}
</section>
<p class="aw-source">受賞作は、${keys.map(k => `<a href="${AWARDS[k].source.url}" target="_blank" rel="noopener">${AWARDS[k].source.name}</a>`).join('、')}で確かめました（2026年9月27日）。</p>
</main>`;
  const header = `<header>
  <div class="hdr-inner">
    <div class="hdr-kana">本格ミステリ大賞・日本推理作家協会賞・江戸川乱歩賞</div>
    <div class="site-title"><a href="/${G.slug}/">${G.name} <span>歴代受賞作ガイド</span></a></div>
  </div>
</header>`;
  const html = pageShell({ header, head, breadcrumb: breadcrumbHTML(crumbs), jsonLd: breadcrumbJsonLd(crumbs), body });
  fs.mkdirSync(path.join(ctx.ROOT, G.slug), { recursive: true });
  fs.writeFileSync(path.join(ctx.ROOT, G.slug, 'index.html'), html);
  console.log(G.slug + '/: ' + keys.length + '賞、2つ以上の賞 ' + multiList.length + '作');
  return SITE + '/' + G.slug + '/';
}

module.exports = { GROUPS, buildGroupPage,  AWARDS, buildAwardPage, buildWorkPages, crossRefs, awardCardHTML, loadArray };
