package org.merra.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.cache.autoconfigure.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.connection.RedisConfiguration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

@Configuration(proxyBeanMethods = false)
@EnableCaching
public class CachingConfig {

        @Value("${spring.data.redis.host:localhost}")
        private String redisHost;
        @Value("${spring.data.redis.port:6379}")
        private int redisPort;
        @Value("${spring.data.redis.password:}")
        private String redisPassword;

        @Bean
        public LettuceConnectionFactory redisConnectionFactory() {
                LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                                .useSsl()
                                .disablePeerVerification()
                                .and()
                                .commandTimeout(Duration.ofSeconds(2))
                                .shutdownTimeout(Duration.ZERO)
                                .build();

                RedisStandaloneConfiguration serverConfig = new RedisStandaloneConfiguration(redisHost, redisPort);
                if (redisPassword != null && !redisPassword.isEmpty()) {
                        serverConfig.setPassword(redisPassword);
                }

                return new LettuceConnectionFactory(serverConfig, clientConfig);
        }

        @Bean
        public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer() {
                return (builder) -> builder
                                .withCacheConfiguration("principal", RedisCacheConfiguration
                                                .defaultCacheConfig().entryTtl(Duration.ofMinutes(10)))
                                .withCacheConfiguration("cache1", RedisCacheConfiguration
                                                .defaultCacheConfig().entryTtl(Duration.ofMinutes(10)));

        }
}
