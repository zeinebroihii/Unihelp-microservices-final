package unihelp.example.groupe.entities;



import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // L’ID de l’utilisateur destinataire
    @Column(name = "recipient_user_id", nullable = false)
    private Long recipientUserId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    // Pour pointer vers la ressource web (ex. "/groups/123")
    private String link;


    /** sur quel groupe porte l’infraction */
    @Column(name = "group_id")
    private Long groupId;

    /** quel utilisateur a commis l’infraction */
    @Column(name = "offender_id")
    private Long offenderId;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Optionnel : flag lu / non lu
    @Column(name = "is_read", nullable = false)
    private Boolean read = false;

    @Column(name="join_request_id")
    private Long joinRequestId;
}

