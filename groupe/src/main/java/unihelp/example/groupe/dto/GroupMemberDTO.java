package unihelp.example.groupe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GroupMemberDTO {
    private Long userId;
    private String firstName;
    private String lastName;
    private String role;

}
