package unihelp.example.groupe.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class JoinRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName; // Utilisateur qui fait la demande
   private String lastName;
    private Long userId; // ✅ ajouté

    @ManyToOne
    @JsonManagedReference

    private Groupe groupe;
    private boolean accepted = false;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime requestedAt = LocalDateTime.now();
    @Column(columnDefinition = "LONGTEXT") // ✅ Modifier ici
    private String profileImage;

}