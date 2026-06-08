package com.example.demo.dto.service;

import com.example.demo.entity.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServResponse {

    private Long id;

    private String name;

    private ServiceType type;
}
