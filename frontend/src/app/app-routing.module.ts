import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import {NotFoundComponent} from "./components/not-found/not-found.component";
import {SignupComponent} from "./signup/signup.component";
import {ProfileComponent} from "./components/profile/profile.component";
import {AuthGuard} from "./auth.guard";

const routes: Routes = [
  {path:'',component:HomeComponent},
  {path:'login', component: LoginComponent},
  { path: 'signup', component: SignupComponent },
  {path:'home', component: HomeComponent},
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent } // Wildcard route for 404
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
