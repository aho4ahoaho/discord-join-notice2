# Discord-Join-Notice

## 起動方法

```bash
bun install
bun start
```

ボイスチャンネルへの接続を通知する bot です。
[Python バージョンはこちら](https://github.com/aho4ahoaho/discord-join-notice)

本来、Bun で制作される予定でしたが、`@discordjs/voice`が Node.js の dgram に依存しているため、Bun では動作しませんでした。
[こちらの Issue](https://github.com/oven-sh/bun/issues/1630)が解決された暁には、Bun に移行する予定です。

## 仕様

接続通知用音声は voice フォルダへキャッシュしますので必要に応じてパラメータを変更して使用してください。

## 使用する環境変数

|      変数名       | 説明                                                         |
| :---------------: | ------------------------------------------------------------ |
|  DISCORD_API_KEY  | 接続に利用する Discord の API キー                           |
| DISCORD_CLIENT_ID | スラッシュコマンドの登録に利用する Discord のクライアント ID |
|   VOICEVOX_URL    | 音声合成に使用する VOICEVOX_CORE の URL                      |
|  OPENAI_API_KEY   | GPT 利用時の API キー                                        |
|   OPENAI_ORG_ID   | GPT 利用時の組織 ID                                          |

## bot の操作

/help でヘルプが表示されます。元ファイルは[こちら](src/help.md)
