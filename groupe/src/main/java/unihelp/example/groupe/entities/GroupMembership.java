package unihelp.example.groupe.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class GroupMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long Id;
    private Long userId;
    @ManyToOne
    @JoinColumn(name = "group_id")
    @JsonBackReference
    private Groupe groupe;
    private String role;
    private LocalDateTime joinedAt;
    @Column(name = "added_by_id")
    private Long addedById;
}
