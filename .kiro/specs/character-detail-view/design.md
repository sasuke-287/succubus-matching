# 設計書

## 概要

キャラクター詳細表示機能は、既存のSuccubus Realmアプリケーションに詳細情報を表示するモーダルウィンドウを追加する機能です。ユーザーはキャラクターカードまたはハーレム一覧から詳細画面にアクセスでき、より豊富な情報を確認した上で選択を行うことができます。

この機能は既存のアプリケーション構造を最小限の変更で拡張し、一貫したユーザーエクスペリエンスを提供します。

### 追加機能

**ホットリロード開発環境:**
- ファイル変更の自動検出とブラウザリロード
- WebSocketベースのリアルタイム通信
- CSS専用の部分更新機能

**視覚的フィードバックシステム:**
- スワイプアクション時の即座なフィードバック表示
- 残り人数とアクション結果の明確な表示
- アニメーション効果による滑らかなUX

**改善された画像システム:**
- SVGベースの淫紋をモチーフにしたキャラクター画像
- 各キャラクターの特性に合わせた色彩とシンボル
- 高品質でスケーラブルな画像表示

**統計とランクシステム:**
- ハーレム構築結果に基づく詳細な統計表示
- 5段階のランクシステム
- リプレイとナビゲーション機能

## アーキテクチャ

### 既存システムとの統合

現在の`SuccubusRealmApp`クラスに以下の機能を追加：
- モーダル管理機能
- 詳細表示機能
- イベントハンドリングの拡張

### モーダルシステム設計

```
┌─────────────────────────────────────┐
│           Main App Layer            │
│  ┌─────────────────────────────────┐ │
│  │        Modal Overlay            │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │    Detail Modal Content     │ │ │
│  │  │                             │ │ │
│  │  │  - Character Image          │ │ │
│  │  │  - Detailed Info            │ │ │
│  │  │  - Ability Progress Bars    │ │ │
│  │  │  - Action Buttons           │ │ │
│  │  │                             │ │ │
│  │  └─────────────────────────────┘ │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## コンポーネントとインターフェース

### 1. モーダル管理コンポーネント

**責任:**
- モーダルの表示/非表示制御
- 背景オーバーレイの管理
- キーボードイベント処理（ESC）

**メソッド:**
```javascript
class ModalManager {
  showModal(content)     // モーダルを表示
  hideModal()           // モーダルを非表示
  createOverlay()       // 背景オーバーレイを作成
  setupEventListeners() // イベントリスナー設定
}
```

### 2. キャラクター詳細表示コンポーネント

**責任:**
- キャラクター詳細情報のレンダリング
- 能力値のプログレスバー表示
- アクションボタンの管理
- 外部リンクボタンの生成と管理

**メソッド:**
```javascript
class CharacterDetailView {
  render(character, context)    // 詳細画面をレンダリング
  createAbilityBars(abilities) // 能力値バーを作成
  createActionButtons(context) // アクションボタンを作成
  createExternalLinks(character) // 外部リンクボタンを作成
  handleAction(action, character) // アクション処理
  handleExternalLink(url, character) // 外部リンク処理
}
```

### 3. 既存クラスの拡張

**SuccubusRealmAppクラスに追加するメソッド:**
```javascript
// モーダル関連
showCharacterDetail(character, context)
hideCharacterDetail()
setupDetailEventListeners()
setupImageClickListener()

// ハーレム管理拡張
removeFromHarem(character)
updateHaremDisplay()

// スワイプフィードバック
showSwipeAction(direction)
swipeCard(direction) // 拡張版

// 終了処理
showEndMessage() // 改善版
```

### 4. ホットリロード開発システム

**責任:**
- ファイル変更の監視
- WebSocket通信の管理
- ブラウザの自動更新制御

**コンポーネント:**
```javascript
// サーバーサイド (Node.js)
class HotReloadServer {
  startFileWatcher()     // ファイル監視開始
  setupWebSocket()       // WebSocket設定
  broadcastReload()      // リロード信号送信
}

