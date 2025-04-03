package com.unihelp.cours.controller;

import com.unihelp.cours.entities.Lesson;
import com.unihelp.cours.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/modules/{moduleId}/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    // CREATE: Add a lesson to a module
    @PostMapping
    public ResponseEntity<Lesson> addLesson(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @RequestBody Lesson lesson) {
        Lesson savedLesson = lessonService.addLessonToModule(moduleId, lesson);
        return ResponseEntity.ok(savedLesson);
    }

    // READ: Get all lessons for a module
    @GetMapping
    public ResponseEntity<List<Lesson>> getLessonsByModule(
            @PathVariable Long courseId,
            @PathVariable Long moduleId) {
        List<Lesson> lessons = lessonService.getLessonsByModule(moduleId);
        return ResponseEntity.ok(lessons);
    }

    // READ: Get a specific lesson by ID
    @GetMapping("/{lessonId}")
    public ResponseEntity<Lesson> getLessonById(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long lessonId) {
        Lesson lesson = lessonService.getLessonById(moduleId, lessonId);
        return ResponseEntity.ok(lesson);
    }

    // UPDATE: Update an existing lesson
    @PutMapping("/{lessonId}")
    public ResponseEntity<Lesson> updateLesson(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long lessonId,
            @RequestBody Lesson updatedLesson) {
        Lesson lesson = lessonService.updateLesson(moduleId, lessonId, updatedLesson);
        return ResponseEntity.ok(lesson);
    }

    // DELETE: Delete a lesson by ID
    @DeleteMapping("/{lessonId}")
    public ResponseEntity<Void> deleteLesson(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long lessonId) {
        lessonService.deleteLesson(moduleId, lessonId);
        return ResponseEntity.noContent().build();
    }
}
