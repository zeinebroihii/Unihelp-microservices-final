package unihelp.example.groupe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class GroupMemberDTO {
    private Long userId;
    private String firstName;
    private String lastName;
    private List<String> roles;      // ← avant : String role
    private String profileImage; // <== ici c'est une String ! base64 ou URL
    private String  invitedBy;     // <-- nouveau
    private Long invitedById;    // son userId


}
