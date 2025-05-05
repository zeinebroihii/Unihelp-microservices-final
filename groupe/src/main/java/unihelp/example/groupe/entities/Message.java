package unihelp.example.groupe.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Lob // <-- pour indiquer un champ texte long
    @Column(columnDefinition = "TEXT")
    private String content;
    private Date time = new Date();

    private Long senderId; // ID du user qui a envoyé
    @Column(name = "sender_profile_image", columnDefinition = "LONGTEXT")
    private String senderProfileImage;
    private String senderName;
    @ManyToOne
    @JsonBackReference
    @JoinColumn(name = "chat_id") // Ceci force Hibernate à ne pas créer chat_chat_id
// ✅ C'est ÇA qu'il faut utiliser ici
    private Chat chat;
    // Message.java
    @Column(name = "file_url")
    private String fileUrl;
    @ElementCollection
    private List<Long> hiddenFor = new ArrayList<>();
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Reaction> reactions;
    @ManyToOne
    @JoinColumn(name = "reply_to_id")
    private Message replyTo;
    @Transient // Ne pas persister
    private Message replyToMessage;
    private String type;
    @Transient
    private Long replyToSenderId;
// Pour WebSocket : "MESSAGE", "REACTION_UPDATED", etc.
}
