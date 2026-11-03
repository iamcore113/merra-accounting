package org.merra.service;

import java.util.Date;
import java.util.concurrent.TimeUnit;

import org.merra.config.JwtUtils;
import org.merra.utilities.RedisKeys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;

@Service
public class TokenBlacklistService {
    private static final Logger logger = LoggerFactory.getLogger(TokenBlacklistService.class);
    private final RedisTemplate<String, Object> redisTemplate;
    private final JwtUtils jwtUtils;

    public TokenBlacklistService(RedisTemplate<String, Object> redisTemplate, JwtUtils jwtUtils) {
        this.redisTemplate = redisTemplate;
        this.jwtUtils = jwtUtils;
    }

    /**
     * Adds the given JWT token to the Redis blacklist with a TTL equal to the
     * token's remaining lifetime.
     *
     * @param token the JWT string to blacklist
     */
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        try {
            Date expiration = jwtUtils.extractClaim(token, Claims::getExpiration);
            long remainingTimeMs = expiration.getTime() - System.currentTimeMillis();
            if (remainingTimeMs > 0) {
                String key = RedisKeys.getBlacklistKey(token);
                redisTemplate.opsForValue().set(key, "blacklisted", remainingTimeMs, TimeUnit.MILLISECONDS);
                logger.info("Blacklisted token with remaining TTL: {} ms", remainingTimeMs);
            } else {
                logger.debug("Token already expired, skipping blacklist");
            }
        } catch (Exception e) {
            logger.warn("Could not blacklist token (token may be invalid or expired): {}", e.getMessage());
        }
    }

    /**
     * Checks if a token is present in the Redis blacklist.
     *
     * @param token the JWT string to inspect
     * @return true if the token is blacklisted, false otherwise
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            String key = RedisKeys.getBlacklistKey(token);
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            logger.error("Error checking token blacklist in Redis: {}", e.getMessage(), e);
            return false;
        }
    }
}

