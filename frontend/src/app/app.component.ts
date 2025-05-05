import { Router, NavigationEnd } from '@angular/router';
import {
  Component, OnInit, AfterViewInit,
  ElementRef, ViewChild, HostListener, NgZone
} from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'UniHelp-Front';
  isLoaded = false;
  error: any = null;
  window = window; // Add reference to window object for template
  @ViewChild('headerRef', { static: false }) headerRef!: ElementRef;
  @ViewChild('mainContentRef', { static: false }) mainContentRef!: ElementRef;
  constructor(private router: Router, private ngZone: NgZone) {
    // Error handlers disabled to prevent showing error screen
    console.log('App component initialized');
  }

  ngOnInit() {
    this.isLoaded = true;

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        console.log('Navigation completed:', event.url);
        this.updateMainPadding(); // recalculer après chaque navigation
      }
    });
  }


  ngAfterViewInit() {
    setTimeout(() => this.ngZone.run(() => this.updateMainPadding()), 0);
  }

  @HostListener('window:resize', [])
  onResize() {
    this.updateMainPadding();
  }

  updateMainPadding() {
    if (this.headerRef && this.mainContentRef) {
      const headerHeight = this.headerRef.nativeElement.offsetHeight;
      this.mainContentRef.nativeElement.style.paddingTop = `${headerHeight}px`;
    }
  }
}
