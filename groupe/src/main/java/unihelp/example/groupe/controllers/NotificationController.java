package unihelp.example.groupe.controllers;

import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import unihelp.example.groupe.entities.Notification;
import unihelp.example.groupe.repositories.NotificationRepository;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationRepository repo;

    public NotificationController(NotificationRepository repo) {
        this.repo = repo;
    }
    /** 1) Récupère l’historique (toutes les notifs) */
    @GetMapping("/user/{userId}")
    public List<Notification> getForUser(@PathVariable Long userId) {
        return repo.findByRecipientUserIdOrderByCreatedAtDesc(userId);
    }

    /** 2) Récupère seulement les non-lus (pour le badge) */
    @GetMapping("/user/{userId}/unread")
    public List<Notification> getUnreadForUser(@PathVariable Long userId) {
        return repo.findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    /** 3) Marquer une notification comme lue */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Notification n = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Notif introuvable"));
        n.setRead(true);
        repo.save(n);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long userId) {
        repo.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }

}
