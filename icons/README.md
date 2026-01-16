# アイコン画像について

このディレクトリには拡張機能のアイコン画像を配置してください。

## 必要なファイル

以下のサイズのPNG画像を用意してください:

- `icon16.png` (16x16px)
- `icon32.png` (32x32px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

## アイコン作成方法

1. **オンラインツールを使用**
   - [Canva](https://www.canva.com/) - 無料デザインツール
   - [Figma](https://www.figma.com/) - UIデザインツール
   - [Favicon.io](https://favicon.io/) - アイコン生成ツール

2. **デザインのヒント**
   - 🔍 虫眼鏡アイコン
   - 📊 グラフ/チャートアイコン
   - 🔧 技術ツールアイコン
   - シンプルで認識しやすいデザインにする
   - 背景色: #667eea (紫系のグラデーション)

3. **簡易的な代替方法**
   以下のコマンドでImageMagickを使用して簡易アイコンを生成できます:

   ```bash
   # ImageMagickがインストールされている場合
   convert -size 128x128 xc:#667eea -pointsize 80 -fill white -gravity center -annotate +0+0 "🔍" icon128.png
   convert icon128.png -resize 48x48 icon48.png
   convert icon128.png -resize 32x32 icon32.png
   convert icon128.png -resize 16x16 icon16.png
   ```

## 暫定対応

アイコンがない場合、Chromeはデフォルトアイコンを表示しますが、拡張機能は正常に動作します。
