FROM node:16.6.2-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/lion
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["sh", "-c", "node ./dist/index.js 2 >& 1 | node ./scripts/logger.js"]
