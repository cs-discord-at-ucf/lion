FROM node:16.6.2-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/lion
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "./dist/index.js"]
