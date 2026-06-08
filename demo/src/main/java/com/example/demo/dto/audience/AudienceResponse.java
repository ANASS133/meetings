package com.example.demo.dto.audience;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AudienceResponse {

    private Long id;

    private String name;

    private String description;
}
