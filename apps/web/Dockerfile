FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# copy root files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY packages ./packages

# copy web app
COPY apps/web ./apps/web

# install from ROOT
RUN pnpm install --frozen-lockfile

# build only web
RUN pnpm --filter web build

# move to web
WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "start"]