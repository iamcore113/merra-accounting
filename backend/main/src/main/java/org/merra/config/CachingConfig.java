package org.merra.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.cache.autoconfigure.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration(proxyBeanMethods = false)
@EnableCaching
public class CachingConfig {

        @Value("${spring.data.redis.host:localhost}")
        private String redisHost;
        @Value("${spring.data.redis.port:6379}")
        private int redisPort;
        @Value("${spring.data.redis.password:}")
        private String redisPassword;

        /**
         * Configures and returns a {@link LettuceConnectionFactory} for connecting to
         * the Redis instance.
         * <p>
         * The connection is configured to use SSL with peer verification disabled,
         * a command timeout of 2 seconds, and immediate shutdown (zero shutdown
         * timeout).
         * </p>
         *
         * @return the configured Lettuce connection factory
         */
        @Bean
        public LettuceConnectionFactory lettuceConnectionFactory() {
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

        // @Bean
        // public RedisCacheManagerBuilderCustomizer
        // redisCacheManagerBuilderCustomizer() {
        // return (builder) -> builder
        // .withCacheConfiguration("principal", RedisCacheConfiguration
        // .defaultCacheConfig().entryTtl(Duration.ofHours(2)));

        // }

        @Bean
        RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
                RedisTemplate<String, Object> template = new RedisTemplate<>();
                template.setConnectionFactory(connectionFactory);

                template.setKeySerializer(new StringRedisSerializer());
                template.setHashKeySerializer(new StringRedisSerializer());
                template.setValueSerializer(RedisSerializer.json());
                template.setHashValueSerializer(RedisSerializer.json());
                return template;
        }

}
