package unihelp.example.groupe.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GroupeDTO {
    private Long groupId;
    private String groupName;
    private String description;
    private String createdBy;
    private Long createdById;
    private String groupImage;
    private LocalDateTime createdAt;
    private int messageCount;
}
