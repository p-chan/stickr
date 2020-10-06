# Slack App 設定

## Interactivity & Shortcuts

### Interactivity

On

#### Request URL

`https://yourdomain.com/slack/events`

### Shortcuts

| Type             | Name                           | Short Description                    | Callback ID        |
| :--------------- | :----------------------------- | :----------------------------------- | :----------------- |
| Message Shortcut | スタンプにエイリアスを追加する | このスタンプにエイリアスを追加します | `add_alias_action` |

## Slash Commands

| Command   | Request URL                         | Short Description              | Usage Hint             |
| :-------- | :---------------------------------- | :----------------------------- | :--------------------- |
| `/stickr` | https://yourdomain.com/slack/events | トークンやスタンプを追加します | `help [or add, token]` |

## OAuth & Permissions

### OAuth Tokens & Redirect URLs

#### Redirect URLs

`https://yourdomain.com/slack/oauth_redirect`

### Scopes

#### Bot Token Scopes

- `app_mentions:read`
- `channels:history`
- `chat:write`
- `commands`
- `emoji:read`
- `groups:history`
- `im:history`
- `mpim:history`
- `users:read`

#### User Token Scopes

- `chat:write`

## Event Subscriptions

### Enable Events

#### Request URL

`https://yourdomain.com/slack/events`

### Subscribe to bot events

- `app_mention`
- `message.im`
- `message.groups`
- `message.channels`
- `message.mpim`
