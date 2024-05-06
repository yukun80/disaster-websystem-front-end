# 使用 Nginx 官方镜像
FROM nginx:stable-alpine

# 将 dist 目录下的文件复制到 Nginx 的 serve 目录
COPY ./dist /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

# 启动时运行 Nginx
CMD ["nginx", "-g", "daemon off;"]
