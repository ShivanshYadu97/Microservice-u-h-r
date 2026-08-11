package com.back.user.service.external.service;

import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

import com.back.user.service.entities.Rating;

@FeignClient(name = "RATINGSERVICE")
@Service
public interface RatingService {
	
	
	//create
	@PostMapping("/ratings")
	public Rating createRating(Rating values);
//	public Rating createRating(Map<String, Object> values); if we do not have user defined pre values than we use it cause it will save data in Map as JSON format in key-value pair
	
	//update
	@PutMapping("/ratings/{ratingId}")
	public Rating updateRating(@PathVariable("ratingId") String ratingId, Rating rating);
	
	//delete
	@DeleteMapping("/ratings/{ratingId}")
	public void deleteRating(@PathVariable String ratingId);
}
