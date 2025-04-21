import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotFoundComponent } from './components/not-found/not-found.component';
import {HttpClientModule} from "@angular/common/http";
import { SignupComponent } from './signup/signup.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatChipsModule} from "@angular/material/chips";
import {MatFormFieldModule} from "@angular/material/form-field";
import { ProfileComponent } from './components/profile/profile.component';
import {AuthGuard} from "./auth.guard";
import {AuthService} from "./services/auth.service";
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ResetPasswordModalComponent } from './components/reset-password-modal/reset-password-modal.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    LoginComponent,
    NotFoundComponent,
    SignupComponent,
    ProfileComponent,
    ResetPasswordComponent,
    ResetPasswordModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
  ],
  providers: [AuthService, AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
