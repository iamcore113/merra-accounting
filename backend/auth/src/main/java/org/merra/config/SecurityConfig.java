package org.merra.config;

import java.util.Arrays;

import org.merra.enums.UserAccountStatusEn;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.data.repository.query.SecurityEvaluationContextExtension;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true)
public class SecurityConfig {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final static String ROLE_ADVISOR = UserAccountStatusEn.ADVISOR.toString();
    private final static String ROLE_MEMBER = UserAccountStatusEn.MEMBER.toString();
    private final static String ROLE_STANDARD = UserAccountStatusEn.STANDARD.toString();
    private final static String ROLE_READ_ONLY = UserAccountStatusEn.READ_ONLY.toString();
    private final static String ROLE_INVOICE_ONLY = UserAccountStatusEn.INVOICE_ONLY.toString();
    private final static String ROLE_IDLE = UserAccountStatusEn.IDLE.toString();

    private final AuthEntrypointJwt unAuthorizedHandler;
    private final CustomUserDetailsService customUserDetailsService;
    private final TokenFilter tokenFilter;

    public SecurityConfig(
            AuthEntrypointJwt unAuthorizedHandler,
            TokenFilter tokenFilter,
            CustomUserDetailsService customUserDetailsService) {
        this.unAuthorizedHandler = unAuthorizedHandler;
        this.customUserDetailsService = customUserDetailsService;
        this.tokenFilter = tokenFilter;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration builder) throws Exception {
        return builder.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(customUserDetailsService);
        /* Tell AuthenticationProvider which UserDetailService to use */
        /*
         * Fetch information about the user
         * Provide a password on encoder
         */
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /*
     * This bean is used for method level security expressions.
     */
    @Bean
    public SecurityEvaluationContextExtension securityEvaluationContextExtension() {
        return new SecurityEvaluationContextExtension();
    }

    /*
     * The typical reason to do this is to keep the filter as a Spring-managed bean
     * (so it can be injected or referenced) but avoid double-registration: the
     * filter can
     * instead be inserted explicitly into the Spring Security filter chain
     * (for example via addFilterBefore/addFilterAfter), giving precise control over
     * ordering and execution context.
     * Gotchas: disabling registration means the servlet container won’t run the
     * filter unless it’s
     * manually added elsewhere; ensure the TempTokenFilter bean is still injected
     * into your Security
     * configuration and added to the Security filter chain, otherwise it will never
     * execute.
     */
    @Bean
    public FilterRegistrationBean<TokenFilter> registrationMain(TokenFilter filter) {
        FilterRegistrationBean<TokenFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public static RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.withDefaultRolePrefix()
                .role(ROLE_ADVISOR).implies(ROLE_STANDARD)
                .role(ROLE_STANDARD).implies(ROLE_INVOICE_ONLY)
                .role(ROLE_INVOICE_ONLY).implies(ROLE_READ_ONLY)
                .role(ROLE_READ_ONLY).implies(ROLE_IDLE)
                .build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(frontendUrl));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * This security filter chain method is used for the apis.
     * 
     * @param http - accepts {@linkplain HttpSecurity} object.
     * @return - {@linkplain SecurityFilterChain} object.
     * @throws Exception
     */
    @Bean
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(customizer -> customizer
                        /*
                         * Allows all HTTP OPTIONS requests to any path without authentication.
                         * This is important for CORS preflight requests, which browsers send before
                         * actual API calls.
                         */
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/api/metadata/**",
                                "/api/account/user/**")
                        .hasAnyRole(ROLE_IDLE, ROLE_READ_ONLY, ROLE_INVOICE_ONLY, ROLE_STANDARD, ROLE_ADVISOR,
                                ROLE_MEMBER)
                        .requestMatchers(
                                "/",
                                "/api/main/utilities/**",
                                "/actuator/**",
                                "/api/auth/**",
                                "/api/tokens/**",
                                "/swagger-ui/**",
                                "/api-docs/**",
                                "/v3/api-docs/**")
                        .permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(
                        customizer -> customizer.authenticationEntryPoint(unAuthorizedHandler))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(tokenFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

}
