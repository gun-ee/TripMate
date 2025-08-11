# TripMate 프로젝트 AI 컨텍스트

## 🎯 프로젝트 개요
TripMate는 여행 관련 서비스를 제공하는 웹 애플리케이션입니다.

## 🛠 기술 스택

### Frontend
- **React 19.1.1** - UI 라이브러리
- **TypeScript 5.8.3** - 타입 안전성
- **Vite 7.0.6** - 빌드 도구 및 개발 서버
- **Axios** - HTTP 클라이언트
- **ESLint** - 코드 품질 관리

### Backend
- **Spring Boot 3.5.4** - 백엔드 프레임워크
- **Java 21** - 프로그래밍 언어
- **Spring Data JPA** - 데이터베이스 ORM
- **Spring Security** - 보안 기능
- **MySQL** - 데이터베이스
- **Lombok** - 코드 간소화

### 예정 기술 스택
- **Docker** - 컨테이너화
- **Redis** - 캐싱 및 세션 관리

## 📁 프로젝트 구조
```
TripMate/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── src/main/java/     # Spring Boot 백엔드
│   └── com/tripmate/
├── pom.xml           # Maven 설정
└── AI_CONTEXT.md     # 이 파일
```

## 🎨 개발 환경 설정

### Frontend 실행 (포트: 5173)
```bash
cd frontend
npm install
npm run dev
```

### Backend 실행 (포트: 80)
```bash
./mvnw spring-boot:run
```

## 📋 주요 요구사항
- 여행 관련 서비스 제공
- 사용자 인증 및 권한 관리
- 데이터베이스 연동
- RESTful API 제공
- 반응형 웹 디자인

## 🔧 개발 규칙
- TypeScript strict 모드 사용
- ESLint 규칙 준수
- Spring Boot 3.x 버전 사용
- Java 21 사용
- DB 네이밍은 camelCase로 통일
- Member.java 기준으로 네이밍 통일
- 백엔드 포트: 80, 프론트엔드 포트: 5173

## 📝 AI 참고사항
- 이 프로젝트는 React + Spring Boot 기반
- TypeScript와 Java를 주로 사용
- 향후 Docker와 Redis 추가 예정
- 프론트엔드는 Vite로 빌드
- 백엔드는 Maven으로 관리

---
*이 파일은 AI 어시스턴트가 프로젝트 컨텍스트를 유지하기 위해 사용됩니다.* 