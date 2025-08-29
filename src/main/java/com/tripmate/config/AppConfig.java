package com.tripmate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class AppConfig {

  /*@Value("${http.connect.timeout.ms:5000}")
  private int connectTimeoutMs;

  @Value("${http.read.timeout.ms:10000}")
  private int readTimeoutMs;

  @Bean
  public RestTemplate restTemplate() {
    var f = new org.springframework.http.client.HttpComponentsClientHttpRequestFactory();
    f.setConnectTimeout(connectTimeoutMs);
    f.setReadTimeout(readTimeoutMs);
    return new RestTemplate(f);
  }*/
}
