package org.merra.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

public class WebClientConfig {
    // @Value("${spring.security.oauth2.resourceserver.opaquetoken.introspection-uri}")
    private String introspectorUri;

    @Bean
    public WebClient userInfoClient() {
        System.out.println("WebClientConfig - introspectorUri: " + introspectorUri);
        return WebClient.builder().baseUrl(introspectorUri).build();
    }
}
