import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Ticket } from '../../models/ticket.model';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-view-bookings-dialog',
  templateUrl: './view-bookings-dialog.component.html',
  styleUrls: ['./view-bookings-dialog.component.css'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      transition(':enter', [
        animate('500ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ViewBookingsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { tickets: Ticket[]; eventTitle: string }) {}
}
