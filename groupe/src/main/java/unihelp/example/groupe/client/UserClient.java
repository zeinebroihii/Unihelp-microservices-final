package unihelp.example.groupe.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import unihelp.example.groupe.dto.UserDTO;
import java.util.List;

@FeignClient(name = "user", url = "http://localhost:8070/api/auth")
public interface UserClient {

    @GetMapping("/users/{id}")
    UserDTO getUserById(@PathVariable("id") Long id);

    @GetMapping("/users")
    List<UserDTO> getAllUsers();

    // ⚠️ Ancienne méthode devenue obsolète
    // @GetMapping("/api/users/by-username/{username}")
    // UserDTO getUserByUsername(@PathVariable("username") String username);

    // ✅ Nouvelle version à utiliser si on veut chercher par prénom/nom
    @GetMapping("/by-name")
    UserDTO getUserByFullName(@RequestParam("firstName") String firstName,
                              @RequestParam("lastName") String lastName);


}

