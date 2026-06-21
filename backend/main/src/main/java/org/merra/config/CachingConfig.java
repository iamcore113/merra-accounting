package org.merra.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.jedis.JedisClientConfiguration;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import redis.clients.jedis.ConnectionPoolConfig;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.X509Certificate;
import java.security.NoSuchAlgorithmException;
import java.security.KeyManagementException;

@Configuration
@EnableCaching
public class CachingConfig {

        @Value("${spring.data.redis.host:localhost}")
        private String redisHost;
        @Value("${spring.data.redis.port:6379}")
        private int redisPort;
        @Value("${spring.data.redis.password:}")
        private String redisPassword;

        @Bean
        @Profile("dev")
        public JedisConnectionFactory redisConnectionFactory() {
                TrustManager[] trustAllCerts = new TrustManager[] {
                                new X509TrustManager() {
                                        public X509Certificate[] getAcceptedIssuers() {
                                                return new X509Certificate[0];
                                        }

                                        public void checkClientTrusted(X509Certificate[] certs, String authType) {
                                        }

                                        public void checkServerTrusted(X509Certificate[] certs, String authType) {
                                        }
                                }
                };

                SSLContext sslContext;
                try {
                        sslContext = SSLContext.getInstance("TLS");
                        sslContext.init(null, trustAllCerts, new java.security.SecureRandom());
                } catch (NoSuchAlgorithmException | KeyManagementException e) {
                        throw new RuntimeException("Failed to initialize SSLContext for Jedis", e);
                }

                ConnectionPoolConfig poolConfig = new ConnectionPoolConfig();
                poolConfig.setMaxTotal(50); // Max active connections
                poolConfig.setMaxIdle(20); // Max idle connections to keep
                poolConfig.setMinIdle(5); // Min idle connections
                poolConfig.setMaxWait(Duration.ofSeconds(2)); // Wait up to 2 seconds for a connection before failing

                JedisClientConfiguration clientConfig = JedisClientConfiguration.builder()
                                .usePooling()
                                .poolConfig(poolConfig)
                                .and()
                                .useSsl()
                                .sslSocketFactory(sslContext.getSocketFactory())
                                .hostnameVerifier((hostname, session) -> true)
                                .and()
                                .readTimeout(Duration.ofSeconds(2))
                                .connectTimeout(Duration.ofSeconds(2))
                                .build();

                RedisStandaloneConfiguration serverConfig = new RedisStandaloneConfiguration(redisHost, redisPort);
                if (redisPassword != null && !redisPassword.isEmpty()) {
                        serverConfig.setPassword(redisPassword);
                }

                return new JedisConnectionFactory(serverConfig, clientConfig);
        }

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
