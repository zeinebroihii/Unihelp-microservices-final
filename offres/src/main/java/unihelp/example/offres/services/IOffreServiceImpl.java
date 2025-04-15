package unihelp.example.offres.services;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import unihelp.example.offres.Client.UserClient;

import unihelp.example.offres.dto.UserDTO;
import unihelp.example.offres.entities.Offre;

import unihelp.example.offres.entities.Typeoffre;
import unihelp.example.offres.repositories.IOffreRepository;


import java.util.Date;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class IOffreServiceImpl implements IOffreService {

    private final IOffreRepository offreRepository;
    private final UserClient userClient;

    @Override
    public Offre createOffre(Offre offre, Long userIdAppelant) {
        UserDTO user = userClient.getUserById(userIdAppelant); // Feign récupère l'utilisateur

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seuls les admins peuvent créer des offres");
        }

        offre.setCreatedByEmail(user.getEmail()); // 👉 on associe l'email ici
        log.info("Offre créée par : " + user.getEmail());

        return offreRepository.save(offre);
    }

    /*public Offre createOffre(Offre offre) {
        // Vous pouvez ajouter une logique de validation ou d'autres règles ici avant l'enregistrement
        return offreRepository.save(offre);
    }

*/
    @Override
    public List<Offre> getAllOffres() {
        return offreRepository.findAll();
    }

    @Override
    public Offre getOffreById(Long id) {
        return offreRepository.findById(id).orElse(null);
    }


    @Override
    public Offre updateOffre(Long id, Offre updatedOffre) {
        Offre existing = offreRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offre non trouvée"));

        existing.setTitre(updatedOffre.getTitre());
        existing.setDescription(updatedOffre.getDescription());
        existing.setLocalisation(updatedOffre.getLocalisation());
        existing.setEntreprise(updatedOffre.getEntreprise());
        existing.setDateExpiration(updatedOffre.getDateExpiration());
        existing.setTypeOffre(updatedOffre.getTypeOffre());

        return offreRepository.save(existing);
    }


    @Override
    public void deleteOffre(Long id) {
        if (!offreRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Offre non trouvée");
        }
        offreRepository.deleteById(id);
    }


}