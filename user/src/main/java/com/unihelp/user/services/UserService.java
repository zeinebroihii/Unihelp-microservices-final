package com.unihelp.user.services;

import com.unihelp.user.entities.Token;
import com.unihelp.user.repositories.TokenRepository;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.unihelp.user.dto.RegisterRequest;
import com.unihelp.user.entities.User;
import com.unihelp.user.entities.UserRole;
import com.unihelp.user.repositories.UserRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenRepository tokenRepository;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, TokenRepository tokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenRepository = tokenRepository;
    }

    public User registerUser(String firstName, String lastName, String email, String password,
                             String bio, String skills, UserRole role, MultipartFile profileImage) {

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email déjà utilisé !");
        }

        // Traitement de l'image (optionnel : enregistrer en base de données ou dans un dossier)
        byte[] imageData = null;
        try {
            imageData = profileImage.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors du traitement de l'image : " + e.getMessage());
        }

        User user = User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .password(passwordEncoder.encode(password))
                .bio(bio)
                .skills(skills)
                .role(role)
                .profileImage(imageData) // ⚠️ profileImage doit être un tableau de bytes dans ton entité !
                .isActive(true)
                .isBanned(false)
                .build();

        return userRepository.save(user);
    }


    public void generateAndSendEmailRestToken(String email) throws MessagingException {
        Optional<User> userByEmail = userRepository.findByEmail(email);

        if (userByEmail.isPresent()) {
            String generatedToken = generateActivationCode();
            var token = Token.builder()
                    .token(generatedToken)
                    .createdAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .user(userByEmail.get())
                    .build();
            tokenRepository.save(token);

            String resetLink = "http://localhost:8070/reset-password?token=" + token.getToken();

            System.out.println(resetLink);
        }
    }

    private String generateActivationCode() {
        return UUID.randomUUID().toString();
    }
}