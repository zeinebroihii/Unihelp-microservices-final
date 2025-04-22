import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';  // <-- Import HttpClientModule

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { CoursesComponent } from './courses/courses.component';
import { CancelComponent } from './cancel/cancel.component';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { CourseDetailsComponent } from './course-details/course-details.component';
import { PanierComponent } from './panier/panier.component';
import { QuizComponent } from './quiz/quiz.component';
import { SuccessComponent } from './success/success.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    LoginComponent,
    NotFoundComponent,
    CoursesComponent,
    CancelComponent,
    ChatbotComponent,
    CourseDetailsComponent,
    PanierComponent,
    QuizComponent,
    SuccessComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
