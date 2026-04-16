# build angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

# run nginx
FROM nginx:stable-alpine
# Copy code đã biên dịch từ giai đoạn build vào thư mục của Nginx
# Lưu ý: Thay 'task-manager-ui' bằng tên project khai báo trong angular.json
COPY --from=build /app/dist/task-manager-angular/browser /usr/share/nginx/html

# Copy file cấu hình nginx để handle Angular Routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]