# TripMate · 개인 프로젝트

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-007396?logo=openjdk&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

> **한 줄 소개**  
> 여행 일정을 만들고, 그 일정 기반으로 동행을 모으며, 소셜·위치 채팅까지 목표로 하는 올인원 여행 플랫폼.  
> 프론트/백엔드 **완전 분리** 구조, **직접 구현한 동선 최적화 알고리즘**, **Redis 캐싱으로 Google Place API 호출 최소화**가 핵심입니다.

---

## 목차
- [핵심 기능](#핵심-기능)
- [아키텍처](#아키텍처)
- [기능별 흐름도](#기능별-흐름도)
- [페이지 방문 흐름](#페이지-방문-흐름)
- [기술 스택](#기술-스택)
- [빠른 시작](#빠른-시작)
- [프로젝트 구조(예시)](#프로젝트-구조예시)
- [하이라이트](#하이라이트)
- [로드맵](#로드맵)
- [라이선스 & 문의](#라이선스--문의)

---

## 핵심 기능

- ✈️ **여행 일정 플래너**: 날짜·도시 선택 → 장소 추가/정렬 → 일정 저장/수정  
- 🤝 **동행 모집**: 생성한 일정에 기반해 모집글 작성, 참여 신청/수락 흐름  
- 🗣️ **소셜 기능**: 게시글/댓글/좋아요(기본 커뮤니티 기능)  
- 📍 **지역 채팅**: 지역(도시) 단위 채팅 (실시간 통신은 프론트/백 설계에 포함)

> **중요**: **Redis는 채팅이 아닌** *Google Place* 장소 검색 결과 **캐싱**에 사용됩니다. (중복 호출 최소화)

---

## 아키텍처

```mermaid
flowchart LR
  subgraph Client[Frontend: React + Vite + TS]
    UI[SPA UI/지도/검색/일정편집]
  end

  subgraph Server[Backend: Spring Boot + JPA]
    API[REST API]
    OPT[동선 최적화 알고리즘]
  end

  subgraph Storage[Storage]
    DB[(MySQL)]
    C{Redis Cache}
  end

  subgraph External[External APIs]
    GP[Google Places API]
  end

  UI <--> API
  API --> DB
  API --> OPT
  UI -->|장소 검색| API
  API -->|캐시 조회| C
  C -- miss --> API --> GP --> API --> C
  API -->|장소 검색 결과| UI
  UI -->|최적화 요청| OPT
  OPT -->|최적 순서/거리·시간 추정| UI
