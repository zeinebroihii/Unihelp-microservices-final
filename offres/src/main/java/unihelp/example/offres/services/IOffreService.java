package unihelp.example.offres.services;


import unihelp.example.offres.dto.UserDTO;
import unihelp.example.offres.entities.Offre;
import unihelp.example.offres.entities.Typeoffre;

import java.util.List;


public interface IOffreService {
  public List<Offre> getAllOffres();
  public Offre getOffreById(Long id);
  public Offre createOffre(Offre offre, Long userIdAppelant);
 //Offre createOffre(Offre offre);

    public Offre updateOffre(Long id, Offre updatedOffre);
    public void deleteOffre(Long id);
}
