FROM node:latest

WORKDIR /home/node

RUN mkdir -p /home/node/server

COPY tsconfig.json .prettierrc package.json yarn.lock ./

COPY server/ server/

RUN yarn install --frozen-lockfile

WORKDIR /home/node/server

ENTRYPOINT yarn migrate && yarn seed && yarn dev