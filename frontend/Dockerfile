# React 프론트엔드를 위한 Dockerfile
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 애플리케이션 빌드
RUN npm run dev

# Nginx를 사용하여 정적 파일 서빙
#FROM nginx:alpine

# 빌드된 파일을 Nginx 디렉토리로 복사
#COPY --from=0 /app/dist /usr/share/nginx/html

# Nginx 설정 파일 복사 (필요시)
# COPY nginx.conf /etc/nginx/nginx.conf

# 포트 노출
EXPOSE 80

# Nginx 시작
#CMD ["nginx", "-g", "daemon off;"]
