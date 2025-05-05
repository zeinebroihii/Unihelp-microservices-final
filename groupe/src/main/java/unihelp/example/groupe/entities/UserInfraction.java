package unihelp.example.groupe.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
public class UserInfraction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ✅ Ajoute ceci !

    private Long id; // ou @EmbeddedId selon ta logique

    private Long userId;

    private int infractionCount;
    private boolean blocked;
    private LocalDateTime blockedUntil;
    private Long groupId; // 👈 Ajouter ce champ

    public UserInfraction(Long userId, Long groupId) {
        this.userId = userId;
        this.groupId = groupId;
        this.infractionCount = 0;
        this.blocked = false;
    }

}
