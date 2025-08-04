# ベースイメージ
FROM node:18

# 作業ディレクトリを作成
WORKDIR /app

# ファイルコピー
COPY . .

# 依存関係インストール
RUN npm run install-deps

# ローカルで動かす場合は.envにHOST=0.0.0.0
COPY .env.example .env

# ポート指定（必要に応じて）
EXPOSE 3000

# 本番起動コマンド
CMD ["npm", "start"]
