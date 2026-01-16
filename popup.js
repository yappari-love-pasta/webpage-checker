// ポップアップUI制御スクリプト

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const contentEl = document.getElementById('content');
  const errorEl = document.getElementById('error');
  const refreshBtn = document.getElementById('refreshBtn');

  // 再解析ボタン
  refreshBtn.addEventListener('click', () => {
    location.reload();
  });

  try {
    // アクティブなタブを取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('アクティブなタブが見つかりません');
    }

    // Content Scriptからデータを取得
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: analyzePageContent
    });

    if (!result || !result.result) {
      throw new Error('コンテンツ解析に失敗しました');
    }

    const pageData = result.result;

    // Background Scriptからヘッダー情報を取得
    const headerData = await chrome.runtime.sendMessage({
      action: 'getHeaderInfo',
      tabId: tab.id,
      url: tab.url
    });

    // UIに反映
    displayResults(pageData, headerData);

    // 表示切替
    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

  } catch (error) {
    console.error('Error:', error);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
  }
});

// ページコンテンツを解析する関数（Content Script内で実行）
function analyzePageContent() {
  const data = {
    meta: {},
    ogp: {},
    frameworks: [],
    cms: []
  };

  // メタ情報の取得
  data.meta.title = document.title || '-';
  data.meta.charset = document.characterSet || '-';

  const metaDescription = document.querySelector('meta[name="description"]');
  data.meta.description = metaDescription ? metaDescription.content : '-';

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  data.meta.keywords = metaKeywords ? metaKeywords.content : '-';

  const metaViewport = document.querySelector('meta[name="viewport"]');
  data.meta.viewport = metaViewport ? metaViewport.content : '-';

  // OGP情報の取得
  const ogTitle = document.querySelector('meta[property="og:title"]');
  data.ogp.title = ogTitle ? ogTitle.content : '-';

  const ogDescription = document.querySelector('meta[property="og:description"]');
  data.ogp.description = ogDescription ? ogDescription.content : '-';

  const ogImage = document.querySelector('meta[property="og:image"]');
  data.ogp.image = ogImage ? ogImage.content : '-';

  const ogType = document.querySelector('meta[property="og:type"]');
  data.ogp.type = ogType ? ogType.content : '-';

  // フレームワーク・ライブラリの検出
  const scripts = Array.from(document.scripts).map(s => s.src || s.textContent);
  const htmlContent = document.documentElement.outerHTML;

  // jQuery
  if (window.jQuery) {
    data.frameworks.push({ name: 'jQuery', version: window.jQuery.fn.jquery });
  }

  // React
  if (window.React || htmlContent.includes('react') || scripts.some(s => s.includes('react'))) {
    const reactVersion = window.React?.version || '-';
    data.frameworks.push({ name: 'React', version: reactVersion });
  }

  // Next.js
  if (window.__NEXT_DATA__ || document.querySelector('#__next')) {
    data.frameworks.push({ name: 'Next.js', version: '-' });
  }

  // Vue.js
  if (window.Vue || document.querySelector('[data-v-]') || scripts.some(s => s.includes('vue'))) {
    const vueVersion = window.Vue?.version || '-';
    data.frameworks.push({ name: 'Vue.js', version: vueVersion });
  }

  // Nuxt.js
  if (window.__NUXT__ || document.querySelector('#__nuxt')) {
    data.frameworks.push({ name: 'Nuxt.js', version: '-' });
  }

  // Bootstrap
  if (htmlContent.includes('bootstrap') || scripts.some(s => s.includes('bootstrap'))) {
    data.frameworks.push({ name: 'Bootstrap', version: '-' });
  }

  // Tailwind CSS
  if (htmlContent.includes('tailwind') || document.querySelector('[class*="tw-"]') ||
      Array.from(document.styleSheets).some(sheet => {
        try {
          return sheet.href && sheet.href.includes('tailwind');
        } catch(e) { return false; }
      })) {
    data.frameworks.push({ name: 'Tailwind CSS', version: '-' });
  }

  // Angular
  if (window.angular || document.querySelector('[ng-app], [ng-controller]')) {
    const angularVersion = window.angular?.version?.full || '-';
    data.frameworks.push({ name: 'Angular', version: angularVersion });
  }

  // CMS検出

  // WordPress
  const wpMeta = document.querySelector('meta[name="generator"][content*="WordPress"]');
  if (wpMeta || htmlContent.includes('wp-content') || htmlContent.includes('wp-includes')) {
    const wpVersion = wpMeta ? wpMeta.content.match(/WordPress\s+([\d.]+)/)?.[1] : '-';
    data.cms.push({ name: 'WordPress', version: wpVersion || '-' });
  }

  // Shopify
  if (window.Shopify || htmlContent.includes('cdn.shopify.com')) {
    data.cms.push({ name: 'Shopify', version: '-' });
  }

  // Wix
  if (htmlContent.includes('wix.com') || window.wixBiSession) {
    data.cms.push({ name: 'Wix', version: '-' });
  }

  // Movable Type
  const mtMeta = document.querySelector('meta[name="generator"][content*="Movable Type"]');
  if (mtMeta) {
    const mtVersion = mtMeta.content.match(/Movable Type\s+([\d.]+)/)?.[1];
    data.cms.push({ name: 'Movable Type', version: mtVersion || '-' });
  }

  return data;
}

// 結果をUIに表示
function displayResults(pageData, headerData) {
  // メタ情報
  document.getElementById('meta-title').textContent = pageData.meta.title;
  document.getElementById('meta-charset').textContent = pageData.meta.charset;
  document.getElementById('meta-description').textContent = truncate(pageData.meta.description, 100);
  document.getElementById('meta-keywords').textContent = truncate(pageData.meta.keywords, 100);
  document.getElementById('meta-viewport').textContent = pageData.meta.viewport;

  // OGP情報
  document.getElementById('ogp-title').textContent = pageData.ogp.title;
  document.getElementById('ogp-description').textContent = truncate(pageData.ogp.description, 100);
  document.getElementById('ogp-image').textContent = truncate(pageData.ogp.image, 50);
  document.getElementById('ogp-type').textContent = pageData.ogp.type;

  // フレームワーク・ライブラリ
  const frameworksEl = document.getElementById('frameworks');
  if (pageData.frameworks.length > 0) {
    frameworksEl.innerHTML = pageData.frameworks.map(fw =>
      `<span class="tag">${fw.name} ${fw.version !== '-' ? `v${fw.version}` : ''}</span>`
    ).join('');
  } else {
    frameworksEl.innerHTML = '<span class="tag tag-empty">検出されませんでした</span>';
  }

  // CMS・バックエンド
  const cmsEl = document.getElementById('cms');
  if (pageData.cms.length > 0) {
    cmsEl.innerHTML = pageData.cms.map(cms =>
      `<span class="tag">${cms.name} ${cms.version !== '-' ? `v${cms.version}` : ''}</span>`
    ).join('');
  } else {
    cmsEl.innerHTML = '<span class="tag tag-empty">検出されませんでした</span>';
  }

  // サーバー・インフラ情報
  document.getElementById('http-version').textContent = headerData?.protocol || '-';
  document.getElementById('server-info').textContent = headerData?.server || '-';
  document.getElementById('cdn-info').textContent = headerData?.cdn || '-';
}

// テキスト切り詰め
function truncate(text, maxLength) {
  if (!text || text === '-') return '-';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
