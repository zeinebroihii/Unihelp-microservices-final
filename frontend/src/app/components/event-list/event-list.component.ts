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
import { Observable } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as QRCode from 'qrcode';

// Define a minimal interface for the user data returned by authService.getCurrentUser()
interface AuthUser {
  userId: number;
  role: string;
}

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      transition(':enter', [
        animate('400ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class EventListComponent implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = []; // New property for filtered events
  isStudent$: Observable<boolean>;
  userId?: number;
  currentUser: AuthUser | null = null;
  userTickets: Ticket[] = [];
  hasBooked: { [eventId: number]: boolean } = {};
  expandedEvents: { [eventId: number]: boolean } = {};
  qrCodes: { [eventId: number]: string | null } = {};
  showQrCode: { [eventId: number]: boolean } = {};

  constructor(
    private eventService: EventService,
    private ticketService: TicketService,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.isStudent$ = this.authService.isStudent();
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      this.userId = user?.userId;
      if (this.userId) {
        this.loadUserTickets();
      }
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
        this.updateHasBooked();
        // Update filtered events after loading tickets
        this.updateFilteredEvents();
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
            this.expandedEvents[event.eventId] = false;
          }
        });
        this.updateHasBooked();
        // Update filtered events after loading all events
        this.updateFilteredEvents();
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load events: ' + err.message, 'Close', { duration: 3000 });
      }
    });
  }

  // New method to filter events that are not already booked
  updateFilteredEvents(): void {
    this.filteredEvents = this.events.filter(event =>
      event.eventId && !this.hasBooked[event.eventId]
    );
  }

  updateHasBooked(): void {
    this.events.forEach(event => {
      if (event.eventId) {
        const ticket = this.userTickets.find(
          t => t.event && t.event.eventId === event.eventId
        );
        this.hasBooked[event.eventId] = !!ticket;
        if (ticket) {
          this.generateQrCode(event, ticket);
        }
      }
    });
    // Update filtered events whenever booking status changes
    this.updateFilteredEvents();
  }

  toggleEventDetails(eventId?: number): void {
    if (eventId !== undefined) {
      this.expandedEvents[eventId] = !this.expandedEvents[eventId];
    }
  }

  generateQrCode(event: Event, ticket: Ticket): void {
    if (!event.eventId || !this.currentUser?.userId) return;

    this.userService.getUserById(this.currentUser.userId).subscribe({
      next: (userDetails: User) => {
        const qrContent = `Event: ${event.titre}\n` +
          `Student: ${userDetails.firstName || 'N/A'} ${userDetails.lastName || 'N/A'}\n` +
          `Email: ${userDetails.email || 'N/A'}\n` +
          `Booking Status: Confirmed\n` +
          `Event Date: ${event.date}\n` +
          `Location: ${event.lieu}`;

        QRCode.toDataURL(qrContent, { width: 200, margin: 1 }, (err, url) => {
          if (err) {
            console.error('Error generating QR code:', err);
            return;
          }
          this.qrCodes[event.eventId!] = url;
        });
      },
      error: (err: any) => {
        this.snackBar.open('Failed to fetch user details for QR code: ' + err.message, 'Close', { duration: 3000 });
      }
    });
  }

  toggleQrCode(eventId?: number): void {
    if (eventId !== undefined) {
      this.showQrCode[eventId] = !this.showQrCode[eventId];
    }
  }

  bookTicket(eventId?: number): void {
    if (eventId === undefined || !this.userId) {
      this.snackBar.open('Event ID or User ID is missing.', 'Close', { duration: 3000 });
      return;
    }
    this.ticketService.bookTicket(eventId, this.userId).subscribe({
      next: (createdTicket: Ticket) => {
        this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
        this.loadUserTickets();
      },
      error: (err: any) => {
        this.snackBar.open('Failed to register: ' + (err.error?.message || err.message), 'Close', { duration: 3000 });
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

    if (confirm('Are you sure you want to cancel this registration?')) {
      this.ticketService.cancelTicket(ticket.ticketId!, this.userId!).subscribe({
        next: () => {
          this.snackBar.open('Registration canceled successfully!', 'Close', { duration: 3000 });
          this.loadUserTickets();
          this.loadEvents();
          this.hasBooked[eventId] = false;
          this.qrCodes[eventId] = null;
          this.showQrCode[eventId] = false;
          // Update filtered events after cancellation
          this.updateFilteredEvents();
        },
        error: (err: any) => {
          this.snackBar.open('Failed to cancel registration: ' + (err.error?.message || err.message), 'Close', { duration: 3000 });
        }
      });
    }
  }

  descriptionExceedsLimit(description: string): boolean {
    const approxMaxCharsForThreeLines = 120;
    return description.length > approxMaxCharsForThreeLines;
  }
}
