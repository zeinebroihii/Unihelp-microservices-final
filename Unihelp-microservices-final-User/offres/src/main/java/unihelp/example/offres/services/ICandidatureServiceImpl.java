package unihelp.example.offres.services;



import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.stereotype.Service;
import unihelp.example.offres.Client.UserClient;
import unihelp.example.offres.dto.UserDTO;
import unihelp.example.offres.entities.Candidature;

import unihelp.example.offres.entities.CandidatureStatus;
import unihelp.example.offres.entities.Offre;
import unihelp.example.offres.repositories.ICandidatureRepository;
import unihelp.example.offres.repositories.IOffreRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;

import java.util.ArrayList;

import java.util.List;
import java.util.Set;


@Slf4j
@Service
@RequiredArgsConstructor
public class ICandidatureServiceImpl implements ICandidatureService {

    private final ICandidatureRepository candidatureRepository;
    private final IOffreRepository offreRepository;

    private final UserClient userClient;

    @Value("${candidature.match.threshold:0.3}")
    private double matchThreshold;

    @Override
    public Candidature postuler(Long offreId, Candidature candidature, Long userIdAppelant) {
        // Retrieve the offer from the database
        Offre offre = offreRepository.findById(offreId)
                .orElseThrow(() -> new RuntimeException("Offer not found with id=" + offreId));

        // Get the user information using the UserClient
        UserDTO user = userClient.getUserById(userIdAppelant);
        if (!"STUDENT".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Only students can apply.");
        }

        // Check if the user has already applied to the same offer
        if (candidatureRepository.existsByOffreIdAndUserId(offreId, userIdAppelant)) {
            throw new RuntimeException("You have already applied to this offer.");
        }

        // Create and save the application
        candidature.setOffre(offre);
        candidature.setUserId(userIdAppelant);
        candidature.setDateSoumission(LocalDate.now());
       // candidature.setStatus(CandidatureStatus.PENDING);
        Candidature saved = candidatureRepository.save(candidature);

        // Notify the offer creator (mentor)


        return saved;
    }
    @Override
    public List<Candidature> getByOffreId(Long offreId) {
        // Retrieve all applications by offer ID
        return candidatureRepository.findByOffreId(offreId);
    }

    @Override
    public List<Candidature> getCandidaturesByAdminEmail(String email) {
        // Retrieve all offers created by a specific admin
        List<Offre> offres = offreRepository.findByCreatedByEmail(email);
        log.info("📧 Offers created by {}: {}", email, offres.size());

        List<Candidature> candidatures = new ArrayList<>();
        for (Offre offre : offres) {
            List<Candidature> cands = candidatureRepository.findByOffreId(offre.getId());
            for (Candidature c : cands) {
                log.info("📝 Found application for the offer '{}': {}", offre.getTitle(), c.getMessage());
            }
            candidatures.addAll(cands);
        }

        log.info("📨 Total applications to return: {}", candidatures.size());
        return candidatures;
    }
    @Override
    public Candidature updateStatus(Long candidatureId, CandidatureStatus status, LocalDateTime dateEntretien) {
        // Récupération et mise à jour de la candidature
        Candidature cand = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new RuntimeException("Candidature not found"));
        cand.setStatus(status);
        if (status == CandidatureStatus.ACCEPTED && dateEntretien != null) {
            cand.setDateEntretien(dateEntretien);
        }
        candidatureRepository.save(cand);

        // Préparation des infos
        Offre offre = cand.getOffre();
        String titre = "📢 Status update for: " + offre.getTitle();
        String messageStatut = switch (status) {
            case ACCEPTED -> "🎉 Accepted";
            case REJECTED -> "❌ Rejected";
            default       -> "⌛ Still pending";
        };
        String contenu = "Your application has been " + messageStatut;
        String statutParam = status.toString();
        String dateParam   = (status == CandidatureStatus.ACCEPTED && dateEntretien != null)
                ? dateEntretien.toString()
                : "";

