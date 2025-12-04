package org.merra;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@EnableJpaRepositories(basePackages = { "org.merra" })
@EntityScan(basePackages = { "org.merra" })
@SpringBootApplication(scanBasePackages = { "org.merra" })
@RestController
@RequestMapping
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }

    @GetMapping
    public ResponseEntity<String> main() {
        return ResponseEntity.ok("Backend is running...");
    }
}