package unihelp.example.offres.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import unihelp.example.offres.entities.Notification;
import java.util.List;

public interface INotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByDateEnvoiDesc(Long userId);
}
