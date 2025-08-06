// LikeManagerクラスの実装検証スクリプト
// ブラウザのコンソールで実行して実装を検証

function validateLikeManagerImplementation() {
  console.log('=== LikeManager実装検証 ===');
  
  // 1. クラスの存在確認
  if (typeof LikeManager === 'undefined') {
    console.error('✗ LikeManagerクラスが定義されていません');
    return false;
  }
  console.log('✓ LikeManagerクラスが定義されています');
  
  // 2. インスタンス作成確認
  let likeManager;
  try {
    likeManager = new LikeManager();
    console.log('✓ LikeManagerインスタンスが作成できます');
  } catch (error) {
    console.error('✗ LikeManagerインスタンス作成エラー:', error);
    return false;
  }
  
  // 3. 必要なメソッドの存在確認
  const requiredMethods = [
    'getCharacterById',
    'incrementLike',
    'getLikeCount',
    'getAllLikes',
    'isAlreadyLiked',
    'markAsLiked',
    'loadLikedCharacters'
  ];
  
  let methodsValid = true;
  requiredMethods.forEach(method => {
    if (typeof likeManager[method] === 'function') {
      console.log(`✓ ${method}メソッドが実装されています`);
    } else {
      console.error(`✗ ${method}メソッドが実装されていません`);
      methodsValid = false;
    }
  });
  
  if (!methodsValid) {
    return false;
  }
  
  // 4. 基本機能のテスト
  console.log('\n--- 基本機能テスト ---');
  
  // getCharacterByIdテスト
  if (typeof succubi !== 'undefined' && succubi.length > 0) {
    const testCharacter = likeManager.getCharacterById(1);
    if (testCharacter && testCharacter.id === 1) {
      console.log('✓ getCharacterById正常動作');
    } else {
      console.error('✗ getCharacterById異常動作');
    }
  }
  
  // ローカルストレージ機能テスト
  try {
    const initialLiked = likeManager.loadLikedCharacters();
    console.log('✓ loadLikedCharacters正常動作:', initialLiked);
    
    likeManager.markAsLiked(999); // テスト用ID
    const afterMark = likeManager.loadLikedCharacters();
    
    if (afterMark.includes(999)) {
      console.log('✓ markAsLiked正常動作');
      
      const isLiked = likeManager.isAlreadyLiked(999);
      if (isLiked) {
        console.log('✓ isAlreadyLiked正常動作');
      } else {
        console.error('✗ isAlreadyLiked異常動作');
      }
    } else {
      console.error('✗ markAsLiked異常動作');
    }
    
    // テストデータをクリーンアップ
    likeManager.clearLikedCharacters();
    
  } catch (error) {
    console.error('✗ ローカルストレージ機能エラー:', error);
  }
  
  // 5. エラーハンドリングテスト
  console.log('\n--- エラーハンドリングテスト ---');
  
  // 無効なIDでのgetCharacterById
  const invalidCharacter = likeManager.getCharacterById(null);
  if (invalidCharacter === null) {
    console.log('✓ 無効IDでのgetCharacterById正常処理');
  } else {
    console.error('✗ 無効IDでのgetCharacterById異常処理');
  }
  
  // 無効なIDでのisAlreadyLiked
  const invalidLiked = likeManager.isAlreadyLiked(null);
  if (invalidLiked === false) {
    console.log('✓ 無効IDでのisAlreadyLiked正常処理');
  } else {
    console.error('✗ 無効IDでのisAlreadyLiked異常処理');
  }
  
  console.log('\n=== 実装検証完了 ===');
  return true;
}

// グローバルに公開
window.validateLikeManagerImplementation = validateLikeManagerImplementation;

console.log('LikeManager実装検証スクリプトが読み込まれました');
console.log('ブラウザのコンソールで validateLikeManagerImplementation() を実行してください');