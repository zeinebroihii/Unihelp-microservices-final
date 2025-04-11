package com.unihelp.event.services;

import com.unihelp.event.clients.UserRestClient;
import com.unihelp.event.entities.Event;
import com.unihelp.event.entities.Ticket;
import com.unihelp.event.model.Role;
import com.unihelp.event.model.User;
import com.unihelp.event.Repository.EventRepository;
import com.unihelp.event.Repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
@EnableFeignClients(basePackages = "com.unihelp.event.clients")
public class EventService {
    private final EventRepository eventRepository;

    private final UserRestClient userRestClient;


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
        return eventRepository.findAll();
    }

    public Event getEventById(Long id) {
        return eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
    }


    public Event updateEvent(Long id, Event updatedEvent) {
        Event existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        existingEvent.setTitre(updatedEvent.getTitre());
        existingEvent.setDate(updatedEvent.getDate());
        existingEvent.setDescription(updatedEvent.getDescription());
        existingEvent.setLieu(updatedEvent.getLieu());

        return eventRepository.save(existingEvent);
    }

    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }
}
