package com.tripmate.service;

import com.tripmate.dto.BotAnswer;
import kr.co.shineware.nlp.komoran.constant.DEFAULT_MODEL;
import kr.co.shineware.nlp.komoran.core.Komoran;
import kr.co.shineware.nlp.komoran.model.KomoranResult;
import kr.co.shineware.nlp.komoran.model.Token;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TravelNlpService {

    private final Komoran komoran = new Komoran(DEFAULT_MODEL.FULL);

    // 의도별 키워드 세트 - 더 정확한 분류를 위해 개선
    private static final Set<String> RESTAURANT_WORDS = Set.of("맛집","음식","식당","카페","레스토랑","요리","맛","먹을곳","식사","점심","저녁","아침","밥","식욕","배고파","배불러","간식","디저트","술집","펜션","호텔식당");
    private static final Set<String> ITINERARY_WORDS = Set.of("일정","코스","루트","가이드","동선","여행계획","스케줄","관광","명소","체험","여행","관광지","관광코스","여행지","유적지","박물관","전시관","공원","산","바다","해수욕장","폭포","사찰","성","궁전","마을","거리","쇼핑");
    private static final Set<String> BUDGET_WORDS = Set.of("예산","비용","얼마","가격","돈","경비","지출","저렴","비싸","가격대","돈이","얼마나","비용이","경제적","합리적","할인","쿠폰","이벤트");
    private static final Set<String> ACCOMPANY_WORDS = Set.of("동행","함께","같이","친구","커플","가족","혼자","솔로","그룹","만남","사람","파트너","메이트","여행객","동료","친구들","가족여행","커플여행","혼자여행","솔로여행");
    private static final Set<String> FAQ_WORDS = Set.of("사용법","도움말","방법","어떻게","뭐야","무엇","기능","서비스","앱","웹사이트","도움","질문","궁금","알려줘","설명","가이드","매뉴얼","도구","특징");

    private static final List<String> CITIES = List.of("서울","부산","제주","인천","대구","대전","광주","울산","수원","고양","용인","성남","화성","청주","천안","전주","포항","창원","김해","여수","순천","목포","군산","익산","정읍","남원","김제","완주","진안","무주","장수","임실","순창","고창","부안","광양","구례","곡성","담양","장성","영광","함평","무안","신안","완도","진도","강진","해남","영암","장흥","보성","화순","나주");

    public BotAnswer answer(String raw) {
        String q = normalize(raw);
        if (!StringUtils.hasText(q)) {
            return BotAnswer.builder().answer("안녕하세요! TripMate 여행 도우미입니다. 🧳\n\n여행 일정 추천, 예산 계산, 동행 구하기 등 다양한 여행 정보를 도와드릴게요!\n\n예시: 제주도 3박4일 일정 추천, 부산 2박3일 2인 예산, 동행 구하기 방법").build();
        }

        // 형태소 분석
        KomoranResult res = komoran.analyze(q);
        List<Token> tokens = res.getTokenList();
        Set<String> nouns = tokens.stream()
                .filter(t -> t.getPos().startsWith("NN")) // 명사
                .map(Token::getMorph).collect(Collectors.toCollection(LinkedHashSet::new));

        // 도시명 추출 (우선순위 높음)
        String city = extractCity(q, nouns);
        
        // 의도 분석 - 더 정확한 분류
        IntentType intent = analyzeIntent(q, nouns);
        
        // 도시명이 있으면 해당 도시 정보 제공, 없으면 일반적인 안내
        if (city != null && !city.equals("여행지")) {
            return generateCityResponse(city, intent, q, nouns);
        } else {
            return generateGeneralResponse(intent, q, nouns);
        }
    }
    
    private IntentType analyzeIntent(String q, Set<String> nouns) {
        // 점수 기반 의도 분석
        int restaurantScore = calculateScore(q, RESTAURANT_WORDS);
        int itineraryScore = calculateScore(q, ITINERARY_WORDS);
        int budgetScore = calculateScore(q, BUDGET_WORDS) + (Pattern.compile("\\d+박\\d+일|\\d+일|\\d+박").matcher(q).find() ? 2 : 0);
        int accompanyScore = calculateScore(q, ACCOMPANY_WORDS);
        int faqScore = calculateScore(q, FAQ_WORDS);
        
        // 가장 높은 점수의 의도 반환
        int maxScore = Math.max(Math.max(Math.max(restaurantScore, itineraryScore), Math.max(budgetScore, accompanyScore)), faqScore);
        
        if (maxScore == 0) return IntentType.GENERAL;
        if (maxScore == restaurantScore) return IntentType.RESTAURANT;
        if (maxScore == itineraryScore) return IntentType.ITINERARY;
        if (maxScore == budgetScore) return IntentType.BUDGET;
        if (maxScore == accompanyScore) return IntentType.ACCOMPANY;
        return IntentType.FAQ;
    }
    
    private String extractCity(String q, Set<String> nouns) {
        // 도시명 우선 추출
        for (String city : CITIES) {
            if (q.contains(city)) {
                return city;
            }
        }
        return null;
    }
    
    private BotAnswer generateCityResponse(String city, IntentType intent, String q, Set<String> nouns) {
        switch (intent) {
            case RESTAURANT:
                return restaurant(city, q, nouns);
            case ITINERARY:
                return itinerary(city, q, nouns);
            case BUDGET:
                return budget(city, q, nouns);
            case ACCOMPANY:
                return accompany(city, q, nouns);
            case FAQ:
                return faq(city, q, nouns);
            default:
                return generalCityInfo(city, q, nouns);
        }
    }
    
    private BotAnswer generateGeneralResponse(IntentType intent, String q, Set<String> nouns) {
        switch (intent) {
            case RESTAURANT:
                return restaurant("여행지", q, nouns);
            case ITINERARY:
                return itinerary("여행지", q, nouns);
            case BUDGET:
                return budget("일반", q, nouns);
            case ACCOMPANY:
                return accompany("여행지", q, nouns);
            case FAQ:
                return faq("여행지", q, nouns);
            default:
                return generalHelp();
        }
    }
    
    private BotAnswer generalCityInfo(String city, String q, Set<String> nouns) {
        String answer = String.format("🏙️ %s에 대해 궁금하시는군요!\n\n", city);
        
        if (city.equals("제주")) {
            answer += "제주도는 한국의 대표적인 휴양지입니다!\n\n";
            answer += "🌊 주요 관광지: 성산일출봉, 한라산, 섭지코지\n";
            answer += "🍽️ 대표 음식: 흑돼지, 해산물, 감귤\n";
            answer += "🏨 숙소: 리조트, 펜션, 게스트하우스\n\n";
        } else if (city.equals("부산")) {
            answer += "부산은 한국 제2의 도시이자 해양관광의 중심지입니다!\n\n";
            answer += "🌊 주요 관광지: 해운대, 자갈치시장, 감천문화마을\n";
            answer += "🍽️ 대표 음식: 밀면, 돼지국밥, 생선구이\n";
            answer += "🏨 숙소: 호텔, 게스트하우스, 모텔\n\n";
        } else if (city.equals("서울")) {
            answer += "서울은 한국의 수도이자 최대 도시입니다!\n\n";
            answer += "🏛️ 주요 관광지: 경복궁, 명동, 홍대, 강남\n";
            answer += "🍽️ 대표 음식: 한정식, 냉면, 갈비\n";
            answer += "🏨 숙소: 호텔, 게스트하우스, 한옥스테이\n\n";
        } else {
            answer += String.format("%s는 좋은 여행지입니다!\n\n", city);
            answer += "🏛️ 다양한 관광지와 맛집이 있어요\n";
            answer += "🍽️ 현지 특색 음식을 맛볼 수 있어요\n";
            answer += "🏨 다양한 숙소 옵션이 있어요\n\n";
        }
        
        answer += "💡 더 구체적인 정보가 필요하시면 아래 메뉴를 선택해주세요!";
        
        return BotAnswer.builder()
                .answer(answer)
                .suggestions(List.of(city + " 맛집 추천", city + " 일정 추천", city + " 예산 계산", city + " 동행 구하기"))
                .build();
    }
    
    private BotAnswer generalHelp() {
        return BotAnswer.builder()
                .answer("안녕하세요! TripMate 여행 도우미입니다. 🧳\n\n어떤 도움이 필요하신가요?\n\n• 여행 일정 추천\n• 맛집 추천\n• 예산 계산\n• 동행 구하기\n• 사용법 안내")
                .suggestions(List.of("제주도 여행", "부산 여행", "서울 여행", "TripMate 사용법"))
                .build();
    }
    
    private int calculateScore(String q, Set<String> words) {
        int score = 0;
        for (String word : words) {
            if (q.contains(word)) {
                score += 1;
                // 더 구체적인 키워드에 가중치
                if (word.length() > 2) score += 1;
            }
        }
        return score;
    }
    
    enum IntentType {
        RESTAURANT, ITINERARY, BUDGET, ACCOMPANY, FAQ, GENERAL
    }

    private BotAnswer restaurant(String city, String q, Set<String> nouns) {
        
        String answer = String.format("🍽️ %s 맛집을 추천드릴게요!\n\n", city);
        
        if (city.equals("제주")) {
            answer += "제주도 대표 맛집들:\n\n";
            answer += "🌊 해산물 맛집\n";
            answer += "• 제주해녀의집 - 신선한 해산물\n";
            answer += "• 성산일출봉 해녀의집 - 전복죽 전문\n\n";
            answer += "🥩 고기 맛집\n";
            answer += "• 제주돼지고기집 - 흑돼지 전문\n";
            answer += "• 한라산돼지고기 - 제주 흑돼지\n\n";
            answer += "☕ 카페\n";
            answer += "• 카페 루프 - 바다뷰 카페\n";
            answer += "• 카페 드롭탑 - 제주 감귤 디저트\n\n";
        } else if (city.equals("부산")) {
            answer += "부산 대표 맛집들:\n\n";
            answer += "🐟 생선구이 맛집\n";
            answer += "• 자갈치시장 - 신선한 생선\n";
            answer += "• 부산어시장 - 회 전문\n\n";
            answer += "🍜 국수 맛집\n";
            answer += "• 밀면 - 부산 대표 국수\n";
            answer += "• 돼지국밥 - 부산 전통 국밥\n\n";
            answer += "🍖 고기 맛집\n";
            answer += "• 부산갈비 - 부산 대표 갈비\n";
            answer += "• 돼지갈비 - 부산식 돼지갈비\n\n";
        } else if (city.equals("서울")) {
            answer += "서울 대표 맛집들:\n\n";
            answer += "🍖 고기 맛집\n";
            answer += "• 삼겹살집 - 맛있는 삼겹살\n";
            answer += "• 갈비집 - 프리미엄 갈비\n\n";
            answer += "🍜 국수 맛집\n";
            answer += "• 냉면집 - 시원한 냉면\n";
            answer += "• 칼국수집 - 정통 칼국수\n\n";
            answer += "☕ 카페\n";
            answer += "• 스타벅스 - 프리미엄 커피\n";
            answer += "• 이디야 - 합리적 가격 커피\n\n";
        } else {
            answer += String.format("%s 지역 맛집 추천:\n\n", city);
            answer += "🍽️ 로컬 맛집\n";
            answer += "• 현지인 추천 식당\n";
            answer += "• 전통 음식 전문점\n\n";
            answer += "☕ 카페\n";
            answer += "• 지역 특색 카페\n";
            answer += "• 디저트 전문점\n\n";
        }
        
        answer += "💡 팁: 현지인들이 많이 찾는 곳을 추천해드렸어요!\n";
        answer += "더 구체적인 음식 종류나 가격대를 말씀해주시면 더 정확한 추천을 드릴 수 있어요!";
        
        return BotAnswer.builder()
                .answer(answer)
                .suggestions(List.of("제주 맛집", "부산 맛집", "서울 맛집", "카페 추천"))
                .build();
    }

    private BotAnswer itinerary(String city, String q, Set<String> nouns) {
        int days = extractDays(q);
        int people = extractPeople(q);
        
        // 도시별 특화 일정 생성
        var daysList = new ArrayList<BotAnswer.Day>();
        for (int d=1; d<=days; d++) {
            List<BotAnswer.Plan> plan = new ArrayList<>();
            
            if (city.equals("제주")) {
                plan.addAll(getJejuDayPlan(d, people));
            } else if (city.equals("부산")) {
                plan.addAll(getBusanDayPlan(d, people));
            } else if (city.equals("서울")) {
                plan.addAll(getSeoulDayPlan(d, people));
            } else {
                plan.addAll(getGenericDayPlan(city, d, people));
            }
            
            daysList.add(new BotAnswer.Day(d, plan));
        }
        
        String answer = String.format("🧳 %s %d박%d일 %d인 여행 일정을 추천드릴게요!\n\n", city, days-1, days, people);
        if (people == 1) answer += "혼자 여행하시는군요! 안전하고 즐거운 여행 되세요! ✈️\n";
        else if (people == 2) answer += "커플 여행이시군요! 로맨틱한 추억을 만들어보세요! 💕\n";
        else answer += "그룹 여행이시군요! 함께 즐거운 시간 보내세요! 👥\n";
        
        return BotAnswer.builder()
                .answer(answer)
                .itinerary(new BotAnswer.Itinerary(daysList))
                .suggestions(List.of("더 자세한 명소 정보 알려줘", "맛집 추천해줘", "교통편은 어떻게 타?"))
                .build();
    }
    
    private List<BotAnswer.Plan> getJejuDayPlan(int day, int people) {
        List<BotAnswer.Plan> plans = new ArrayList<>();
        switch (day) {
            case 1:
                plans.add(new BotAnswer.Plan("09:00", "제주공항 도착 & 렌터카 픽업"));
                plans.add(new BotAnswer.Plan("10:30", "성산일출봉 (일출 명소)"));
                plans.add(new BotAnswer.Plan("12:00", "성산 포구에서 해물라면"));
                plans.add(new BotAnswer.Plan("14:00", "섭지코지 (드라마 촬영지)"));
                plans.add(new BotAnswer.Plan("16:00", "카멜리아힐 (동백꽃)"));
                plans.add(new BotAnswer.Plan("18:00", "제주시내 숙소 체크인"));
                plans.add(new BotAnswer.Plan("19:30", "제주시내 흑돼지 맛집"));
                break;
            case 2:
                plans.add(new BotAnswer.Plan("09:00", "한라산 등반 (백록담)"));
                plans.add(new BotAnswer.Plan("12:00", "한라산 기슭 도시락"));
                plans.add(new BotAnswer.Plan("14:00", "중문관광단지 (테디베어뮤지엄)"));
                plans.add(new BotAnswer.Plan("16:00", "천지연폭포"));
                plans.add(new BotAnswer.Plan("18:00", "중문 해수욕장"));
                plans.add(new BotAnswer.Plan("19:30", "중문 리조트에서 휴식"));
                break;
            case 3:
                plans.add(new BotAnswer.Plan("09:00", "한림공원 (야자수길)"));
                plans.add(new BotAnswer.Plan("11:00", "협재해수욕장"));
                plans.add(new BotAnswer.Plan("13:00", "협재 해물찜"));
                plans.add(new BotAnswer.Plan("15:00", "월정리해수욕장"));
                plans.add(new BotAnswer.Plan("17:00", "제주공항으로 이동"));
                plans.add(new BotAnswer.Plan("19:00", "공항에서 기념품 쇼핑"));
                break;
        }
        return plans;
    }
    
    private List<BotAnswer.Plan> getBusanDayPlan(int day, int people) {
        List<BotAnswer.Plan> plans = new ArrayList<>();
        switch (day) {
            case 1:
                plans.add(new BotAnswer.Plan("09:00", "부산역 도착"));
                plans.add(new BotAnswer.Plan("10:00", "자갈치시장 (신선한 해산물)"));
                plans.add(new BotAnswer.Plan("12:00", "자갈치시장에서 회덮밥"));
                plans.add(new BotAnswer.Plan("14:00", "부산타워 & 용두산공원"));
                plans.add(new BotAnswer.Plan("16:00", "남포동 BIFF광장"));
                plans.add(new BotAnswer.Plan("18:00", "해운대 해수욕장"));
                plans.add(new BotAnswer.Plan("19:30", "해운대 마린시티"));
                break;
            case 2:
                plans.add(new BotAnswer.Plan("09:00", "감천문화마을 (부산의 마추픽추)"));
                plans.add(new BotAnswer.Plan("11:00", "태종대 (부산 최남단)"));
                plans.add(new BotAnswer.Plan("13:00", "오륙도 스카이워크"));
                plans.add(new BotAnswer.Plan("15:00", "송도해수욕장"));
                plans.add(new BotAnswer.Plan("17:00", "부산역으로 이동"));
                plans.add(new BotAnswer.Plan("19:00", "부산역 근처 쇼핑"));
                break;
        }
        return plans;
    }
    
    private List<BotAnswer.Plan> getSeoulDayPlan(int day, int people) {
        List<BotAnswer.Plan> plans = new ArrayList<>();
        switch (day) {
            case 1:
                plans.add(new BotAnswer.Plan("09:00", "경복궁 (한복 체험)"));
                plans.add(new BotAnswer.Plan("11:00", "인사동 (전통문화)"));
                plans.add(new BotAnswer.Plan("13:00", "인사동 전통 한정식"));
                plans.add(new BotAnswer.Plan("15:00", "북촌한옥마을"));
                plans.add(new BotAnswer.Plan("17:00", "청계천"));
                plans.add(new BotAnswer.Plan("19:00", "명동 쇼핑"));
                plans.add(new BotAnswer.Plan("21:00", "남대문시장 야시장"));
                break;
            case 2:
                plans.add(new BotAnswer.Plan("09:00", "한강공원 (자전거 대여)"));
                plans.add(new BotAnswer.Plan("11:00", "63빌딩 전망대"));
                plans.add(new BotAnswer.Plan("13:00", "여의도 한강공원"));
                plans.add(new BotAnswer.Plan("15:00", "홍대 (젊은 문화)"));
                plans.add(new BotAnswer.Plan("17:00", "이태원"));
                plans.add(new BotAnswer.Plan("19:00", "강남 쇼핑"));
                break;
        }
        return plans;
    }
    
    private List<BotAnswer.Plan> getGenericDayPlan(String city, int day, int people) {
        List<BotAnswer.Plan> plans = new ArrayList<>();
        plans.add(new BotAnswer.Plan("09:00", city + " 시내 관광"));
        plans.add(new BotAnswer.Plan("12:00", city + " 로컬 맛집"));
        plans.add(new BotAnswer.Plan("14:00", city + " 대표 명소"));
        plans.add(new BotAnswer.Plan("16:00", city + " 문화체험"));
        plans.add(new BotAnswer.Plan("18:00", city + " 야경 명소"));
        return plans;
    }

    private BotAnswer budget(String city, String q, Set<String> nouns) {
        int nights = extractNights(q);
        int people = extractPeople(q);
        
        // 도시별 예산 계산
        int perNight, foodPerDay, localTrans, activityPerDay;
        if (city.equals("제주")) {
            perNight = 120000; foodPerDay = 40000; localTrans = 15000; activityPerDay = 20000;
        } else if (city.equals("부산")) {
            perNight = 80000; foodPerDay = 35000; localTrans = 12000; activityPerDay = 15000;
        } else if (city.equals("서울")) {
            perNight = 100000; foodPerDay = 45000; localTrans = 10000; activityPerDay = 25000;
        } else {
            perNight = 90000; foodPerDay = 30000; localTrans = 10000; activityPerDay = 15000;
        }
        
        int accommodation = nights * perNight;
        int food = (nights + 1) * foodPerDay;
        int transport = (nights + 1) * localTrans;
        int activities = (nights + 1) * activityPerDay;
        int total = (accommodation + food + transport + activities) * people;
        
        String ans = String.format("💰 %s %d박%d일 %d인 예산 계산 결과\n\n" +
                "🏨 숙박비: %,d원 (%d박 × %,d원)\n" +
                "🍽️ 식비: %,d원 (%d일 × %,d원)\n" +
                "🚌 교통비: %,d원 (%d일 × %,d원)\n" +
                "🎯 체험비: %,d원 (%d일 × %,d원)\n\n" +
                "💵 총 예상비용: %,d원\n\n" +
                "※ 항공권, 쇼핑비, 여행자보험 등은 별도입니다.",
                city, nights, nights+1, people,
                accommodation, nights, perNight,
                food, nights+1, foodPerDay,
                transport, nights+1, localTrans,
                activities, nights+1, activityPerDay,
                total);
        
        return BotAnswer.builder()
                .answer(ans)
                .suggestions(List.of("더 저렴한 숙소 추천해줘", "무료 관광지 알려줘", "할인 방법 있어?"))
                .build();
    }

    private BotAnswer accompany(String city, String q, Set<String> nouns) {
        String ans = "👥 TripMate 동행 구하기 서비스 안내\n\n" +
                "1️⃣ 동행구하기 메뉴에서 여행 일정을 등록하세요\n" +
                "2️⃣ 같은 기간, 같은 지역 여행자를 찾아보세요\n" +
                "3️⃣ 프로필을 확인하고 메시지로 연락하세요\n" +
                "4️⃣ 안전한 만남을 위해 공개 장소에서 만나세요\n\n" +
                "💡 팁: 상세한 여행 계획과 함께 등록하면 더 많은 관심을 받을 수 있어요!";
        
        return BotAnswer.builder()
                .answer(ans)
                .suggestions(List.of("동행 구하기 글 작성법", "안전한 만남 방법", "여행 매칭 팁"))
                .build();
    }

    private BotAnswer faq(String city, String q, Set<String> nouns) {
        String ans;
        if (q.contains("사용법") || q.contains("방법") || q.contains("어떻게")) {
            ans = "📱 TripMate 사용법 안내\n\n" +
                    "1️⃣ 회원가입 후 로그인하세요\n" +
                    "2️⃣ 여행 일정 계획 메뉴에서 여행을 계획하세요\n" +
                    "3️⃣ 동행구하기에서 같은 여행자를 찾아보세요\n" +
                    "4️⃣ 트립톡에서 여행 정보를 공유하세요\n" +
                    "5️⃣ 마이페이지에서 내 여행을 관리하세요\n\n" +
                    "💡 더 자세한 도움이 필요하면 고객센터로 문의하세요!";
        } else if (q.contains("동행")) {
            ans = "👥 동행 구하기 방법\n\n" +
                    "1. 동행구하기 메뉴 클릭\n" +
                    "2. 여행 일정 등록 (날짜, 지역, 인원)\n" +
                    "3. 상세 정보 작성 (여행 스타일, 관심사)\n" +
                    "4. 등록된 글에서 관심 있는 동행자 찾기\n" +
                    "5. 메시지로 연락 후 만남 약속\n\n" +
                    "⚠️ 안전을 위해 공개 장소에서 만나세요!";
        } else if (q.contains("일정") || q.contains("계획")) {
            ans = "📅 여행 일정 계획 방법\n\n" +
                    "1. 여행 일정 계획 메뉴 클릭\n" +
                    "2. 여행지와 날짜 선택\n" +
                    "3. 관심 있는 활동 선택\n" +
                    "4. AI가 맞춤 일정을 추천해드려요\n" +
                    "5. 일정을 저장하고 공유할 수 있어요\n\n" +
                    "🎯 더 정확한 추천을 위해 상세 정보를 입력해주세요!";
        } else if (q.contains("트립톡")) {
            ans = "💬 트립톡 사용법\n\n" +
                    "1. 트립톡 메뉴에서 지역별 채팅방 참여\n" +
                    "2. 여행 정보와 팁을 공유하세요\n" +
                    "3. 실시간으로 현지 정보를 얻을 수 있어요\n" +
                    "4. 다른 여행자들과 소통하세요\n\n" +
                    "🌟 매너 있는 채팅으로 즐거운 여행 정보를 나누세요!";
        } else {
            ans = "❓ 자주 묻는 질문\n\n" +
                    "🔹 TripMate 사용법\n" +
                    "🔹 동행 구하기 방법\n" +
                    "🔹 여행 일정 계획\n" +
                    "🔹 트립톡 사용법\n\n" +
                    "위 키워드를 클릭하거나 질문해주세요!";
        }
        
        return BotAnswer.builder()
                .answer(ans)
                .suggestions(List.of("TripMate 사용법", "동행 구하기 방법", "여행 일정 계획", "트립톡 사용법"))
                .build();
    }

    private int extractDays(String q){
        Matcher m = Pattern.compile("(\\d+)일").matcher(q);
        if (m.find()) return Math.max(2, Math.min(6, Integer.parseInt(m.group(1))));
        return 3;
    }
    private int extractNights(String q){
        Matcher m = Pattern.compile("(\\d+)박(\\d+)일").matcher(q);
        if (m.find()) return Integer.parseInt(m.group(1));
        return 2;
    }
    private int extractPeople(String q){
        Matcher m = Pattern.compile("(\\d+)인").matcher(q);
        if (m.find()) return Integer.parseInt(m.group(1));
        return 1;
    }


    private String normalize(String text){
        if (text == null) return "";
        String t = text.replaceAll("\\s+", " ").trim();
        t = t.replace('’','\'').replace('“','"').replace('”','"');
        return t;
    }
}
