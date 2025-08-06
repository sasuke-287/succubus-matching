# 依存パッケージライセンス一覧

## 概要

このドキュメントは、Succubus Realm プロジェクトで使用している主要な依存パッケージのライセンス情報をまとめたものです。

## 本体依存関係 (dependencies)

| パッケージ名 | バージョン | ライセンス   | 説明                                          |
| ------------ | ---------- | ------------ | --------------------------------------------- |
| express      | 4.21.2     | MIT          | Node.js 用 Web アプリケーションフレームワーク |
| chokidar     | 3.6.0      | MIT          | ファイル監視ライブラリ                        |
| dotenv       | 16.6.1     | BSD-2-Clause | 環境変数管理ライブラリ                        |
| node-fetch   | 3.3.2      | MIT          | Node.js 用 HTTP クライアント                  |
| ws           | 8.18.3     | MIT          | WebSocket ライブラリ                          |

## 開発依存関係 (devDependencies)

| パッケージ名     | バージョン | ライセンス | 説明                               |
| ---------------- | ---------- | ---------- | ---------------------------------- |
| vitest           | 1.6.1      | MIT        | 高速なユニットテストフレームワーク |
| @vitest/ui       | 1.6.1      | MIT        | Vitest の WebUI                    |
| playwright       | 1.54.1     | Apache-2.0 | E2E テストフレームワーク           |
| @playwright/test | 1.54.1     | Apache-2.0 | Playwright テストランナー          |
| jsdom            | 23.2.0     | MIT        | DOM 環境シミュレーター             |

## ライセンス詳細

### MIT License

以下のパッケージが MIT ライセンスを使用しています：

- express
- chokidar
- node-fetch
- ws
- vitest
- @vitest/ui
- jsdom

MIT ライセンスは、著作権表示とライセンス文の保持を条件として、商用・非商用問わず自由に使用、複製、変更、配布が可能です。

### BSD-2-Clause License

以下のパッケージが BSD-2-Clause ライセンスを使用しています：

- dotenv

BSD-2-Clause ライセンスは、著作権表示とライセンス文の保持を条件として、ソースコードとバイナリ形式での再配布を許可します。

### Apache-2.0 License

以下のパッケージが Apache-2.0 ライセンスを使用しています：

- playwright
- @playwright/test

Apache-2.0 ライセンスは、著作権表示、ライセンス文の保持、変更点の明示を条件として、商用・非商用問わず使用、複製、変更、配布が可能です。

## ライセンス遵守について

このプロジェクトでは、すべての依存パッケージのライセンス条項を遵守しています：

1. **著作権表示の保持**: 各ライブラリの著作権情報を NOTICE ファイルに記載
2. **ライセンス文の保持**: node_modules 内の各パッケージの LICENSE ファイルを保持
3. **変更点の明示**: 依存パッケージを直接変更していないため該当なし

## 更新履歴

- 2025/08/06: 初版作成
- 依存パッケージの更新時は、このドキュメントも併せて更新してください

## 参考リンク

- [MIT License](https://opensource.org/licenses/MIT)
- [BSD-2-Clause License](https://opensource.org/licenses/BSD-2-Clause)
- [Apache-2.0 License](https://opensource.org/licenses/Apache-2.0)
