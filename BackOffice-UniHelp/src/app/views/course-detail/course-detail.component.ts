import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Course, Module, Lesson } from '../models/course';
import { trigger, state, style, transition, animate } from '@angular/animations';
import {NgClass, NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {FormsModule} from "@angular/forms";
@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
  imports: [
    NgOptimizedImage,
    NgForOf,
    NgClass,
    FormsModule,
    NgIf
  ],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({height: '0', opacity: '0', overflow: 'hidden'})),
      state('expanded', style({height: '*', opacity: '1'})),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ]
})
export class CourseDetailComponent implements OnInit {
  course: Course | null = null;
  modules: Module[] = [];
  expandedModule: number | null = null;
  newLesson: { [moduleId: number]: { title: string } } = {};

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    console.log('Course ID:', courseId); // Debug
    if (courseId) {
      this.fetchCourse(+courseId);
      this.fetchModules(+courseId);
    }
  }

  fetchCourse(courseId: number): void {
    console.log('Fetching course:', courseId); // Debug
    this.http.get<Course>(`http://localhost:8888/COURS/api/courses/${courseId}`).subscribe({
      next: (course) => {
        console.log('Course fetched:', course); // Debug
        this.course = course;
      },
      error: (err) => {
        console.error('Error fetching course:', err);
        this.course = null;
      }
    });
  }

  fetchModules(courseId: number): void {
    console.log('Fetching modules for:', courseId); // Debug
    this.http.get<Module[]>(`http://localhost:8888/COURS/api/courses/${courseId}/modules`).subscribe({
      next: (modules) => {
        console.log('Modules fetched:', modules); // Debug
        this.modules = modules;
        modules.forEach(module => {
          this.newLesson[module.id] = { title: '' };
        });
      },
      error: (err) => {
        console.error('Error fetching modules:', err);
      }
    });
  }

  toggleModule(moduleId: number): void {
    this.expandedModule = this.expandedModule === moduleId ? null : moduleId;
  }

  addLesson(moduleId: number): void {
    const lesson = this.newLesson[moduleId];
    if (!lesson.title.trim()) return;

    console.log('Adding lesson:', lesson.title, 'to module:', moduleId); // Debug
    const newLesson: Lesson = { title: lesson.title };
    this.http.post(`http://localhost:8888/COURS/api/modules/${moduleId}/lessons`, newLesson).subscribe({
      next: (response: any) => {
        console.log('Lesson added:', response); // Debug
        const module = this.modules.find(m => m.id === moduleId);
        if (module) {
          module.lessons.push({ id: response.id, title: lesson.title });
          this.newLesson[moduleId].title = '';
        }
      },
      error: (err) => {
        console.error('Error adding lesson:', err);
      }
    });
  }
}
