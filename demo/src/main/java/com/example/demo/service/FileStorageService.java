package com.example.demo.service;

import com.example.demo.config.FileStorageProperties;
import com.example.demo.exception.FileStorageException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final FileStorageProperties properties;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(properties.getDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory: " + this.rootLocation, e);
        }
    }

    /**
     * Store a file in a subdirectory (e.g. "photos" or "documents").
     * Returns the URL-accessible path relative to the upload root.
     */
    public String storeFile(MultipartFile file, String subDirectory) {
        String originalFilename = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename()));

        // Sanity check — prevent directory traversal
        if (originalFilename.contains("..")) {
            throw new FileStorageException("Invalid filename path: " + originalFilename);
        }

        // Generate unique filename: uuid_originalName
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }
        String storedFilename = UUID.randomUUID() + extension;

        try {
            Path targetDir = this.rootLocation.resolve(subDirectory);
            Files.createDirectories(targetDir);

            Path targetPath = targetDir.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Return the URL path: e.g. "photos/abc123.jpg"
            return subDirectory + "/" + storedFilename;

        } catch (IOException e) {
            throw new FileStorageException("Could not store file " + originalFilename, e);
        }
    }

    /**
     * Load a file as a Spring Resource.
     */
    public Resource loadFileAsResource(String filePath) {
        try {
            Path file = this.rootLocation.resolve(filePath).normalize();
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileStorageException("File not found: " + filePath);
            }
        } catch (MalformedURLException e) {
            throw new FileStorageException("File not found: " + filePath, e);
        }
    }

    /**
     * Delete a file from the local filesystem.
     */
    public void deleteFile(String filePath) {
        try {
            Path file = this.rootLocation.resolve(filePath).normalize();
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new FileStorageException("Could not delete file: " + filePath, e);
        }
    }
}
