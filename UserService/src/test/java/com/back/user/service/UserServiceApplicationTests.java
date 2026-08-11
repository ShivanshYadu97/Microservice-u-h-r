package com.back.user.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.back.user.service.entities.Rating;
import com.back.user.service.external.service.RatingService;

@SpringBootTest
class UserServiceApplicationTests {

	@Test
	void contextLoads() {
	}
	
	
	@Autowired
	private RatingService ratingService;

	@Test
	void createRating() {
		Rating rating = Rating.builder().rating(10).userId("").hotelId("").feedback("this is created using Feign Client").build();
		Rating savedRating = ratingService.createRating(rating);
		System.out.println("New Rating Created !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
	}
	
}
