package unihelp.example.groupe.controllers;

import jakarta.transaction.Transactional;
import org.springframework.core.io.Resource; // ✅ Correct
import lombok.AllArgsConstructor;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import unihelp.example.groupe.dto.*;
import unihelp.example.groupe.entities.*;
import unihelp.example.groupe.repositories.IMessageRepository;
import unihelp.example.groupe.repositories.IUserInfractionRepository;
import unihelp.example.groupe.services.IGroupeService;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/api/groupes")
public class GroupeController {

    private final IGroupeService groupeService;
    private final SimpMessagingTemplate messagingTemplate;
    private final IUserInfractionRepository userInfractionRepository;
    private final IMessageRepository messageRepository;


    @PostMapping("/create")
    public ResponseEntity<Groupe> createGroup(@RequestBody CreateGroupRequest request) {
        return ResponseEntity.ok(
                groupeService.createGroup(
                        request.getGroupName(),
                        request.getDescription(),  // 👈 ajouté ici
                        request.getUserIds(),
                        request.getCreatedBy(),
                        request.getGroupImage() // 👈 nouveau paramètre

                )
        );
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMemberDTO>> getGroupMembers(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupeService.getGroupMembers(groupId));
    }

    @PutMapping("/{groupId}/rename")
    public ResponseEntity<Groupe> renameGroup(
            @PathVariable Long groupId,
            @RequestBody Map<String, String> body) {

        System.out.println("🔥 Appel REST /rename reçu pour groupe " + groupId + " avec nom = " + body.get("newName"));

        String newName = body.get("newName");
        Groupe updated = groupeService.renameGroup(groupId, newName);
        return ResponseEntity.ok(updated);
    }


    @PostMapping("/{groupId}/add-user")
    public ResponseEntity<Groupe> addUser(
            @PathVariable Long groupId,
            @RequestBody Map<String,Long> body
    ) {
        Long userId    = body.get("userId");
        Long addedById = body.get("addedById");
        Groupe g = groupeService.addUserById(groupId, userId, addedById);
        return ResponseEntity.ok(g);
    }


    @PostMapping("/{groupId}/sendMessage")
    public ResponseEntity<Chat> sendMessage(
            @PathVariable Long groupId,
            @RequestParam Long userId,
            @RequestParam String message) {
        return ResponseEntity.ok(groupeService.sendMessage(groupId, userId, message));
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<List<Message>> getMessages(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupeService.getMessages(groupId));
    }

