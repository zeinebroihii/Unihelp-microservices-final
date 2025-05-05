package unihelp.example.groupe.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import unihelp.example.groupe.entities.Reaction;
import unihelp.example.groupe.entities.Message;

import java.util.List;
import java.util.Optional;

public interface IReactionRepository extends JpaRepository<Reaction, Long> {
    List<Reaction> findByMessage(Message message);
    boolean existsByUserIdAndEmojiAndMessage(Long userId, String emoji, Message message);
    Optional<Reaction> findByMessageAndUserId(Message message, Long userId);

}