// クライアントサイド
class HotReloadClient {
  connectWebSocket()     // WebSocket接続
  handleReloadSignal()   // リロード処理
  updateCSS()           // CSS部分更新
}
```

### 5. フィードバックシステム

**責任:**
- スワイプアクションの視覚的フィードバック
- 統計情報の計算と表示
- ランクシステムの管理

**メソッド:**
```javascript
class FeedbackSystem {
  showSwipeAction(direction, character, remainingCount)
  calculateStatistics(haremMembers, totalCount)
  determineRank(haremRatio)
  createFeedbackElement(content, color)
  animateFeedback(element)
}
```

## データモデル

### キャラクター表示コンテキスト

```javascript
const DisplayContext = {
  CURRENT_CARD: 'current',    // 現在のカードから
  HAREM_MEMBER: 'harem'       // ハーレムメンバーから
}
```

### 外部リンク設定

```javascript
const ExternalLinks = {
  profile: 'https://example.com/profile/',     // プロフィール詳細
  gallery: 'https://example.com/gallery/',     // ギャラリー
  social: 'https://example.com/social/'        // ソーシャルメディア
}
```

### モーダル状態管理

```javascript
const ModalState = {
  isVisible: boolean,
  currentCharacter: Object,
  displayContext: string,
  animationInProgress: boolean
}
```

### ランクシステム

```javascript
const RankSystem = {
  EMPEROR: { threshold: 0.8, name: "魅惑の帝王", emoji: "👑" },
  MASTER: { threshold: 0.6, name: "誘惑の達人", emoji: "✨" },
  EXPLORER: { threshold: 0.4, name: "魅惑の探求者", emoji: "🌟" },
  JUDGE: { threshold: 0.2, name: "慎重な判断者", emoji: "🎭" },
  SEEKER: { threshold: 0.0, name: "孤高の求道者", emoji: "🗡️" }
}
```

### キャラクター画像設定

```javascript
const CharacterImageConfig = {
  format: 'SVG',
  baseSize: { width: 300, height: 400 },
  themes: {
    LILITH: { colors: ['#8B0000', '#FFB6C1'], symbol: '闇の女王' },
    SELENE: { colors: ['#4B0082', '#E6E6FA'], symbol: '月夜の女王' },
    CARMILLA: { colors: ['#DC143C', '#FFE4E1'], symbol: '血薔薇の女王' },
    VIOLA: { colors: ['#2F2F2F', '#9370DB'], symbol: '影踊りの女王' },
    ASTAROTH: { colors: ['#FF4500', '#FFFFE0'], symbol: '炎心の女王' },
    NEREIDA: { colors: ['#708090', '#F0F8FF'], symbol: '霧纏いの女王' }
  }
}
```

### ホットリロード設定

```javascript
const HotReloadConfig = {
  port: 3000,
  watchPatterns: ['*.html', '*.css', '*.js', '*.json'],
  excludePatterns: ['node_modules/**'],
  reconnectDelay: 1000,
  cssUpdateDelay: 100
}
```

## エラーハンドリング

### 1. 画像読み込みエラー

```javascript
// 画像読み込み失敗時のフォールバック
const handleImageError = (imgElement) => {
  imgElement.src = 'placeholder-image-url';
  imgElement.alt = '画像を読み込めませんでした';
}
```

### 2. モーダル表示エラー

```javascript
// モーダル表示失敗時の処理
const handleModalError = (error) => {
  console.error('モーダル表示エラー:', error);
  // フォールバック: 基本情報をアラートで表示
  alert(`${character.name}\n${character.description}`);
}
```

### 3. データ不整合エラー

```javascript
// キャラクターデータが不完全な場合の処理
const validateCharacterData = (character) => {
  const required = ['name', 'type', 'origin', 'power', 'abilities'];
  return required.every(field => character[field] !== undefined);
}
```

## テスト戦略

### 1. ユニットテスト

**モーダル管理機能:**
- モーダルの表示/非表示
- オーバーレイクリックでの閉じる動作
- ESCキーでの閉じる動作

**詳細表示機能:**
- キャラクターデータの正確な表示
- 能力値プログレスバーの計算
- アクションボタンの動作

### 2. 統合テスト

**エンドツーエンドフロー:**
- カードクリック → 詳細表示 → アクション実行
- ハーレムクリック → 詳細表示 → 削除実行
- 詳細画面での各種閉じる操作

### 3. ユーザビリティテスト

**レスポンシブ対応:**
- モバイルデバイスでの表示確認
- タッチ操作の動作確認
- 画面サイズ変更時の表示確認

## 実装の詳細設計

### HTML構造拡張

```html
<!-- 詳細表示モーダル -->
<div id="characterDetailModal" class="modal-overlay">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div class="detail-header">
      <img class="detail-image" src="" alt="">
      <div class="detail-power-badge"></div>
    </div>
    <div class="detail-body">
      <h2 class="detail-name"></h2>
      <p class="detail-type"></p>
      <p class="detail-origin"></p>
      <div class="detail-abilities"></div>
      <p class="detail-description"></p>
    </div>
    <div class="detail-actions">
      <!-- コンテキストに応じてボタンが変わる -->
    </div>
    <div class="detail-external-links">
      <!-- 外部リンクボタン -->
      <button class="external-link-btn" data-link-type="profile">📋 詳細プロフィール</button>
      <button class="external-link-btn" data-link-type="gallery">🖼️ ギャラリー</button>
      <button class="external-link-btn" data-link-type="social">🌐 ソーシャル</button>
    </div>
  </div>
