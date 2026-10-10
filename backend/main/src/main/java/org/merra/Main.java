package org.merra;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;


import com.redis.om.spring.annotations.EnableRedisEnhancedRepositories;

@EnableJpaRepositories(basePackages = "org.merra")
@EntityScan(basePackages = "org.merra")
@SpringBootApplication(scanBasePackages = "org.merra")
@EnableRedisEnhancedRepositories(basePackages = "org.merra")
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}