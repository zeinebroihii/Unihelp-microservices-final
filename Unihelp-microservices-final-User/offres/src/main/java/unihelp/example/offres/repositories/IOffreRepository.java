package unihelp.example.offres.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import unihelp.example.offres.entities.Offre;
import unihelp.example.offres.entities.Typeoffre;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface IOffreRepository  extends JpaRepository<Offre, Long> {
    List<Offre> findByCreatedByEmail(String email);


    @Query("SELECT o FROM Offre o WHERE o.publicationDate = :publicationDate")
    List<Offre> findOffresByPublicationDate(@Param("publicationDate") LocalDate publicationDate);
}
