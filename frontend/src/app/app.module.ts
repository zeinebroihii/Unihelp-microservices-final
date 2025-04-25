import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {EventDetailsDialogComponent, EventListComponent} from './components/event-list/event-list.component';
import {MatCardModule} from "@angular/material/card";
import {HttpClientModule} from "@angular/common/http";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import { MatIconModule } from '@angular/material/icon';
import {MatDialogModule} from "@angular/material/dialog";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatListModule} from "@angular/material/list";
import {MatTooltipModule} from "@angular/material/tooltip";
import { FullCalendarModule } from '@fullcalendar/angular';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    LoginComponent,
    NotFoundComponent,
    EventListComponent,
    EventDetailsDialogComponent
  ],
  imports: [
    FullCalendarModule,
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    AppRoutingModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatTooltipModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
