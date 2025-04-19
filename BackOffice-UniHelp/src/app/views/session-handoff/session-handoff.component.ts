import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-handoff',
  template: ''
})
export class SessionHandoffComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const user = urlParams.get('user');
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', user);
      window.history.replaceState({}, document.title, '/dashboard');
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/404']);
    }
  }
}
