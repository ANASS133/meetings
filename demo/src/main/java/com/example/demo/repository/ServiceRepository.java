package com.example.demo.repository;

import com.example.demo.entity.Service;
import com.example.demo.entity.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Long> {

    List<Service> findByType(ServiceType type);
}
