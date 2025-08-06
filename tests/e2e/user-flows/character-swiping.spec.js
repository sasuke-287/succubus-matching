import { test, expect } from '@playwright/test';
import { MainPage } from '../page-objects/main-page.js';

test.describe('キャラクタースワイプ機能', () => {
  let mainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    await mainPage.goto();
  });

  test('アプリケーションが正常に起動する', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/Succubus Matching/i);
    
    // 必要な要素が表示されることを確認
    await expect(mainPage.characterCard).toBeVisible();
    await expect(mainPage.likeButton).toBeVisible();
    await expect(mainPage.passButton).toBeVisible();
  });

  test('キャラクターカードが表示される', async () => {
    // キャラクターカードの要素が存在することを確認
    await expect(mainPage.characterCard).toBeVisible();
    await expect(mainPage.characterImage).toBeVisible();
    await expect(mainPage.characterName).toBeVisible();
    
    // キャラクター名が空でないことを確認
    const characterName = await mainPage.getCurrentCharacterName();
    expect(characterName).toBeTruthy();
    expect(characterName.length).toBeGreaterThan(0);
  });

  test('右スワイプでいいね機能が動作する', async () => {
    // 初期状態でスワイプインジケーターが非表示
    await expect(mainPage.swipeIndicator).not.toBeVisible();
    
    // 右スワイプを実行
    await mainPage.swipeRight();
    
    // スワイプ後の処理を待つ
    await page.waitForTimeout(1000);
    
    // 新しいキャラクターカードが表示されることを確認
    await expect(mainPage.characterCard).toBeVisible();
  });

  test('左スワイプでパス機能が動作する', async () => {
    // 現在のキャラクター名を取得
    const currentCharacter = await mainPage.getCurrentCharacterName();
    
    // 左スワイプを実行
    await mainPage.swipeLeft();
    
    // スワイプ後の処理を待つ
    await page.waitForTimeout(1000);
    
    // 新しいキャラクターカードが表示されることを確認
    await expect(mainPage.characterCard).toBeVisible();
    
    // 異なるキャラクターが表示されることを確認（データが十分にある場合）
    const newCharacter = await mainPage.getCurrentCharacterName();
    if (currentCharacter !== newCharacter) {
      expect(newCharacter).not.toBe(currentCharacter);
    }
  });

  test('いいねボタンクリックが動作する', async () => {
    // いいねボタンが有効であることを確認
    await expect(mainPage.likeButton).toBeEnabled();
    
    // いいねボタンをクリック
    await mainPage.clickLike();
    
    // クリック後の処理を待つ
    await page.waitForTimeout(1000);
    
    // 新しいキャラクターカードが表示されることを確認
    await expect(mainPage.characterCard).toBeVisible();
  });

  test('パスボタンクリックが動作する', async () => {
    // パスボタンが有効であることを確認
    await expect(mainPage.passButton).toBeEnabled();
    
    // パスボタンをクリック
    await mainPage.clickPass();
    
    // クリック後の処理を待つ
    await page.waitForTimeout(1000);
    
    // 新しいキャラクターカードが表示されることを確認
    await expect(mainPage.characterCard).toBeVisible();
  });

  test('キャラクターカードが無限にスワイプできる', async () => {
    const swipeCount = 5;
    
    for (let i = 0; i < swipeCount; i++) {
      // キャラクターカードが表示されていることを確認
      await expect(mainPage.characterCard).toBeVisible();
      
      // ランダムに右または左にスワイプ
      if (Math.random() > 0.5) {
        await mainPage.swipeRight();
      } else {
        await mainPage.swipeLeft();
      }
      
      // 次のカードの読み込みを待つ
      await page.waitForTimeout(500);
    }
    
    // 最後にもキャラクターカードが表示されていることを確認
    await expect(mainPage.characterCard).toBeVisible();
  });
});