</div>
```

### CSS設計原則

**既存デザインとの一貫性:**
- 同じカラーパレット（紫系グラデーション）
- 同じフォントファミリー
- 同じボーダーとシャドウスタイル

**アニメーション設計:**
- フェードイン/アウト効果
- スケールアニメーション
- スムーズなトランジション

### JavaScript実装パターン

**イベント委譲パターン:**
```javascript
// 効率的なイベント管理
document.addEventListener('click', (e) => {
  if (e.target.matches('.succubus-card')) {
    this.showCharacterDetail(currentCharacter, 'current');
  }
  if (e.target.matches('.harem-member')) {
    const character = this.getCharacterFromElement(e.target);
    this.showCharacterDetail(character, 'harem');
  }
});
```

**状態管理パターン:**
```javascript
// 明確な状態管理
const updateModalState = (newState) => {
  this.modalState = { ...this.modalState, ...newState };
  this.renderModalIfNeeded();
}
```

## パフォーマンス考慮事項

### 1. DOM操作の最適化

- モーダル要素の事前作成と再利用
- 不要なDOM操作の削減
- 効率的なイベントリスナー管理

### 2. 画像読み込み最適化

- 遅延読み込み（必要時のみ）
- 画像キャッシュの活用
- プレースホルダー画像の使用

### 3. アニメーション最適化

- CSS transformsの使用（GPU加速）
- requestAnimationFrameの活用
- 不要なリフローの回避

## セキュリティ考慮事項

### 1. XSS対策

```javascript
// HTMLエスケープ処理
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### 2. データ検証

```javascript
// 入力データの検証
const sanitizeCharacterData = (character) => {
  return {
    name: escapeHtml(character.name || ''),
    type: escapeHtml(character.type || ''),
    // ... 他のフィールド
  };
}
```

### 3. 外部リンクセキュリティ

```javascript
// 外部リンクの安全な処理
const handleExternalLink = (url, character) => {
  // URLの検証
  if (!isValidUrl(url)) {
    console.error('無効なURLです:', url);
    return;
  }
  
  // 新しいタブで開く（rel="noopener noreferrer"相当）
  const newWindow = window.open(url, '_blank');
  if (newWindow) {
    newWindow.opener = null; // セキュリティ対策
  }
}

const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  } catch {
    return false;
  }
}
```