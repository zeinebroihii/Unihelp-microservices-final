import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import {NotFoundComponent} from "./components/not-found/not-found.component";
import {CoursesComponent} from "./courses/courses.component";
import {CourseDetailsComponent} from "./course-details/course-details.component";
import {PanierComponent} from "./panier/panier.component";
import {QuizComponent} from "./quiz/quiz.component";
import {ChatbotComponent} from "./chatbot/chatbot.component";
import {CancelComponent} from "./cancel/cancel.component";
import {SuccessComponent} from "./success/success.component";

const routes: Routes = [
  {path:'',component:HomeComponent},
  {path:'login', component: LoginComponent},
  {path:'home', component: HomeComponent},
  { path: 'courses', component: CoursesComponent },
  { path: 'success', component: SuccessComponent },
  { path: 'cancel', component: CancelComponent },
  { path: 'course-details/:id', component: CourseDetailsComponent },
  { path: 'panier', component: PanierComponent },
  { path: 'quiz/:courseId', component: QuizComponent },
  { path: 'courses/:courseId/chatbot', component: ChatbotComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
//kamel el footer zidou w tfakedli el app html
