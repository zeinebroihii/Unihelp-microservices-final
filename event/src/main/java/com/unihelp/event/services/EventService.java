package com.unihelp.event.services;

import com.unihelp.event.Repository.EventRepository;
import com.unihelp.event.clients.UserRestClient;
import com.unihelp.event.entities.Event;
import com.unihelp.event.entities.Ticket;
import com.unihelp.event.model.Role;
import com.unihelp.event.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final TicketService ticketService;
    private final UserRestClient userRestClient;
    private final TicketService TicketService;

    public Event createEvent(Event event ) {
        System.out.println("CREATE EVENT CALLED");

        if (event.getUserId() == null) {
            throw new IllegalArgumentException("User ID is required to create an event");
        }
        User instructor = userRestClient.findUserById(event.getUserId());
        System.out.println("Fetched user: " + instructor.getEmail() + " with role: " + instructor.getRole());
        if (instructor == null) {
            throw new IllegalArgumentException("User not found with ID: " + event.getUserId());
        }
        if (instructor.getRole() != Role.MENTOR) {
            throw new IllegalArgumentException("Only instructors with the role 'MENTOR' can create event");
        }
        event.setUser(instructor);
        return eventRepository.save(event);
    }

    public List<Event> getAllEvents() {
        List<Event> events = eventRepository.findAll();
        events.forEach(event -> {
            if (event.getUserId() != 0) { // Assuming 0 means no user
                try {
                    event.setUser(userRestClient.findUserById(event.getUserId()));
                } catch (Exception e) {
                    event.setUser(null); // Fallback in case of error
                }
            }
        });
        return events;
    }

    public Event getEventById(Long id) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        // Populate user field
        if (event.getUserId() != 0) {
            try {
                event.setUser(userRestClient.findUserById(event.getUserId()));
            } catch (Exception e) {
                event.setUser(null);
            }
        }
        return event;
    }


    public Event updateEvent(Long id, Event updatedEvent) {
        Event existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        existingEvent.setTitre(updatedEvent.getTitre());
        existingEvent.setDate(updatedEvent.getDate());
        existingEvent.setDescription(updatedEvent.getDescription());
        existingEvent.setLieu(updatedEvent.getLieu());
        existingEvent.setUserId(updatedEvent.getUserId());

        return eventRepository.save(existingEvent);
    }

    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        if (!event.getTickets().isEmpty()) {
            throw new IllegalStateException("Cannot delete event with booked tickets");
        }
        eventRepository.delete(event); // orphanRemoval will handle ticket deletion if allowed
    }


    public List<Ticket> getTicketsByEventId(Long eventId) {
        return ticketService.getTicketsByEventId(eventId);
    }
}
