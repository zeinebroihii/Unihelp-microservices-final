package unihelp.example.groupe.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Reaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String emoji;
    @ManyToOne
    @JoinColumn(name = "message_id")
    @JsonBackReference
    private Message message;
    private String userName;
    @Transient
    private String userProfileImage;


}
