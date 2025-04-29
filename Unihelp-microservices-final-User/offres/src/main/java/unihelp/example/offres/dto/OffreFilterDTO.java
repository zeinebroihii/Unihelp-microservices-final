package unihelp.example.offres.dto;

import lombok.Data;


@Data
public class OffreFilterDTO {
    private String keyword;
    private String typeOffre;
    private String location;
}
