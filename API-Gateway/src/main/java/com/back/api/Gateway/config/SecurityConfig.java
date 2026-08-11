package com.back.api.Gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(
            ServerHttpSecurity httpSecurity) {

        httpSecurity
                .authorizeExchange(exchange -> exchange
                        .pathMatchers("/oauth2/**").permitAll()
                        .pathMatchers("/login/oauth2/**").permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2Login(oauth2 -> {})
                .oauth2Client(oauth2 -> {})
                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt());

        return httpSecurity.build();
    }
}