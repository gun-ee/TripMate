
package com.tripmate.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
@Configuration
public class HttpConfig {
  @Value("${http.connect.timeout.ms:5000}") private int connectTimeoutMs;
  @Value("${http.read.timeout.ms:10000}") private int readTimeoutMs;
  @Bean public RestTemplate restTemplate() {
    HttpComponentsClientHttpRequestFactory f = new HttpComponentsClientHttpRequestFactory();
    f.setConnectTimeout(connectTimeoutMs); f.setReadTimeout(readTimeoutMs); return new RestTemplate(f);
  }
}
