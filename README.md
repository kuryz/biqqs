# Biqqs — Telegram + WhatsApp Bookkeeper (TypeScript + MySQL + Cache Service)

A bookkeeping bot for small businesses, reachable over **Telegram and/or
WhatsApp**. Shop owners text sales, expenses, and credit sales in plain
language; the bot logs them and replies with reports on request. Same
business logic, two front doors — enable either or both.

## Stack
- **TypeScript** — strict mode, compiled with `tsc`
- **MySQL** via `mysql2/promise` — connection pool, parameterized queries
- **CacheService** — Redis-backed cache with an automatic file-based
  fallback when `REDIS_URL` isn't set, so the app runs without any extra
  infrastructure for local dev
- **Express** — webhook/polling server, one route group per channel

## Project layout
```
src/
  app.ts                          - wires everything together, registers channels
  server.ts                       - boots the DB connection + Express server
  config/env.ts                   - typed, validated environment config
  types/index.ts                  - shared interfaces (ParsedMessage, Summary, ...)
  parsers/MessageParser.ts        - turns informal text into structured data
  channels/
    telegram/TelegramClient.ts    - Telegram Bot API client (native fetch)
    whatsapp/WhatsAppClient.ts    - Meta WhatsApp Cloud API client (native fetch)
  controllers/
    TelegramController.ts         - unwraps a Telegram update, calls MessageController
    WhatsAppController.ts         - unwraps a WhatsApp webhook, calls MessageController
    MessageController.ts          - channel-agnostic: parses text, calls services
  routes/
    telegram.ts                   - POST /telegram/webhook
    whatsapp.ts                   - GET+POST /whatsapp/webhook (verify + receive)
  models/                         - Business, Transaction, Debt, Usage
  repositories/                   - MySQL access (Business/Transaction/Debt)
  services/                       - BusinessService, TransactionService,
                                     ReportService, UsageService, CacheService
  views/ReplyFormatter.ts         - turns results back into chat-friendly text
  db/
    pool.ts                       - mysql2 connection pool
    migrate.ts                    - creates businesses/transactions/debts tables
```

## How channels work
Every channel adapter (`TelegramController`, `WhatsAppController`) does the
same three things:
1. Unwrap the provider's webhook payload into a `chatId` + raw text
2. Call `MessageController.handle(chatId, text, channel)` — this is the one
   place that knows about parsing, business rules, and replies
3. Send the returned reply back through that channel's client

`Business` rows are keyed by `(chat_id, channel)`, so a Telegram chat ID and
a WhatsApp phone number can never collide into the same business, even if
they happen to be numerically identical.

Enable a channel by setting its env vars (see `.env.example`):
- **Telegram**: `TELEGRAM_BOT_TOKEN`
- **WhatsApp**: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`

You can set one or both. The app throws on startup only if neither is
configured. `GET /health` reports which channels are active.

## How the cache layer works
`CacheService` (`src/services/CacheService.ts`) exposes `get`/`set`/`del`/`delPrefix`.

- If `REDIS_URL` is set, it writes through Redis — this is what you want for
  production, especially once you're running more than one server instance.
- It also always keeps a per-key JSON file fallback under `./cache`, so
  reads still succeed if Redis is unset or a call fails.

What's cached and why:
- **`getOrCreateBusiness`** caches the business row by `channel:chatId`
  (default TTL from `CACHE_TTL_SECONDS`, 60s) — looked up on every incoming
  message, so it's the highest-value thing to cache.
- **Report summaries** (`today`/`week`/`month`) and **open debts list** are
  cached with a short 30s TTL, mainly to absorb bursts of repeated report
  requests.
- **Cache invalidation**: any write (`addTransaction`, debt `create`,
  `markPaid`) immediately deletes that business's cached reports, debts
  list, and usage count, so the next read is fresh.

## Setting up MySQL
You need a running MySQL (or MariaDB) instance reachable from the app.

```sql
CREATE DATABASE bookkeeper;
CREATE USER 'bookkeeper'@'%' IDENTIFIED BY 'choose_a_real_password';
GRANT ALL PRIVILEGES ON bookkeeper.* TO 'bookkeeper'@'%';
FLUSH PRIVILEGES;
```

Then set `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` in
`.env` to match, and run the migration:
```bash
npm run migrate
```
This creates the `businesses`, `transactions`, and `debts` tables (see
`src/db/migrate.ts` for the exact schema).

## Setting up Redis (optional but recommended for production)
Any managed Redis works (Upstash, Redis Cloud, AWS ElastiCache, etc.) — just
set `REDIS_URL` in `.env`, e.g.:
```
REDIS_URL=redis://default:password@your-redis-host:6379
```

## Setting up the Telegram channel
1. Message **@BotFather** on Telegram, send `/newbot`, follow the prompts.
2. Copy the token BotFather gives you into `TELEGRAM_BOT_TOKEN` in `.env`.
3. For production, register your webhook:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain/telegram/webhook"
   ```