        // **UN SEUL** appel à envoyer(), avec statut + interviewDate si ACCEPTED

        return cand;
    }


    public void sendEntretienToStudent(Candidature candidature, LocalDateTime entretienDate) {
        // Here, you can create a calendar event for the interview and send it to the applicant
        // For example, using a third-party service to integrate with a calendar (e.g., Google Calendar, etc.)

        String content = "Your interview for the offer '" + candidature.getOffre().getTitle() + "' is scheduled for: "
                + entretienDate.toLocalDate() + " at " + entretienDate.toLocalTime();

        // Example of sending a calendar invite or email notification

        log.info("Interview scheduled for applicant {} on " + entretienDate);
    }

    @Override
    public boolean existsByOffreIdAndUserId(Long offreId, Long userId) {
        // Check if a user has already applied to a given offer
        return candidatureRepository.existsByOffreIdAndUserId(offreId, userId);
    }

    private List<String> getExpectedKeywordsForOffer(Offre offre) {
        // Determine the expected keywords for an offer based on title and type
        List<String> expected = new ArrayList<>();
        String title = offre.getTitle().toLowerCase();
        boolean isFrench = title.matches(".*(développeur|analyste|marketing|comptable|responsable).*");
        if (isFrench) {
            addFrenchKeywords(expected, offre);
        } else {
            addEnglishKeywords(expected, offre);
        }
        return expected;
    }

    private void addFrenchKeywords(List<String> keywords, Offre offre) {
        // Add French keywords depending on the offer type
        switch (offre.getTypeOffre()) {
            case STAGE:
                keywords.addAll(List.of("stage", "formation", "apprentissage", "projet", "étudiant", "travail en équipe",
                        "diplôme", "recherche", "support", "connaissances", "stages"));
                break;
            case CDI:
                keywords.addAll(List.of("cdi", "permanent", "full-time", "gestion de projet", "programmation"));
                break;
            case CDD:
                keywords.addAll(List.of("cdd", "temporaire", "mission", "durée limitée", "contrat"));
                break;
        }
        if (offre.getTitle().contains("développeur")) {
            keywords.addAll(List.of("java", "spring", "python", "c++", "javascript", "angular", "react", "sql",
                    "html", "css", "api", "web", "architecture", "docker", "kubernetes", "terraform",
                    "ansible", "aws", "gcp", "azure", "cloud", "iot", "arduino", "raspberry", "mqtt"));
        }
    }

    private void addEnglishKeywords(List<String> keywords, Offre offre) {
        // Add English keywords depending on the offer type
        switch (offre.getTypeOffre()) {
            case STAGE:
                keywords.addAll(List.of("internship", "training", "project", "student", "teamwork", "learning"));
                break;
            case CDI:
                keywords.addAll(List.of("permanent", "full-time", "project management", "programming", "development"));
                break;
            case CDD:
                keywords.addAll(List.of("temporary", "contract", "short-term", "mission", "analysis"));
                break;
        }
        if (offre.getTitle().toLowerCase().contains("developer")) {
            keywords.addAll(List.of("java", "spring", "python", "c++", "javascript", "angular", "react", "nodejs", "sql",
                    "html", "css", "api", "web", "architecture", "docker", "kubernetes", "terraform",
                    "ansible", "aws", "gcp", "azure", "cloud", "iot", "arduino", "raspberry", "mqtt"));
        }
    }

    @Override
    public void deleteCandidature(Candidature candidature) {
        // Delete an application if it exists
        if (candidatureRepository.existsById(candidature.getId())) {
            candidatureRepository.delete(candidature);
        } else {
            throw new RuntimeException("Application not found.");
        }
    }

    @Override
    public Candidature getById(Long id) {
        // Retrieve an application by its ID
        return candidatureRepository.findById(id).orElse(null);
    }

    @Override
    public List<Candidature> getCandidaturesByOffreAndUser(Long offreId, Long userId) {
        // Get all applications for a specific offer and user
        return candidatureRepository.findByOffreIdAndUserId(offreId, userId);
    }
}
