package unihelp.example.groupe.dto;


import lombok.Data;

@Data
public class JoinRequestDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private Long userId;
    private String profileImage;
    private Long groupId;
    private String groupName;
}
