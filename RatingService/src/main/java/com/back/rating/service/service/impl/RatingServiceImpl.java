package com.back.rating.service.service.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.back.rating.service.entities.Rating;
import com.back.rating.service.repository.RatingRepository;
import com.back.rating.service.service.RatingService;

@Service
public class RatingServiceImpl implements RatingService{
	
	@Autowired
    private RatingRepository repository;


	@Override
	public Rating create(Rating rating) {        
        String ratingID = UUID.randomUUID().toString();
        rating.setRatingId(ratingID);
		return repository.save(rating);
	}

	@Override
	public List<Rating> getRatings() {
		return repository.findAll();
	}

	@Override
	public List<Rating> getRatingByUserId(String userId) {
		return repository.findByUserId(userId);
	}

	@Override
	public List<Rating> getRatingByHotelId(String hotelId) {
		return repository.findByHotelId(hotelId);
	}

}
