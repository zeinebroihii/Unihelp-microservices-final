package unihelp.example.offres.services;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import unihelp.example.offres.entities.Notification;
import unihelp.example.offres.repositories.INotificationRepository;

import java.util.List;

@Service
@AllArgsConstructor
public class INotificationServiceImpl  implements INotificationService {
    private final INotificationRepository notificationRepository;

    @Override
    public void envoyer(Long userId, String titre, String message,
                        String offreTitre, String entreprise, String emailCreateur) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitre(titre);
        n.setMessage(message);
        n.setOffreTitre(offreTitre);
        n.setEntreprise(entreprise);
        n.setCreatedByEmail(emailCreateur);
        notificationRepository.save(n);
    }

    @Override
    public List<Notification> getParUser(Long userId) {
        return notificationRepository.findByUserIdOrderByDateEnvoiDesc(userId);
    }
    public void deleteById(Long id) {
        notificationRepository.deleteById(id);
    }


}
