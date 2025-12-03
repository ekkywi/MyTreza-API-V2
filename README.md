# MyTreza API v2 - Skeleton
This is a generated backend skeleton for **MyTreza v2**.
Structure follows Clean-ish architecture with presentation / application / domain / infrastructure folders.

## What's included
- Express app entry (server.js)
- Basic middleware: helmet, cors, rate-limit, json parser
- Example folders: src/presentation (routes/controllers), src/application (use-cases), src/domain (models/interfaces), src/infrastructure (prisma placeholder)
- Validators (Joi) and global error & response wrapper
- Example routes: auth, user, wallet, transaction, category, transfer, dashboard

## How to use
1. Copy `.env.example` to `.env` and set variables.
2. Run `npm install` (or yarn).
3. Run `npx prisma init` and configure your datasource if using prisma.
4. `npm run dev` to start in development mode.

