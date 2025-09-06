package com.tripmate.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            // 1. URL 파라미터에서 토큰 찾기
            String token = servletRequest.getServletRequest().getParameter("token");
            System.out.println("🔐 [JwtHandshakeInterceptor] URL 파라미터 토큰: " + (token != null ? "존재" : "없음"));
            
            // 2. 헤더에서도 토큰 찾기
            if (token == null) {
                String authHeader = servletRequest.getServletRequest().getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                    System.out.println("🔐 [JwtHandshakeInterceptor] 헤더에서 토큰 발견");
                }
            }
            
            if (token != null) {
                attributes.put("token", "Bearer " + token);
                System.out.println("🔐 [JwtHandshakeInterceptor] 토큰 저장 완료");
            } else {
                System.out.println("❌ [JwtHandshakeInterceptor] 토큰을 찾을 수 없음");
            }
        }
        return true;
    }
    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                              WebSocketHandler wsHandler, Exception exception) {}
}
