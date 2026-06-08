package com.example.demo.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.upload")
public class FileStorageProperties {

    /**
     * Root directory where uploaded files are stored (relative to working directory).
     */
    private String dir = "uploads";
}
