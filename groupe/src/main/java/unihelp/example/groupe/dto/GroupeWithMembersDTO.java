package unihelp.example.groupe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupeWithMembersDTO {
    private Long groupId;
    private String groupName;
    private String description;
    private String groupImage;
    private LocalDateTime createdAt;
    private String createdBy;
    private Long createdById;     // ✅ on l'ajoute
    private Integer messageCount;
    private List<GroupMemberDTO> members;
}