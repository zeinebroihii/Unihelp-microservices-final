package unihelp.example.offres.services;

import org.springframework.web.multipart.MultipartFile;
import unihelp.example.offres.entities.Candidature;
import unihelp.example.offres.entities.CandidatureStatus;
import unihelp.example.offres.entities.Offre;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;


public interface ICandidatureService {
    public List<Candidature> getByOffreId(Long offreId);
    public Candidature postuler(Long offreId, Candidature candidature, Long userIdAppelant);
    List<Candidature> getCandidaturesByAdminEmail(String email);
    boolean existsByOffreIdAndUserId(Long offreId, Long userId);
    List<Candidature> getCandidaturesByOffreAndUser(Long offreId, Long userId);
    void sendEntretienToStudent(Candidature candidature, LocalDateTime entretienDate);
    void deleteCandidature(Candidature candidature);
    Candidature getById(Long id);
    public Candidature updateStatus(Long candidatureId, CandidatureStatus newStatus, LocalDateTime dateEntretien);
}