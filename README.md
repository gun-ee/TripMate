# TripMate · 개인 프로젝트
여행 일정을 만들고, **동선을 최적화**하며, 동행/커뮤니티/지역 채팅까지 아우르는 올인원 웹 앱

![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB?logo=react&labelColor=20232a)
![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%20%2B%20JPA-6DB33F?logo=springboot&labelColor=1a1a1a)
![DB](https://img.shields.io/badge/DB-MySQL-4479A1?logo=mysql&labelColor=1a1a1a)
![Cache](https://img.shields.io/badge/Cache-Redis%20(Google%20Place%20캐시)-DC382D?logo=redis&labelColor=1a1a1a)
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
- 📍 **지역 채팅**: 도시(지역) 단위 대화(실시간 설계 포함)  
- ⚡ **장소 캐싱**: Google Place 검색 결과를 **Redis**에 저장해 반복/근접 검색 즉시 응답  
> 참고: **Redis는 채팅용이 아니라 ‘장소 검색 결과 캐시’에만 사용**됩니다.

---

## 🧰 기술 스택
- **Frontend**: React, Vite, TypeScript, React Router, Axios *(스타일/지도 라이브러리는 프로젝트 기준 적용)*  
- **Backend**: Spring Boot, Java, Spring Data JPA *(JWT/Security/WebSocket 등은 구현 수준에 맞춰 구성)*  
- **Database & Cache**: MySQL(영속 데이터), **Redis(장소 검색 결과 캐싱)**  
- **DevOps**: Docker / Docker Compose(선택), GitHub

```mermaid
pie title Tech Focus
  "Frontend (React)" : 40
  "Backend (Spring)" : 40
  "Data & Cache (MySQL/Redis)" : 15
  "DevOps (Docker)" : 5

## 아키텍처
flowchart LR
  subgraph Client[Frontend · React + Vite + TypeScript]
    UI[SPA UI · 지도/검색/일정 편집]
  end

  subgraph API[Backend · Spring Boot + JPA]
    C[REST Controllers]
    S[Services<br/>Trip / Place / Companion / Social / Chat]
    ALG[Route Optimizer<br/>· 방문 순서/시간 예측]
  end

  subgraph Data[Data Layer]
    DB[(MySQL)]
    RC[(Redis · Google Place 결과 캐시)]
  end

  subgraph Ext[External APIs]
    GP[Google Places API]
  end

  UI <--> C
  C --> S --> DB
  S -->|장소 검색| RC
  RC -- miss --> S --> GP --> S --> RC
  S --> ALG
  ALG --> C --> UI


