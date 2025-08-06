/**
 * キャラクター詳細モーダルのPage Objectパターン実装
 */
export class CharacterModal {
  constructor(page) {
    this.page = page;
    this.modal = page.locator('.character-modal');
    this.closeButton = page.locator('.modal-close');
    this.characterName = page.locator('.modal-character-name');
    this.characterImage = page.locator('.modal-character-image');
    this.characterDescription = page.locator('.character-description');
    this.likeButton = page.locator('.modal-like-button');
    this.likeCount = page.locator('.like-count');
    this.addToHaremButton = page.locator('.add-to-harem-button');
  }

  /**
   * モーダルが表示されているかチェック
   */
  async isVisible() {
    return await this.modal.isVisible();
  }

  /**
   * モーダルを閉じる
   */
  async close() {
    await this.closeButton.click();
  }

  /**
   * キャラクター名を取得
   */
  async getCharacterName() {
    return await this.characterName.textContent();
  }

  /**
   * キャラクター説明を取得
   */
  async getCharacterDescription() {
    return await this.characterDescription.textContent();
  }

  /**
   * いいねボタンをクリック
   */
  async clickLike() {
    await this.likeButton.click();
  }

  /**
   * いいね数を取得
   */
  async getLikeCount() {
    const text = await this.likeCount.textContent();
    return parseInt(text.replace(/[^\d]/g, '')) || 0;
  }

  /**
   * ハーレムに追加ボタンをクリック
   */
  async addToHarem() {
    await this.addToHaremButton.click();
  }

  /**
   * モーダルの外側をクリックして閉じる
   */
  async clickOutside() {
    await this.page.click('body', { position: { x: 10, y: 10 } });
  }
}