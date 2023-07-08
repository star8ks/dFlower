[![server status](https://uptime.betterstack.com/status-badges/v1/monitor/rt08.svg)](https://uptime.betterstack.com/?utm_source=status_badge)

# Pom Pom 小红花

小红花是一个去中心分配工具，如果把要分配的东西比作蛋糕的话，小红花就是分蛋糕的工具：综合每个人对其他人设置的分配比例，算出最终的所有人可以得到的蛋糕比例。

Pom Pom is a decentralized share tool. If the things to be shared are compared to cakes, Pom Pom is a tool for sharing cakes: comprehensively calculate the final cake ratio that everyone can get based on the share ratio set by each person to other people.

This is the server codebase.

## Run it in your dev environment

```bash
yarn

cp .env.example .env

# You need a postgres DB
# edit .env POSTGRES_PRISMA_URL and POSTGRES_URL_NON_POOLING

# DB migrate
npx prisma generate && npx prisma migrate deploy

yarn run dev
```

Then clone [dFlower-discord](https://github.com/star8ks/dFlower-discord) to run discord bot.