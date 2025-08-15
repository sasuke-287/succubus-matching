import { test, expect } from '@playwright/test';

// E2Eテスト: ユーザーインタラクション
test.describe('ユーザーインタラクション E2E テスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にローカルストレージをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('ページが正常に読み込まれる', async ({ page }) => {
    await page.goto('/');
    
    // ページタイトルの確認
    await expect(page).toHaveTitle(/魅惑のサキュバスマッチング/);
    
    // メインコンテンツの確認
    await expect(page.locator('h1')).toContainText('魅惑のサキュバスマッチング');
    await expect(page.locator('#character-grid')).toBeVisible();
  });

  test('キャラクターカードが表示される', async ({ page }) => {
    await page.goto('/');
    
    // キャラクターデータの読み込み完了を待機
    await page.waitForSelector('.character-card', { timeout: 10000 });
    
    // キャラクターカードの存在確認
    const characterCards = page.locator('.character-card');
    await expect(characterCards).toHaveCount.greaterThan(0);
    
    // 最初のキャラクターカードの内容確認
    const firstCard = characterCards.first();
    await expect(firstCard.locator('.character-name')).toBeVisible();
    await expect(firstCard.locator('.character-type')).toBeVisible();
    await expect(firstCard.locator('.like-btn')).toBeVisible();
    await expect(firstCard.locator('.like-count')).toBeVisible();
  });

  test('いいねボタンが正常に動作する', async ({ page }) => {
    await page.goto('/');
    
    // キャラクターカードの読み込み完了を待機
    await page.waitForSelector('.character-card', { timeout: 10000 });
    
    const firstCard = page.locator('.character-card').first();
    const likeBtn = firstCard.locator('.like-btn');
    const likeCount = firstCard.locator('.like-count');
    
    // 初期いいね数を取得
    const initialCount = await likeCount.textContent();
    const initialCountNum = parseInt(initialCount || '0');
    
    // いいねボタンをクリック
    await likeBtn.click();
    
    // いいね数の増加を確認
    await expect(likeCount).toContainText((initialCountNum + 1).toString());
    
    // ボタンの状態変化を確認
    await expect(likeBtn).toHaveClass(/liked/);
    await expect(likeBtn).toBeDisabled();
    await expect(likeBtn).toContainText('いいね済み');
  });

  test('キャラクター詳細表示が正常に動作する', async ({ page }) => {
    await page.goto('/');
    
    // キャラクターカードの読み込み完了を待機
    await page.waitForSelector('.character-card', { timeout: 10000 });
    
    const firstCard = page.locator('.character-card').first();
    const characterName = await firstCard.locator('.character-name').textContent();
    
    // キャラクターカードをクリック
    await firstCard.click();
    
    // 詳細表示の確認
    await expect(page.locator('#character-detail')).toBeVisible();
    await expect(page.locator('#character-detail .character-name')).toContainText(characterName || '');
    await expect(page.locator('#character-detail .character-abilities')).toBeVisible();
    await expect(page.locator('#character-detail .character-description')).toBeVisible();
  });

  test('ハーレム表示が正常に動作する', async ({ page }) => {
    await page.goto('/');
    
    // ハーレムボタンをクリック
    await page.click('#harem-btn');
    
    // ハーレム表示の確認
    await expect(page.locator('#harem-view')).toBeVisible();
    await expect(page.locator('#harem-view h2')).toContainText('あなたのハーレム');
  });

  test('いいね済み状態がローカルストレージに保存される', async ({ page }) => {
    await page.goto('/');
    
    // キャラクターカードの読み込み完了を待機
    await page.waitForSelector('.character-card', { timeout: 10000 });
    
    const firstCard = page.locator('.character-card').first();
    const characterId = await firstCard.getAttribute('data-character-id');
    const likeBtn = firstCard.locator('.like-btn');
    
    // いいねボタンをクリック
    await likeBtn.click();
    
    // ローカルストレージの確認
    const likedCharacters = await page.evaluate(() => {
      const stored = localStorage.getItem('succubus-realm-likes');
      return stored ? JSON.parse(stored).likedCharacters : [];
    });
    
    expect(likedCharacters).toContain(parseInt(characterId || '0'));
  });

  test('ページリロード後もいいね済み状態が保持される', async ({ page }) => {
    await page.goto('/');
    
    // キャラクターカードの読み込み完了を待機
    await page.waitForSelector('.character-card', { timeout: 10000 });
    
    const firstCard = page.locator('.character-card').first();
    const likeBtn = firstCard.locator('.like-btn');
    
    // いいねボタンをクリック
    await likeBtn.click();
    
    // いいね済み状態の確認
    await expect(likeBtn).toHaveClass(/liked/);
    
    // ページをリロード
    await page.reload();
    await page.waitForSelector('.character-card', { timeout: 10000 });
    
    // リロード後もいいね済み状態が保持されていることを確認
    const reloadedFirstCard = page.locator('.character-card').first();
    const reloadedLikeBtn = reloadedFirstCard.locator('.like-btn');
    
    await expect(reloadedLikeBtn).toHaveClass(/liked/);
    await expect(reloadedLikeBtn).toBeDisabled();
  });

  test('複数キャラクターのいいねが正常に動作する', async ({ page }) => {
    await page.goto('/');
    
    // キャラクターカードの読み込み完了を待機
    await page.waitForSelector('.character-card', { timeout: 10000 });
    
    const characterCards = page.locator('.character-card');
    const cardCount = await characterCards.count();
    
    if (cardCount >= 3) {
      // 最初の3つのキャラクターにいいね
      for (let i = 0; i < 3; i++) {
        const card = characterCards.nth(i);
        const likeBtn = card.locator('.like-btn');
        
        await likeBtn.click();
        await expect(likeBtn).toHaveClass(/liked/);
      }
      
      // ローカルストレージの確認
      const likedCharacters = await page.evaluate(() => {
        const stored = localStorage.getItem('succubus-realm-likes');
        return stored ? JSON.parse(stored).likedCharacters : [];
      });
      
      expect(likedCharacters.length).toBe(3);
    }
  });

  test('エラー状態の適切な表示', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('**/api/characters', route => route.abort());
    
    await page.goto('/');
    
    // エラーメッセージの表示確認
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-message')).toContainText('データの読み込みに失敗しました');
  });

  test('レスポンシブデザインの確認', async ({ page }) => {
    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // キャラクターカードの読み込み完了を待機
    await page.waitForSelector('.character-card', { timeout: 10000 });
    
    // モバイル表示の確認
    const characterGrid = page.locator('#character-grid');
    await expect(characterGrid).toBeVisible();
    
    // キャラクターカードがモバイルレイアウトで表示されることを確認
    const firstCard = page.locator('.character-card').first();
    await expect(firstCard).toBeVisible();
    
    // タブレットサイズでテスト
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(characterGrid).toBeVisible();
    
    // デスクトップサイズでテスト
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(characterGrid).toBeVisible();
  });

  test('キーボードナビゲーションの確認', async ({ page }) => {
    await page.goto('/');
    
    // キャラクターカードの読み込み完了を待機
    await page.waitForSelector('.character-card', { timeout: 10000 });
    
    // Tabキーでナビゲーション
    await page.keyboard.press('Tab');
    
    // フォーカスされた要素の確認
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Enterキーでクリック操作
    await page.keyboard.press('Enter');
    
    // 適切な動作が実行されることを確認（詳細表示またはいいね）
    // 実装に応じて適切な確認を行う
  });

  test('アクセシビリティの基本確認', async ({ page }) => {
    await page.goto('/');
    
    // キャラクターカードの読み込み完了を待機
    await page.waitForSelector('.character-card', { timeout: 10000 });
    
    // 基本的なアクセシビリティ要素の確認
    const firstCard = page.locator('.character-card').first();
    const likeBtn = firstCard.locator('.like-btn');
    
    // ボタンにaria-labelまたはテキストがあることを確認
    const buttonText = await likeBtn.textContent();
    const ariaLabel = await likeBtn.getAttribute('aria-label');
    
    expect(buttonText || ariaLabel).toBeTruthy();
    
    // 画像にalt属性があることを確認
    const characterImage = firstCard.locator('img');
    if (await characterImage.count() > 0) {
      const altText = await characterImage.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });
});