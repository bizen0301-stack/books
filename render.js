// 本屋大賞ガイド 共通レンダリング関数。
// ブラウザ(<script src="render.js">)とNode(build.js からの require)の両方から使う。
// カード・購入リンク・ジャンルのスラッグ対応は、ここ一箇所だけに持つ
// (index.html・year/*・genre/* が別々に持つと、後から仕様がずれる)。

(function (root) {
  const AMAZON_TAG = 'soranoshita-books-22';
  const RAKUTEN_TAG = '1baffa53.9767f76d.1baffa54.f4870c64';

  // ジャンルの日本語名 → URLスラッグ。後から日本語名を変えてもURLは変わらない。
  const GENRE_SLUGS = {
    'ヒューマン': 'human',
    'ミステリ': 'mystery',
    '青春': 'youth',
    'お仕事': 'work',
    'SF': 'sf',
    '歴史': 'history',
  };
  const GENRE_LABELS = Object.fromEntries(Object.entries(GENRE_SLUGS).map(([k, v]) => [v, k]));

  function getAmazonKindleLink(title, author) {
    return `https://www.amazon.co.jp/s?k=${encodeURIComponent(title + ' ' + author)}&i=digital-text&tag=${AMAZON_TAG}&linkCode=as2`;
  }
  function getAmazonPaperLink(title, author) {
    return `https://www.amazon.co.jp/s?k=${encodeURIComponent(title + ' ' + author)}&tag=${AMAZON_TAG}`;
  }
  function getRakutenLink(title, author) {
    return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_TAG}/?pc=https%3A%2F%2Fsearch.rakuten.co.jp%2Fsearch%2Fmall%2F${encodeURIComponent(title + ' ' + author)}%2F-%2F%3Fsid%3D213310`;
  }
  function getAmazonAudibleLink(title, author) {
    return `https://www.amazon.co.jp/s?k=${encodeURIComponent(title + ' ' + author + ' Audible')}&i=audible&tag=${AMAZON_TAG}`;
  }

  function getMoodsForBook(b) {
    const moods = [];
    const genre = b ? (b.genre || '') : '';
    if (genre === 'ミステリ') moods.push('どんでん返し');
    if (genre === '青春' || genre === '青春・日常') moods.push('サクサク読める');
    if (genre === 'ヒューマン' || genre === 'ドラマ・家族') moods.push('泣ける');
    if (b && (b.rank === 1 || genre === 'SF' || genre === 'ミステリ')) moods.push('一気読み');
    if (moods.length === 0) moods.push('サクサク読める');
    return moods;
  }

  function rankBadgeHTML(r) {
    if (r === 11) return `<div class="rank-badge rn">翻訳賞</div>`;
    if (r === 12) return `<div class="rank-badge rn">発掘賞</div>`;
    if (r === 1) return `<div class="rank-badge r1"><span class="crown">👑</span><span class="txt">大賞</span></div>`;
    return `<div class="rank-badge rn">${r}位</div>`;
  }

  function coverUrlFor(b) {
    let finalCoverUrl = b.coverImg || '';
    if (!finalCoverUrl && b.isbn && b.isbn.startsWith('978') && b.isbn.length >= 10) {
      finalCoverUrl = `https://cover.openbd.jp/${b.isbn}.jpg`;
    }
    return finalCoverUrl;
  }

  // idAttr: 年度ページで `<article id="r1">` のようにアンカーを付けたいときに渡す。
  // トップページのJS描画では使わない(渡さなければ何も付かない)。
  function cardHTML(b, opts) {
    if (!b) return '';
    opts = opts || {};
    const isTop = b.rank === 1;
    const isDept = b.rank >= 11;
    const mediaBadgeHTML = b.media ? `<span class="media-badge">🎬 ${b.media}</span>` : '';
    const moods = getMoodsForBook(b);
    const moodBadgeHTML = `<span class="mood-badge">#${moods[0]}</span>`;
    const audibleButtonHTML = b.audible ? `<a class="btn-link btn-audible" href="${getAmazonAudibleLink(b.title, b.author)}" target="_blank" rel="noopener">🎧 Audible版</a>` : '';

    const finalCoverUrl = coverUrlFor(b);
    const coverHTML = finalCoverUrl ? `<img src="${finalCoverUrl}" alt="${b.title}" loading="lazy">` : '';
    const idAttr = opts.id ? ` id="${opts.id}"` : '';

    return `
<article class="card${isTop ? ' rank-1' : ''}" data-year="${b.year}" data-rank="${b.rank}"${idAttr}>
  <div class="cover-wrap">
    ${rankBadgeHTML(b.rank)}
    <div class="year-badge">${b.year}年</div>
    <div class="placeholder">
      <span class="placeholder-title">${b.title}</span>
      <span class="placeholder-author">${b.author}</span>
    </div>
    ${coverHTML}
  </div>
  <div class="card-body">
    <div class="tag-container">
      <span class="genre-badge">${isDept ? '部門賞' : b.genre}</span>
      ${moodBadgeHTML}
      ${mediaBadgeHTML}
    </div>
    <div class="book-title">${b.title}</div>
    <div class="book-author">${b.author} 著</div>
    ${b.synopsis ? `<p class="synopsis">${b.synopsis}</p>` : ''}
  </div>
  <div class="card-foot">
    <div class="btn-group-main">
      <a class="btn-link btn-kindle" href="${getAmazonKindleLink(b.title, b.author)}" target="_blank" rel="noopener">📱 Kindle版</a>
      <a class="btn-link btn-rakuten" href="${getRakutenLink(b.title, b.author)}" target="_blank" rel="noopener">🔴 楽天ブックス</a>
    </div>
    <div class="btn-group-sub">
      ${audibleButtonHTML}
      <a class="btn-link btn-paper" href="${getAmazonPaperLink(b.title, b.author)}" target="_blank" rel="noopener">📖 紙の本</a>
    </div>
  </div>
</article>`;
  }

  const api = {
    AMAZON_TAG,
    RAKUTEN_TAG,
    GENRE_SLUGS,
    GENRE_LABELS,
    getAmazonKindleLink,
    getAmazonPaperLink,
    getRakutenLink,
    getAmazonAudibleLink,
    getMoodsForBook,
    rankBadgeHTML,
    coverUrlFor,
    cardHTML,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    Object.assign(root, api);
  }
})(typeof window !== 'undefined' ? window : globalThis);
