package unihelp.example.offres.services;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import unihelp.example.offres.Client.UserClient;
import unihelp.example.offres.dto.UserDTO;
import unihelp.example.offres.entities.Candidature;


import unihelp.example.offres.entities.CandidatureStatus;
import unihelp.example.offres.entities.Offre;
import unihelp.example.offres.repositories.ICandidatureRepository;
import unihelp.example.offres.repositories.IOffreRepository;


import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


@Slf4j
@Service
@AllArgsConstructor
public class ICandidatureServiceImpl implements ICandidatureService {

    private final ICandidatureRepository candidatureRepository;
   private  final IOffreRepository offreRepository;
    private final INotificationService notificationService;

    private final UserClient userClient;
    @Override
    public Candidature postuler(Long offreId, Candidature candidature, Long userIdAppelant) {
        Offre offre = offreRepository.findById(offreId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        UserDTO user = userClient.getUserById(userIdAppelant);

        // 🔐 Vérification du rôle
        if (!"STUDENT".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("❌ Seuls les étudiants peuvent postuler à une offre.");
        }

        candidature.setOffre(offre);
        candidature.setUserId(userIdAppelant);
        candidature.setDateDepot(LocalDate.now());

        log.info("📥 Étudiant {} ({}) postule à l’offre {}", user.getEmail(), userIdAppelant, offre.getTitre());

        return candidatureRepository.save(candidature);
    }

    @Override
    public List<Candidature> getByOffreId(Long offreId) {
        return candidatureRepository.findByOffreId(offreId);
    }

    @Override
    public List<Candidature> getCandidaturesByAdminEmail(String email) {
        List<Offre> offres = offreRepository.findByCreatedByEmail(email);
        log.info("📧 Offres créées par {} : {}", email, offres.size());

        List<Candidature> candidatures = new ArrayList<>();
        for (Offre offre : offres) {
            List<Candidature> cands = candidatureRepository.findByOffreId(offre.getId());
            for (Candidature c : cands) {
                log.info("📝 Candidature trouvée pour offre '{}': {}", offre.getTitre(), c.getMessage());
            }
            candidatures.addAll(cands);
        }

        log.info("📨 Total candidatures à retourner : {}", candidatures.size());
        return candidatures;
    }


    @Override
    public Candidature updateStatut(Long candidatureId, CandidatureStatus newStatus) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));

        candidature.setStatut(newStatus);
        candidatureRepository.save(candidature);

        Offre offre = candidature.getOffre();
        String titreNotif = "📢 Mise à jour de votre candidature";
        String message = switch (newStatus) {
            case ACCEPTEE -> "🎉 Acceptée";
            case REFUSEE -> "❌ Refusée";
            case EN_ATTENTE -> "⌛ Toujours en attente";
        };

        notificationService.envoyer(
                candidature.getUserId(),
                titreNotif,
                "Votre candidature a été " + message,
                offre.getTitre(),
                offre.getEntreprise(),
                offre.getCreatedByEmail()
        );
        return candidature;
    }



}