    @DeleteMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(@PathVariable Long groupId, @RequestParam Long userId) {
        groupeService.leaveGroup(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/byUser")
    public ResponseEntity<List<Groupe>> getGroupsForUser(@RequestParam Long userId) {
        return ResponseEntity.ok(groupeService.getGroupsForUser(userId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Groupe>> getAllGroups() {
        return ResponseEntity.ok(groupeService.getAllGroups());
    }



    @PostMapping("/{groupId}/join-request")
    public ResponseEntity<Void> requestToJoin(@PathVariable Long groupId, @RequestParam Long userId) {
        groupeService.requestToJoin(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{groupId}/pending-requests")
    public ResponseEntity<List<JoinRequestDTO>> getPendingRequests(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupeService.getPendingRequests(groupId));
    }


    @PostMapping("/join-request/{requestId}/accept")
    public ResponseEntity<Void> acceptJoinRequest(
            @PathVariable Long requestId,
            @RequestParam Long acceptedById   // ← on injecte l’ID de l’utilisateur connecté
    ) {
        groupeService.acceptJoinRequest(requestId, acceptedById);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/with-members")
    public ResponseEntity<List<GroupeWithMembersDTO>> getGroupsWithMembers() {
        return ResponseEntity.ok(groupeService.getAllGroupsWithMembers());
    }

    @GetMapping("/created-by")
    public ResponseEntity<List<GroupeDTO>> getGroupsCreatedBy(@RequestParam Long userId) {
        return ResponseEntity.ok(groupeService.getGroupsCreatedBy(userId));
    }


    @DeleteMapping("/group/{groupId}")
    public ResponseEntity<Map<String, String>> deleteGroup(@PathVariable Long groupId,
                                                           @RequestParam Long userId) {
        try {
            groupeService.deleteGroup(groupId, userId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Groupe supprimé avec succès.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    @MessageMapping("/typing/{groupId}")
    public void handleTyping(@Payload TypingDTO typingDTO, @DestinationVariable Long groupId) {
        String fullName = typingDTO.getFirstName() + " " + typingDTO.getLastName();
        messagingTemplate.convertAndSend("/topic/chat/" + groupId + "/typing", fullName);
        System.out.println("Typing reçu : " + typingDTO.getFirstName() + " " + typingDTO.getLastName());

    }
    @PostMapping("/{groupId}/sendTextAndFile")
    public ResponseEntity<?> sendTextAndFileMessage(
            @PathVariable Long groupId,
            @RequestParam Long userId,
            @RequestParam(required = false) String messageText,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(required = false) Long replyToId // 👈 Ajouté ici
    ) {
        try {
            String fileUrl = null;

            // 📁 Gestion du fichier
            if (file != null && !file.isEmpty()) {
                Path uploadPath = Paths.get("uploads");
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                fileUrl = "/uploads/" + fileName;
            }

            // 📩 Appel du service avec replyToId
            Chat chat = groupeService.sendTextAndOptionalFileMessage(groupId, userId, messageText, fileUrl, replyToId);

            return ResponseEntity.ok(chat);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de l’envoi du message : " + e.getMessage());
        }
    }

    @PutMapping("/{groupId}/image")
    public ResponseEntity<?> updateGroupImage(
            @PathVariable Long groupId,
            @RequestBody ImageUpdateRequest request) {

        groupeService.updateGroupImage(groupId, request.getImage());
        return ResponseEntity.ok().build();
    }
    @PostMapping("/join-request/{id}/reject")
    public ResponseEntity<Void> rejectRequest(@PathVariable Long id) {
        groupeService.rejectJoinRequest(id);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/search-users")
    public ResponseEntity<List<UserDTO>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(groupeService.searchUsers(query));
    }

    @GetMapping("/infractions/{userId}/{groupId}")
    public ResponseEntity<UserInfraction> getUserInfraction(
            @PathVariable Long userId,
            @PathVariable Long groupId) {

        return ResponseEntity.ok(
                userInfractionRepository.findByUserIdAndGroupId(userId, groupId)
                        .orElse(new UserInfraction(userId, groupId))
        );
    }


    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam String filename) {
        try {
            Path filePath = Paths.get("uploads").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String mode) {

        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message introuvable"));

        Long groupId = message.getChat().getGroupe().getGroupId(); // ✅ tu récupères le bon groupe

        if ("everyone".equals(mode)) {
            if (!message.getSenderId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Non autorisé");
            }

            messageRepository.delete(message);

            // ✅ 🔔 Notifier tous les membres du groupe
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + groupId,
                    Map.of(
                            "type", "MESSAGE_DELETED",
                            "messageId", message.getId(),
                            "mode", "everyone"
                    )
            );

        } else if ("me".equals(mode)) {
            if (message.getHiddenFor() == null) {
                message.setHiddenFor(new ArrayList<>());
            }
            message.getHiddenFor().add(userId);
            messageRepository.save(message);

            // ✅ 🔔 Notifier uniquement ce user
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + groupId,
                    Map.of(
                            "type", "MESSAGE_DELETED",
                            "messageId", message.getId(),
                            "mode", "me",
                            "userId", userId
                    )
            );
        }
        return ResponseEntity.ok().build();
    }
    @PutMapping("/messages/{id}")
    public ResponseEntity<Message> updateMessage(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message introuvable"));

        String newContent = body.get("content");
        if (newContent == null || newContent.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }

        message.setContent(newContent.trim());
        Message updated = messageRepository.save(message);

        // 🔔 Notifier le groupe via WebSocket que le message a été modifié
        Long groupId = message.getChat().getGroupe().getGroupId();
        messagingTemplate.convertAndSend(
                "/topic/chat/" + groupId,
                Map.of(
                        "type", "MESSAGE_UPDATED",
                        "messageId", updated.getId(),
                        "newContent", updated.getContent()
                )
        );

        return ResponseEntity.ok(updated);
    }
    @PostMapping("/{groupId}/react")
    public ResponseEntity<Void> reactToMessage(
            @PathVariable Long groupId,
            @RequestParam Long messageId,
            @RequestParam Long userId,
            @RequestParam String emoji
    ) {
        groupeService.reactToMessage(groupId, messageId, userId, emoji);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{groupId}/block-user/{userId}")
    @Transactional
    public ResponseEntity<Void> blockUserInGroup(
            @PathVariable Long groupId,
            @PathVariable Long userId
    ) {
        groupeService.blockUserInGroup(groupId, userId);
        return ResponseEntity.noContent().build();
    }

}
