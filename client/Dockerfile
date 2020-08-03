FROM node:latest

WORKDIR /home/node

RUN mkdir -p /home/node/client

COPY tsconfig.json package.json yarn.lock ./

COPY client/ client/

RUN yarn install --frozen-lockfile

WORKDIR /home/node/client

ENTRYPOINT yarn dev
