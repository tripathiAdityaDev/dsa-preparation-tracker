package com.dsatracker;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
public class UserQuestionProgressController {

    private final UserQuestionProgressService progressService;
    private final UserRepository userRepository;

    public UserQuestionProgressController(
            UserQuestionProgressService progressService,
            UserRepository userRepository) {

        this.progressService = progressService;
        this.userRepository = userRepository;
    }

    // Get progress for the currently logged-in user
    @GetMapping
    public List<UserQuestionProgress> getUserProgress(
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return progressService.getUserProgress(user.getId());
    }

    // Update progress for the currently logged-in user
    @PutMapping("/{questionId}")
    public UserQuestionProgress updateProgress(
            Authentication authentication,
            @PathVariable Long questionId,
            @RequestParam boolean solved) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return progressService.updateProgress(
                user.getId(),
                questionId,
                solved
        );
    }
}