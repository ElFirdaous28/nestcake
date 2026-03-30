FROM node:20-alpine

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @shared-types build

RUN pnpm --filter web build

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "start"]