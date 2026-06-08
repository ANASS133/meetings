package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.example.demo.service.MeetingService;

@SpringBootTest
class DemoApplicationTests {

    @Autowired
    private MeetingService meetingService;

    @Test
    void testDelete() {
        try {
            System.out.println("=== DELETING MEETING 1002 ===");
            meetingService.delete(1002L);
            System.out.println("=== DELETED SUCCESSFULLY ===");
        } catch (Exception e) {
            System.out.println("=== DELETE FAILED ===");
            e.printStackTrace();
        }
    }
}
