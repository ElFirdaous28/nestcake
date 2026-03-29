FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY packages ./packages

# copy only api app
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @shared-types build
RUN pnpm --filter api build

# move into api
WORKDIR /app/apps/api

EXPOSE 3001

CMD ["pnpm", "start:prod"]