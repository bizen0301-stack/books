import re
import json

RAKUTEN_ID = "1baffa53.9767f76d.1baffa54.f4870c64"

with open("本屋大賞 歴代ランキング（1位〜10位）完全版.md", "r", encoding="utf-8") as f:
    content = f.read()

years_data = re.split(r'## 本屋大賞 ', content)
books = []
book_id = 1

# 本編（1位〜10位）のパース
for y_data in years_data[1:]:
    if "## 翻訳小説部門・発掘部門" in y_data:
        y_data = y_data.split("## 翻訳小説部門・発掘部門")[0]
        
    year_match = re.match(r'(\d+)年', y_data)
    if not year_match: continue
    year = year_match.group(1)
    
    rows = re.findall(r'\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|', y_data)
    for row in rows:
        rank = int(row[0])
        title = row[1].strip()
        author = row[2].strip()
        links_str = row[3].strip()
        
        # Amazonアフィリエイトリンクの抽出
        amazon_url = ""
        detail_match = re.search(r'\[商品詳細\]\((https://[^)]+)\)', links_str)
        search_match = re.search(r'\[検索結果\]\((https://[^)]+)\)', links_str)
        search_only_match = re.search(r'\[Amazon検索\]\((https://[^)]+)\)', links_str)
        
        if detail_match: amazon_url = detail_match.group(1)
        elif search_match: amazon_url = search_match.group(1)
        elif search_only_match: amazon_url = search_only_match.group(1)
            
        # 楽天Koboの自動検索アフィリエイトリンクの生成
        search_query = f"{title} {author} 電子書籍"
        if RAKUTEN_ID != "なし":
            kobo_url = f"https://hb.afl.rakuten.co.jp/ichiba/{RAKUTEN_ID}/?pc=https%3A%2F%2Fsearch.rakuten.co.jp%2Fsearch%2Fmall%2F{re.sub(r'[^a-zA-Z0-9ぁ-んァ-ヶ一-龠]', ' ', search_query)}%2F"
        else:
            kobo_url = f"https://search.rakuten.co.jp/search/mall/{search_query}/"
        
        category = "grand" if rank == 1 else "nominate"
        badge = f"{year}年 本屋大賞" if rank == 1 else f"{year}年 第{rank}位"
        
        books.append({
            "id": book_id, "year": year, "title": title, "author": author, "badge": badge, "category": category,
            "catch": "全国の書店員が選んだ、絶対に失敗しない名作。",
            "story": ["本屋大賞に選ばれた傑作小説。文字が読みやすく、ストーリーに一気に引き込まれます。"],
            "meta": [f"🏆{year}年 第{rank}位", "⏱目安：約4時間"],
            "tags": ["サクサク読める"] if rank == 1 else [],
            "coverImg": f"https://placehold.co/140x200?text={year}_{rank}",
            "kindleUrl": amazon_url, "koboUrl": kobo_url
        })
        book_id += 1

# 部門賞のパース
if "## 翻訳小説部門・発掘部門" in content:
    dept_part = content.split("## 翻訳小説部門・発掘部門")[1]
    sections = dept_part.split("### ")
    for sec in sections:
        dept_type = "translation" if "翻訳小説部門" in sec else "discovery" if "発掘部門" in sec else None
        if not dept_type: continue
        
        rows = re.findall(r'\|\s*(\d{4})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|', sec)
        for row in rows:
            year, title, author, links_str = row[0].strip(), row[1].strip(), row[2].strip(), row[3].strip()
            url_match = re.search(r'\((https://[^)]+)\)', links_str)
            amazon_url = url_match.group(1) if url_match else ""
            
            search_query = f"{title} 電子書籍"
            if RAKUTEN_ID != "なし":
                kobo_url = f"https://hb.afl.rakuten.co.jp/ichiba/{RAKUTEN_ID}/?pc=https%3A%2F%2Fsearch.rakuten.co.jp%2Fsearch%2Fmall%2F{title}%2F"
            else:
                kobo_url = f"https://search.rakuten.co.jp/search/mall/{title}/"
                
            badge_name = "翻訳小説部門 1位" if dept_type == "translation" else "発掘部門 1位"
            books.append({
                "id": book_id, "year": year, "title": title, "author": author, "badge": f"{year}年 {badge_name}",
                "category": "department", "catch": "世界が認めた傑作、または色褪せない隠れた名作。",
                "story": ["本屋大賞の部門賞を受賞した、読書好きから今最も支持されている一冊です。"],
                "meta": ["🌍海外文学" if dept_type == "translation" else "💎不朽の名作"], "tags": [],
                "coverImg": f"https://placehold.co/140x200?text={year}_{dept_type[:3].upper()}",
                "kindleUrl": amazon_url, "koboUrl": kobo_url
            })
            book_id += 1

# data.js として書き出し
with open("data.js", "w", encoding="utf-8") as f:
    f.write("const bookData = " + json.dumps(books, ensure_ascii=False, indent=2) + ";")

print("成功！ data.js が自動生成されました。")