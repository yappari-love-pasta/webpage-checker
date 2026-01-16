// Content Script - ページのDOM解析
// このスクリプトは各ページに注入され、必要に応じて情報を収集します

// Content Scriptは主にpopup.jsから呼び出されるexecuteScript経由で動作するため、
// ここでは補助的な機能やイベントリスナーを配置できます

console.log('Tech Stack Analyzer: Content Script loaded');

// ページ読み込み時に検出情報をキャッシュ（オプション）
const pageInfo = {
  detectedAt: new Date().toISOString(),
  url: window.location.href
};

// メッセージリスナー（必要に応じて拡張可能）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ready' });
  }
  return true;
});
