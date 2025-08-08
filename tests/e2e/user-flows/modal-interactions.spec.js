import { test, expect } from '@playwright/test';
import { MainPage } from '../page-objects/main-page.js';
import { CharacterModal } from '../page-objects/character-modal.js';

test.describe('モーダルインタラクション', () => {
  let mainPage;
  let characterModal;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    characterModal = new CharacterModal(page);
    await mainPage.goto();
  });

  test('モーダルの基本表示要素', async () => {
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // 基本要素の表示確認
    await expect(characterModal.characterName).toBeVisible();
    await expect(characterModal.characterImage).toBeVisible();
    await expect(characterModal.characterDescription).toBeVisible();
    await expect(characterModal.likeButton).toBeVisible();
    await expect(characterModal.closeButton).toBeVisible();
    
    // キャラクター情報が空でないことを確認
    const characterName = await characterModal.getCharacterName();
    expect(characterName).toBeTruthy();
    expect(characterName.length).toBeGreaterThan(0);
  });

  test('モーダルのキャラクター情報表示', async () => {
    // メインページでキャラクター名を取得
    const mainPageCharacterName = await mainPage.getCurrentCharacterName();
    
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // モーダル内のキャラクター名を取得
    const modalCharacterName = await characterModal.getCharacterName();
    
    // 同じキャラクターの情報が表示されることを確認
    expect(modalCharacterName).toBe(mainPageCharacterName);
    
    // 説明文が存在することを確認
    const description = await characterModal.getCharacterDescription();
    expect(description).toBeTruthy();
  });

  test('モーダル内のいいねボタンの状態', async () => {
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // いいねボタンがクリック可能であることを確認
    await expect(characterModal.likeButton).toBeEnabled();
    
    // いいね数表示が存在することを確認
    await expect(characterModal.likeCount).toBeVisible();
    
    // いいね数が非負の数値であることを確認
    const likeCount = await characterModal.getLikeCount();
    expect(likeCount).toBeGreaterThanOrEqual(0);
  });

  test('キーボードでのモーダル操作', async ({ page }) => {
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // Escapeキーでモーダルが閉じることを確認
    await page.keyboard.press('Escape');
    await expect(characterModal.modal).not.toBeVisible();
    
    // 再度モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // Enterキーでいいねできることを確認
    const initialLikeCount = await characterModal.getLikeCount();
    await characterModal.likeButton.focus();
    await page.keyboard.press('Enter');
    
    // いいね数の変化を待つ
    await expect(async () => {
      const currentCount = await characterModal.getLikeCount();
      return currentCount > initialLikeCount;
    }).toPass({ timeout: 3000 });
    
    const newLikeCount = await characterModal.getLikeCount();
    expect(newLikeCount).toBeGreaterThan(initialLikeCount);
  });

  test('モーダルのアニメーション表示', async ({ page }) => {
    // モーダル開閉のアニメーションをテスト
    await mainPage.openCharacterModal();
    
    // モーダルの表示を待つ
    await expect(characterModal.modal).toBeVisible();
    // アニメーションの完了を待つ
    await page.waitForLoadState('networkidle');
    
    // モーダルが完全に表示されていることを確認
    const opacity = await characterModal.modal.evaluate(el => 
      window.getComputedStyle(el).opacity
    );
    expect(parseFloat(opacity)).toBeGreaterThan(0.5);
  });

  test('複数モーダルの同時表示防止', async ({ page }) => {
    // 最初のモーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // 同じキャラクター画像を再度クリック
    await mainPage.characterImage.click();
    
    // モーダルが1つのみ表示されることを確認
    const modalCount = await page.locator('.character-modal').count();
    expect(modalCount).toBeLessThanOrEqual(1);
  });

  test('モーダル内でのスクロール動作', async ({ page }) => {
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // モーダル内でスクロールが可能かテスト
    const modalContent = characterModal.modal.locator('.modal-content');
    if (await modalContent.isVisible()) {
      // スクロール可能な要素がある場合のテスト
      await modalContent.hover();
      await page.mouse.wheel(0, 100);
      // スクロール完了を待つ
      await page.waitForLoadState('domcontentloaded');
      
      // モーダルが閉じていないことを確認
      await expect(characterModal.modal).toBeVisible();
    }
  });

  test('モーダルの応答性（レスポンシブデザイン）', async ({ page }) => {
    // デスクトップサイズでモーダルを開く
    await page.setViewportSize({ width: 1920, height: 1080 });
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    let modalWidth = await characterModal.modal.evaluate(el => 
      el.getBoundingClientRect().width
    );
    
    // モーダルを閉じる
    await characterModal.close();
    
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    let mobileModalWidth = await characterModal.modal.evaluate(el => 
      el.getBoundingClientRect().width
    );
    
    // モバイルサイズで幅が調整されることを確認
    expect(mobileModalWidth).toBeLessThan(modalWidth);
    
    // 元のサイズに戻す
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('モーダル内でのタッチジェスチャー', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // タッチでいいねボタンをタップ
    const initialLikeCount = await characterModal.getLikeCount();
    
    await characterModal.likeButton.tap();
    
    // いいね数の変化を待つ
    await expect(async () => {
      const currentCount = await characterModal.getLikeCount();
      return currentCount > initialLikeCount;
    }).toPass({ timeout: 3000 });
    
    const newLikeCount = await characterModal.getLikeCount();
    expect(newLikeCount).toBeGreaterThan(initialLikeCount);
  });
});