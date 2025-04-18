import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css']
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
  isEdit = false;
  eventId?: number;

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.eventForm = this.fb.group({
      titre: ['', Validators.required],
      date: ['', Validators.required],
      description: [''],
      lieu: ['', Validators.required],
      userId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['id'];
    if (this.eventId) {
      this.isEdit = true;
      this.eventService.getEventById(this.eventId).subscribe({
        next: (event) => {
          this.eventForm.patchValue({
            titre: event.titre,
            date: new Date(event.date),
            description: event.description,
            lieu: event.lieu,
            userId: event.userId
          });
        },
        error: (err) => {
          this.snackBar.open('Failed to load event: ' + err.message, 'Close', { duration: 3000 });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      const event: Event = this.eventForm.value;
      if (this.isEdit && this.eventId) {
        this.eventService.updateEvent(this.eventId, event).subscribe({
          next: () => {
            this.snackBar.open('Event updated successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/events']);
          },
          error: (err) => {
            this.snackBar.open('Failed to update event: ' + err.error.message, 'Close', { duration: 3000 });
          }
        });
      } else {
        this.eventService.createEvent(event).subscribe({
          next: () => {
            this.snackBar.open('Event created successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/events']);
          },
          error: (err) => {
            this.snackBar.open('Failed to create event: ' + err.error.message, 'Close', { duration: 3000 });
          }
        });
      }
    }
  }
}
