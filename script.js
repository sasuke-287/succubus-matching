// サキュバスデータ（JSONから読み込み）
let succubi = [];

// いいね機能管理クラス
class LikeManager {
  constructor() {
    this.localStorageKey = "succubus-realm-likes";
    this.offlineQueueKey = "succubus-realm-offline-queue";
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1秒
    this.isProcessingQueue = false;

    // オンライン/オフライン状態の監視を開始
    this.setupNetworkMonitoring();
  }

  // キャラクターIDからキャラクター情報を取得
  getCharacterById(characterId) {
    if (!characterId || !Array.isArray(succubi)) {
      return null;
    }
    return succubi.find((character) => character.id === characterId) || null;
  }

  // いいねを増加させる（API呼び出し）
  async incrementLike(characterId) {
    if (!characterId) {
      throw new Error("キャラクターIDが指定されていません");
    }

    // 既にいいね済みかチェック
    if (this.isAlreadyLiked(characterId)) {
      throw new Error("このキャラクターには既にいいねしています");
    }

    // オフライン時の処理
    if (!navigator.onLine) {
      // ローカルでいいね済み状態を保存
      this.markAsLiked(characterId);

      // オフライン操作をキューに追加
      this.queueOfflineOperation("/api/likes/increment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ characterId: characterId }),
      });

      // ローカルでいいね数を仮増加
      const currentCount = await this.getLikeCountFromCache(characterId);
      this.updateLocalLikeCount(characterId, currentCount + 1);

      this.showTemporaryMessage(
        "💜 いいねを記録しました（オフライン）",
        "success",
        3000
      );
      return currentCount + 1;
    }

    try {
      const response = await this.makeApiRequest("/api/likes/increment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ characterId: characterId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // ローカルストレージにいいね済み状態を保存
        this.markAsLiked(characterId);
        // ローカルキャッシュも更新
        this.updateLocalLikeCount(characterId, data.totalLikes);
        return data.totalLikes;
      } else {
        throw new Error("いいねの処理に失敗しました");
      }
    } catch (error) {
      console.error(
        `いいね処理でエラーが発生しました (キャラクターID: ${characterId}):`,
        error
      );

      // ネットワークエラーの場合、オフライン処理として扱う
      if (error.name === "TypeError" || !navigator.onLine) {
        this.markAsLiked(characterId);
        this.queueOfflineOperation("/api/likes/increment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ characterId: characterId }),
        });

        const currentCount = await this.getLikeCountFromCache(characterId);
        this.updateLocalLikeCount(characterId, currentCount + 1);

        this.showTemporaryMessage(
          "💜 いいねを記録しました（後で同期）",
          "warning",
          3000
        );
        return currentCount + 1;
      }

