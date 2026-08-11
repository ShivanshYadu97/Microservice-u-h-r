package com.back.user.service.configurations;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class UserConfig {

	@Bean
	@LoadBalanced						//if there is more than 1 instance than distribute the load
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}
	
}
