package com.unihelp.cours.service;

import com.unihelp.cours.clients.UserRestClient;
import com.unihelp.cours.entities.Course;
import com.unihelp.cours.exception.CourseNotFoundException;
import com.unihelp.cours.model.Role;
import com.unihelp.cours.model.User;
import com.unihelp.cours.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRestClient userRestClient;


    public Course createCourse(Course course) {
        User instructor = userRestClient.findUserById(course.getUserId());

        if (instructor.getRole() != Role.STUDENT) {
            throw new IllegalArgumentException("Only instructors can create courses");
        }
        course.setUser(instructor);

        return courseRepository.save(course);
    }


    public Course getCourseWithInstructor(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found"));

        User instructor = userRestClient.findUserById(course.getUserId());
        course.setUser(instructor);
        return course;
    }


    public List<Course> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        courses.forEach(course -> {
            User instructor = userRestClient.findUserById(course.getUserId());
            course.setUser(instructor);
        });
        return courses;
    }



    public Course updateCourse(Long courseId, Course updatedCourse) {
        Course existing = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found"));

        existing.setTitle(updatedCourse.getTitle());
        existing.setDescription(updatedCourse.getDescription());
        existing.setPrice(updatedCourse.getPrice());
        return courseRepository.save(existing);
    }


    public void deleteCourse(Long courseId) {
        courseRepository.deleteById(courseId);
    }



}