package unihelp.example.groupe.dto;

import lombok.Data;

@Data
public class NotificationDTO {
    private Long recipientUserId;
    private String title;
    private String message;
    private String link;
}