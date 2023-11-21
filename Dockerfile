FROM registry.cn-shanghai.aliyuncs.com/lwmeng/node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install -g cnpm --registry=https://registry.npmmirror.com
RUN cnpm install
COPY . .
<<<<<<< HEAD
RUN npm run build:prod
=======
RUN npm run build
>>>>>>> c783a6ef305ea32ac430b5826a7a13ab5898515d

# production stage
FROM registry.cn-shanghai.aliyuncs.com/lwmeng/nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80
<<<<<<< HEAD
CMD ["nginx", "-g", "daemon off;"]
=======
CMD ["nginx", "-g", "daemon off;"]
>>>>>>> c783a6ef305ea32ac430b5826a7a13ab5898515d
