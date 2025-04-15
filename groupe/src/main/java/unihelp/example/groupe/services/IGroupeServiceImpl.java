package unihelp.example.groupe.services;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import unihelp.example.groupe.client.UserClient;
import unihelp.example.groupe.dto.GroupMemberDTO;
import unihelp.example.groupe.dto.GroupeWithMembersDTO;
import unihelp.example.groupe.dto.UserDTO;
import unihelp.example.groupe.entities.*;
import unihelp.example.groupe.repositories.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class IGroupeServiceImpl implements IGroupeService {
    private final IGroupeRepository groupeRepository;
    private final IChatRepository chatRepository;
    private final IMessageRepository messageRepository;
    private final IGroupMembershipRepository groupMembershipRepository;
    private final UserClient userClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final JoinRequestRepository joinRequestRepository;

    @Override
    public Groupe createGroup(String groupName, List<Long> userIds, Long createdById) {
        if (groupName == null || groupName.isBlank()) {
            throw new IllegalArgumentException("Le nom du groupe est obligatoire.");
        }

        if (userIds == null || userIds.isEmpty()) {
            throw new IllegalArgumentException("La liste des utilisateurs ne doit pas être vide.");
        }

        if (!userIds.contains(createdById)) {
            userIds.add(createdById);
        }

        Groupe group = new Groupe();
        group.setGroupName(groupName);
        UserDTO creator = userClient.getUserById(createdById);
        group.setCreatedBy(creator.getFirstName() + " " + creator.getLastName());

        Chat chat = new Chat();
        chatRepository.save(chat);
        group.setChat(chat);

        Groupe savedGroup = groupeRepository.save(group);

        for (Long userId : userIds) {
            UserDTO user = userClient.getUserById(userId);
            if (!groupMembershipRepository.existsByUserIdAndGroupe(user.getId(), savedGroup)) {
                GroupMembership membership = new GroupMembership();
                membership.setUserId(user.getId());
                membership.setGroupe(savedGroup);
                membership.setRole(user.getId().equals(createdById) ? Typerole.ADMIN : Typerole.MEMBER);
                membership.setJoinedAt(LocalDateTime.now());
                groupMembershipRepository.save(membership);
            }
        }
        return savedGroup;
    }

    @Override
    public List<Groupe> getAllGroups() {
        List<Groupe> groups = groupeRepository.findAll();
        for (Groupe g : groups) {
            g.setMessageCount((g.getChat() != null && g.getChat().getMessageList() != null)
                    ? g.getChat().getMessageList().size()
                    : 0);
        }
        return groups;
    }

    @Override
    public List<GroupMemberDTO> getGroupMembers(Long groupId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        List<GroupMembership> memberships = groupMembershipRepository.findByGroupe(group);
        return memberships.stream().map(m -> {
            UserDTO user = userClient.getUserById(m.getUserId());
            return new GroupMemberDTO(
                    user.getId(),
                    user.getFirstName(),
                    user.getLastName(),
                    m.getRole().name()
            );
        }).toList();
    }

    @Override
    public Groupe renameGroup(Long groupId, String newName) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé avec ID: " + groupId));
        group.setGroupName(newName);
        return groupeRepository.save(group);
    }

    @Override
    public void leaveGroup(Long groupId, Long userId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé avec ID: " + groupId));

        UserDTO user = userClient.getUserById(userId);

        GroupMembership membership = groupMembershipRepository
                .findByUserIdAndGroupe(user.getId(), group)
                .orElseThrow(() -> new RuntimeException("L'utilisateur n'est pas membre de ce groupe"));

        groupMembershipRepository.delete(membership);

        Message systemMessage = new Message();
        systemMessage.setSenderName("🔔 Système");
        systemMessage.setContent("👤 " + user.getFirstName() + " " + user.getLastName() + " a quitté le groupe.");
        systemMessage.setChat(group.getChat());

        messageRepository.save(systemMessage);
        group.getChat().getMessageList().add(systemMessage);
        chatRepository.save(group.getChat());
    }

    @Override
    public List<Groupe> getGroupsForUser(Long userId) {
        UserDTO user = userClient.getUserById(userId);
        List<GroupMembership> memberships = groupMembershipRepository.findByUserId(user.getId());

        List<Groupe> groupes = memberships.stream()
                .map(GroupMembership::getGroupe)
                .toList();

        for (Groupe g : groupes) {
            g.setMessageCount((g.getChat() != null && g.getChat().getMessageList() != null)
                    ? g.getChat().getMessageList().size()
                    : 0);
        }

        return groupes;
    }

    @Override
    public Groupe addUserByFullName(Long groupId, String firstName, String lastName) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        // 🔍 Appelle le microservice User pour retrouver l'utilisateur à partir du prénom + nom
        UserDTO user = userClient.getUserByFullName(firstName, lastName);

        if (!groupMembershipRepository.existsByUserIdAndGroupe(user.getId(), group)) {
            GroupMembership membership = new GroupMembership();
            membership.setUserId(user.getId());
            membership.setGroupe(group);
            membership.setRole(Typerole.MEMBER);
            membership.setJoinedAt(LocalDateTime.now());
            groupMembershipRepository.save(membership);
        }

        return group;
    }


    @Override
    @Transactional
    public void requestToJoin(Long groupId, Long userId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe introuvable (ID=" + groupId + ")"));

        UserDTO user = userClient.getUserById(userId);

        boolean isAlreadyMember = groupMembershipRepository.existsByUserIdAndGroupe(user.getId(), group);
        if (isAlreadyMember) {
            throw new RuntimeException("Tu es déjà membre de ce groupe.");
        }

        // ✅ Mieux : vérification via userId (plus fiable que prénom/nom)
        boolean alreadyRequested = joinRequestRepository.existsByGroupeAndUserId(group, user.getId());
        if (alreadyRequested) {
            throw new RuntimeException("Tu as déjà une demande en attente pour ce groupe.");
        }

        JoinRequest request = new JoinRequest();
        request.setFirstName(user.getFirstName());
        request.setLastName(user.getLastName());
        request.setUserId(user.getId()); // ✅ Très important !
        request.setGroupe(group);
        request.setAccepted(false);
        request.setRequestedAt(LocalDateTime.now());

        joinRequestRepository.save(request);
    }



    @Override
    public List<JoinRequest> getPendingRequests(Long groupId) {
        return joinRequestRepository.findByGroupeGroupIdAndAcceptedFalse(groupId);
    }

    @Override
    public void acceptJoinRequest(Long requestId) {
        JoinRequest req = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        // Hypothèse : username = email
        UserDTO user = userClient.getUserById(req.getUserId()); // 👍

        GroupMembership m = new GroupMembership();
        m.setUserId(user.getId());
        m.setGroupe(req.getGroupe());
        m.setRole(Typerole.MEMBER);
        m.setJoinedAt(LocalDateTime.now());

        groupMembershipRepository.save(m);

        req.setAccepted(true);
        joinRequestRepository.save(req);
    }

    @Override
    public Chat sendMessage(Long groupId, Long userId, String messageText) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        UserDTO sender = userClient.getUserById(userId);

        Message message = new Message();
        message.setSenderName(sender.getFirstName() + " " + sender.getLastName());
        message.setSenderId(userId); // ✅ Ajoute l'ID de l’expéditeur
        message.setContent(messageText);
        message.setChat(group.getChat());

        messageRepository.save(message);

        // ✅ Envoi aux abonnés WebSocket
        messagingTemplate.convertAndSend("/topic/chat/" + groupId, message);


