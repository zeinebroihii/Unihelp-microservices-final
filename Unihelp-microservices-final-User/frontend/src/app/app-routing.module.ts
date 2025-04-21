import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import {NotFoundComponent} from "./components/not-found/not-found.component";
import { BlogComponent } from './components/blog/blog.component';
import { AddBlogComponent } from './components/add-blog/add-blog.component';
import { BlogDetailsComponent } from './components/blogdetails/blog-details/blog-details.component';

const routes: Routes = [
  {path:'',component:HomeComponent},
  {path:'blogs',component:BlogComponent},
  {path:'blog/:id',component:BlogDetailsComponent},
  {path:'addblog',component:AddBlogComponent},
  {path:'editblog/:id',component:AddBlogComponent},
  {path:'login', component: LoginComponent},
  {path:'home', component: HomeComponent},
  { path: '**', component: NotFoundComponent } // Wildcard route for 404
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
//kamel el footer zidou w tfakedli el app html
