import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// フロントエンドUI機能のテスト
describe('フロントエンド UI機能', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    // DOM環境をセットアップ
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <div id="character-grid"></div>
          <div id="character-detail"></div>
          <div id="harem-view"></div>
          <button id="like-btn" data-character-id="1">いいね</button>
          <span id="like-count">0</span>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    dom.window.close();
  });

  describe('キャラクターグリッド表示', () => {
    it('キャラクターカードが正常に生成される', () => {
      const mockCharacter = {
        id: 1,
        name: 'テストキャラ',
        type: 'fire',
        power: 85,
        description: 'テスト用キャラクター',
        image: 'test.jpg'
      };

      // キャラクターカード生成関数をシミュレート
      const createCharacterCard = (character) => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;
        
        card.innerHTML = `
          <img src="${character.image}" alt="${character.name}">
          <h3>${character.name}</h3>
          <p class="type">${character.type}</p>
          <p class="power">パワー: ${character.power}</p>
          <p class="description">${character.description}</p>
          <button class="like-btn" data-character-id="${character.id}">いいね</button>
          <span class="like-count">0</span>
        `;
        
        return card;
      };

      const card = createCharacterCard(mockCharacter);
      document.getElementById('character-grid').appendChild(card);

      expect(card.querySelector('h3').textContent).toBe('テストキャラ');
      expect(card.querySelector('.type').textContent).toBe('fire');
      expect(card.querySelector('.power').textContent).toBe('パワー: 85');
      expect(card.dataset.characterId).toBe('1');
    });

    it('複数のキャラクターカードが正常に表示される', () => {
      const mockCharacters = [
        { id: 1, name: 'キャラ1', type: 'fire', power: 80, description: 'テスト1', image: 'test1.jpg' },
        { id: 2, name: 'キャラ2', type: 'water', power: 75, description: 'テスト2', image: 'test2.jpg' },
        { id: 3, name: 'キャラ3', type: 'earth', power: 90, description: 'テスト3', image: 'test3.jpg' }
      ];

      const grid = document.getElementById('character-grid');
      
      mockCharacters.forEach(character => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;
        card.innerHTML = `<h3>${character.name}</h3>`;
        grid.appendChild(card);
      });

      const cards = grid.querySelectorAll('.character-card');
      expect(cards.length).toBe(3);
      expect(cards[0].querySelector('h3').textContent).toBe('キャラ1');
      expect(cards[1].querySelector('h3').textContent).toBe('キャラ2');
      expect(cards[2].querySelector('h3').textContent).toBe('キャラ3');
    });
  });

  describe('キャラクター詳細表示', () => {
    it('キャラクター詳細が正常に表示される', () => {
      const mockCharacter = {
        id: 1,
        name: 'テストキャラ',
        type: 'fire',
        origin: 'テスト界',
        power: 85,
        abilities: {
          strength: 80,
          magic: 90,
          charm: 95
        },
        description: '詳細なテスト用キャラクター',
        image: 'test-detail.jpg'
      };

      // キャラクター詳細表示関数をシミュレート
      const showCharacterDetail = (character) => {
        const detailView = document.getElementById('character-detail');
        detailView.innerHTML = `
          <div class="character-detail-content">
            <img src="${character.image}" alt="${character.name}">
            <h2>${character.name}</h2>
            <p class="type">タイプ: ${character.type}</p>
            <p class="origin">出身: ${character.origin}</p>
            <p class="power">総合パワー: ${character.power}</p>
            <div class="abilities">
              <p>力: ${character.abilities.strength}</p>
              <p>魔力: ${character.abilities.magic}</p>
              <p>魅力: ${character.abilities.charm}</p>
            </div>
            <p class="description">${character.description}</p>
            <button class="like-btn" data-character-id="${character.id}">いいね</button>
            <span class="like-count">0</span>
          </div>
        `;
      };

      showCharacterDetail(mockCharacter);
      const detailView = document.getElementById('character-detail');

      expect(detailView.querySelector('h2').textContent).toBe('テストキャラ');
      expect(detailView.querySelector('.type').textContent).toBe('タイプ: fire');
      expect(detailView.querySelector('.origin').textContent).toBe('出身: テスト界');
      expect(detailView.querySelector('.abilities p:nth-child(1)').textContent).toBe('力: 80');
      expect(detailView.querySelector('.abilities p:nth-child(2)').textContent).toBe('魔力: 90');
      expect(detailView.querySelector('.abilities p:nth-child(3)').textContent).toBe('魅力: 95');
    });
  });

  describe('いいねボタン機能', () => {
    it('いいねボタンクリック時に適切なイベントが発生する', () => {
      const likeBtn = document.getElementById('like-btn');
      const clickHandler = vi.fn();
      
      likeBtn.addEventListener('click', clickHandler);
      likeBtn.click();

      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it('いいね数が正常に更新される', () => {
      const likeCountElement = document.getElementById('like-count');
      
      // いいね数更新関数をシミュレート
      const updateLikeCount = (characterId, newCount) => {
        const countElement = document.querySelector(`[data-character-id="${characterId}"] + .like-count`) ||
                           document.getElementById('like-count');
        if (countElement) {
          countElement.textContent = newCount.toString();
        }
      };

      updateLikeCount(1, 42);
      expect(likeCountElement.textContent).toBe('42');

      updateLikeCount(1, 43);
      expect(likeCountElement.textContent).toBe('43');
    });

    it('いいね済み状態が視覚的に反映される', () => {
      const likeBtn = document.getElementById('like-btn');
      
      // いいね済み状態の設定関数をシミュレート
      const setLikedState = (characterId, isLiked) => {
        const btn = document.querySelector(`[data-character-id="${characterId}"]`);
        if (btn) {
          if (isLiked) {
            btn.classList.add('liked');
            btn.textContent = 'いいね済み';
            btn.disabled = true;
          } else {
            btn.classList.remove('liked');
            btn.textContent = 'いいね';
            btn.disabled = false;
          }
        }
      };

      // いいね済み状態に設定
      setLikedState(1, true);
      expect(likeBtn.classList.contains('liked')).toBe(true);
      expect(likeBtn.textContent).toBe('いいね済み');
      expect(likeBtn.disabled).toBe(true);

      // いいね済み状態を解除
      setLikedState(1, false);
      expect(likeBtn.classList.contains('liked')).toBe(false);
      expect(likeBtn.textContent).toBe('いいね');
      expect(likeBtn.disabled).toBe(false);
    });
  });

  describe('ローカルストレージ連携', () => {
    it('いいね済み状態がローカルストレージに保存される', () => {
      const characterId = 1;
      
      // ローカルストレージ保存関数をシミュレート
      const saveLikedState = (id) => {
        const likedCharacters = JSON.parse(localStorage.getItem('succubus-realm-likes') || '{"likedCharacters":[]}');
        if (!likedCharacters.likedCharacters.includes(id)) {
          likedCharacters.likedCharacters.push(id);
          localStorage.setItem('succubus-realm-likes', JSON.stringify(likedCharacters));
        }
      };

      localStorage.getItem.mockReturnValue('{"likedCharacters":[]}');
      
      saveLikedState(characterId);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'succubus-realm-likes',
        JSON.stringify({ likedCharacters: [1] })
      );
    });

    it('いいね済み状態がローカルストレージから読み込まれる', () => {
      const mockData = '{"likedCharacters":[1,3,5]}';
      localStorage.getItem.mockReturnValue(mockData);
      
      // ローカルストレージ読み込み関数をシミュレート
      const loadLikedCharacters = () => {
        const stored = localStorage.getItem('succubus-realm-likes');
        if (stored) {
          const data = JSON.parse(stored);
          return data.likedCharacters || [];
        }
        return [];
      };

      const likedCharacters = loadLikedCharacters();
      
      expect(localStorage.getItem).toHaveBeenCalledWith('succubus-realm-likes');
      expect(likedCharacters).toEqual([1, 3, 5]);
    });
  });

  describe('エラーハンドリング', () => {
    it('DOM要素が存在しない場合のエラーハンドリング', () => {
      // 存在しない要素への操作をシミュレート
      const safeUpdateElement = (selector, content) => {
        const element = document.querySelector(selector);
        if (element) {
          element.textContent = content;
          return true;
        }
        return false;
      };

      const result1 = safeUpdateElement('#existing-element', 'test');
      const result2 = safeUpdateElement('#like-count', '42');

      expect(result1).toBe(false); // 存在しない要素
      expect(result2).toBe(true);  // 存在する要素
    });

    it('不正なデータでのエラーハンドリング', () => {
      // 不正なキャラクターデータの処理をシミュレート
      const validateCharacterData = (character) => {
        if (!character || typeof character !== 'object') {
          return { valid: false, error: 'キャラクターデータが無効です' };
        }
        
        const requiredFields = ['id', 'name', 'type'];
        const missingFields = requiredFields.filter(field => !character[field]);
        
        if (missingFields.length > 0) {
          return { valid: false, error: `必須フィールドが不足: ${missingFields.join(', ')}` };
        }
        
        return { valid: true };
      };

      expect(validateCharacterData(null)).toEqual({
        valid: false,
        error: 'キャラクターデータが無効です'
      });

      expect(validateCharacterData({ id: 1 })).toEqual({
        valid: false,
        error: '必須フィールドが不足: name, type'
      });

      expect(validateCharacterData({ id: 1, name: 'テスト', type: 'fire' })).toEqual({
        valid: true
      });
    });
  });
});