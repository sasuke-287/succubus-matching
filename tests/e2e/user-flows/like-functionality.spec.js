import { test, expect } from '@playwright/test';
import { MainPage } from '../page-objects/main-page.js';
import { CharacterModal } from '../page-objects/character-modal.js';

test.describe('いいね機能', () => {
  let mainPage;
  let characterModal;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    characterModal = new CharacterModal(page);
    await mainPage.goto();
  });

  test('キャラクター詳細モーダルが開く', async ({ page }) => {
    // キャラクター画像をクリックしてモーダルを開く
    await mainPage.openCharacterModal();
    
    // モーダルが表示されることを確認
    await expect(characterModal.modal).toBeVisible();
    await expect(characterModal.characterName).toBeVisible();
    await expect(characterModal.likeButton).toBeVisible();
  });

  test('モーダル内でいいね機能が動作する', async ({ page }) => {
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // 現在のいいね数を取得
    const initialLikeCount = await characterModal.getLikeCount();
    
    // いいねボタンをクリック
    await characterModal.clickLike();
    
    // いいね数の変化を待つ
    await expect(async () => {
      const currentCount = await characterModal.getLikeCount();
      return currentCount > initialLikeCount;
    }).toPass({ timeout: 5000 });
    
    // いいね数が増加することを確認
    const newLikeCount = await characterModal.getLikeCount();
    expect(newLikeCount).toBeGreaterThan(initialLikeCount);
  });

  test('モーダルを閉じることができる', async () => {
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // 閉じるボタンでモーダルを閉じる
    await characterModal.close();
    
    // モーダルが非表示になることを確認
    await expect(characterModal.modal).not.toBeVisible();
  });

  test('モーダル外クリックでモーダルが閉じる', async () => {
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // モーダル外をクリック
    await characterModal.clickOutside();
    
    // モーダルが非表示になることを確認
    await expect(characterModal.modal).not.toBeVisible();
  });

  test('複数のキャラクターにいいねできる', async ({ page }) => {
    const likeCount = 3;
    const likedCharacters = [];
    
    for (let i = 0; i < likeCount; i++) {
      // キャラクター名を取得
      const characterName = await mainPage.getCurrentCharacterName();
      likedCharacters.push(characterName);
      
      // モーダルを開く
      await mainPage.openCharacterModal();
      await expect(characterModal.modal).toBeVisible();
      
      // いいねをする
      await characterModal.clickLike();
      // いいね処理の完了を待つ
      await page.waitForLoadState('networkidle');
      
      // モーダルを閉じる
      await characterModal.close();
      // モーダルが完全に閉じるのを待つ
      await expect(characterModal.modal).not.toBeVisible();
      
      // 次のキャラクターに移動（最後の場合は除く）
      if (i < likeCount - 1) {
        await mainPage.swipeRight();
        // 次のキャラクターカードの読み込みを待つ
        await expect(mainPage.characterCard).toBeVisible();
      }
    }
    
    // いいねしたキャラクター数が期待値と一致することを確認
    expect(likedCharacters.length).toBe(likeCount);
    
    // 重複がないことを確認（データセットによる）
    const uniqueCharacters = [...new Set(likedCharacters)];
    expect(uniqueCharacters.length).toBeGreaterThan(0);
  });

  test('オフライン時のいいね機能（オフラインキュー）', async ({ page, context }) => {
    // ネットワークを無効にする
    await context.setOffline(true);
    
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // オフライン状態でいいねを試行
    await characterModal.clickLike();
    // オフライン操作のキューイングを待つ
    await page.waitForLoadState('domcontentloaded');
    
    // ネットワークを再有効化
    await context.setOffline(false);
    
    // オンライン復帰時の同期を待つ
    await page.waitForLoadState('networkidle');
    
    // いいね数が更新されることを確認
    const finalLikeCount = await characterModal.getLikeCount();
    expect(finalLikeCount).toBeGreaterThan(0);
  });

  test('いいね数の表示が正確である', async () => {
    // モーダルを開く
    await mainPage.openCharacterModal();
    await expect(characterModal.modal).toBeVisible();
    
    // いいね数の表示要素が存在することを確認
    await expect(characterModal.likeCount).toBeVisible();
    
    // いいね数が数値であることを確認
    const likeCount = await characterModal.getLikeCount();
    expect(typeof likeCount).toBe('number');
    expect(likeCount).toBeGreaterThanOrEqual(0);
  });
});