      throw error;
    }
  }

  // ローカルキャッシュからいいね数を取得
  async getLikeCountFromCache(characterId) {
    try {
      const cacheKey = `like-count-${characterId}`;
      const cached = localStorage.getItem(cacheKey);
      return cached ? parseInt(cached) : 0;
    } catch (error) {
      console.error("ローカルキャッシュからのいいね数取得に失敗:", error);
      return 0;
    }
  }

  // ローカルキャッシュのいいね数を更新
  updateLocalLikeCount(characterId, count) {
    try {
      const cacheKey = `like-count-${characterId}`;
      localStorage.setItem(cacheKey, count.toString());
    } catch (error) {
      console.error("ローカルキャッシュのいいね数更新に失敗:", error);
    }
  }

  // 特定キャラクターのいいね数を取得
  async getLikeCount(characterId) {
    if (!characterId) {
      return 0;
    }

    try {
      const response = await this.makeApiRequest(
        `/api/likes/count/${characterId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.totalLikes || 0;
    } catch (error) {
      console.error(
        `いいね数取得でエラーが発生しました (キャラクターID: ${characterId}):`,
        error
      );
      return 0;
    }
  }

  // 全キャラクターのいいね数を取得
  async getAllLikes() {
    try {
      const response = await this.makeApiRequest("/api/likes/all");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.likes || {};
    } catch (error) {
      console.error("全いいね数取得でエラーが発生しました:", error);
      return {};
    }
  }

  // 既にいいね済みかチェック
  isAlreadyLiked(characterId) {
    if (!characterId) {
      return false;
    }

    const likedCharacters = this.loadLikedCharacters();
    return likedCharacters.includes(characterId);
  }

  // いいね済み状態をローカルストレージに保存
  markAsLiked(characterId) {
    if (!characterId) {
      return;
    }

    try {
      const likedCharacters = this.loadLikedCharacters();

      if (!likedCharacters.includes(characterId)) {
        likedCharacters.push(characterId);

        const data = {
          likedCharacters: likedCharacters,
        };

        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error("いいね済み状態の保存でエラーが発生しました:", error);
    }
  }

  // ローカルストレージからいいね済みキャラクターリストを読み込み
  loadLikedCharacters() {
    try {
      const stored = localStorage.getItem(this.localStorageKey);

      if (!stored) {
        return [];
      }

      const data = JSON.parse(stored);

      // データ形式の検証
      if (data && Array.isArray(data.likedCharacters)) {
        // 数値IDのみを保持（データクリーニング）
        return data.likedCharacters.filter(
          (id) => typeof id === "number" && id > 0
        );
      }

      return [];
    } catch (error) {
      console.error(
        "いいね済みキャラクターリストの読み込みでエラーが発生しました:",
        error
      );
      return [];
    }
  }

  // API リクエストの共通処理（再試行機能付き）
  async makeApiRequest(url, options = {}, attempt = 1) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.warn(
          `API リクエスト失敗 (試行 ${attempt}/${this.retryAttempts}): ${url}`,
          error
        );

        // ユーザーに再試行中であることを通知
        this.showNetworkRetryMessage(attempt, this.retryAttempts);

        // 指数バックオフで再試行
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);

        return this.makeApiRequest(url, options, attempt + 1);
      } else {
        console.error(`API リクエスト最終失敗: ${url}`, error);

        // ネットワークエラーの詳細分析とユーザーフレンドリーなメッセージ表示
        this.handleNetworkError(error, url);
        throw error;
      }
    }
  }

  // ネットワークエラーハンドリング
  handleNetworkError(error, url) {
    let userMessage = "";
    let errorType = "unknown";

    if (!navigator.onLine) {
      errorType = "offline";
      userMessage =
        "🌐 インターネット接続が切断されています。接続を確認してから再度お試しください。";
    } else if (error.name === "TypeError" && error.message.includes("fetch")) {
      errorType = "network";
      userMessage =
        "🔌 サーバーに接続できません。しばらく時間をおいてから再度お試しください。";
    } else if (error.name === "AbortError") {
      errorType = "timeout";
      userMessage = "⏱️ 通信がタイムアウトしました。もう一度お試しください。";
    } else {
      errorType = "server";
      userMessage =
        "⚠️ 通信エラーが発生しました。しばらく時間をおいてから再度お試しください。";
    }

    this.showUserFriendlyError(userMessage, errorType);

    // オフライン状態の場合、操作をキューに追加
    if (errorType === "offline") {
      this.queueOfflineOperation(url);
    }
  }

  // 再試行中メッセージの表示
  showNetworkRetryMessage(currentAttempt, maxAttempts) {
    const message = `🔄 接続を再試行中... (${currentAttempt}/${maxAttempts})`;
    this.showTemporaryMessage(message, "info", 2000);
  }

  // ユーザーフレンドリーなエラーメッセージ表示
  showUserFriendlyError(message, errorType = "error") {
    const errorElement = document.createElement("div");
    errorElement.className = `user-error-message ${errorType}`;
    errorElement.innerHTML = `
      <div class="error-content">
        <div class="error-text">${message}</div>
        <button class="error-dismiss" onclick="this.parentElement.parentElement.remove()">
          ✕ 閉じる
        </button>
      </div>
    `;

    // エラーメッセージのスタイルを動的に追加
    this.addErrorMessageStyles();

    document.body.appendChild(errorElement);

    // 自動削除（10秒後）
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.remove();
      }
    }, 10000);
  }

  // 一時的なメッセージ表示
  showTemporaryMessage(message, type = "info", duration = 3000) {
    const messageElement = document.createElement("div");
    messageElement.className = `temporary-message ${type}`;
    messageElement.textContent = message;

    // メッセージのスタイルを動的に追加
    this.addTemporaryMessageStyles();

    document.body.appendChild(messageElement);

    // フェードイン
    setTimeout(() => messageElement.classList.add("show"), 100);

    // 自動削除
    setTimeout(() => {
      messageElement.classList.add("fade-out");
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.remove();
        }
      }, 300);
    }, duration);
  }

  // エラーメッセージのスタイルを追加
  addErrorMessageStyles() {
    if (document.getElementById("error-message-styles")) return;

    const style = document.createElement("style");
    style.id = "error-message-styles";
    style.textContent = `
      .user-error-message {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: rgba(0, 0, 0, 0.95);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        border-left: 4px solid #ff6b6b;
      }
      
      .user-error-message.offline {
        border-left-color: #ffa726;
      }
      
      .user-error-message.network {
        border-left-color: #42a5f5;
      }
      
      .user-error-message.timeout {
        border-left-color: #ab47bc;
      }
      
      .error-content {
        padding: 16px 20px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      
      .error-text {
        flex: 1;
        color: #e6e6fa;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .error-dismiss {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e6e6fa;
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .error-dismiss:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 一時的なメッセージのスタイルを追加
  addTemporaryMessageStyles() {
    if (document.getElementById("temporary-message-styles")) return;

    const style = document.createElement("style");
    style.id = "temporary-message-styles";
    style.textContent = `
      .temporary-message {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: #e6e6fa;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        max-width: 90vw;
        text-align: center;
      }
      
      .temporary-message.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      
      .temporary-message.fade-out {
        opacity: 0;
        transform: translateX(-50%) translateY(-10px);
      }
      
      .temporary-message.success {
        border-left: 4px solid #4caf50;
        background: rgba(76, 175, 80, 0.1);
      }
      
      .temporary-message.error {
        border-left: 4px solid #f44336;
        background: rgba(244, 67, 54, 0.1);
      }
      
      .temporary-message.warning {
        border-left: 4px solid #ff9800;
        background: rgba(255, 152, 0, 0.1);
      }
      
      .temporary-message.info {
        border-left: 4px solid #2196f3;
        background: rgba(33, 150, 243, 0.1);
      }
    `;
    document.head.appendChild(style);
  }

  // 指定時間待機するユーティリティ
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ネットワーク状態監視の設定
  setupNetworkMonitoring() {
    // オンライン復帰時の処理
    window.addEventListener("online", () => {
      console.log("オンラインに復帰しました");
      this.showTemporaryMessage(
        "🌐 インターネット接続が復旧しました",
        "success",
        3000
      );
      this.processOfflineQueue();
    });

    // オフライン時の処理
    window.addEventListener("offline", () => {
      console.log("オフラインになりました");
      this.showTemporaryMessage(
        "📱 オフラインモードになりました。操作は後で同期されます",
        "warning",
        5000
      );
    });

    // ページ読み込み時にキューを処理
    if (navigator.onLine) {
      setTimeout(() => this.processOfflineQueue(), 1000);
    }
  }

  // オフライン操作をキューに追加
  queueOfflineOperation(url, options = {}) {
    try {
      const operation = {
        id: Date.now() + Math.random(),
        url,
        options,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      const queue = this.getOfflineQueue();
      queue.push(operation);

      localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));

      console.log("オフライン操作をキューに追加しました:", operation);
      this.showTemporaryMessage(
        "📝 操作をキューに保存しました。オンライン復帰時に実行されます",
        "info",
        4000
      );
    } catch (error) {
      console.error("オフライン操作のキューイングに失敗しました:", error);
    }
  }

  // オフラインキューを取得
  getOfflineQueue() {
    try {
      const stored = localStorage.getItem(this.offlineQueueKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("オフラインキューの読み込みに失敗しました:", error);
      return [];
    }
  }

  // オフラインキューを処理
  async processOfflineQueue() {
    if (this.isProcessingQueue || !navigator.onLine) {
      return;
    }

    this.isProcessingQueue = true;
    const queue = this.getOfflineQueue();

    if (queue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    console.log(`オフラインキューを処理中... (${queue.length}件)`);
    this.showTemporaryMessage(
      `🔄 保存された操作を同期中... (${queue.length}件)`,
      "info",
      3000
    );

    const processedOperations = [];
    const failedOperations = [];

    for (const operation of queue) {
      try {
        const response = await fetch(operation.url, operation.options);

        if (response.ok) {
          processedOperations.push(operation);
          console.log("オフライン操作を正常に処理しました:", operation.id);
        } else {
          operation.retryCount = (operation.retryCount || 0) + 1;
          if (operation.retryCount < 3) {
            failedOperations.push(operation);
          } else {
            console.error(
              "オフライン操作の最大再試行回数に達しました:",
              operation.id
            );
          }
        }
      } catch (error) {
        console.error(
          "オフライン操作の処理に失敗しました:",
          operation.id,
          error
        );
        operation.retryCount = (operation.retryCount || 0) + 1;
        if (operation.retryCount < 3) {
          failedOperations.push(operation);
        }
      }

      // 処理間隔を設ける
      await this.sleep(500);
    }

    // キューを更新（失敗した操作のみ残す）
    localStorage.setItem(
      this.offlineQueueKey,
      JSON.stringify(failedOperations)
    );

    // 結果をユーザーに通知
    if (processedOperations.length > 0) {
      this.showTemporaryMessage(
        `✅ ${processedOperations.length}件の操作を同期しました`,
        "success",
        4000
      );
    }

    if (failedOperations.length > 0) {
      this.showTemporaryMessage(
        `⚠️ ${failedOperations.length}件の操作が失敗しました。後で再試行されます`,
        "warning",
        5000
      );
    }

    this.isProcessingQueue = false;
  }

  // ローカルストレージをクリア（デバッグ用）
  clearLikedCharacters() {
    try {
      localStorage.removeItem(this.localStorageKey);
      console.log("いいね済みデータをクリアしました");
    } catch (error) {
      console.error("いいね済みデータのクリアでエラーが発生しました:", error);
    }
  }

  // オフラインキューをクリア（デバッグ用）
  clearOfflineQueue() {
    try {
      localStorage.removeItem(this.offlineQueueKey);
      console.log("オフラインキューをクリアしました");
    } catch (error) {
      console.error("オフラインキューのクリアでエラーが発生しました:", error);
    }
  }
}

class SuccubusRealmApp {
  constructor() {
    this.currentSuccubusIndex = 0;
    this.haremMembers = [];
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;

    this.succubusCard = document.getElementById("succubusCard");
    this.seduceBtn = document.getElementById("seduceBtn");
    this.banishBtn = document.getElementById("banishBtn");
    this.haremList = document.getElementById("haremList");

    // モーダル関連要素
    this.modal = document.getElementById("characterDetailModal");
    this.modalContent = this.modal.querySelector(".modal-content");
    this.modalClose = this.modal.querySelector(".modal-close");

    // モーダル状態管理
    this.modalState = {
      isVisible: false,
      currentCharacter: null,
      displayContext: null,
      animationInProgress: false,
    };

    // いいね機能管理
    this.likeManager = new LikeManager();

    this.init();
  }

  async init() {
    await this.loadSuccubiData();
    this.loadCurrentSuccubus();
    this.setupEventListeners();
    this.setupModalEventListeners();
    this.addSwipeIndicators();
  }

  async loadSuccubiData() {
    try {
      const response = await fetch("succubi-data.json");
      const data = await response.json();
      succubi = data.succubi;
    } catch (error) {
      console.error("サキュバスデータの読み込みに失敗しました:", error);
      console.warn("フォールバック用のサンプルデータを使用します");
      // フォールバック用のサンプルデータ
      succubi = [
        {
          name: "【サンプル】テスト・サキュバス",
          type: "デモ用サキュバス",
          origin: "サンプルデータ領域",
          power: 50,
          abilities: { 魅惑: 10, 幻術: 10, 吸精: 10, 変身: 10, 支配: 10 },
          description:
            "これはサンプルデータです。JSONファイルの読み込みに失敗した場合に表示されます。正常なデータを表示するには、succubi-data.jsonファイルが正しく配置されていることを確認してください。",
          image:
            "https://via.placeholder.com/300x400/ff6b6b/ffffff?text=SAMPLE%0ADATA%0A%F0%9F%A7%AA",
        },
        {
          name: "【サンプル】デモ・エンティティ",
          type: "テスト用キャラクター",
          origin: "フォールバック空間",
          power: 25,
          abilities: { 魅惑: 5, 幻術: 5, 吸精: 5, 変身: 5, 支配: 5 },
          description:
            "フォールバック機能のテスト用キャラクターです。このキャラクターが表示されている場合、データファイルの読み込みに問題があります。",
          image:
            "https://via.placeholder.com/300x400/4ecdc4/ffffff?text=DEMO%0ACHARACTER%0A%F0%9F%94%A7",
        },
        {
          name: "【サンプル】エラー・ハンドラー",
          type: "システム管理者",
          origin: "エラー処理部門",
          power: 1,
          abilities: { 魅惑: 1, 幻術: 1, 吸精: 1, 変身: 1, 支配: 1 },
          description:
            "エラーハンドリング機能の動作確認用です。通常の運用では表示されません。開発者向けのテストデータとなります。",
          image:
            "https://via.placeholder.com/300x400/ffa726/ffffff?text=ERROR%0AHANDLER%0A%E2%9A%A0%EF%B8%8F",
        },
      ];
    }
  }

  addSwipeIndicators() {
    const seduceIndicator = document.createElement("div");
    seduceIndicator.className = "swipe-indicator seduce";
    seduceIndicator.textContent = "SEDUCE";

    const banishIndicator = document.createElement("div");
    banishIndicator.className = "swipe-indicator banish";
    banishIndicator.textContent = "BANISH";

    this.succubusCard.appendChild(seduceIndicator);
    this.succubusCard.appendChild(banishIndicator);
  }

  setupEventListeners() {
    // ボタンイベント
    this.seduceBtn.addEventListener("click", () => this.seduceSuccubus());
    this.banishBtn.addEventListener("click", () => this.banishSuccubus());

    // 画像クリックイベント（詳細表示用）
    this.setupImageClickListener();

    // タッチイベント
    this.succubusCard.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this)
    );
    this.succubusCard.addEventListener(
      "touchmove",
      this.handleTouchMove.bind(this)
    );
    this.succubusCard.addEventListener(
      "touchend",
      this.handleTouchEnd.bind(this)
    );

    // マウスイベント
    this.succubusCard.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
  }

  setupImageClickListener() {
    // 画像部分のクリックイベントを設定（詳細表示用）
    const succubusImage = document.getElementById("succubusImage");
    if (succubusImage) {
      // 既存のイベントリスナーを削除
      succubusImage.replaceWith(succubusImage.cloneNode(true));
      const newImage = document.getElementById("succubusImage");

      newImage.addEventListener("click", (e) => {
        // イベントの伝播を停止（カード全体のイベントを防ぐ）
        e.stopPropagation();

        // スワイプ中やモーダル表示中でない場合のみ詳細表示
        if (!this.isDragging && !this.modalState.isVisible) {
          const currentCharacter = succubi[this.currentSuccubusIndex];
          if (currentCharacter) {
            this.showCharacterDetail(currentCharacter, "current");
          }
        }
      });

      // 画像にカーソルポインターを設定
      newImage.style.cursor = "pointer";
    }
  }

  loadCurrentSuccubus() {
    if (this.currentSuccubusIndex >= succubi.length) {
      this.showEndMessage();
      return;
    }

    const succubus = succubi[this.currentSuccubusIndex];
    document.getElementById("succubusName").textContent = succubus.name;
    document.getElementById(
      "succubusType"
    ).textContent = `種類: ${succubus.type}`;
    document.getElementById(
      "succubusOrigin"
    ).textContent = `出身: ${succubus.origin}`;
    document.getElementById(
      "powerBadge"
    ).textContent = `Power ${succubus.power}`;
    // 説明文は非表示にする（スクロールを防ぐため）
    // document.getElementById("succubusDescription").textContent =
    //   succubus.description;
    document.getElementById("succubusImage").src = succubus.image;

    // 能力表示
    const abilitiesContainer = document.getElementById("succubusAbilities");
    abilitiesContainer.innerHTML = "";
    Object.entries(succubus.abilities).forEach(([ability, value]) => {
      const abilityElement = document.createElement("span");
      abilityElement.className = "ability";
      abilityElement.textContent = `${ability}:${value}`;
      abilitiesContainer.appendChild(abilityElement);
    });

    // カードをリセット
    this.succubusCard.className = "succubus-card";
    this.succubusCard.style.transform = "";

    // 新しいキャラクターが読み込まれた時に画像クリックイベントを再設定
    this.setupImageClickListener();
  }

  seduceSuccubus() {
    const succubus = succubi[this.currentSuccubusIndex];
    this.haremMembers.push(succubus);
    this.updateHaremList();
    this.swipeCard("right");
  }

  banishSuccubus() {
    this.swipeCard("left");
  }

  swipeCard(direction) {
    // スワイプアニメーションを開始
    this.succubusCard.classList.add(`swipe-${direction}`);

    // スワイプ中はボタンを無効化
    this.seduceBtn.disabled = true;
    this.banishBtn.disabled = true;

    // スワイプアクションのフィードバック表示
    this.showSwipeAction(direction);

    setTimeout(() => {
      this.currentSuccubusIndex++;

      // 次のサキュバスがいるかチェック
      if (this.currentSuccubusIndex >= succubi.length) {
        // 全てのサキュバスとの出会いが完了
        this.showEndMessage();
      } else {
        // 次のサキュバスを読み込み
        this.loadCurrentSuccubus();
        // ボタンを再有効化
        this.seduceBtn.disabled = false;
        this.banishBtn.disabled = false;
      }
    }, 300);
  }

  showSwipeAction(direction) {
    // スワイプアクションのフィードバック表示
    const currentSuccubus = succubi[this.currentSuccubusIndex];
    const actionText =
      direction === "right" ? "💋 誘惑しました！" : "🔥 追放しました！";
    const actionColor = direction === "right" ? "#ff69b4" : "#ff6b6b";
    const remainingCount = succubi.length - this.currentSuccubusIndex - 1;

    // 一時的なフィードバック要素を作成
    const feedback = document.createElement("div");
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: ${actionColor};
      padding: 20px 30px;
      border-radius: 15px;
      font-size: 1.5rem;
      font-weight: bold;
      text-align: center;
      z-index: 10000;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      border: 2px solid ${actionColor};
      animation: swipeFeedback 0.8s ease-out forwards;
    `;

    feedback.innerHTML = `
      <div style="margin-bottom: 10px;">${actionText}</div>
      <div style="font-size: 1rem; color: #c8a2c8; opacity: 0.8;">
        ${currentSuccubus.name}
      </div>
      ${
        remainingCount > 0
          ? `<div style="font-size: 0.9rem; color: #9370db; margin-top: 10px;">
          残り ${remainingCount} 人のサキュバス
        </div>`
          : `<div style="font-size: 0.9rem; color: #dda0dd; margin-top: 10px;">
          🌙 全ての出会いが完了します
        </div>`
      }
    `;

    // CSSアニメーションを追加
    if (!document.getElementById("swipe-feedback-style")) {
      const style = document.createElement("style");
      style.id = "swipe-feedback-style";
      style.textContent = `
        @keyframes swipeFeedback {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(feedback);

    // フィードバックを自動削除
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 800);
  }

  async updateHaremList() {
    this.haremList.innerHTML = "";

    // 全てのいいね数を一度に取得
    const allLikes = await this.likeManager.getAllLikes();

    // ハーレムメンバーをいいね数順でソート（降順）
    const sortedMembers = [...this.haremMembers].sort((a, b) => {
      const aLikes = a.id ? allLikes[a.id] || 0 : 0;
      const bLikes = b.id ? allLikes[b.id] || 0 : 0;
      return bLikes - aLikes; // 降順ソート
    });

    sortedMembers.forEach((succubus, index) => {
      const item = document.createElement("div");
      item.className = "harem-member";

      // いいね数を取得（IDが存在する場合のみ）
      const likeCount = succubus.id ? allLikes[succubus.id] || 0 : 0;

      // いいね数に応じた表示スタイルを設定
      const likeDisplayClass =
        likeCount === 0 ? "like-count-zero" : "like-count-positive";
      const likeIcon = likeCount === 0 ? "🤍" : "💜";
      const likeText = likeCount === 0 ? "まだなし" : likeCount.toString();

      item.innerHTML = `
                <h4>${succubus.name} (Power ${succubus.power})</h4>
                <p>${succubus.type} - ${succubus.origin}</p>
                <div class="harem-member-likes">
                    <span class="like-count ${likeDisplayClass}" data-count="${likeCount}">
                        ${likeIcon} ${likeText}
                    </span>
                </div>
            `;

      // ハーレムメンバーのクリックイベント
      item.addEventListener("click", () => {
        this.showCharacterDetail(succubus, "harem");
      });

      // データ属性でインデックスを保存（元のインデックスを保持）
      const originalIndex = this.haremMembers.findIndex(
        (member) =>
          member.name === succubus.name && member.power === succubus.power
      );
      item.setAttribute("data-harem-index", originalIndex);

      this.haremList.appendChild(item);
    });

    // ハーレムメンバー数とソート情報を表示
    this.updateHaremStats(sortedMembers, allLikes);
  }

  // ハーレム統計情報を更新
  updateHaremStats(sortedMembers, allLikes) {
    // 既存の統計情報要素があれば削除
    const existingStats =
      this.haremList.parentElement.querySelector(".harem-stats");
    if (existingStats) {
      existingStats.remove();
    }

    if (sortedMembers.length === 0) {
      return; // ハーレムが空の場合は統計を表示しない
    }

    // 統計情報を計算
    const totalLikes = sortedMembers.reduce((sum, member) => {
      return sum + (member.id ? allLikes[member.id] || 0 : 0);
    }, 0);

    const averageLikes =
      sortedMembers.length > 0
        ? Math.round((totalLikes / sortedMembers.length) * 10) / 10
        : 0;

    const mostLikedMember = sortedMembers[0];
    const mostLikes = mostLikedMember.id
      ? allLikes[mostLikedMember.id] || 0
      : 0;

    // 統計情報要素を作成
    const statsElement = document.createElement("div");
    statsElement.className = "harem-stats";
    statsElement.innerHTML = `
      <div class="harem-stats-content">
        <h4>📊 ハーレム統計</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">総いいね数</span>
            <span class="stat-value">${totalLikes}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均いいね数</span>
            <span class="stat-value">${averageLikes}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最高いいね数</span>
            <span class="stat-value">${mostLikes}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">人気No.1</span>
            <span class="stat-value">${mostLikedMember.name}</span>
          </div>
        </div>
        <div class="sort-info">
          <small>💜 いいね数順で表示中</small>
        </div>
      </div>
    `;

    // ハーレムリストの後に統計情報を挿入
    this.haremList.parentElement.insertBefore(
      statsElement,
      this.haremList.nextSibling
    );
  }

  showEndMessage() {
    // ボタンを無効化
    this.seduceBtn.disabled = true;
    this.banishBtn.disabled = true;

    // ハーレムの統計を計算
    const totalPower = this.haremMembers.reduce(
      (sum, member) => sum + member.power,
      0
    );
    const averagePower =
      this.haremMembers.length > 0
        ? Math.round(totalPower / this.haremMembers.length)
        : 0;
    const banishedCount = succubi.length - this.haremMembers.length;

    // 結果に応じたメッセージとランク
    let rank, message, emoji;
    const haremSize = this.haremMembers.length;
    const haremRatio = haremSize / succubi.length;

    if (haremRatio >= 0.8) {
      rank = "魅惑の帝王";
      message = "圧倒的な魅力で多くのサキュバスを虜にしました";
      emoji = "👑";
    } else if (haremRatio >= 0.6) {
      rank = "誘惑の達人";
      message = "優れた魅力でサキュバスたちを魅了しました";
      emoji = "✨";
    } else if (haremRatio >= 0.4) {
      rank = "魅惑の探求者";
      message = "バランスの取れた選択をしました";
      emoji = "🌟";
    } else if (haremRatio >= 0.2) {
      rank = "慎重な判断者";
      message = "厳選された少数精鋭のハーレムです";
      emoji = "🎭";
    } else {
      rank = "孤高の求道者";
      message = "真の美を求める厳格な審美眼をお持ちです";
      emoji = "🗡️";
    }

    this.succubusCard.innerHTML = `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; padding: 20px; background: linear-gradient(145deg, #2d1b2d, #1a0d1a); border-radius: 15px; box-shadow: 0 8px 32px rgba(139, 0, 139, 0.3);">
        <div style="margin-bottom: 20px;">
          <div style="font-size: 4rem; margin-bottom: 10px;">${emoji}</div>
          <h2 style="color: #dda0dd; margin-bottom: 10px; font-size: 1.8rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">🌙 魅惑の儀式完了</h2>
          <div style="color: #ff69b4; font-size: 1.3rem; font-weight: bold; margin-bottom: 15px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${rank}</div>
          <p style="color: #c8a2c8; margin-bottom: 20px; font-style: italic;">${message}</p>
        </div>
        
        <div style="background: rgba(139, 0, 139, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(221, 160, 221, 0.3);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; color: #c8a2c8;">
            <div>
              <div style="color: #dda0dd; font-weight: bold;">💜 ハーレム</div>
              <div style="font-size: 1.2rem; color: #ff69b4;">${haremSize}人</div>
            </div>
            <div>
              <div style="color: #dda0dd; font-weight: bold;">🔥 追放</div>
              <div style="font-size: 1.2rem; color: #ff6b6b;">${banishedCount}人</div>
            </div>
            <div>
              <div style="color: #dda0dd; font-weight: bold;">⚡ 総合力</div>
              <div style="font-size: 1.2rem; color: #ffd700;">${totalPower}</div>
            </div>
            <div>
              <div style="color: #dda0dd; font-weight: bold;">📊 平均力</div>
              <div style="font-size: 1.2rem; color: #87ceeb;">${averagePower}</div>
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
          <button onclick="location.reload()" style="padding: 12px 24px; border: 2px solid #8b008b; border-radius: 8px; background: linear-gradient(45deg, #4b0082, #8b008b); color: #e6e6fa; cursor: pointer; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); transition: all 0.3s ease; font-size: 1rem;">
            🔄 新たな誘惑へ
          </button>
          <button onclick="window.scrollTo({top: document.getElementById('harem').offsetTop, behavior: 'smooth'})" style="padding: 12px 24px; border: 2px solid #ff69b4; border-radius: 8px; background: linear-gradient(45deg, #8b008b, #ff1493); color: #e6e6fa; cursor: pointer; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); transition: all 0.3s ease; font-size: 1rem;">
            💜 ハーレムを見る
          </button>
        </div>
        
        <div style="margin-top: 15px; font-size: 0.9rem; color: #9370db; opacity: 0.8;">
          ${succubi.length}人のサキュバスとの出会いが完了しました
        </div>
      </div>
    `;
  }

  // タッチイベントハンドラー
  handleTouchStart(e) {
    this.isDragging = true;
    this.startX = e.touches[0].clientX;
    this.succubusCard.classList.add("dragging");
  }

  handleTouchMove(e) {
    if (!this.isDragging) return;

    this.currentX = e.touches[0].clientX;
    const deltaX = this.currentX - this.startX;
    const rotation = deltaX * 0.1;

    this.succubusCard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

    // スワイプインジケーター表示
    if (deltaX > 50) {
      this.succubusCard.classList.add("show-seduce");
      this.succubusCard.classList.remove("show-banish");
    } else if (deltaX < -50) {
      this.succubusCard.classList.add("show-banish");
      this.succubusCard.classList.remove("show-seduce");
    } else {
      this.succubusCard.classList.remove("show-seduce", "show-banish");
    }
  }

  handleTouchEnd(e) {
    if (!this.isDragging) return;

    const deltaX = this.currentX - this.startX;
    const threshold = 100;

    if (deltaX > threshold) {
      this.seduceSuccubus();
    } else if (deltaX < -threshold) {
      this.banishSuccubus();
    } else {
      // 元の位置に戻す
      this.succubusCard.style.transform = "";
      this.succubusCard.classList.remove("show-seduce", "show-banish");
    }

    this.isDragging = false;
    this.succubusCard.classList.remove("dragging");
  }

  // マウスイベントハンドラー
  handleMouseDown(e) {
    this.isDragging = true;
    this.startX = e.clientX;
    this.succubusCard.classList.add("dragging");
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;

    this.currentX = e.clientX;
    const deltaX = this.currentX - this.startX;
    const rotation = deltaX * 0.1;

    this.succubusCard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

    // スワイプインジケーター表示
    if (deltaX > 50) {
      this.succubusCard.classList.add("show-seduce");
      this.succubusCard.classList.remove("show-banish");
    } else if (deltaX < -50) {
      this.succubusCard.classList.add("show-banish");
      this.succubusCard.classList.remove("show-seduce");
    } else {
      this.succubusCard.classList.remove("show-seduce", "show-banish");
    }
  }

  handleMouseUp(e) {
    if (!this.isDragging) return;

    const deltaX = this.currentX - this.startX;
    const threshold = 100;

    if (deltaX > threshold) {
      this.seduceSuccubus();
    } else if (deltaX < -threshold) {
      this.banishSuccubus();
    } else {
      // 元の位置に戻す
      this.succubusCard.style.transform = "";
      this.succubusCard.classList.remove("show-seduce", "show-banish");
    }

    this.isDragging = false;
    this.succubusCard.classList.remove("dragging");
  }

  // モーダル関連メソッド
  setupModalEventListeners() {
    // 閉じるボタン
    this.modalClose.addEventListener("click", () => this.hideCharacterDetail());

    // オーバーレイクリック
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.hideCharacterDetail();
      }
    });

    // キーボードナビゲーション
    document.addEventListener("keydown", (e) => {
      if (this.modalState.isVisible) {
        if (e.key === "Escape") {
          this.hideCharacterDetail();
        } else if (e.key === "Enter") {
          // フォーカスされた要素がボタンの場合はクリック
          const focusedElement = document.activeElement;
          if (focusedElement && focusedElement.tagName === "BUTTON") {
            focusedElement.click();
          }
        } else if (e.key === "Tab") {
          // Tabキーでのフォーカス移動は自動的に処理される
          // 必要に応じてカスタムロジックを追加
        }
      }
    });
  }

  showCharacterDetail(character, context) {
    if (this.modalState.animationInProgress) return;

    this.modalState = {
      isVisible: true,
      currentCharacter: character,
      displayContext: context,
      animationInProgress: true,
    };

    // キャラクター詳細情報を表示
    this.renderCharacterDetail(character, context);

    // モーダル表示
    this.modal.classList.add("show");

    // スワイプ機能とボタンを無効化
    if (context === "current") {
      this.succubusCard.style.pointerEvents = "none";
      this.seduceBtn.disabled = true;
      this.banishBtn.disabled = true;
    }

    // アニメーション完了後
    setTimeout(() => {
      this.modalState.animationInProgress = false;
    }, 300);
  }

  renderCharacterDetail(character, context) {
    // データ検証
    if (!this.validateCharacterData(character)) {
      console.error("キャラクターデータが不完全です:", character);
      return;
    }

    // データのサニタイズ
    const sanitizedCharacter = this.sanitizeCharacterData(character);

    // 基本情報の表示
    const detailImage = this.modal.querySelector(".detail-image");
    const detailPowerBadge = this.modal.querySelector(".detail-power-badge");
    const detailName = this.modal.querySelector(".detail-name");
    const detailType = this.modal.querySelector(".detail-type");
    const detailOrigin = this.modal.querySelector(".detail-origin");
    const detailDescription = this.modal.querySelector(".detail-description");
    const detailAbilities = this.modal.querySelector(".detail-abilities");

    // 画像とパワーバッジ
    detailImage.src = sanitizedCharacter.image;
    detailImage.alt = `${sanitizedCharacter.name}の画像`;
    detailPowerBadge.textContent = `Power ${sanitizedCharacter.power}`;

    // 基本情報
    detailName.textContent = sanitizedCharacter.name;
    detailType.textContent = `種類: ${sanitizedCharacter.type}`;
    detailOrigin.textContent = `出身: ${sanitizedCharacter.origin}`;
    detailDescription.textContent = sanitizedCharacter.description;

    // いいね数表示を追加
    this.addLikeCountDisplay(sanitizedCharacter);

    // 能力値プログレスバーの生成
    this.renderAbilityBars(sanitizedCharacter.abilities, detailAbilities);

    // 外部リンクボタンの設定
    this.setupExternalLinks(sanitizedCharacter);

    // アクションボタンの設定
    this.setupDetailActionButtons(sanitizedCharacter, context);

    // 画像読み込みエラー処理
    detailImage.onerror = () => {
      detailImage.src =
        "https://via.placeholder.com/300x400/8b008b/ffffff?text=No%0AImage";
      detailImage.alt = "画像を読み込めませんでした";
    };
  }

  validateCharacterData(character) {
    const required = [
      "name",
      "type",
      "origin",
      "power",
      "abilities",
      "description",
    ];
    return required.every(
      (field) => character[field] !== undefined && character[field] !== null
    );
  }

  sanitizeCharacterData(character) {
    return {
      name: this.escapeHtml(character.name || ""),
      type: this.escapeHtml(character.type || ""),
      origin: this.escapeHtml(character.origin || ""),
      power: parseInt(character.power) || 0,
      abilities: character.abilities || {},
      description: this.escapeHtml(character.description || ""),
      image: character.image || "",
    };
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  setupDetailActionButtons(character, context) {
    const actionsContainer = this.modal.querySelector(".detail-actions");
    actionsContainer.innerHTML = "";

    // いいねボタンを全てのコンテキストで表示
    this.addLikeButton(actionsContainer, character);

    if (context === "current") {
      // 現在のカードの場合：誘惑/追放ボタン
      const seduceBtn = document.createElement("button");
      seduceBtn.className = "detail-action-btn seduce-btn";
      seduceBtn.innerHTML = "💋 誘惑";
      seduceBtn.addEventListener("click", () => {
        this.seduceSuccubus();
        this.hideCharacterDetail();
      });

      const banishBtn = document.createElement("button");
      banishBtn.className = "detail-action-btn banish-btn";
      banishBtn.innerHTML = "🔥 追放";
      banishBtn.addEventListener("click", () => {
        this.banishSuccubus();
        this.hideCharacterDetail();
      });

      actionsContainer.appendChild(banishBtn);
      actionsContainer.appendChild(seduceBtn);
    } else if (context === "harem") {
      // ハーレムメンバーの場合：削除ボタン
      const removeBtn = document.createElement("button");
      removeBtn.className = "detail-action-btn remove-btn";
      removeBtn.innerHTML = "💔 ハーレムから削除";
      removeBtn.addEventListener("click", () => {
        this.removeFromHarem(character);
        this.hideCharacterDetail();
      });

      actionsContainer.appendChild(removeBtn);
    }
  }

  removeFromHarem(character) {
    // ハーレムから該当キャラクターを削除
    const index = this.haremMembers.findIndex(
      (member) =>
        member.name === character.name && member.power === character.power
    );

    if (index !== -1) {
      this.haremMembers.splice(index, 1);
      this.updateHaremList();
    }
  }

  // いいねボタンを追加するメソッド
  addLikeButton(container, character) {
    if (!character.id) {
      console.warn("キャラクターにIDが設定されていません:", character);
      return;
    }

    const likeBtn = document.createElement("button");
    likeBtn.className = "detail-action-btn like-btn";

    // いいね済みかチェック
    const isAlreadyLiked = this.likeManager.isAlreadyLiked(character.id);

    if (isAlreadyLiked) {
      likeBtn.innerHTML = "💜 いいね済み";
      likeBtn.disabled = true;
      likeBtn.classList.add("liked");

      // いいね済み状態のホバー効果
      likeBtn.addEventListener("mouseenter", () => {
        if (likeBtn.disabled) {
          likeBtn.style.transform = "scale(1.02)";
        }
      });

      likeBtn.addEventListener("mouseleave", () => {
        if (likeBtn.disabled) {
          likeBtn.style.transform = "scale(1)";
        }
      });
    } else {
      likeBtn.innerHTML = "💖 いいね";
      likeBtn.disabled = false;

      // ホバー時のプレビューエフェクト
      likeBtn.addEventListener("mouseenter", () => {
        if (!likeBtn.disabled) {
          likeBtn.style.transform = "translateY(-2px) scale(1.05)";
          likeBtn.style.boxShadow = "0 6px 16px rgba(255, 20, 147, 0.6)";
        }
      });

      likeBtn.addEventListener("mouseleave", () => {
        if (!likeBtn.disabled) {
          likeBtn.style.transform = "translateY(0) scale(1)";
          likeBtn.style.boxShadow = "0 2px 8px rgba(255, 20, 147, 0.4)";
        }
      });
    }

    // いいねボタンのクリックイベント
    likeBtn.addEventListener("click", async () => {
      await this.handleLikeClick(likeBtn, character);
    });

    // いいねボタンを最初に配置
    container.insertBefore(likeBtn, container.firstChild);
  }

  // いいねボタンクリック処理
  async handleLikeClick(button, character) {
    if (!character.id) {
      console.error("キャラクターIDが不正です:", character);
      return;
    }

    // 既にいいね済みの場合は何もしない
    if (this.likeManager.isAlreadyLiked(character.id)) {
      return;
    }

    // クリック時のアニメーション
    button.classList.add("clicking");
    setTimeout(() => button.classList.remove("clicking"), 300);

    // ボタンを一時的に無効化
    button.disabled = true;
    button.innerHTML = "💫 処理中...";

    try {
      // いいねを実行
      const newLikeCount = await this.likeManager.incrementLike(character.id);

      // 成功時の処理
      button.innerHTML = "💜 いいね済み";
      button.classList.add("liked");

      // ハートエフェクトアニメーション
      this.showHeartEffect(button);

      // いいね数表示を更新（リアルタイム更新）
      await this.updateLikeCountDisplay(character.id);

      // 成功メッセージを表示
      this.showSuccessMessage(`${character.name}にいいねしました！`);

      // ハーレムリストを更新（いいね数を反映）
      this.updateHaremList();

      console.log(
        `${character.name}にいいねしました！ 総いいね数: ${newLikeCount}`
      );
    } catch (error) {
      console.error("いいね処理でエラーが発生しました:", error);

      // エラー時の処理
      button.disabled = false;
      button.innerHTML = "💖 いいね";
      button.classList.remove("liked");

      // ユーザーにエラーメッセージを表示
      this.showErrorMessage(
        "いいねの処理に失敗しました。もう一度お試しください。"
      );
    }
  }

  // ハートエフェクトアニメーション
  showHeartEffect(button) {
    // 単一のハートエフェクト
    this.createSingleHeartEffect(button);

    // ハートバーストエフェクト
    this.createHeartBurstEffect(button);
  }

  // 単一のハートエフェクト
  createSingleHeartEffect(button) {
    const heart = document.createElement("div");
    heart.className = "heart-effect";
    heart.innerHTML = "💖";

    // ボタンの位置を基準に配置
    const rect = button.getBoundingClientRect();
    heart.style.left = `${rect.left + rect.width / 2 - 15}px`;
    heart.style.top = `${rect.top - 10}px`;

    document.body.appendChild(heart);

    // アニメーション完了後に要素を削除
    setTimeout(() => {
      if (heart.parentNode) {
        heart.parentNode.removeChild(heart);
      }
    }, 1200);
  }

  // ハートバーストエフェクト
  createHeartBurstEffect(button) {
    const burstContainer = document.createElement("div");
    burstContainer.className = "heart-burst";

    // ボタンの位置を基準に配置
    const rect = button.getBoundingClientRect();
    burstContainer.style.left = `${rect.left + rect.width / 2}px`;
    burstContainer.style.top = `${rect.top + rect.height / 2}px`;

    // 複数のハートを作成
    const heartSymbols = ["💖", "💕", "💗", "💓", "💝"];
    for (let i = 0; i < 5; i++) {
      const heart = document.createElement("div");
      heart.className = "heart";
      heart.innerHTML = heartSymbols[i % heartSymbols.length];

      // ランダムな方向に配置
      const angle = i * 72 + Math.random() * 30 - 15; // 72度間隔 + ランダム
      const distance = 30 + Math.random() * 20;
      const x = Math.cos((angle * Math.PI) / 180) * distance;
      const y = Math.sin((angle * Math.PI) / 180) * distance;

      heart.style.transform = `translate(${x}px, ${y}px)`;
      burstContainer.appendChild(heart);
    }

    document.body.appendChild(burstContainer);

    // アニメーション完了後に要素を削除
    setTimeout(() => {
      if (burstContainer.parentNode) {
        burstContainer.parentNode.removeChild(burstContainer);
      }
    }, 1000);
  }

  // エラーメッセージ表示
  showErrorMessage(message) {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #8b0000, #dc143c);
      color: #ffffff;
      padding: 15px 25px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(139, 0, 0, 0.6);
      border: 2px solid #8b0000;
      animation: messageSlideIn 0.3s ease-out;
    `;
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // 3秒後に自動削除
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.style.animation = "messageSlideOut 0.3s ease-in forwards";
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
          }
        }, 300);
      }
    }, 3000);
  }

  // 成功メッセージ表示
  showSuccessMessage(message) {
    const successDiv = document.createElement("div");
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #8b008b, #9932cc);
      color: #ffffff;
      padding: 15px 25px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(139, 0, 139, 0.6);
      border: 2px solid #8b008b;
      animation: messageSlideIn 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    successDiv.innerHTML = `<span>💖</span><span>${message}</span>`;

    document.body.appendChild(successDiv);

    // 2.5秒後に自動削除
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.style.animation = "messageSlideOut 0.3s ease-in forwards";
        setTimeout(() => {
          if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
          }
        }, 300);
      }
    }, 2500);
  }

  // いいね数表示を追加
  async addLikeCountDisplay(character) {
    if (!character.id) {
      return;
    }

    // 既存のいいね数表示を削除
    const existingLikeDisplay = this.modal.querySelector(".detail-like-count");
    if (existingLikeDisplay) {
      existingLikeDisplay.remove();
    }

    try {
      // いいね数を取得
      const likeCount = await this.likeManager.getLikeCount(character.id);

      // いいね数表示要素を作成
      const likeCountDiv = document.createElement("div");
      likeCountDiv.className = "detail-like-count";
      likeCountDiv.innerHTML = `
        <div class="like-count-container">
          <span class="like-icon">💜</span>
          <span class="like-number">${likeCount}</span>
          <span class="like-label">いいね</span>
        </div>
      `;

      // 基本情報の後に挿入
      const detailOrigin = this.modal.querySelector(".detail-origin");
      if (detailOrigin) {
        detailOrigin.insertAdjacentElement("afterend", likeCountDiv);
      }
    } catch (error) {
      console.error("いいね数の取得に失敗しました:", error);
    }
  }

  // いいね数表示を更新（アニメーション付き）
  updateLikeCountDisplay(characterId, newCount) {
    const likeCountContainer = this.modal.querySelector(
      ".like-count-container"
    );
    const likeNumber = this.modal.querySelector(".like-number");

    if (likeCountContainer && likeNumber) {
      // 数値更新アニメーション
      likeNumber.classList.add("updating");
      likeCountContainer.classList.add("updated");

      // 数値を更新
      setTimeout(() => {
        likeNumber.textContent = newCount;
      }, 250);

      // アニメーションクラスを削除
      setTimeout(() => {
        likeNumber.classList.remove("updating");
        likeCountContainer.classList.remove("updated");
      }, 800);
    }
  }

  setupExternalLinks(character) {
    const externalLinksContainer = this.modal.querySelector(
      ".detail-external-links"
    );
    const linkButtons =
      externalLinksContainer.querySelectorAll(".external-link-btn");

    // 外部リンクの基本URL設定
    const externalLinks = {
      profile: "https://example.com/profile/",
      gallery: "https://example.com/gallery/",
      social: "https://example.com/social/",
    };

    linkButtons.forEach((button) => {
      const linkType = button.getAttribute("data-link-type");

      // 既存のイベントリスナーを削除
      button.replaceWith(button.cloneNode(true));
      const newButton = externalLinksContainer.querySelector(
        `[data-link-type="${linkType}"]`
      );

      // 新しいイベントリスナーを追加
      newButton.addEventListener("click", () => {
        const baseUrl = externalLinks[linkType];
        if (baseUrl) {
          const fullUrl = baseUrl + encodeURIComponent(character.name);
          this.handleExternalLink(fullUrl, character);
        }
      });
    });
  }

  handleExternalLink(url, character) {
    // URLの検証
    if (!this.isValidUrl(url)) {
      console.error("無効なURLです:", url);
      return;
    }

    // 新しいタブで開く（rel="noopener noreferrer"相当）
    const newWindow = window.open(url, "_blank");
    if (newWindow) {
      newWindow.opener = null; // セキュリティ対策
    }
  }

  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "https:" || urlObj.protocol === "http:";
    } catch {
      return false;
    }
  }

  renderAbilityBars(abilities, container) {
    container.innerHTML = "";

    Object.entries(abilities).forEach(([abilityName, value]) => {
      const abilityItem = document.createElement("div");
      abilityItem.className = "ability-item";

      // 能力名
      const abilityLabel = document.createElement("div");
      abilityLabel.className = "ability-label";
      abilityLabel.textContent = abilityName;

      // プログレスバーコンテナ
      const barContainer = document.createElement("div");
      barContainer.className = "ability-bar-container";

      // プログレスバー
      const abilityBar = document.createElement("div");
      abilityBar.className = "ability-bar";

      // 能力値（最大20として計算）
      const percentage = Math.min((value / 20) * 100, 100);

      // 値表示
      const abilityValue = document.createElement("div");
      abilityValue.className = "ability-value";
      abilityValue.textContent = value;

      // 要素を組み立て
      barContainer.appendChild(abilityBar);
      abilityItem.appendChild(abilityLabel);
      abilityItem.appendChild(barContainer);
      abilityItem.appendChild(abilityValue);
      container.appendChild(abilityItem);

      // アニメーション効果（少し遅延させて実行）
      setTimeout(() => {
        abilityBar.style.width = `${percentage}%`;
      }, 100);
    });
  }

  hideCharacterDetail() {
    if (this.modalState.animationInProgress) return;

    this.modalState.animationInProgress = true;

    // モーダル非表示
    this.modal.classList.remove("show");

    // スワイプ機能とボタンを再有効化
    this.succubusCard.style.pointerEvents = "";
    this.seduceBtn.disabled = false;
    this.banishBtn.disabled = false;

    // アニメーション完了後
    setTimeout(() => {
      // メモリリーク防止：モーダル内容をクリア
      this.clearModalContent();

      this.modalState = {
        isVisible: false,
        currentCharacter: null,
        displayContext: null,
        animationInProgress: false,
      };
    }, 300);
  }

  // プロフィール画面でのいいね数表示機能
  async addLikeCountDisplay(character) {
    // いいね数表示エリアを探すか作成
    let likeCountContainer = this.modal.querySelector(".detail-like-count");

    if (!likeCountContainer) {
      // いいね数表示コンテナを作成
      likeCountContainer = document.createElement("div");
      likeCountContainer.className = "detail-like-count";

      // 基本情報の後、能力値の前に挿入
      const detailBody = this.modal.querySelector(".detail-body");
      const detailAbilities = this.modal.querySelector(".detail-abilities");

      if (detailBody && detailAbilities) {
        detailBody.insertBefore(likeCountContainer, detailAbilities);
      }
    }

    // いいね数を取得して表示
    if (character.id) {
      try {
        const likeCount = await this.likeManager.getLikeCount(character.id);
        this.renderLikeCountDisplay(likeCountContainer, likeCount);
      } catch (error) {
        console.error("いいね数の取得に失敗しました:", error);
        this.renderLikeCountDisplay(likeCountContainer, 0);
      }
    } else {
      // IDがない場合は0を表示
      this.renderLikeCountDisplay(likeCountContainer, 0);
    }
  }

  // いいね数表示のレンダリング
  renderLikeCountDisplay(container, likeCount) {
    container.innerHTML = `
      <div class="like-count-display">
        <div class="like-count-icon">💜</div>
        <div class="like-count-info">
          <div class="like-count-label">受け取ったいいね</div>
          <div class="like-count-number" data-count="${likeCount}">${likeCount}</div>
        </div>
      </div>
    `;

    // アニメーション効果を追加
    const numberElement = container.querySelector(".like-count-number");
    if (numberElement && likeCount > 0) {
      // カウントアップアニメーション
      this.animateCountUp(numberElement, 0, likeCount, 800);
    }
  }

  // カウントアップアニメーション
  animateCountUp(element, start, end, duration) {
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // イージング関数（ease-out）
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(start + (end - start) * easeOut);

      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = end;
      }
    };

    requestAnimationFrame(animate);
  }

  // リアルタイム更新機能
  async updateLikeCountDisplay(characterId) {
    if (!this.modalState.isVisible || !this.modalState.currentCharacter) {
      return;
    }

    // 現在表示中のキャラクターのいいね数を更新
    if (this.modalState.currentCharacter.id === characterId) {
      try {
        const likeCount = await this.likeManager.getLikeCount(characterId);
        const likeCountContainer =
          this.modal.querySelector(".detail-like-count");

        if (likeCountContainer) {
          this.renderLikeCountDisplay(likeCountContainer, likeCount);
        }
      } catch (error) {
        console.error("いいね数のリアルタイム更新に失敗しました:", error);
      }
    }
  }

  clearModalContent() {
    // DOM要素の参照をクリアしてメモリリークを防止
    const actionsContainer = this.modal.querySelector(".detail-actions");
    const abilitiesContainer = this.modal.querySelector(".detail-abilities");
    const likeCountContainer = this.modal.querySelector(".detail-like-count");

    if (actionsContainer) {
      actionsContainer.innerHTML = "";
    }
    if (abilitiesContainer) {
      abilitiesContainer.innerHTML = "";
    }
    if (likeCountContainer) {
      likeCountContainer.innerHTML = "";
    }
  }
}

// アプリ初期化
document.addEventListener("DOMContentLoaded", () => {
  const app = new SuccubusRealmApp();

  // デバッグ用：LikeManagerをグローバルに公開
  window.likeManager = app.likeManager;
  window.app = app;

  console.log("Succubus Realm アプリが初期化されました");
  console.log("デバッグ用: window.likeManager でLikeManagerにアクセスできます");
});
