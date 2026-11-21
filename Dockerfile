# syntax=docker/dockerfile:1

FROM node:26 AS base
RUN npm install --global yarn@1.22.22

FROM base AS frontend-build

WORKDIR /app/frontend
COPY ["frontend/package.json", "frontend/yarn.lock", "./"]
RUN yarn install --frozen-lockfile
COPY frontend/ ./
RUN yarn build

FROM base

ENV NODE_ENV=development
ENV ADMIN_DIST_PATH=/opt/admin-dist

WORKDIR /app

COPY ["package.json", "yarn.lock*", "./"]

RUN yarn install

COPY . .
COPY --from=frontend-build /app/frontend/dist /opt/admin-dist
RUN mkdir -p logs sessions uploads

CMD ["yarn", "run", "dev"]
