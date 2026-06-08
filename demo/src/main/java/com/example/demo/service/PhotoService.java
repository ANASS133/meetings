package com.example.demo.service;

import com.example.demo.dto.photo.PhotoResponse;
import com.example.demo.entity.Meeting;
import com.example.demo.entity.Photo;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.MeetingRepository;
import com.example.demo.repository.PhotoRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public PhotoResponse upload(Long meetingId, MultipartFile file) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", meetingId));

        User currentUser = getCurrentUser();

        String filePath = fileStorageService.storeFile(file, "photos");

        Photo photo = Photo.builder()
                .url(filePath)
                .uploadDate(LocalDateTime.now())
                .meeting(meeting)
                .uploadedBy(currentUser)
                .build();

        photo = photoRepository.save(photo);
        return toResponse(photo);
    }

    @Transactional(readOnly = true)
    public List<PhotoResponse> findByMeetingId(Long meetingId) {
        return photoRepository.findByMeetingId(meetingId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PhotoResponse findById(Long id) {
        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", "id", id));
        return toResponse(photo);
    }

    @Transactional
    public void delete(Long id) {
        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", "id", id));

        fileStorageService.deleteFile(photo.getUrl());
        photoRepository.delete(photo);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private PhotoResponse toResponse(Photo p) {
        return PhotoResponse.builder()
                .id(p.getId())
                .url(p.getUrl())
                .uploadDate(p.getUploadDate())
                .meetingId(p.getMeeting() != null ? p.getMeeting().getId() : null)
                .uploadedById(p.getUploadedBy() != null ? p.getUploadedBy().getId() : null)
                .build();
    }
}
