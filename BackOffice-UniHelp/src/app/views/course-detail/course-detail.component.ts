import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Course, Module, Lesson } from '../models/course';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
  standalone: true,
  imports: [NgClass, NgForOf, NgIf, FormsModule],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', opacity: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: '1' })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ]),
    trigger('modalAnimation', [
      state('open', style({ opacity: 1 })),
      state('closing', style({ opacity: 0 })),
      transition('void => open', [
        style({ opacity: 0 }),
        animate('300ms ease-in-out', style({ opacity: 1 }))
      ]),
      transition('open => closing', [
        animate('300ms ease-in-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class CourseDetailComponent implements OnInit {
  course: Course | null = null;
  modules: Module[] = [];
  expandedModule: number | null = null;
  newLesson: { [moduleId: number]: { title: string, description: string, file: File | null, filePreview: string | undefined, fileType: string | null, isDragging: boolean } } = {};
  responseMessage: { [moduleId: number]: string } = {};
  isSubmitting: { [moduleId: number]: boolean } = {};
  selectedVideo: Lesson | null = null;
  modalState: 'open' | 'closing' | null = null;
  private courseId: number | null = null;
  private backendBaseUrl = 'http://localhost:8888/COURS';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const courseIdStr = this.route.snapshot.paramMap.get('id');
    console.log('Course ID:', courseIdStr);
    if (courseIdStr) {
      this.courseId = +courseIdStr;
      this.fetchCourse(this.courseId);
      this.fetchModules(this.courseId);
    } else {
      console.error('No course ID in URL');
      this.responseMessage[0] = 'Course ID not found.';
    }
  }

  fetchCourse(courseId: number): void {
    console.log('Fetching course:', courseId);
    this.http.get<Course>(`${this.backendBaseUrl}/api/courses/${courseId}`).subscribe({
      next: (course) => {
        console.log('Course fetched:', course);
        this.course = course;
      },
      error: (err) => {
        console.error('Error fetching course:', err);
        this.course = null;
        this.responseMessage[0] = 'Failed to load course: ' + (err.error?.error || err.statusText || 'Server error');
      }
    });
  }

  fetchModules(courseId: number): void {
    console.log('Fetching modules for:', courseId);
    this.http.get<Module[]>(`${this.backendBaseUrl}/api/courses/${courseId}/modules`).subscribe({
      next: (modules) => {
        console.log('Modules fetched:', modules);
        this.modules = modules;
        modules.forEach(module => {
          this.newLesson[module.id] = { title: '', description: '', file: null, filePreview: undefined, fileType: null, isDragging: false };
          this.isSubmitting[module.id] = false;
          this.responseMessage[module.id] = '';
          this.fetchLessons(module.id);
        });
      },
      error: (err) => {
        console.error('Error fetching modules:', err);
        this.responseMessage[0] = 'Failed to load modules: ' + (err.error?.error || err.statusText || 'Server error');
      }
    });
  }

  fetchLessons(moduleId: number): void {
    if (this.courseId === null) {
      console.error('Course ID is not set');
      this.responseMessage[moduleId] = 'Failed to load lessons: Course ID not set.';
      return;
    }
    const url = `${this.backendBaseUrl}/api/courses/${this.courseId}/modules/${moduleId}/lessons`;
    console.log('Fetching lessons from:', url);
    this.http.get<Lesson[]>(url).subscribe({
      next: (lessons) => {
        console.log('Lessons fetched for module', moduleId, ':', lessons);
        const module = this.modules.find(m => m.id === moduleId);
        if (module) {
          module.lessons = lessons;
        }
      },
      error: (err) => {
        console.error('Error fetching lessons for module', moduleId, ':', err);
        this.responseMessage[moduleId] = 'Failed to load lessons: ' + (err.error?.error || err.error?.details || err.statusText || 'Server error');
      }
    });
  }

  toggleModule(moduleId: number): void {
    this.expandedModule = this.expandedModule === moduleId ? null : moduleId;
  }

  onDragOver(event: DragEvent, moduleId: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.newLesson[moduleId].isDragging = true;
  }

  onDragLeave(event: DragEvent, moduleId: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.newLesson[moduleId].isDragging = false;
  }

  onDrop(event: DragEvent, moduleId: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.newLesson[moduleId].isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length) {
      this.handleFile(files[0], moduleId);
    }
  }

  onFileSelected(event: Event, moduleId: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0], moduleId);
    }
  }

  handleFile(file: File, moduleId: number): void {
    const validTypes = ['application/pdf', 'video/mp4', 'video/webm', 'video/ogg'];
    if (!validTypes.includes(file.type)) {
      this.responseMessage[moduleId] = 'Please upload a PDF or video file (MP4, WebM, OGG).';
      return;
    }

    this.newLesson[moduleId].file = file;
    this.newLesson[moduleId].fileType = file.type === 'application/pdf' ? 'pdf' : 'video';

    if (file.type === 'application/pdf') {
      this.newLesson[moduleId].filePreview = 'assets/pdf-icon.png';
    } else {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        video.currentTime = 1;
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 60;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            this.newLesson[moduleId].filePreview = canvas.toDataURL();
          }
          URL.revokeObjectURL(video.src);
        };
      };
    }
  }

  removeFile(moduleId: number): void {
    if (this.newLesson[moduleId]) {
      this.newLesson[moduleId].file = null;
      this.newLesson[moduleId].filePreview = undefined;
      this.newLesson[moduleId].fileType = null;
      this.responseMessage[moduleId] = '';
    }
  }

  addLesson(moduleId: number): void {
    if (!this.newLesson[moduleId].title) {
      this.responseMessage[moduleId] = 'Lesson title is required.';
      return;
    }
    if (!this.newLesson[moduleId].file) {
      this.responseMessage[moduleId] = 'Please upload a PDF or video file.';
      return;
    }
    if (!this.courseId) {
      console.error('Course ID is not set');
      this.responseMessage[moduleId] = 'Failed to add lesson: Course ID not set.';
      return;
    }

    this.isSubmitting[moduleId] = true;
    this.responseMessage[moduleId] = '';

    const formData = new FormData();
    formData.append('title', this.newLesson[moduleId].title);
    formData.append('description', this.newLesson[moduleId].description || '');
    formData.append('file', this.newLesson[moduleId].file);
    console.log('FormData for module', moduleId, ':');
    console.log('  Title:', this.newLesson[moduleId].title);
    console.log('  Description:', this.newLesson[moduleId].description);
    console.log('  File:', this.newLesson[moduleId].file.name);

    const url = `${this.backendBaseUrl}/api/courses/${this.courseId}/modules/${moduleId}/lessons`;
    console.log('Posting lesson to:', url);
    this.http.post<Lesson>(url, formData).subscribe({
      next: (lesson) => {
        console.log('Lesson added:', lesson);
        console.log('Video URL:', this.getVideoUrl(lesson));
        const module = this.modules.find(m => m.id === moduleId);
        if (module) {
          module.lessons = [...(module.lessons || []), {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            contentUrl: lesson.contentUrl,
            contentType: this.newLesson[moduleId].fileType as 'pdf' | 'video',
            thumbnailUrl: this.newLesson[moduleId].fileType === 'video' ? this.newLesson[moduleId].filePreview : undefined
          }];
        }
        this.newLesson[moduleId] = { title: '', description: '', file: null, filePreview: undefined, fileType: null, isDragging: false };
        this.responseMessage[moduleId] = 'Lesson added successfully!';
        this.isSubmitting[moduleId] = false;
        setTimeout(() => {
          this.responseMessage[moduleId] = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Error adding lesson for module', moduleId, ':', err);
        this.responseMessage[moduleId] = 'Failed to add lesson: ' + (err.error?.error || err.error?.details || err.statusText || 'Server error');
        this.isSubmitting[moduleId] = false;
      }
    });
  }

  getVideoUrl(lesson: Lesson): string {
    let url = '';
    if (lesson.contentUrl) {
      const normalizedUrl = lesson.contentUrl.startsWith('/COURS/uploads/')
        ? lesson.contentUrl
        : `/COURS/uploads/${lesson.contentUrl.replace(/^\/[Uu]ploads\//, '')}`;
      url = `${this.backendBaseUrl}${normalizedUrl}`;
    }
    console.log('Video URL:', url);
    return url;
  }

  openVideoModal(lesson: Lesson): void {
    console.log('Opening video:', lesson);
    this.selectedVideo = lesson;
    this.modalState = 'open';
  }

  closeVideoModal(): void {
    this.modalState = 'closing';
    setTimeout(() => {
      this.selectedVideo = null;
      this.modalState = null;
    }, 300);
  }
}
