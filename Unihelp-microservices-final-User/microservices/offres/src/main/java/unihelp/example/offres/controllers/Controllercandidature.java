package unihelp.example.offres.controllers;

import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import unihelp.example.offres.entities.Candidature;
import unihelp.example.offres.entities.CandidatureStatus;

import unihelp.example.offres.services.ICandidatureService;
import unihelp.example.offres.services.IOffreService;


import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@Slf4j
@AllArgsConstructor
@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/api/candidatures")
public class Controllercandidature {

    private final ICandidatureService candidatureService;
    private final IOffreService offreService;


    @GetMapping("/download")
    public void downloadCv(@RequestParam String path, HttpServletResponse response) throws IOException {
        File file = new File(path); // 🔥 On utilise directement le chemin reçu

        if (file.exists()) {
            response.setContentType("application/pdf");
            response.setHeader("Content-Disposition", "attachment; filename=\"" + file.getName() + "\"");
            Files.copy(file.toPath(), response.getOutputStream());
            response.getOutputStream().flush();
        } else {
            response.setStatus(HttpStatus.NOT_FOUND.value());
            response.getWriter().write("❌ Fichier non trouvé : " + file.getAbsolutePath());
        }
    }
    @PostMapping(
            value = "/offres/{offreId}/candidatures",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> postulerAvecFichier(
            @PathVariable Long offreId,
            @RequestParam("userId") Long userId,
            @RequestParam("message") String message,
            @RequestParam("cvFile") MultipartFile cvFile
    ) {
        try {
            // 1️⃣ Check that the uploaded file is a PDF
            if (!"application/pdf".equals(cvFile.getContentType())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "The file must be a PDF."));
            }

            // 2️⃣ Create the 'uploads' directory if it doesn't exist
            Path uploadDir = Paths.get("uploads");
            Files.createDirectories(uploadDir);

            // 3️⃣ Generate a unique filename and save the file to disk
            String filename = UUID.randomUUID() + "_" + cvFile.getOriginalFilename();
            Path target = uploadDir.resolve(filename);
            cvFile.transferTo(target);

            // 4️⃣ Build the Candidature object
            Candidature dto = new Candidature();
            dto.setMessage(message);
            dto.setUrlCv(target.toString());

            // 5️⃣ Call the service method to save the application
            Candidature saved = candidatureService.postuler(offreId, dto, userId);

            // 6️⃣ Return 201 Created with the resource location
            URI location = URI.create("/api/candidatures/" + saved.getId());
            return ResponseEntity.created(location).body(saved);

        } catch (RuntimeException ex) {
            log.warn("Erreur postulerAvecFichier: {}", ex.getMessage());

            // ⚠️ If the user has already applied, return 409 Conflict
            if (ex.getMessage().toLowerCase().contains("already applied")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "You have already applied to this offer."));
            }

            // 🔁 For other runtime errors, return 400 Bad Request
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", ex.getMessage()));
        } catch (IOException ioe) {
            // ❌ Handle errors related to file saving
            log.error("IO error saving CV", ioe);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to store the CV file."));
        }
    }

    @GetMapping("/offre/{offreId}")
    public List<Candidature> getByOffre(@PathVariable Long offreId) {
        return candidatureService.getByOffreId(offreId);
    }

    @GetMapping("/admin/candidatures")
    public List<Candidature> getCandidaturesByAdmin(@RequestParam("email") String email) {
        log.info("📩 Email received in response to search : " + email);
        return candidatureService.getCandidaturesByAdminEmail(email);
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<Candidature> updateStatus(
            @PathVariable Long id,
            @RequestParam("status") CandidatureStatus status, // Utilisation de RequestParam pour le statut
            @RequestParam("dateEntretien") @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime dateEntretien // Utilisation de RequestParam pour la date d'entretien
    ) {
        System.out.println("📥 Requête pour mettre à jour la candidature ID: " + id);
        System.out.println("Statut reçu: " + status);
        System.out.println("Date d'entretien reçue: " + dateEntretien);

        try {
            Candidature updated = candidatureService.updateStatus(id, status, dateEntretien);
            System.out.println("✅ Candidature mise à jour avec succès: " + updated);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la mise à jour de la candidature: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }




    @GetMapping("/offres/{offreId}/candidatures")
    public ResponseEntity<List<Candidature>> getCandidaturesByOffreAndUser(
            @PathVariable Long offreId,
            @RequestParam Long userId) {

        List<Candidature> candidatures = candidatureService
                .getCandidaturesByOffreAndUser(offreId, userId);

        return ResponseEntity.ok(candidatures);
    }


}








