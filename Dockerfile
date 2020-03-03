FROM node:13.8-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/lion
COPY package.json .
RUN npm install\
	&& npm install tsc -g
COPY . .
RUN npm run build
CMD ["node", "./dist/index.js"]