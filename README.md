# Tech Stack Analyzer

ページの技術スタック（SEO、メタ情報、CSS/JSフレームワーク、CMS、サーバー情報）を瞬時に解析して表示するChrome拡張機能です。

## 機能

### 📄 HTMLメタ情報
- ページタイトル
- 文字コード (charset)
- 説明文 (meta description)
- キーワード (meta keywords)
- ビューポート設定

### 🌐 OGP情報
- og:title
- og:description
- og:image
- og:type

### ⚛️ フレームワーク・ライブラリ検出
- **CSS Framework**: Bootstrap, Tailwind CSS
- **JavaScript Library**: jQuery (バージョン表示)
- **JavaScript Framework**:
  - React.js (バージョン表示)
  - Next.js
  - Vue.js (バージョン表示)
  - Nuxt.js
  - Angular (バージョン表示)

### 🔧 CMS・バックエンド検出
- WordPress (バージョン表示)
- Shopify
- Wix
- Movable Type (バージョン表示)

### 🖥️ サーバー・インフラ情報
- HTTPプロトコル (HTTP/1.1, HTTP/2推定, HTTP/3検出)
- Webサーバー情報 (Serverヘッダー)
- CDN/WAF検出 (Cloudflare, CloudFront, Akamai, Fastly, Azure CDN等)

## インストール方法

### 1. ファイルの準備

このリポジトリをクローンまたはダウンロードします。

```bash
git clone <repository-url>
cd webpage-checker
```

### 2. アイコン画像の準備

`icons/` ディレクトリに以下のアイコン画像を配置してください:
- icon16.png (16x16px)
- icon32.png (32x32px)
- icon48.png (48x48px)
- icon128.png (128x128px)

アイコン作成の詳細は [icons/README.md](icons/README.md) を参照してください。

### 3. Chromeに拡張機能を読み込む

1. Chromeブラウザで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このプロジェクトのディレクトリを選択

### 4. 使用方法

1. 解析したいWebページを開く
2. 拡張機能のアイコンをクリック
3. 技術スタック情報が自動的に表示されます
4. 🔄 ボタンで再解析が可能

## ファイル構成

```
webpage-checker/
├── manifest.json          # 拡張機能の設定ファイル (Manifest V3)
├── popup.html            # ポップアップのHTML
├── popup.js              # ポップアップのロジック
├── content.js            # Content Script (DOM解析)
├── background.js         # Service Worker (ヘッダー解析)
├── styles.css            # スタイルシート
├── icons/                # アイコン画像ディレクトリ
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 技術仕様

### Manifest V3
- Chrome拡張機能の最新仕様に準拠
- Service Workerを使用したバックグラウンド処理

### 検出方法

#### フレームワーク検出
- グローバルオブジェクトの存在チェック (window.React, window.Vue等)
- DOM要素の特徴的な属性 ([data-v-], #__next等)
- スクリプトタグのsrc解析

#### CMS検出
- metaタグのgenerator属性
- 特徴的なURL/パス (wp-content, cdn.shopify.com等)
- グローバルオブジェクト (window.Shopify等)

#### サーバー情報検出
- chrome.webRequest APIでレスポンスヘッダーを取得
- Serverヘッダーの解析
- CDN/WAF特有のヘッダー検出 (cf-ray, x-amz-cf-id等)
- Alt-SvcヘッダーでHTTP/3を検出

## 制限事項

### HTTPプロトコルの検出
Chrome拡張機能のAPIでは、HTTPプロトコルバージョンを直接取得できません。以下の方法で推定しています:

- **HTTP/3**: Alt-Svcヘッダーに `h3` が含まれる場合
- **HTTP/2**: HTTPSサイトの場合は推定（現代のサーバーはHTTP/2がデフォルト）
- **HTTP/1.1**: その他

より正確な検出には、Chrome DevTools Protocolを使用する必要がありますが、パフォーマンスとの兼ね合いで現在は実装していません。

### セキュリティ制限
- 一部のサイト (chrome://等) では動作しません
- CORS制限により、外部APIからの情報取得は制限されます

## カスタマイズ

### 検出ロジックの追加

新しいフレームワークやCMSを検出したい場合は、[popup.js](popup.js) の `analyzePageContent()` 関数内に検出ロジックを追加してください。

例:
```javascript
// Svelte検出
if (document.querySelector('[class*="svelte-"]') || htmlContent.includes('svelte')) {
  data.frameworks.push({ name: 'Svelte', version: '-' });
}
```

### UIのカスタマイズ

[styles.css](styles.css) を編集することで、デザインをカスタマイズできます。

## トラブルシューティング

### 拡張機能が動作しない場合

1. **エラーメッセージを確認**
   - `chrome://extensions/` で拡張機能の「エラー」を確認
   - ブラウザのコンソール（F12）でエラーを確認

2. **権限の確認**
   - manifest.jsonのpermissionsが正しく設定されているか確認

3. **再読み込み**
   - `chrome://extensions/` で拡張機能を無効化→有効化
   - ページをリロード

### 情報が表示されない場合

1. ページを再読み込みしてから拡張機能を開く
2. 🔄 ボタンで再解析を実行
3. Content Securityポリシーで制限されている可能性があります

## ライセンス

MIT License

## 開発者

個人開発プロジェクト

## 今後の拡張予定

- [ ] より多くのフレームワーク/ライブラリの検出
- [ ] バージョン検出の精度向上
- [ ] エクスポート機能 (JSON, CSV)
- [ ] 履歴機能
- [ ] より詳細なパフォーマンス情報
- [ ] セキュリティヘッダーの分析
