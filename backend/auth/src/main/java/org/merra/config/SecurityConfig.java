package org.merra.config;

import org.merra.enums.UserAccountStatusEn;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true)
public class SecurityConfig {

    private final AuthEntrypointJwt unAuthorizedHandler;
    private final CustomUserDetailsService customUserDetailsService;
    private final MainTokenFilter mainTokenFilter;
    private final TempTokenFilter tempTokenFilter;

    public SecurityConfig(
            MainTokenFilter mainTokenFilter,
            AuthEntrypointJwt unAuthorizedHandler,
            TempTokenFilter tempTokenFilter,
            CustomUserDetailsService customUserDetailsService) {
        this.unAuthorizedHandler = unAuthorizedHandler;
        this.customUserDetailsService = customUserDetailsService;
        this.mainTokenFilter = mainTokenFilter;
        this.tempTokenFilter = tempTokenFilter;
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
        The typical reason to do this is to keep the filter as a Spring-managed bean
        (so it can be injected or referenced) but avoid double-registration: the filter can
        instead be inserted explicitly into the Spring Security filter chain
        (for example via addFilterBefore/addFilterAfter), giving precise control over ordering and execution context.
        Gotchas: disabling registration means the servlet container won’t run the filter unless it’s
        manually added elsewhere; ensure the TempTokenFilter bean is still injected into your Security
        configuration and added to the Security filter chain, otherwise it will never execute. 
    */
    @Bean
    public FilterRegistrationBean<TempTokenFilter> registration(TempTokenFilter filter) {
        FilterRegistrationBean<TempTokenFilter> registration = new FilterRegistrationBean<>(filter);
        // This line is the magic: it tells Spring Boot NOT to add it to the main filter chain
        registration.setEnabled(false); 
        return registration;
    }

    @Bean
    public FilterRegistrationBean<MainTokenFilter> registrationMain(MainTokenFilter filter) {
        FilterRegistrationBean<MainTokenFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
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
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(customizer -> customizer
                        /*
                         * Allows all HTTP OPTIONS requests to any path without authentication.
                         * This is important for CORS preflight requests, which browsers send before
                         * actual API calls.
                         */
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                            "/api/v1/metadata/**",
                            "/api/v1/account/user/**"
                        )
                        .hasRole(UserAccountStatusEn.PENDING.toString())
                        .requestMatchers(
                                "/",
                                "/api/v1/auth/**",
                                "/swagger-ui/**",
                                "/api-docs/**",
                                "/v3/api-docs/**")
                        .permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(
                        customizer -> customizer.authenticationEntryPoint(unAuthorizedHandler))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(tempTokenFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(mainTokenFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

}
