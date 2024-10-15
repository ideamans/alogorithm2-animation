FROM node:22

ADD . /app
WORKDIR /app

RUN yarn install

CMD ["yarn", "start"]
