# 設計ドキュメント

## 概要

いいね機能は、既存の Succubus Realm アプリケーションに統合される新しい評価システムです。ユーザーが特定のキャラクターに対して「いいね」を表現でき、その情報を永続的に保存・管理します。既存の character-detail-view 機能やハーレムシステムとシームレスに統合され、ユーザー体験を向上させます。

## アーキテクチャ

### システム構成

```
Frontend (script.js)
├── LikeManager クラス
├── 既存のSuccubusRealmApp クラス（拡張）
└── UI コンポーネント（いいねボタン、カウント表示）

Backend (server.js)
├── Express API エンドポイント
└── ファイルベースストレージ

Data Layer
├── succubi-data.json（既存）
└── likes-data.json（新規）
```

### データフロー

1. ユーザーがいいねボタンをクリック
2. フロントエンドが API リクエストを送信
3. サーバーが likes-data.json を更新
4. レスポンスで UI を更新
5. プロフィール画面でいいね数を表示

## コンポーネントとインターフェース

### 1. LikeManager クラス

```javascript
class LikeManager {
  constructor(apiClient)
  getCharacterById(characterId) // ID からキャラクターを取得
  async incrementLike(characterId)
  async getLikeCount(characterId)
  async getAllLikes()
  isAlreadyLiked(characterId)
  markAsLiked(characterId)
  loadLikedCharacters()
}
```

### 2. API エンドポイント

```
POST /api/likes/increment
- Body: { characterId: number }
- Response: { success: boolean, totalLikes: number }

GET /api/likes/count/:characterId
- Response: { characterId: number, totalLikes: number }

GET /api/likes/all
- Response: { likes: { [characterId]: number } }
```

### 3. UI コンポーネント

#### いいねボタン

- 位置: character-detail-view モーダル内
- 動作: 一度だけクリック可能、いいね数を増加
- 状態管理: ローカルストレージでいいね済み状態を保存
- 視覚表現: いいね済みの場合は無効化表示
- アニメーション: クリック時のハートエフェクト

#### いいね数表示

- プロフィール画面での表示
- ハーレムメンバー一覧での表示
- リアルタイム更新

## データモデル

### likes-data.json 構造

```json
{
  "likes": {
    "1": 15,
    "2": 8,
    "3": 12,
    "4": 6,
    "5": 20,
    "6": 4
  }
}
```

### キャラクターID管理
- `succubi-data.json`の各キャラクターにIDフィールドを追加
- オートインクリメント形式の連番ID（1, 2, 3, ...）
- 既存データの移行: 配列順序に基づいてIDを付与
- 一意性: 各キャラクターに固有の数値IDを保証
- RDB移行対応: 将来的なAUTO_INCREMENT主キーと互換

### 既存データとの統合

- `succubi-data.json`にIDフィールドを追加（1ベースの連番）
- いいね情報は別ファイルで管理し、IDで関連付け
- 既存のキャラクターオブジェクトに動的にいいね情報を追加

### succubi-data.json 構造変更
```json
{
  "succubi": [
    {
      "id": 1,
      "name": "リリス・ナイトシェード",
      "type": "上級サキュバス",
      "origin": "深淵の宮殿",
      "power": 95,
      "abilities": { ... },
      "description": "...",
      "image": "..."
    }
  ]
}
```

## エラーハンドリング

### フロントエンド

- ネットワークエラー時の再試行機能
- オフライン状態での操作キューイング
- ユーザーフレンドリーなエラーメッセージ

### バックエンド

- ファイル読み書きエラーのハンドリング
- データ整合性チェック
- ログ記録とエラー追跡

### エラーシナリオ

1. **ファイル読み込みエラー**: デフォルト値で継続、エラーログ記録
2. **ファイル書き込みエラー**: 操作を中断、ユーザーに通知
3. **データ破損**: バックアップからの復旧機能
4. **同時アクセス**: ファイルロック機能で整合性保証

## テスト戦略

### 単体テスト

- LikeManager クラスの各メソッド
- API エンドポイントの動作
- データ永続化機能

### 統合テスト

- フロントエンド-バックエンド間の通信
- 既存機能との統合確認
- character-detail-view との連携

### E2E テスト

- いいね機能の完全なユーザーフロー
- 複数ユーザーでの同時操作
- データ永続化の確認

### パフォーマンステスト

- 大量データでの動作確認
- 同時アクセス時の性能
- メモリ使用量の監視

## セキュリティ考慮事項

### データ保護

- ユーザー ID の匿名化
- 個人情報の最小化
- データ暗号化（将来的な拡張）

### アクセス制御

- レート制限の実装
- 不正なリクエストの検出
- CSRF 対策

## 既存システムとの統合

### character-detail-view 機能との統合

- モーダル内にいいねボタンを追加
- 既存のレイアウトを維持
- アクションボタンエリアの拡張

### ハーレムシステムとの統合

- ハーレムメンバーのいいね数表示
- ソート機能の拡張（いいね数順）
- 統計情報の追加

### 既存データ構造の保持

- `succubi-data.json`の変更なし
- 後方互換性の維持
- 段階的な機能追加

## パフォーマンス最適化

### フロントエンド

- いいね状態のローカルストレージ管理
- 遅延読み込みの実装
- アニメーションの最適化

### ローカルストレージ設計

```javascript
// localStorage key: 'succubus-realm-likes'
{
  "likedCharacters": [1, 2, 5]
}
```

### バックエンド

- ファイル I/O の最小化
- メモリキャッシュの活用
- 非同期処理の実装

## 将来の拡張性

### 機能拡張

- いいね以外の評価システム（星評価など）
- コメント機能
- ソーシャル機能

### 技術的拡張

- データベースへの移行準備
- リアルタイム通知
- 分析機能の追加
