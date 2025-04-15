package unihelp.example.offres.controllers;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import unihelp.example.offres.entities.Notification;
import unihelp.example.offres.services.INotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@AllArgsConstructor
public class ControllerNotification {

    private final INotificationService notificationService;

    @GetMapping("/{userId}")
    public List<Notification> getPourUser(@PathVariable Long userId) {
        return notificationService.getParUser(userId);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteById(id);
        return ResponseEntity.noContent().build();
    }


}
