package com.back.user.service.service;



import java.util.List;

import com.back.user.service.entities.User;

public interface UserService {
	
	User saveUser(User user);
	
	List<User> getAllUser();
	
	User getUser(String userId);
}
