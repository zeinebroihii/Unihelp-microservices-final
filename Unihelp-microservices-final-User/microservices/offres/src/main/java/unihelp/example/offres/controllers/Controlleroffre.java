package unihelp.example.offres.controllers;

import com.google.zxing.WriterException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import unihelp.example.offres.Client.UserClient;
import unihelp.example.offres.dto.OffreFilterDTO;
import unihelp.example.offres.dto.UserDTO;
import unihelp.example.offres.entities.Offre;
import unihelp.example.offres.services.IOffreService;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@AllArgsConstructor
@RequestMapping("/api/offres")
@Slf4j
@Qualifier("iNotificationServiceImpl")
public class Controlleroffre {

    private final IOffreService offreService;
    private final UserClient userClient;
    @PostMapping("/create")
    public ResponseEntity<Offre> createOffre(@RequestBody Offre offre,
                                             @RequestHeader("X-USER-ID") Long userIdAppelant
                                            ) {  // Ajout : récupérer l'ID de la Company
        System.out.println("💬 Offer received: " + offre);
        if (offre.getTypeOffre() == null) {
            System.out.println("⚠️ Offer type is NULL! Check if the JSON passed includes 'typeOffre' field.");
        } else {
            System.out.println("✅ Offer type: " + offre.getTypeOffre());
        }


        // ➔ Créer l'offre en passant l'ID de la Company
        Offre created = offreService.createOffre(offre, userIdAppelant);

        // ➔ Récupérer tous les utilisateurs
        List<UserDTO> allUsers = userClient.getAllUsers();

        // ➔ Notification aux étudiants
        String title = "New offer published!";
        String content = "A new offer has been added: " + created.getTitle();
        String location = created.getLocation();
        String company = created.getCompany() ;
        String emailCreateur = created.getCreatedByEmail();

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }


 /*   @PostMapping("/create")

    public ResponseEntity<Offre> createOffre(@RequestBody Offre offre,
                                             @RequestHeader("X-USER-ID") Long userIdAppelant) {
        System.out.println("💬 Offer received: " + offre);
        if (offre.getTypeOffre() == null) {
            System.out.println("⚠️ Offer type is NULL! Check if the JSON passed includes 'typeOffre' field.");
        } else {
            System.out.println("✅ Offer type: " + offre.getTypeOffre());
        }
        String fullText = offre.getTitle() + " " + offre.getDescription();
        Set<String> keywords = cvProcessingService.extractKeywordsFromCV(fullText);
        offre.setKeywords(new ArrayList<>(keywords));
        // 1️⃣ Créer l'offre
        Offre created = offreService.createOffre(offre, userIdAppelant);

        // 2️⃣ Récupérer tous les utilisateurs depuis le microservice User
        List<UserDTO> allUsers = userClient.getAllUsers(); // Assure-toi que cette méthode existe

        // 3️⃣ Filtrer les étudiants et leur envoyer une notification
        String title = "New offer published!";
        String content = "A new offer has been added: " + created.getTitle();
        String location = created.getLocation();
        String company = created.getCompany();
        String emailCreateur = created.getCreatedByEmail();

        for (UserDTO user : allUsers) {
            if ("STUDENT".equalsIgnoreCase(user.getRole())) {
                notificationService.envoyer(user.getId(), title, content, location, company, "", "", emailCreateur);
            }
        }
        String qrData = "http://localhost:8091/api/offres/" + created.getId();  // ici utiliser created.getId()
        String filePath = "C://Users//eyali//QRCODE//offre_" + created.getId() + ".png";  // ajout d'un / manquant + nom fichier propre


        qrCodeGeneratorService.generateQRCode(qrData, filePath);


        return ResponseEntity.status(HttpStatus.CREATED).body(created);

    }


*/
    @GetMapping
    public List<Offre> getAll() {
        return offreService.getAllOffres();
    }

    @GetMapping("/{id}")
    public Offre getById(@PathVariable Long id) {
        return offreService.getOffreById(id);
    }


    @PutMapping("/{id}")
    public Offre updateOffre(@PathVariable Long id, @RequestBody Offre updatedOffre) {
        return offreService.updateOffre(id, updatedOffre);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOffre(@PathVariable Long id) {
        offreService.deleteOffre(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/search")
    public List<Offre> searchOffres(@RequestBody OffreFilterDTO filter) {
        return offreService.searchOffres(filter);
    }

    @GetMapping("/by-user/{userId}")
    public List<Offre> getOffresByUserId(@PathVariable Long userId) {
        return offreService.getOffresByUserId(userId);
    }
   /* @GetMapping("/{offreId}/keywords")
    public Map<String, Object> getOfferKeywords(@PathVariable Long offreId) {
        // Récupérer les mots-clés de l'offre à partir de l'ID de l'offre
        List<String> keywords = offreService.getKeywordsForOffre(offreId);

        return Map.of("keywords", keywords);
    }*/

    @GetMapping("/published-on/{date}")
    public ResponseEntity<List<Offre>> getOffresByPublicationDate(@PathVariable("date") String date) {
        try {
            LocalDate publicationDate = LocalDate.parse(date); // Format attendu : yyyy-MM-dd
            List<Offre> offres = offreService.getOffresByPublicationDate(publicationDate);
            return ResponseEntity.ok(offres);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format. Use yyyy-MM-dd.");
        }
    }


}
