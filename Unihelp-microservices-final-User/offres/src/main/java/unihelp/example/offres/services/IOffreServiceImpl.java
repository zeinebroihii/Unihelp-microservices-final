package unihelp.example.offres.services;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import unihelp.example.offres.Client.UserClient;

import unihelp.example.offres.dto.OffreFilterDTO;
import unihelp.example.offres.dto.UserDTO;
import unihelp.example.offres.entities.Offre;

import unihelp.example.offres.entities.Typeoffre;
import unihelp.example.offres.repositories.IOffreRepository;


import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class IOffreServiceImpl implements IOffreService {

    private final IOffreRepository offreRepository;
    private final UserClient userClient;

    @Override
    public Offre createOffre(Offre offre, Long userIdAppelant) {
        // Récupère l’utilisateur via Feign
        UserDTO user = userClient.getUserById(userIdAppelant);

        // Vérifie le rôle
        if (!"ADMIN".equalsIgnoreCase(user.getRole()) && !"MENTOR".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only admins or mentors can create offers"
            );
        }

        // Associe l’email et l’ID du créateur
        offre.setCreatedByEmail(user.getEmail());
        offre.setCreatedById(userIdAppelant);

        // Vérifie le type d’offre
        if (offre.getTypeOffre() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Offer type is required."
            );
        }

        // Sauvegarde et retourne
        return offreRepository.save(offre);
    }

    /*  @Override
    public Offre createOffre(Offre offre, Long userIdAppelant) {
        // Récupère l’utilisateur via Feign
        UserDTO user = userClient.getUserById(userIdAppelant);



        // Vérifie le rôle
        if (!"ADMIN".equalsIgnoreCase(user.getRole())
                && !"MENTOR".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only admins or mentors can create offers"
            );
        }

        // Associe l’email et l’ID du créateur
        offre.setCreatedByEmail(user.getEmail());
        offre.setCreatedById(userIdAppelant);

        // Vérifie le type d’offre
        if (offre.getTypeOffre() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Offer type is required."
            );
        }

        log.info("Offer created by {} (id={})", user.getEmail(), userIdAppelant);

        // Sauvegarde et retourne
        return offreRepository.save(offre);
    }

*/
    @Override
    public List<Offre> getAllOffres() {
        // Ne renvoie que les offres encore valables
        return offreRepository.findAll().stream()
                .filter(o -> !o.isExpired())
                .collect(Collectors.toList());
    }

    @Override
    public Offre getOffreById(Long id) {
        Offre o = offreRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Offre non trouvée"));
        if (o.isExpired()) {
            // 410 Gone est plus adapté qu’un 404 pour une ressource qui existait mais n’est plus disponible
            throw new ResponseStatusException(
                    HttpStatus.GONE,
                    String.format(
                            "Cette offre a été clôturée le %s et n'est plus disponible.",
                            o.getExpirationDate()
                    )
            );
        }
        return o;
    }

    @Override
    public Offre updateOffre(Long id, Offre updatedOffre) {
        Offre existing = offreRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offre non trouvée"));

        existing.setTitle(updatedOffre.getTitle());
        existing.setDescription(updatedOffre.getDescription());
        existing.setLocation(updatedOffre.getLocation());
        existing.setCompany(updatedOffre.getCompany());
        existing.setExpirationDate(updatedOffre.getExpirationDate());
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
    @Override
    public List<Offre> searchOffres(OffreFilterDTO filter) {
        List<Offre> all = offreRepository.findAll();

        String keyword = filter.getKeyword() != null ? filter.getKeyword().toLowerCase() : null;
        String location = filter.getLocation();

        final Typeoffre type = (filter.getTypeOffre() != null) ?
                Typeoffre.valueOf(filter.getTypeOffre().toUpperCase()) : null;

        return all.stream()
                .filter(o -> keyword == null || o.getTitle().toLowerCase().contains(keyword) || o.getDescription().toLowerCase().contains(keyword))
                .filter(o -> type == null || o.getTypeOffre() == type)
                .filter(o -> location == null || location.isEmpty() || o.getLocation().equalsIgnoreCase(location))
                .collect(Collectors.toList());
    }
    @Override
    public List<Offre> getOffresByUserId(Long userId) {
        // Récupère les infos de l'utilisateur
        UserDTO user = userClient.getUserById(userId);

        // Récupère toutes les offres
        List<Offre> allOffres = offreRepository.findAll();

        // Filtrer les offres créées par l'email de l'utilisateur
        return allOffres.stream()
                .filter(offre -> user.getEmail().equalsIgnoreCase(offre.getCreatedByEmail()))
                .collect(Collectors.toList());
    }



    @Override
    public List<Offre> getOffresByPublicationDate(LocalDate publicationDate) {
        return offreRepository.findOffresByPublicationDate(publicationDate);
    }








}