import { Component, OnInit } from '@angular/core';
import { EventService } from '../../services/event.service';
import { TicketService } from '../../services/ticket.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Event } from '../../models/event.model';
import { Ticket } from '../../models/ticket.model';
import { User } from '../../models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ViewBookingsDialogComponent } from '../view-bookings-dialog/view-bookings-dialog.component';
import { Observable, forkJoin } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      transition(':enter', [
        animate('500ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class EventListComponent implements OnInit {
  events: Event[] = [];
  isAdmin$: Observable<boolean>;
  userId?: number;
  userTickets: Ticket[] = [];
  hasBooked: { [eventId: number]: boolean } = {};
  expandedEvents: { [eventId: number]: boolean } = {};

  constructor(
    private eventService: EventService,
    private ticketService: TicketService,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.isAdmin$ = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.userId = user.userId;
      this.loadUserTickets();
      this.loadEvents();
    });
  }

  loadUserTickets(): void {
    if (!this.userId) {
      this.snackBar.open('User ID is missing.', 'Close', { duration: 3000 });
      return;
    }
    this.ticketService.getUserTickets(this.userId).subscribe({
      next: (tickets: Ticket[]) => {
        this.userTickets = tickets;
        this.events.forEach(event => {
          if (event.eventId) {
            this.hasBooked[event.eventId] = this.userTickets.some(
              ticket => ticket.event && ticket.event.eventId === event.eventId
            );
          }
        });
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load user tickets: ' + err.message, 'Close', { duration: 3000 });
      }
    });
  }

  loadEvents(): void {
    this.eventService.getAllEvents().subscribe({
      next: (events: Event[]) => {
        this.events = events;
        this.events.forEach(event => {
          if (event.eventId) {
            this.hasBooked[event.eventId] = this.userTickets.some(
              ticket => ticket.event && ticket.event.eventId === event.eventId
            );
            this.expandedEvents[event.eventId] = false;
          }
        });
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load events: ' + err.message, 'Close', { duration: 3000 });
      }
    });
  }

  toggleEventDetails(eventId?: number): void {
    if (eventId !== undefined) {
      this.expandedEvents[eventId] = !this.expandedEvents[eventId];
    }
  }

  bookTicket(eventId?: number): void {
    if (eventId === undefined || !this.userId) {
      this.snackBar.open('Event ID or User ID is missing.', 'Close', { duration: 3000 });
      return;
    }
    this.ticketService.bookTicket(eventId, this.userId).subscribe({
      next: () => {
        this.snackBar.open('Ticket booked successfully!', 'Close', { duration: 3000 });
        this.loadUserTickets();
        this.loadEvents();
      },
      error: (err: any) => {
        this.snackBar.open('Failed to book ticket: ' + (err.error?.message || err.message), 'Close', { duration: 3000 });
      }
    });
  }

  cancelBooking(eventId?: number): void {
    if (eventId === undefined) {
      this.snackBar.open('Event ID is missing.', 'Close', { duration: 3000 });
      return;
    }
    if (!this.userId) {
      this.snackBar.open('User ID is missing.', 'Close', { duration: 3000 });
      return;
    }
    const ticket = this.userTickets.find(t => t.event && t.event.eventId === eventId);
    if (!ticket || !ticket.ticketId) {
      this.snackBar.open('Ticket not found.', 'Close', { duration: 3000 });
      return;
    }

    if (confirm('Are you sure you want to cancel this booking?')) {
      this.ticketService.cancelTicket(ticket.ticketId!, this.userId!).subscribe({
        next: () => {
          this.snackBar.open('Booking canceled successfully!', 'Close', { duration: 3000 });
          this.loadUserTickets();
          this.loadEvents();
        },
        error: (err: any) => {
          this.snackBar.open('Failed to cancel booking: ' + (err.error?.message || err.message), 'Close', { duration: 3000 });
        }
      });
    }
  }

  deleteEvent(eventId?: number): void {
    if (eventId === undefined) {
      this.snackBar.open('Event ID is missing.', 'Close', { duration: 3000 });
      return;
    }
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventService.deleteEvent(eventId).subscribe({
        next: () => {
          this.events = this.events.filter(event => event.eventId !== eventId);
          this.snackBar.open('Event deleted successfully!', 'Close', { duration: 3000 });
        },
        error: (err: any) => {
          this.snackBar.open('Failed to delete event: ' + (err.error?.message || err.message), 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewBookings(eventId?: number): void {
    if (eventId === undefined) {
      this.snackBar.open('Event ID is missing.', 'Close', { duration: 3000 });
      return;
    }

    // Find the event to get its title
    const event = this.events.find(e => e.eventId === eventId);
    const eventTitle = event?.titre || 'Event';

    // Fetch tickets for the specific event
    this.ticketService.getTicketsByEvent(eventId).subscribe({
      next: (tickets: Ticket[]) => {
        if (tickets.length === 0) {
          // If no tickets, open the dialog directly
          this.dialog.open(ViewBookingsDialogComponent, {
            width: '500px',
            data: { tickets, eventTitle }
          });
          return;
        }

        // Fetch user details for each ticket
        const userObservables = tickets
          .filter(ticket => ticket.userId !== undefined)
          .map(ticket => this.userService.getUserById(ticket.userId!));
        forkJoin(userObservables).subscribe({
          next: (users: User[]) => {
            // Combine tickets with user data
            const enrichedTickets = tickets.map((ticket, index) => ({
              ...ticket,
              user: users[index]
            }));
            // Open the dialog with enriched tickets
            this.dialog.open(ViewBookingsDialogComponent, {
              width: '500px',
              data: { tickets: enrichedTickets, eventTitle }
            });
          },
          error: (err: any) => {
            this.snackBar.open('Failed to load user details: ' + (err.error?.message || err.message), 'Close', { duration: 3000 });
            // Fallback: Open dialog with tickets but no user details
            this.dialog.open(ViewBookingsDialogComponent, {
              width: '500px',
              data: { tickets, eventTitle }
            });
          }
        });
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load bookings: ' + (err.error?.message || err.message), 'Close', { duration: 3000 });
      }
    });
  }
}
