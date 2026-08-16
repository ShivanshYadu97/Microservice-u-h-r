package com.back.api.Gateway.controller;

import com.back.api.Gateway.model.AuthResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @GetMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RegisteredOAuth2AuthorizedClient("keycloak")OAuth2AuthorizedClient client,
            @AuthenticationPrincipal OidcUser user
    ) {

        AuthResponse authResponse = new AuthResponse();
        authResponse.setUserId(user.getEmail());
        authResponse.setAccessToken(client.getAccessToken().getTokenValue());

        if (client.getRefreshToken() != null) {
        		authResponse.setRefreshToken(client.getRefreshToken().getTokenValue());
        }

        if (client.getAccessToken().getExpiresAt() != null) {
        		authResponse.setExpireAt(client.getAccessToken().getExpiresAt().getEpochSecond());
        }

        List<String> authorities = user.getAuthorities()
                .stream()
                .map(authority -> authority.getAuthority())
                .collect(Collectors.toList());

        authResponse.setAuthorities(authorities);
        
        return new ResponseEntity<>(authResponse,HttpStatus.OK);
    }
    
    @GetMapping("/logged-out")
    public String loggedOut() {
        return "Successfully Logged Out";
    }
}