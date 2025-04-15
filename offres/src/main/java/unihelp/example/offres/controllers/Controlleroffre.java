package unihelp.example.offres.controllers;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import unihelp.example.offres.Client.UserClient;
import unihelp.example.offres.dto.OffreDTO;
import unihelp.example.offres.dto.UserDTO;
import unihelp.example.offres.entities.Offre;
import unihelp.example.offres.entities.Typeoffre;
import unihelp.example.offres.services.IOffreService;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@AllArgsConstructor
@RequestMapping("/api/offres")
@Slf4j
public class Controlleroffre {

    private final IOffreService offreService;


    @PostMapping
    public ResponseEntity<Offre> createOffre(@RequestBody Offre offre,
                                             @RequestHeader("X-USER-ID") Long userIdAppelant) {
        System.out.println("💬 Offre reçue : " + offre); // ← voir ce qui arrive exactement

        // 💡 Tu peux aussi extraire ça d’un token JWT dans un vrai système sécurisé
        Offre created = offreService.createOffre(offre, userIdAppelant);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }



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
        return ResponseEntity.noContent().build(); // HTTP 204
    }
}
