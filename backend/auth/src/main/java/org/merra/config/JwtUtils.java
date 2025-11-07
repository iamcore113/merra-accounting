package org.merra.config;

import java.io.IOException;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtils {

    @Value("${jwt.token.secret}")
    private String jwtSecret;

    /**
     * This method will extract the user-name from the token.
     * 
     * @param token - accepts token in {@linkplain java.util.String} format.
     * @return - {@linkplain java.util.String}
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String generateToken(UserDetails userDetails, int tokenDuration, boolean isRefreshToken) {
        Date expirationDate = null;

        if (isRefreshToken) {
            expirationDate = generateRefreshTokenExpirationDate(tokenDuration);
        } else {
            expirationDate = new Date(System.currentTimeMillis() + tokenDuration);
        }
        return tokenBuilder(expirationDate, userDetails);
    }

    private Date generateRefreshTokenExpirationDate(int tokenDuration) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(new Date());
        cal.add(Calendar.DAY_OF_MONTH, tokenDuration); // add 5 days
        return cal.getTime();
    }

    private String tokenBuilder(@NonNull Date exDate, @NonNull UserDetails userDetails) {
        var algo = Jwts.SIG.HS256;

        return Jwts
                .builder()
                .claims(null)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(exDate)
                .signWith(getSignInKey(), algo)
                .compact();
    }

    /**
     * This method will check if token is valid.
     * 
     * @param token       - {@linkplain java.util.String}
     * @param userDetails - {@linkplain UserDetails} object type.
     * @return - boolean type
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token); // or email. but with the context of this Jwtservice, we'll
                                                        // stick to username
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}