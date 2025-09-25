# TripMate · 개인 프로젝트
여행 일정을 만들고, **동선을 최적화**하며, 동행/커뮤니티/지역 채팅까지 아우르는 올인원 웹 앱

![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB?logo=react&labelColor=20232a)
![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%20%2B%20JPA-6DB33F?logo=springboot&labelColor=1a1a1a)
![DB](https://img.shields.io/badge/DB-MySQL-4479A1?logo=mysql&labelColor=1a1a1a)
![Cache](https://img.shields.io/badge/Cache-Redis%20(Place%20캐시)-DC382D?logo=redis&labelColor=1a1a1a)
![DevOps](https://img.shields.io/badge/DevOps-Docker-2496ED?logo=docker&labelColor=1a1a1a)

> **핵심 포인트**
> - 프론트/백 **완전 분리** (React SPA ↔ Spring REST API)  
> - **최적 동선 탐색 알고리즘** 직접 구현 (하루 일정 방문 순서/예상 소요시간 산출)  
> - **Redis 캐싱으로 Google Place API 호출 최소화** (중복·근접 검색 응답 가속)  
> - 개인 프로젝트

---

## 📌 주요 기능
- ✈️ **여행 일정 플래너**: 도시/기간 설정 → 장소 검색/추가 → 일자별 편집/정렬/저장  
- 🧭 **동선 최적화**: 장소 리스트 기반 **최적 방문 순서 & 예상 소요시간** 계산  
- 🤝 **동행 모집**: 일정 기반 모집글 작성, 신청/수락/마감  
- 🗣️ **커뮤니티**: 게시글/댓글/좋아요  
- 📍 **지역 채팅**: 도시(지역) 단위 실시간 대화  
- ⚡ **장소 캐싱**: Google Place 검색 결과를 **Redis**에 캐싱 → 반복/근접 검색 즉시 응답  
> 참고: **Redis는 채팅용이 아니라 ‘장소 검색 결과 캐시’ 용도로만 사용**합니다.

---

## 🧰 기술 스택
- **Frontend**: React, Vite, TypeScript, React Router, Axios  
- **Backend**: Spring Boot, Java, Spring Data JPA  
- **Database & Cache**: MySQL(영속 데이터), **Redis(장소 검색 결과 캐싱)**  
- **DevOps**: Docker / Docker Compose(선택), GitHub

```mermaid
pie title "Tech Focus"
  "Frontend (React)" : 40
  "Backend (Spring)" : 40
  "Data & Cache (MySQL/Redis)" : 15
  "DevOps (Docker)" : 5
🏛 아키텍처
mermaid
코드 복사
flowchart LR
  subgraph CLIENT["Frontend: React + Vite + TS"]
    UI["SPA UI / 지도 / 검색 / 플래너"]
  end

  subgraph API["Backend: Spring Boot + JPA"]
    CTRL["REST Controllers"]
    SVC["Services: Trip, Place, Companion, Social, Chat"]
    OPT["Route Optimizer (순서 + ETA)"]
  end

  subgraph DATA["Data"]
    DB[(MySQL)]
    RDS[(Redis: Place Cache)]
  end

  subgraph EXT["External APIs"]
    GPL["Google Places API"]
  end

  UI --> CTRL
  CTRL --> SVC
  SVC --> DB
  SVC --> RDS
  RDS -- "miss" --> SVC --> GPL --> SVC --> RDS
  SVC --> OPT
  OPT --> CTRL
  CTRL --> UI
🔄 기능별 흐름도
mermaid
코드 복사
flowchart LR
  USER["사용자"] --> SEARCH["장소 검색"]
  SEARCH -->|"GET /api/places/search"| CACHE{"Redis 캐시"}
  CACHE -- "hit" --> R1["검색 결과 반환"]
  CACHE -- "miss" --> EXT["외부 API 조회"] --> SAVE["캐시 저장"] --> R1

  R1 --> ADD["일정에 장소 추가"]
  ADD --> EDIT["일자별 편집/정렬"] --> SAVE_TRIP["POST /api/trips"]
  SAVE_TRIP --> PERSIST[(MySQL 저장)]

  EDIT --> OPT_BTN["동선 최적화 실행"]
  OPT_BTN --> RUN_OPT["백엔드 최적화 알고리즘"]
  RUN_OPT --> R2["최적 방문 순서 / 예상 소요시간"]
  R2 --> VIEW["지도 경로 / 타임라인 표시"]
🧭 페이지 방문 흐름
mermaid
코드 복사
flowchart LR
  LAND["랜딩/로그인"] --> PLAN["일정 플래너"]
  PLAN --> PLACE["장소 검색/추가"]
  PLACE --> DAY["일자별 편집"]
  DAY --> OPT["동선 최적화"]
  OPT --> RES["결과: 지도 경로/타임라인"]
  RES --> COMP["동행 모집 작성"]
  RES --> REGION["지역 채팅"]
  RES --> BOARD["커뮤니티(후기/질문)"]
⚙️ 빠른 시작
1) 사전 준비
Node.js 18+, npm

JDK 17+ (권장 21), Maven 또는 Gradle

MySQL, Redis (로컬 실행 또는 Docker)

2) 환경 변수
백엔드 (예시)

properties
코드 복사
# application.yml / .env (properties 예시)
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/tripmate?useSSL=false&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=your_password

SPRING_DATA_REDIS_HOST=localhost
SPRING_DATA_REDIS_PORT=6379

# 필요 시 인증/지도 키 추가
# GOOGLE_PLACES_API_KEY=...
# SERVER_PORT=8080
프론트엔드 (예시)

bash
코드 복사
# frontend/.env
VITE_API_BASE_URL=http://localhost:8080
3) 로컬 실행
Backend

bash
코드 복사
./mvnw spring-boot:run
# 또는
./gradlew bootRun
# http://localhost:8080
Frontend

bash
코드 복사
cd frontend
npm install
npm run dev
# http://localhost:5173
4) Docker (선택)
bash
코드 복사
docker run -d --name tripmate-mysql \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=tripmate \
  -p 3306:3306 mysql:8

docker run -d --name tripmate-redis -p 6379:6379 redis:7

# docker-compose.yml 이 있다면
docker compose up -d
🗂 프로젝트 구조 (예시)
bash
코드 복사
TripMate/
├─ frontend/                 # React + Vite + TypeScript
│  ├─ src/                   # pages, components, hooks, api, ...
│  ├─ public/
│  └─ package.json
├─ backend/  (또는 src/main/java/...)   # Spring Boot
│  ├─ controller/            # REST API (Place/Trip/Companion/Social/Chat)
│  ├─ service/               # 도메인 서비스 및 최적화 알고리즘
│  ├─ repository/            # JPA Repository
│  ├─ entity/                # JPA Entities
│  └─ dto/                   # Request/Response DTO
├─ docker/ (옵션)
└─ README.md
🌟 하이라이트
프론트/백 완전 분리: SPA ↔ REST 구조로 배포/스케일 유연성 향상

최적 동선 탐색 알고리즘 직접 구현: 방문 순서 자동 산출 + 예상 소요시간 계산

Redis 캐싱: Google Place 검색 결과 캐시 → 응답 속도 개선 & API 호출 절감

확장성 고려: 동행/커뮤니티/지역 채팅 등 도메인 분리로 점진적 확장 용이

🗺 로드맵
 캐시 키 전략 및 TTL 고도화 (좌표+반경/키워드 기준)

 동선 최적화 제약 반영 (영업시간/휴식/고정 포인트)

 커뮤니티/채팅 UX 개선 (알림/멘션/모바일 최적화)

 E2E 테스트 및 성능 계측 대시보드

📜 라이선스 & 문의
라이선스: All Rights Reserved (필요 시 오픈소스 라이선스 지정 가능)

문의: GitHub Issues에서 남겨주세요

본 README는 실제 구현 사실(프론트/백 분리, 동선 최적화 직접 구현, Redis는 Place 캐시 전용)을 중심으로 작성되었습니다.

less
코드 복사

**주의:** 꼭 _그대로_ 붙여넣되, mermaid 코드블록(````mermaid`)을 **여는 줄과 닫는 줄**이 모두 들어가 있는지 확인하세요. 위 본문에는 각 다이어그램마다 `닫는 백틱( \`\`\` )`을 이미 넣어 놨습니다.
::contentReference[oaicite:0]{index=0}