// Pas besoin d’ajouter manuellement le message à la liste du chat
        return group.getChat(); // retourne juste le chat sans le re-sauver

    }


    @Override
    public List<Message> getMessages(Long groupId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        return group.getChat().getMessageList();
    }

    @Override
    public void notifyVideoCall(Long groupId, Long userId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé avec ID: " + groupId));

        UserDTO user = userClient.getUserById(userId);

        Message message = new Message();
        message.setSenderName("Système");
        message.setContent("📞 " + user.getFirstName() + " " + user.getLastName() + " a lancé un appel vidéo.");
        message.setChat(group.getChat());

        messageRepository.save(message);
    }

    @Override
    public void startVideoCall(Long groupId, Long userId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé avec ID: " + groupId));

        UserDTO user = userClient.getUserById(userId);

        String roomId = "group-" + groupId + "-call-" + System.currentTimeMillis();

        Message msg = new Message();
        msg.setSenderName("Système");
        msg.setContent("📞 " + user.getFirstName() + " " + user.getLastName() + " a lancé un appel vidéo. Rejoindre ici: " + roomId);
        msg.setRoomId(roomId);
        msg.setChat(group.getChat());

        messageRepository.save(msg);
    }

    @Override
    public void handleIncomingWebSocketMessage(Long groupId, Message message) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        message.setChat(group.getChat());
        messageRepository.save(message);
        messagingTemplate.convertAndSend("/topic/chat/" + groupId, message);
    }

    @Override
    public List<GroupeWithMembersDTO> getAllGroupsWithMembers() {
        List<Groupe> groups = groupeRepository.findAll();
        List<GroupeWithMembersDTO> result = new ArrayList<>();

        for (Groupe group : groups) {
            GroupeWithMembersDTO dto = new GroupeWithMembersDTO();
            dto.setGroupId(group.getGroupId());
            dto.setGroupName(group.getGroupName());
            dto.setCreatedBy(group.getCreatedBy());

            dto.setMessageCount((group.getChat() != null && group.getChat().getMessageList() != null)
                    ? group.getChat().getMessageList().size() : 0);

            List<GroupMembership> memberships = groupMembershipRepository.findByGroupe(group);
            List<GroupMemberDTO> members = memberships.stream().map(m -> {
                UserDTO user = userClient.getUserById(m.getUserId());
                return new GroupMemberDTO(
                        user.getId(),
                        user.getFirstName(),
                        user.getLastName(),
                        m.getRole().name()
                );
            }).toList();

            dto.setMembers(members);
            result.add(dto);
        }

        return result;
    }

    @Override
    public void deleteGroup(Long groupId, Long userId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe introuvable"));

        UserDTO user = userClient.getUserById(userId);

        GroupMembership membership = groupMembershipRepository
                .findByUserIdAndGroupe(user.getId(), group)
                .orElseThrow(() -> new RuntimeException("Tu ne fais pas partie de ce groupe"));

        if (!Typerole.ADMIN.equals(membership.getRole())) {
            throw new RuntimeException("Seul l'administrateur peut supprimer ce groupe !");
        }

        groupeRepository.delete(group);
    }
    @Override
    public List<Groupe> getGroupsCreatedBy(Long userId) {
        UserDTO user = userClient.getUserById(userId);
        String fullName = user.getFirstName() + " " + user.getLastName();
        return groupeRepository.findByCreatedBy(fullName);
    }


}
