package com.unihelp.event.Repository;

import com.unihelp.event.entities.Event;
import com.unihelp.event.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
}
