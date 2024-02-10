# Discord-Join-Notice

## 使い方

```bash
bun install
bun run index.ts
```

ボイスチャンネルへの接続を通知する bot です。
[Python バージョンはこちら](https://github.com/aho4ahoaho/discord-join-notice)

## 仕様

接続通知用音声は voice フォルダへキャッシュしますので必要に応じてパラメータを変更して使用してください。

## 使用する環境変数

|     変数名      | 説明                                    |
| :-------------: | --------------------------------------- |
| DISCORD_API_KEY | 接続に利用する Discord の API キー      |
|  VOICEVOX_URL   | 音声合成に使用する VOICEVOX_CORE の URL |
| OPENAI_API_KEY  | GPT 利用時の API キー                   |
|  OPENAI_ORG_ID  | GPT 利用時の組織 ID                     |
