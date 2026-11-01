package com.dsatracker;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserQuestionProgressRepository
        extends JpaRepository<UserQuestionProgress, Long> {

    Optional<UserQuestionProgress> findByUserIdAndQuestionId(
            Long userId,
            Long questionId
    );
}