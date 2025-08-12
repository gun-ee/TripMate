# TripMate 프로젝트 도커 사용 가이드

## 🐳 도커 설치 확인
```bash
docker --version
docker-compose --version
```

## 🚀 전체 애플리케이션 실행 (권장)

### 1. 모든 서비스 실행
```bash
# 프로젝트 루트 디렉토리에서
docker-compose up -d
```

### 2. 서비스 상태 확인
```bash
docker-compose ps
```

### 3. 로그 확인
```bash
# 전체 로그
docker-compose logs

# 특정 서비스 로그
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### 4. 서비스 중지
```bash
docker-compose down
```

## 🔧 개별 서비스 실행

### 백엔드만 실행
```bash
# 백엔드 이미지 빌드
docker build -t tripmate-backend .

# 백엔드 컨테이너 실행
docker run -p 80:8080 --name tripmate-backend tripmate-backend
```

### 프론트엔드만 실행
```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 프론트엔드 이미지 빌드
docker build -t tripmate-frontend .

# 프론트엔드 컨테이너 실행
docker run -p 5173:80 --name tripmate-frontend tripmate-frontend
```

## 📊 접속 정보

- **백엔드 API**: http://localhost:80
- **프론트엔드**: http://localhost:5173
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

## 🛠️ 개발 환경 설정

### 1. 개발용 Docker Compose (핫 리로드)
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# 환경 변수 수정 후
docker-compose up -d
```

## 🔍 문제 해결

### 컨테이너 재시작
```bash
docker-compose restart
```

### 이미지 재빌드
```bash
docker-compose build --no-cache
docker-compose up -d
```

### 볼륨 삭제 (데이터 초기화)
```bash
docker-compose down -v
```

### 네트워크 확인
```bash
docker network ls
docker network inspect tripmate_tripmate-network
```

## 📝 유용한 명령어

```bash
# 실행 중인 컨테이너 목록
docker ps

# 모든 컨테이너 목록 (중지된 것 포함)
docker ps -a

# 컨테이너 내부 접속
docker exec -it tripmate-backend /bin/bash
docker exec -it tripmate-frontend /bin/sh

# 컨테이너 로그 실시간 확인
docker logs -f tripmate-backend

# 이미지 목록
docker images

# 사용하지 않는 리소스 정리
docker system prune -a
```

## ⚠️ 주의사항

1. **포트 충돌**: 80, 5173, 3306, 6379 포트가 사용 중이지 않은지 확인
2. **메모리**: MySQL과 Redis는 충분한 메모리가 필요
3. **권한**: Windows에서 파일 권한 문제가 발생할 수 있음
4. **방화벽**: 도커 데스크톱의 방화벽 설정 확인

## 🆘 문제가 발생하면

1. `docker-compose logs`로 에러 로그 확인
2. `docker-compose down` 후 `docker-compose up -d` 재시도
3. `docker system prune -a`로 리소스 정리
4. 도커 데스크톱 재시작
