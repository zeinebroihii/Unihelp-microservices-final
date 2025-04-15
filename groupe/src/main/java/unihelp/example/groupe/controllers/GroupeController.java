package unihelp.example.groupe.controllers;

import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import unihelp.example.groupe.dto.CreateGroupRequest;
import unihelp.example.groupe.dto.GroupMemberDTO;
import unihelp.example.groupe.dto.GroupeWithMembersDTO;
import unihelp.example.groupe.dto.TypingDTO;
import unihelp.example.groupe.entities.Chat;
import unihelp.example.groupe.entities.Groupe;
import unihelp.example.groupe.entities.JoinRequest;
import unihelp.example.groupe.entities.Message;
import unihelp.example.groupe.services.IGroupeService;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/groupes")
public class GroupeController {

    private final IGroupeService groupeService;
    private final SimpMessagingTemplate messagingTemplate;


    @PostMapping("/create")
    public ResponseEntity<Groupe> createGroup(@RequestBody CreateGroupRequest request) {
        return ResponseEntity.ok(
                groupeService.createGroup(
                        request.getGroupName(),
                        request.getUserIds(),     // ➕ Longs maintenant, pas Strings
                        request.getCreatedBy()    // ➕ createdBy est un Long
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
            @RequestBody String newName) {
        newName = newName.replace("\"", "");
        return ResponseEntity.ok(groupeService.renameGroup(groupId, newName));
    }

    @PostMapping("/{groupId}/addUserByName")
    public ResponseEntity<Groupe> addUserByFullName(
            @PathVariable Long groupId,
            @RequestParam String firstName,
            @RequestParam String lastName) {
        return ResponseEntity.ok(groupeService.addUserByFullName(groupId, firstName, lastName));
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

    @PostMapping("/{groupId}/video-call-start")
    public ResponseEntity<Void> startVideoCall(@PathVariable Long groupId, @RequestParam Long userId) {
        groupeService.startVideoCall(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/join-request")
    public ResponseEntity<Void> requestToJoin(@PathVariable Long groupId, @RequestParam Long userId) {
        groupeService.requestToJoin(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{groupId}/pending-requests")
    public ResponseEntity<List<JoinRequest>> getPendingRequests(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupeService.getPendingRequests(groupId));
    }

    @PostMapping("/join-request/{requestId}/accept")
    public ResponseEntity<Void> acceptJoinRequest(@PathVariable Long requestId) {
        groupeService.acceptJoinRequest(requestId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/with-members")
    public ResponseEntity<List<GroupeWithMembersDTO>> getGroupsWithMembers() {
        return ResponseEntity.ok(groupeService.getAllGroupsWithMembers());
    }

    @GetMapping("/created-by")
    public ResponseEntity<List<Groupe>> getGroupsCreatedBy(@RequestParam Long userId) {
        return ResponseEntity.ok(groupeService.getGroupsCreatedBy(userId));
    }

    @DeleteMapping("/group/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId,
                                         @RequestParam Long userId) {
        try {
            groupeService.deleteGroup(groupId, userId);
            return ResponseEntity.ok().body("Groupe supprimé avec succès.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
    @MessageMapping("/typing/{groupId}")
    public void handleTyping(@Payload TypingDTO typingDTO, @DestinationVariable Long groupId) {
        String fullName = typingDTO.getFirstName() + " " + typingDTO.getLastName();
        messagingTemplate.convertAndSend("/topic/chat/" + groupId + "/typing", fullName);
        System.out.println("Typing reçu : " + typingDTO.getFirstName() + " " + typingDTO.getLastName());

    }



}
