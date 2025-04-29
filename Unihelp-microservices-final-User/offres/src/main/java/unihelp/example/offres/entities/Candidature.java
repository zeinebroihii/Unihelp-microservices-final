package unihelp.example.offres.entities;



import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Candidature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String message;
    private String urlCv;
    private LocalDate dateSoumission = LocalDate.now();
    @ManyToOne
    @JoinColumn(name = "offre_id") // clé étrangère
    private Offre offre;


    private LocalDateTime dateEntretien;
    @Enumerated(EnumType.STRING)
    private CandidatureStatus status = CandidatureStatus.PENDING; // Par défaut
    public String getCvPath() {
        return urlCv;  // Si 'urlCv' contient déjà le chemin
    }
}
