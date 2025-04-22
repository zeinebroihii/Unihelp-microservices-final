import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {normalizeExtraEntryPoints} from "@angular-devkit/build-angular/src/tools/webpack/utils/helpers";
import {error} from "@angular/compiler-cli/src/transformers/util";

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
})
export class CoursesComponent  implements OnInit{
  courses: any;
  constructor(private http:HttpClient)
  {}
  ngOnInit() {
    this.http.get("http://localhost:8888/COURS/api/courses").subscribe({
      next: data => {
        this.courses = data;
        console.log(this.courses);
      },
      error: err => {
        console.error(err);
      }
    });
  }
}
