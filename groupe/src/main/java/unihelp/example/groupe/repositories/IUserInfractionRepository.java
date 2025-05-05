package unihelp.example.groupe.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import unihelp.example.groupe.entities.UserInfraction;

import java.util.List;
import java.util.Optional;

public interface IUserInfractionRepository extends JpaRepository<UserInfraction, Long> {
    Optional<UserInfraction> findByUserIdAndGroupId(Long userId, Long groupId);
    List<UserInfraction> findByUserId(Long userId); // (utile pour voir son historique)

}
