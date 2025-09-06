package com.tripmate.config;

import com.tripmate.config.JwtHandshakeInterceptor;
import com.tripmate.config.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  @Autowired
  private JwtTokenProvider jwtTokenProvider;
  @Autowired
  private UserDetailsService userDetailsService;
  @Autowired
  private JwtHandshakeInterceptor jwtHandshakeInterceptor;


  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    // 기본 WebSocket 엔드포인트 (SockJS info 엔드포인트용)
    registry.addEndpoint("/ws")
      .addInterceptors(jwtHandshakeInterceptor)
      .setAllowedOriginPatterns("*")
      .withSockJS();

    // 지역 채팅용 WebSocket 엔드포인트
    registry.addEndpoint("/ws/region-chat")
      .addInterceptors(jwtHandshakeInterceptor)
      .setAllowedOriginPatterns("*")  // 프론트 React와 연결 가능
      .withSockJS();  // SockJS fallback 허용

    // 기존 채팅용 WebSocket 엔드포인트
    registry.addEndpoint("/ws/chat")
      .addInterceptors(jwtHandshakeInterceptor)
      .setAllowedOriginPatterns("*")
      .withSockJS();

    // 경매용 WebSocket 엔드포인트
    registry.addEndpoint("/ws/auction")
      .addInterceptors(jwtHandshakeInterceptor)
      .setAllowedOriginPatterns("*")
      .withSockJS();
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableSimpleBroker("/queue", "/topic"); // 브로커 구독 경로
    registry.setApplicationDestinationPrefixes("/app"); // 메시지 송신 경로
  }

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(new ChannelInterceptor() {
      @Override
      public Message<?> preSend(Message<?> message, MessageChannel channel) {
        System.out.println("preSend - 메시지 타입: " + message.getClass().getSimpleName());
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        System.out.println("preSend - accessor.getCommand(): " + accessor.getCommand());
        System.out.println("preSend - accessor.getDestination(): " + accessor.getDestination());
        System.out.println("preSend - accessor.getUser(): " + accessor.getUser());

        if (accessor.getUser() == null) {
          // Handshake에서 저장한 token을 꺼냄
          String token = (String) accessor.getSessionAttributes().get("token");
          System.out.println("🔐 [WebSocketConfig] preSend - token: " + (token != null ? "존재" : "없음"));
          
          if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            System.out.println("🔐 [WebSocketConfig] preSend - Bearer 제거 후 토큰: " + token.substring(0, Math.min(20, token.length())) + "...");
          }
          
          if (token != null) {
            try {
              String email = jwtTokenProvider.getEmail(token);
              System.out.println("🔐 [WebSocketConfig] preSend - 토큰에서 추출한 이메일: " + email);
              
              UserDetails userDetails = userDetailsService.loadUserByUsername(email);
              Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
              
              // 인증 정보를 accessor에 설정
              accessor.setUser(auth);
              SecurityContextHolder.getContext().setAuthentication(auth);
              
              // Member 정보를 sessionAttributes에 저장하여 메시지 핸들러에서 사용
              if (userDetails instanceof CustomUserDetails) {
                CustomUserDetails customUserDetails = (CustomUserDetails) userDetails;
                accessor.getSessionAttributes().put("memberId", customUserDetails.getMemberId());
                accessor.getSessionAttributes().put("memberEmail", customUserDetails.getUsername());
                accessor.getSessionAttributes().put("userDetails", customUserDetails);
                System.out.println("🔐 [WebSocketConfig] preSend - Member ID: " + customUserDetails.getMemberId());
              }
              
              System.out.println("✅ [WebSocketConfig] preSend - 인증 성공");
            } catch (Exception e) {
              System.out.println("❌ [WebSocketConfig] preSend - 토큰 검증 실패: " + e.getMessage());
            }
          } else {
            System.out.println("❌ [WebSocketConfig] preSend - 토큰이 없음");
          }
        } else {
          System.out.println("🔐 [WebSocketConfig] preSend - 이미 인증된 사용자: " + accessor.getUser().getName());
        }
        return message;
      }
      
      @Override
      public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        
        // 연결 해제 시 참여자 비활성화
        if (accessor.getCommand() == StompCommand.DISCONNECT) {
          String sessionId = accessor.getSessionId();
          System.out.println("🔌 WebSocket 연결 해제 감지: sessionId=" + sessionId);

        }
      }
    });
  }
}
