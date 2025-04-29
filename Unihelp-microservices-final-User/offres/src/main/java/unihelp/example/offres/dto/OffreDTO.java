package unihelp.example.offres.dto;

import lombok.Getter;
import lombok.Setter;
import unihelp.example.offres.entities.Typeoffre;

import java.time.LocalDate;

@Getter
@Setter
public class OffreDTO {
    private Long offreId;
    private String title;
    private String location;
    private String description;
    private Typeoffre typeOffre;
    private LocalDate expirationDate;
    private String company;

    // Constructeur avec les bons paramètres
    public OffreDTO(Long offreId, String title, String description,Typeoffre typeOffre, String company, LocalDate expirationDate) {
        this.offreId = offreId;
        this.title = title;
        this.description = description;
        this.typeOffre = typeOffre;
        this.company = company;
        this.expirationDate = expirationDate;
    }
}
