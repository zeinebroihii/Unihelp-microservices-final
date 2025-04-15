package unihelp.example.offres.services;

import unihelp.example.offres.entities.Candidature;
import unihelp.example.offres.entities.CandidatureStatus;


import java.util.List;


public interface ICandidatureService {
    public List<Candidature> getByOffreId(Long offreId);
    public Candidature postuler(Long offreId, Candidature candidature, Long userIdAppelant);
    List<Candidature> getCandidaturesByAdminEmail(String email);
    public Candidature updateStatut(Long candidatureId, CandidatureStatus newStatus);
}