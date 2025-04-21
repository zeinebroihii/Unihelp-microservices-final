package com.unihelp.cours.repository;

import com.unihelp.cours.entities.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.rest.webmvc.RepositoryRestController;

public interface CourseRepository extends JpaRepository<Course, Long> {
}
