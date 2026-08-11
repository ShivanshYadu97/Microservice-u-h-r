package com.back.user.service.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.back.user.service.entities.User;

public interface UserRepository extends JpaRepository<User, String>{

}
