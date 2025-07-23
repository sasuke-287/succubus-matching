// サキュバスデータ（JSONから読み込み）
let succubi = [];

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
    document.getElementById("succubusDescription").textContent =
      succubus.description;
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
    const actionText = direction === "right" ? "💋 誘惑しました！" : "🔥 追放しました！";
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
      ${remainingCount > 0 ? 
        `<div style="font-size: 0.9rem; color: #9370db; margin-top: 10px;">
          残り ${remainingCount} 人のサキュバス
        </div>` : 
        `<div style="font-size: 0.9rem; color: #dda0dd; margin-top: 10px;">
          🌙 全ての出会いが完了します
        </div>`
      }
    `;
    
    // CSSアニメーションを追加
    if (!document.getElementById('swipe-feedback-style')) {
      const style = document.createElement('style');
      style.id = 'swipe-feedback-style';
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

  updateHaremList() {
    this.haremList.innerHTML = "";
    this.haremMembers.forEach((succubus, index) => {
      const item = document.createElement("div");
      item.className = "harem-member";
      item.innerHTML = `
                <h4>${succubus.name} (Power ${succubus.power})</h4>
                <p>${succubus.type} - ${succubus.origin}</p>
            `;

      // ハーレムメンバーのクリックイベント
      item.addEventListener("click", () => {
        this.showCharacterDetail(succubus, "harem");
      });

      // データ属性でインデックスを保存
      item.setAttribute("data-harem-index", index);

      this.haremList.appendChild(item);
    });
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

  clearModalContent() {
    // DOM要素の参照をクリアしてメモリリークを防止
    const actionsContainer = this.modal.querySelector(".detail-actions");
    const abilitiesContainer = this.modal.querySelector(".detail-abilities");

    if (actionsContainer) {
      actionsContainer.innerHTML = "";
    }
    if (abilitiesContainer) {
      abilitiesContainer.innerHTML = "";
    }
  }
}

// アプリ初期化
document.addEventListener("DOMContentLoaded", () => {
  new SuccubusRealmApp();
});
