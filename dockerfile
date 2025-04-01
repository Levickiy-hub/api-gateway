FROM node:21-alpine

WORKDIR /app

COPY . .

CMD ["node", "src/server.js"]

EXPOSE 3000