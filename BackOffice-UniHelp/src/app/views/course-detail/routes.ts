import { Routes } from '@angular/router';
import { CourseDetailComponent } from './course-detail.component'; // Adjust the import path

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Course'
    },
    children: [
      {
        path: '',
        redirectTo: 'courses',
        pathMatch: 'full'
      },

      // Course detail route should be correctly defined here
      {
        path: 'courses/:id',  // Use :id to capture the course ID
        component: CourseDetailComponent, // Assuming the component is correctly imported
        data: {
          title: 'Course Detail'
        }
      }
    ]
  }
];
