package unihelp.example.offres.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String titre;
    private String message;
    private String offreTitre;
    private String entreprise;
    private String createdByEmail;


    private LocalDateTime dateEnvoi = LocalDateTime.now();
}
