FROM node:13

RUN mkdir -p /opt/parallel/client
WORKDIR /opt/parallel

COPY ../package.json .
COPY ../yarn.lock .
COPY package.json client
RUN yarn install
COPY . client
RUN yarn build && yarn --production

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]

