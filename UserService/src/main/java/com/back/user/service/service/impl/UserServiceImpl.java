package com.back.user.service.service.impl;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.back.user.service.entities.Hotel;
import com.back.user.service.entities.Rating;
import com.back.user.service.entities.User;
import com.back.user.service.exception.ResourceNotFoundException;
import com.back.user.service.external.service.HotelService;
import com.back.user.service.repositories.UserRepository;
import com.back.user.service.service.UserService;


@Service
public class UserServiceImpl implements UserService{

	@Autowired
	private UserRepository userRepository;
	
	@Autowired
	private RestTemplate restTemplate;
	
	@Autowired
	private HotelService hotelService;
	
	private Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);
	
	@Override
	public User saveUser(User user) {
		String randomUserId = UUID.randomUUID().toString();
	    user.setUserId(randomUserId);
			return userRepository.save(user);
	}

	@Override
	public List<User> getAllUser() {
		return userRepository.findAll();
	}

	@Override
	public User getUser(String userId) {
		User user = userRepository.findById(userId).orElseThrow(()->new ResourceNotFoundException("User not found with given id :"+userId));
		
		//calling RatingService here
		//http://localhost:8083/ratings/users/e70bbb87-fc2c-4c33-8c58-7ffa9a1eb8d5
//		ArrayList<Rating> ratingsOfUser = restTemplate.getForObject("http://localhost:8083/ratings/users/" + user.getUserId(), ArrayList.class);  here ArraList.class stores all the objects in the format of LinkedHashSet which can not be read by map
		Rating[] ratingsOfUser = restTemplate.getForObject("http://RATINGSERVICE/ratings/users/" + user.getUserId(), Rating[].class);	//called Rating MicroService
		logger.info("{} ",ratingsOfUser);
		
		List<Rating> ratings = Arrays.stream(ratingsOfUser).toList();
		
		List<Rating> ratingList = ratings.stream().map(rating -> {
//			Using RestTemplate call for microservice
//			ResponseEntity<Hotel> forEntity = restTemplate.getForEntity("http://HOTELSERVICE/hotels/"+rating.getHotelId(), Hotel.class);	//called Hotel MicroService
//			Hotel hotel = forEntity.getBody();
//			logger.info("response status code: {}",forEntity.getStatusCode());
			
//			Using Feign Client
			Hotel hotel = hotelService.getHotel(rating.getHotelId());
			
			rating.setHotel(hotel);
			return rating;
		}).collect(Collectors.toList());
		
		user.setRatings(ratingList);
		
		return user;
	}

}
