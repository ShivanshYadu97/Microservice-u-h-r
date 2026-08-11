package com.back.hotel.service.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.back.hotel.service.entities.Hotel;

public interface HotelRepository extends JpaRepository<Hotel, String>{

}
