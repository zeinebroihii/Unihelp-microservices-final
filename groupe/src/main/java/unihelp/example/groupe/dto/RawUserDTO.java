package unihelp.example.groupe.dto;

import lombok.Data;

@Data
public class RawUserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private byte[] profileImage;
}
