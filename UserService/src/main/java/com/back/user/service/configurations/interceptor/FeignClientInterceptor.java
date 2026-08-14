package com.back.user.service.configurations.interceptor;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.stereotype.Component;

@Component
public class FeignClientInterceptor implements RequestInterceptor {

    private final OAuth2AuthorizedClientManager manager;

    public FeignClientInterceptor(
            OAuth2AuthorizedClientManager manager) {
        this.manager = manager;
    }

    @Override
    public void apply(RequestTemplate template) {

        OAuth2AuthorizeRequest authorizeRequest =
                OAuth2AuthorizeRequest
                        .withClientRegistrationId("my-internal-client")
                        .principal("internal")
                        .build();

        OAuth2AuthorizedClient client =
                manager.authorize(authorizeRequest);

        String token =
                client.getAccessToken().getTokenValue();

        template.header(
                "Authorization",
                "Bearer " + token
        );
    }
}