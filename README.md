<div align="center">
  <img src="./assets/icon-production.png" width="256" height="256">
  <h1>Stickr</h1>
  <p>Slack で LINE スタンプを使えるようにする Slackbot</p>
</div>

---

## 注意事項

- この Slack App は実験的なものであり、許可されたワークスペースでしか導入できません

## 使い方

- [Add to Slack](https://stickr-production.an.r.appspot.com/slack/install) から Slack App を追加する
- `@Stickr` をチャンネルに招待する
- `/stickr token` で xoxs トークンを追加する
- `/stickr add` でスタンプを絵文字として追加する
- `@Stickr` が存在するチャンネルでスタンプの絵文字をポストする
- `@Stickr` が絵文字を消してスタンプをポストする

## 開発方法

- `npm install`
- `npm run watch`
- `expose share http://localhost:3000 --subdomain=stickr`

## その他

- [Slack App 設定](./docs/slack-app-settings)
