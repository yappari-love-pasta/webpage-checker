// Service Worker (Background Script) - HTTPヘッダー情報の収集

// リクエストヘッダー情報を保存するMap
const headerCache = new Map();

// webRequestリスナー - レスポンスヘッダーを監視
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.type === 'main_frame') {
      const headers = {};

      // レスポンスヘッダーから情報を抽出
      if (details.responseHeaders) {
        details.responseHeaders.forEach(header => {
          headers[header.name.toLowerCase()] = header.value;
        });
      }

      // 情報を整形して保存
      const info = {
        protocol: parseProtocol(details),
        server: headers['server'] || '-',
        cdn: detectCDN(headers),
        headers: headers,
        timestamp: Date.now()
      };

      headerCache.set(details.tabId, info);

      // 古いキャッシュをクリーンアップ（5分以上前のデータ）
      cleanupCache();
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// プロトコル情報の解析
function parseProtocol(details) {
  // Chrome 拡張機能の制限により、直接HTTP/2やHTTP/3を判定するのは困難
  // responseHeadersからヒントを得る方法を使用

  // HTTP/2の場合、特定のヘッダーが小文字になる傾向がある
  const headers = details.responseHeaders || [];
  const hasLowercaseHeaders = headers.some(h => h.name === h.name.toLowerCase() && h.name.includes('-'));

  // Alt-Svc ヘッダーでHTTP/3をチェック
  const altSvc = headers.find(h => h.name.toLowerCase() === 'alt-svc');
  if (altSvc && altSvc.value.includes('h3')) {
    return 'HTTP/3 (QUIC)';
  }

  // HTTP/2の可能性が高い場合
  if (hasLowercaseHeaders || details.url.startsWith('https://')) {
    // HTTPSの場合、HTTP/2の可能性が高い（現代のサーバーではデフォルト）
    return 'HTTP/2 (推定)';
  }

  return 'HTTP/1.1';
}

// CDN/WAFの検出
function detectCDN(headers) {
  const cdnIndicators = [
    { header: 'cf-ray', name: 'Cloudflare' },
    { header: 'x-amz-cf-id', name: 'Amazon CloudFront' },
    { header: 'x-cdn', name: 'CDN' },
    { header: 'x-cache', name: 'Cache Server' },
    { header: 'server', value: 'cloudflare', name: 'Cloudflare' },
    { header: 'server', value: 'akamai', name: 'Akamai' },
    { header: 'x-akamai-transformed', name: 'Akamai' },
    { header: 'x-fastly-request-id', name: 'Fastly' },
    { header: 'x-azure-ref', name: 'Azure CDN' },
    { header: 'x-served-by', name: 'CDN' }
  ];

  const detected = [];

  for (const indicator of cdnIndicators) {
    const headerValue = headers[indicator.header];
    if (headerValue) {
      if (indicator.value) {
        if (headerValue.toLowerCase().includes(indicator.value)) {
          detected.push(indicator.name);
        }
      } else {
        detected.push(indicator.name);
      }
    }
  }

  // 重複を削除
  const unique = [...new Set(detected)];
  return unique.length > 0 ? unique.join(', ') : '-';
}

// キャッシュクリーンアップ
function cleanupCache() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5分

  for (const [tabId, info] of headerCache.entries()) {
    if (now - info.timestamp > maxAge) {
      headerCache.delete(tabId);
    }
  }
}

// ポップアップからのメッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getHeaderInfo') {
    const info = headerCache.get(request.tabId);

    if (info) {
      sendResponse(info);
    } else {
      // キャッシュにない場合は、基本情報のみ返す
      sendResponse({
        protocol: '-',
        server: '-',
        cdn: '-'
      });
    }
  }
  return true;
});

// タブが閉じられたらキャッシュから削除
chrome.tabs.onRemoved.addListener((tabId) => {
  headerCache.delete(tabId);
});

console.log('Tech Stack Analyzer: Background Service Worker initialized');
