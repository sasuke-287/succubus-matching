/**
 * テストユーティリティ関数集
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import path from 'path';

/**
 * テスト用データファイルの管理
 */
export class TestDataManager {
  constructor(baseDir = 'tests/__fixtures__') {
    this.baseDir = baseDir;
  }

  /**
   * フィクスチャーファイルを読み込み
   * @param {string} filename - ファイル名
   * @returns {Object} パースされたJSONデータ
   */
  loadFixture(filename) {
    const filePath = path.join(process.cwd(), this.baseDir, filename);
    if (!existsSync(filePath)) {
      throw new Error(`フィクスチャーファイルが見つかりません: ${filePath}`);
    }
    return JSON.parse(readFileSync(filePath, 'utf8'));
  }

  /**
   * テスト用一時ファイルを作成
   * @param {string} filename - ファイル名
   * @param {Object} data - 書き込むデータ
   * @returns {string} 作成されたファイルのパス
   */
  createTempFile(filename, data) {
    const filePath = path.join(process.cwd(), 'tests/__temp__', filename);
    const dir = path.dirname(filePath);
    
    // ディレクトリが存在しない場合は作成
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return filePath;
  }

  /**
   * テスト用一時ファイルを削除
   * @param {string} filePath - ファイルパス
   */
  cleanupTempFile(filePath) {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}

/**
 * 非同期処理のテストヘルパー
 */
export class AsyncTestHelper {
  /**
   * 指定時間待機
   * @param {number} ms - 待機時間（ミリ秒）
   */
  static async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 条件が満たされるまで待機
   * @param {Function} condition - 条件チェック関数
   * @param {Object} options - オプション
   */
  static async waitForCondition(condition, options = {}) {
    const { timeout = 5000, interval = 100, message = '条件が満たされませんでした' } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.wait(interval);
    }

    throw new Error(`${message} (タイムアウト: ${timeout}ms)`);
  }

  /**
   * Promise が reject されることを確認
   * @param {Function} fn - テスト対象の関数
   * @param {string} expectedError - 期待されるエラーメッセージ
   */
  static async expectToReject(fn, expectedError = null) {
    try {
      await fn();
      throw new Error('エラーが発生することを期待していましたが、正常に完了しました');
    } catch (error) {
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(`期待されるエラー "${expectedError}" と異なります: ${error.message}`);
      }
      return error;
    }
  }
}

/**
 * DOM操作のテストヘルパー
 */
export class DOMTestHelper {
  /**
   * テスト用DOM要素を作成
   * @param {string} tagName - タグ名
   * @param {Object} attributes - 属性
   * @param {string} textContent - テキスト内容
   */
  static createElement(tagName, attributes = {}, textContent = '') {
    const element = document.createElement(tagName);
    
    Object.keys(attributes).forEach(key => {
      element.setAttribute(key, attributes[key]);
    });

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  /**
   * テスト用のキャラクターカード要素を作成
   * @param {Object} character - キャラクターデータ
   */
  static createCharacterCard(character) {
    const card = this.createElement('div', { 
      class: 'character-card',
      'data-character-id': character.id 
    });

    const image = this.createElement('img', {
      class: 'character-image',
      src: character.image,
      alt: character.name
    });

    const name = this.createElement('h2', { 
      class: 'character-name' 
    }, character.name);

    card.appendChild(image);
    card.appendChild(name);

    return card;
  }

  /**
   * DOM要素をクリーンアップ
   * @param {Element} element - クリーンアップする要素
   */
  static cleanup(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}

/**
 * モックデータ生成ヘルパー
 */
export class MockDataGenerator {
  /**
   * ランダムなキャラクターデータを生成
   * @param {number} count - 生成数
   */
  static generateCharacters(count = 1) {
    const types = ['クール系', '可愛い系', 'セクシー系', 'おとなし系', '元気系'];
    const characters = [];

    for (let i = 0; i < count; i++) {
      characters.push({
        id: `mock-char-${i + 1}`,
        name: `モックサキュバス${i + 1}`,
        description: `テスト用キャラクター${i + 1}の説明`,
        image: `mock-image-${i + 1}.jpg`,
        age: Math.floor(Math.random() * 20) + 18,
        type: types[Math.floor(Math.random() * types.length)],
        likes: Math.floor(Math.random() * 100)
      });
    }

    return count === 1 ? characters[0] : characters;
  }

  /**
   * ランダムないいねデータを生成
   * @param {Array} characterIds - キャラクターID配列
   */
  static generateLikes(characterIds) {
    const likes = {};
    characterIds.forEach(id => {
      likes[id] = Math.floor(Math.random() * 1000);
    });
    return likes;
  }
}

// デフォルトエクスポート
export default {
  TestDataManager,
  AsyncTestHelper, 
  DOMTestHelper,
  MockDataGenerator
};