## Setting up the WhatsApp channel (Meta Cloud API)
1. Create a Meta App at developers.facebook.com and add the **WhatsApp**
   product.
2. Under **API Setup**, note your **Phone number ID** →
   `WHATSAPP_PHONE_NUMBER_ID`.
3. Generate an access token — a permanent token from a System User (Business
   Settings → Users → System Users) for production, or the temporary token
   shown on the API Setup page for testing → `WHATSAPP_TOKEN`.
4. Make up any string for `WHATSAPP_VERIFY_TOKEN` — you'll enter it in the
   next step.
5. Under **WhatsApp → Configuration**, set the **Callback URL** to
   `https://your-domain/whatsapp/webhook` and the **Verify token** to the
   value from step 4. Meta will call `GET /whatsapp/webhook` once to confirm
   you control it.
6. Subscribe to the `messages` webhook field so inbound texts are delivered.

Note: new WhatsApp Business apps start in a test mode where you can only
message numbers you've explicitly added as testers in the App Dashboard,
until the app is reviewed for production access.

## Running it
```bash
npm install
cp .env.example .env   # fill in MySQL creds, and Telegram and/or WhatsApp creds
npm run migrate         # creates tables
npm run dev              # runs the server via ts-node
```

For production:
```bash
npm run build   # compiles TypeScript -> dist/
npm start        # runs the compiled server
```

## Billing / plan enforcement
Free-plan businesses are capped at `FREE_TIER_MONTHLY_LIMIT` (default 30)
billable records per calendar month — a "record" is a sale, an expense, or a
new credit (debt) entry, counted per business across whichever channel(s)
it's used. Marking a debt as paid and running reports (`today`/`week`/
`debts`/`usage`) never count against the limit or get blocked.

- **`usage` command** — reply "usage" (or "plan"/"status") to see current
  plan, records used this month, and remaining allowance.
- **Hitting the limit** — the next sale/expense/credit attempt gets a reply
  explaining the limit was hit and inviting them to upgrade, instead of
  silently logging or silently failing.
- **Upgrading a business** — `businessService.setPlan(businessId, 'paid')` is
  the single function that flips a business to unlimited. Right now it's
  wired to an in-chat admin command for manual testing:
  ```
  /admin_upgrade <chat_id> <ADMIN_TOKEN>
  ```
  Set `ADMIN_TOKEN` in `.env` to enable it (blank disables the command
  entirely). The command upgrades the business on whichever channel the
  command itself was sent from. **This is a placeholder, not real
  billing** — in production you'd replace the admin command with a
  Paystack/Flutterwave payment link, and call `setPlan` directly from that
  provider's webhook once a payment confirms.

## What's NOT built yet (next steps for a real product)
- **Real payment integration** — the admin upgrade command is a stand-in for
  an actual Paystack/Flutterwave subscription flow. See above.
- **Multi-user per business** — one chat (Telegram or WhatsApp) = one
  business right now. A `business_members` table mapping multiple chat IDs
  to one business would be needed for shared staff access, or for linking a
  business's Telegram and WhatsApp presence into a single account.
- **Web dashboard** — reports are text-only right now.
- **Better parsing for pidgin/abbreviations** — same regex-based MVP parser
  as before; swap in an LLM-based parser once you have real usage data
  showing what falls through as "unrecognized".
- **Non-text WhatsApp messages** — images, audio, location, etc. are
  currently silently skipped by `WhatsAppController`.
- **Redis Cluster / connection retry hardening** — the current CacheService
  connects once and doesn't retry a dropped Redis connection; a production
  version would want retry-with-backoff.
- **Idempotency on webhook deliveries** — add a dedupe check (Telegram
  `update_id`, WhatsApp message `id`) before logging a transaction twice, in
  case of retried webhook deliveries.
