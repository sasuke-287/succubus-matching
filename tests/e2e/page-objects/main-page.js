/**
 * メインページのPage Objectパターン実装
 */
export class MainPage {
  constructor(page) {
    this.page = page;
    this.characterCard = page.locator('.character-card');
    this.likeButton = page.locator('.like-button');
    this.passButton = page.locator('.pass-button');
    this.haremButton = page.locator('.harem-button');
    this.characterImage = page.locator('.character-image');
    this.characterName = page.locator('.character-name');
    this.swipeIndicator = page.locator('.swipe-indicator');
  }

  /**
   * アプリケーションにアクセス
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * 右スワイプ（いいね）
   */
  async swipeRight() {
    const card = this.characterCard;
    const box = await card.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width + 100, box.y + box.height / 2);
      await this.page.mouse.up();
    }
  }

  /**
   * 左スワイプ（パス）
   */
  async swipeLeft() {
    const card = this.characterCard;
    const box = await card.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x - 100, box.y + box.height / 2);
      await this.page.mouse.up();
    }
  }

  /**
   * いいねボタンをクリック
   */
  async clickLike() {
    await this.likeButton.click();
  }

  /**
   * パスボタンをクリック
   */
  async clickPass() {
    await this.passButton.click();
  }

  /**
   * ハーレムボタンをクリック
   */
  async clickHarem() {
    await this.haremButton.click();
  }

  /**
   * キャラクター詳細モーダルを開く
   */
  async openCharacterModal() {
    await this.characterImage.click();
  }

  /**
   * 現在のキャラクター名を取得
   */
  async getCurrentCharacterName() {
    return await this.characterName.textContent();
  }

  /**
   * スワイプインジケーターの種類を取得
   */
  async getSwipeIndicatorType() {
    const indicator = this.swipeIndicator;
    if (await indicator.locator('.like').isVisible()) {
      return 'like';
    }
    if (await indicator.locator('.pass').isVisible()) {
      return 'pass';
    }
    return null;
  }
}