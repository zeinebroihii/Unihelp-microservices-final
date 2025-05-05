package unihelp.example.groupe.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import unihelp.example.groupe.entities.Message;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

public interface IMessageRepository  extends JpaRepository<Message, Long> {

    List<Message> findByChat_Groupe_GroupIdAndTimeAfter(Long groupId, Date since);
}

