
package com.dsatracker;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;

    // Constructor injection
    public QuestionService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    // Get all questions
    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    // Get question by ID
    public Question getQuestionById(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Question not found with ID: " + id));
    }

    // Add a new question
    public Question addQuestion(Question question) {
        return questionRepository.save(question);
    }

    // Update an existing question
    public Question updateQuestion(Long id, Question updatedQuestion) {

        Question existingQuestion = getQuestionById(id);

        existingQuestion.setTitle(updatedQuestion.getTitle());
        existingQuestion.setPlatform(updatedQuestion.getPlatform());
        existingQuestion.setTopic(updatedQuestion.getTopic());
        existingQuestion.setDifficulty(updatedQuestion.getDifficulty());
        existingQuestion.setProblemUrl(updatedQuestion.getProblemUrl());
        existingQuestion.setSolved(updatedQuestion.isSolved());
        existingQuestion.setSolvedDate(updatedQuestion.getSolvedDate());

        return questionRepository.save(existingQuestion);
    }

    // Delete a question
    public void deleteQuestion(Long id) {
        Question question = getQuestionById(id);
        questionRepository.delete(question);
    }
}
