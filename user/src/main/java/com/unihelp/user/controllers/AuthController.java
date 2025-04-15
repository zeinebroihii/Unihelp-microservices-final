package com.unihelp.user.controllers;

import com.unihelp.user.dto.*;
import com.unihelp.user.entities.Token;
import com.unihelp.user.entities.User;
import com.unihelp.user.entities.UserRole;
import com.unihelp.user.repositories.TokenRepository;
import com.unihelp.user.repositories.UserRepository;
import com.unihelp.user.security.JwtUtils;
import com.unihelp.user.services.UserService;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("bio") String bio,
            @RequestParam("skills") String skills,
            @RequestParam("role") UserRole role,
            @RequestParam("profileImage") MultipartFile profileImage
    ) {
        try {
            User user = userService.registerUser(
                    firstName, lastName, email, password, bio, skills, role, profileImage
            );
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur d'inscription : " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        System.out.println("Attempting login for email: " + request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    System.out.println("User not found for email: " + request.getEmail());
                    return new RuntimeException("User not found");
                });

        if (user.isBanned()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("User account is banned.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateToken((UserDetails) authentication.getPrincipal());

        System.out.println("User retrieved: " + user.getEmail());

        // Calculate expiration time and convert to LocalDateTime
        long expirationMillis = jwtUtils.getExpiration();
        LocalDateTime expiresAt = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(System.currentTimeMillis() + expirationMillis),
                ZoneId.systemDefault()
        );

        // Save token to Token table (not revoked)
        Token token = Token.builder()
                .token(jwt)
                .expiresAt(expiresAt)
                .user(user)
                .revoked(false)
                .build();
        tokenRepository.save(token);

        return ResponseEntity.ok(LoginResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            SecurityContextHolder.clearContext();
            return ResponseEntity.ok("User logged out successfully (no token provided).");
        }

        String jwt = authHeader.substring(7);
        Optional<Token> tokenOpt = tokenRepository.findByToken(jwt);
        if (tokenOpt.isPresent()) {
            Token token = tokenOpt.get();
            token.setRevoked(true);
            tokenRepository.save(token);
        }

        SecurityContextHolder.clearContext();
        return ResponseEntity.ok("User logged out successfully.");
    }

    @GetMapping("/admin/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/admin/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @PostMapping("/admin/users/{id}/ban")
    public ResponseEntity<String> banUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.isBanned()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User already banned.");
        }
        user.setBanned(true);
        userRepository.save(user);
        return ResponseEntity.ok("User banned successfully.");
    }

    @PostMapping("/admin/users/{id}/unban")
    public ResponseEntity<String> unbanUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!user.isBanned()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User is not banned.");
        }
        user.setBanned(false);
        userRepository.save(user);
        return ResponseEntity.ok("User unbanned successfully.");
    }

    @PutMapping("/admin/users/{id}")
    public ResponseEntity<String> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setFirstName(updatedUser.getFirstName());
        user.setLastName(updatedUser.getLastName());
        user.setEmail(updatedUser.getEmail());
        user.setBio(updatedUser.getBio());
        user.setSkills(updatedUser.getSkills());
        user.setProfileImage(updatedUser.getProfileImage());
        user.setRole(updatedUser.getRole());
        userRepository.save(user);
        return ResponseEntity.ok("User details updated successfully.");
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
        return ResponseEntity.ok("User deleted successfully.");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody EmailRequest email) throws MessagingException {
        userService.generateAndSendEmailRestToken(email.getEmail());
        return ResponseEntity.ok("Password reset link sent to your email!");
    }

    @GetMapping("/reset-password")
    public ResponseEntity<String> verifyToken(@RequestParam String token) {
        Token resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token expired");
        }

        return ResponseEntity.ok("Token verified. Display password reset form.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        String token = request.getToken();
        String newPassword = request.getNewPassword();

        Token resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token expired");
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Le mot de passe doit comporter au moins 8 caractères.");
        }
        User user = resetToken.getUser();
        user.setPassword(bCryptPasswordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenRepository.delete(resetToken);

        return ResponseEntity.ok("Password successfully reset!");
    }
}