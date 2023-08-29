FROM node:16.15.1-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/lion
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "./dist/index.js"]
