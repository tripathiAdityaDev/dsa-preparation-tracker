package com.dsatracker;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserQuestionProgressService {

    private final UserQuestionProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;

    public UserQuestionProgressService(
            UserQuestionProgressRepository progressRepository,
            UserRepository userRepository,
            QuestionRepository questionRepository) {

        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
    }

    // Get progress for one user
    public List<UserQuestionProgress> getUserProgress(Long userId) {
        return progressRepository.findAll()
                .stream()
                .filter(progress -> progress.getUser().getId().equals(userId))
                .toList();
    }

    // Mark a question solved or unsolved for one user
    public UserQuestionProgress updateProgress(
            Long userId,
            Long questionId,
            boolean solved) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        UserQuestionProgress progress = progressRepository
                .findByUserIdAndQuestionId(userId, questionId)
                .orElseGet(UserQuestionProgress::new);

        progress.setUser(user);
        progress.setQuestion(question);
        progress.setSolved(solved);

        if (solved) {
            progress.setSolvedDate(java.time.LocalDate.now());
        } else {
            progress.setSolvedDate(null);
        }

        return progressRepository.save(progress);
    }
}