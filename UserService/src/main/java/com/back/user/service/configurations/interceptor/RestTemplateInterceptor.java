package com.back.user.service.configurations.interceptor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;

import java.io.IOException;

public class RestTemplateInterceptor implements ClientHttpRequestInterceptor {

    private final OAuth2AuthorizedClientManager manager;

    private final Logger logger =
            LoggerFactory.getLogger(RestTemplateInterceptor.class);

    public RestTemplateInterceptor(
            OAuth2AuthorizedClientManager manager) {
        this.manager = manager;
    }

    @Override
    public ClientHttpResponse intercept(
            HttpRequest request,
            byte[] body,
            ClientHttpRequestExecution execution) throws IOException {

        OAuth2AuthorizeRequest authorizeRequest =
                OAuth2AuthorizeRequest
                        .withClientRegistrationId("my-internal-client")
                        .principal("internal")
                        .build();

        OAuth2AuthorizedClient client =
                manager.authorize(authorizeRequest);

        String token =
                client.getAccessToken().getTokenValue();

        logger.info("RestTemplate interceptor: Token generated");
        logger.info("Rest Template interceptor: Token : {}", token);
        logger.info("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Rest Interceptor ran!!!!!!");

        request.getHeaders().add(
                "Authorization",
                "Bearer " + token
        );

        return execution.execute(request, body);
    }
}