package unihelp.example.offres.services;

import unihelp.example.offres.entities.Notification;

import java.util.List;

public interface INotificationService {
    void envoyer(Long userId, String titre, String message,
                 String offreTitre, String entreprise, String emailCreateur);
 List<Notification> getParUser(Long userId);
    public void deleteById(Long id);

}
