package unihelp.example.groupe.services;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import unihelp.example.groupe.client.UserClient;
import unihelp.example.groupe.dto.*;
import unihelp.example.groupe.entities.*;
import unihelp.example.groupe.repositories.*;

import java.time.LocalDateTime;
import java.util.*;

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
    private final IUserInfractionRepository userInfractionRepository;
    private final IReactionRepository reactionRepository;
    private final NotificationRepository notificationRepository;

    private UserDTO mapUser(UserDTO user) {
        try {
            if (user.getProfileImage() != null && !user.getProfileImage().startsWith("data:image")) {
                user.setProfileImage("data:image/png;base64," + user.getProfileImage());
            }
        } catch (Exception e) {
            System.out.println("Erreur encodage image: " + e.getMessage());
        }
        return user;
    }

    @Override
    public Groupe createGroup(String groupName,
                              String description,
                              List<Long> userIds,
                              Long createdById,
                              String groupImage) {
        // — validations (inchangées) —
        if (groupName == null || groupName.isBlank())
            throw new IllegalArgumentException("Le nom du groupe est obligatoire.");
        if (userIds == null || userIds.isEmpty())
            throw new IllegalArgumentException("La liste des utilisateurs ne doit pas être vide.");
        if (description == null || description.isBlank())
            throw new IllegalArgumentException("La description est obligatoire.");

        // 1️⃣ Créateur
        UserDTO creator = mapUser(userClient.getUserById(createdById));
        String role = creator.getRole();
        if (!"ADMIN".equalsIgnoreCase(role) && !"MENTOR".equalsIgnoreCase(role)) {
            throw new IllegalArgumentException(
                    "Seuls les administrateurs et mentors peuvent créer un groupe."
            );
        }

        // 2️⃣ Création du groupe + chat
        Groupe group = new Groupe();
        group.setGroupName(groupName);
        group.setDescription(description);
        group.setCreatedAt(LocalDateTime.now());
        group.setGroupImage(groupImage);
        group.setCreatedBy(creator.getFirstName() + " " + creator.getLastName());
        group.setCreatedById(createdById);

        Chat chat = new Chat();
        chatRepository.save(chat);
        group.setChat(chat);
        Groupe savedGroup = groupeRepository.save(group);

        // 3️⃣ Créateur en ADMIN de ce groupe
        GroupMembership adminM = new GroupMembership();
        adminM.setUserId(createdById);
        adminM.setGroupe(savedGroup);
        adminM.setJoinedAt(LocalDateTime.now());
        adminM.setRole("ADMIN");

        groupMembershipRepository.save(adminM);

        // 4️⃣ Ajout de tous les ADMIN globaux
        List<UserDTO> allUsers = userClient.getAllUsers();
        List<Long> globalAdminIds = allUsers.stream()
                .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                .map(UserDTO::getId)
                .toList();

        for (Long adminId : globalAdminIds) {
            if (adminId.equals(createdById)) continue;                                  // pas le créateur
            if (groupMembershipRepository.existsByUserIdAndGroupe(adminId, savedGroup)) continue;

            GroupMembership gm = new GroupMembership();
            gm.setUserId(adminId);
            gm.setGroupe(savedGroup);
            gm.setJoinedAt(LocalDateTime.now());
            gm.setRole("ADMIN");
            groupMembershipRepository.save(gm);

            Notification notif = new Notification();
            notif.setRecipientUserId(adminId);
            notif.setTitle("Vous surveillez un nouveau groupe");
            notif.setMessage("Vous avez été ajouté·e au groupe « "
                    + savedGroup.getGroupName() + " » en tant qu’administrateur.");
            notif.setLink("/groups/" + savedGroup.getGroupId());
            notificationRepository.save(notif);
            messagingTemplate.convertAndSendToUser(
                    adminId.toString(),
                    "/queue/notifications",
                    notif
            );
        }

        // 5️⃣ Ajout des membres passés en param (tous rôles confondus)
        for (Long userId : userIds) {
            if (userId.equals(createdById)) continue;                  // pas le créateur
            if (globalAdminIds.contains(userId)) continue;            // pas un admin déjà ajouté

            UserDTO user = mapUser(userClient.getUserById(userId));
            String inferredRole = Optional.ofNullable(user.getRole())
                    .filter(r -> !r.isBlank())
                    .orElse("STUDENT");

            if (!groupMembershipRepository.existsByUserIdAndGroupe(userId, savedGroup)) {
                // a) persistance de l’adhésion
                GroupMembership membership = new GroupMembership();
                membership.setUserId(userId);
                membership.setGroupe(savedGroup);
                membership.setJoinedAt(LocalDateTime.now());
                membership.setRole(inferredRole);
                membership.setAddedById(createdById);    // <-- on stocke qui a invité

                groupMembershipRepository.save(membership);

                // b) notification en base
                Notification notif = new Notification();
                notif.setRecipientUserId(userId);
                notif.setTitle("Vous avez été ajouté au groupe « " +
                        savedGroup.getGroupName() + " »");
                notif.setMessage("L'utilisateur " + creator.getFirstName() + " "
                        + creator.getLastName() + " vous a invité en tant que "
                        + inferredRole + ".");
                notif.setLink("/groups/" + savedGroup.getGroupId());
                notificationRepository.save(notif);

                // c) push WebSocket
                messagingTemplate.convertAndSendToUser(
                        userId.toString(),
                        "/queue/notifications",
                        notif
                );
            }
        }

        return savedGroup;
    }

    @Override
    public void acceptJoinRequest(Long requestId,Long acceptedById) {
        JoinRequest req = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        UserDTO user = userClient.getUserById(req.getUserId());

        // ✅ Vérifie s’il est déjà membre
        boolean alreadyMember = groupMembershipRepository.existsByUserIdAndGroupe(user.getId(), req.getGroupe());
        if (!alreadyMember) {
            GroupMembership m = new GroupMembership();
            m.setUserId(user.getId());
            m.setGroupe(req.getGroupe());
            m.setRole("STUDENT");
            m.setJoinedAt(LocalDateTime.now());
            m.setAddedById(acceptedById);          // ← on enregistre qui a accepté


            groupMembershipRepository.save(m);
        }

        req.setAccepted(true);
        joinRequestRepository.save(req);
    }


    @Override
    public List<JoinRequestDTO> getPendingRequests(Long groupId) {
        List<JoinRequest> requests = joinRequestRepository.findByGroupeGroupIdAndAcceptedFalse(groupId);

        return requests.stream().map(req -> {
            JoinRequestDTO dto = new JoinRequestDTO();
            dto.setId(req.getId());
            dto.setFirstName(req.getFirstName());
            dto.setLastName(req.getLastName());
            dto.setUserId(req.getUserId());
            dto.setProfileImage(req.getProfileImage());
            dto.setGroupId(req.getGroupe().getGroupId());
            dto.setGroupName(req.getGroupe().getGroupName());
            return dto;
        }).toList();
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
    @Transactional
    public Groupe addUserById(Long groupId, Long userId, Long addedById) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        UserDTO user = mapUser(userClient.getUserById(userId));

        if (!groupMembershipRepository.existsByUserIdAndGroupe(userId, group)) {
            GroupMembership m = new GroupMembership();
            m.setUserId(userId);
            m.setGroupe(group);
            m.setJoinedAt(LocalDateTime.now());

            String roleToAssign = Optional.ofNullable(user.getRole())
                    .filter(r -> !r.isBlank())
                    .orElse("STUDENT");
            m.setRole(roleToAssign);

            // **On stocke l’ID de celui qui ajoute** (passed in argument)
            m.setAddedById(addedById);

            groupMembershipRepository.save(m);
            Notification notif = new Notification();
            notif.setRecipientUserId(userId);
            notif.setTitle("Vous avez été ajouté au groupe « " + group.getGroupName() + " »");
            notif.setMessage("L'utilisateur "
                    + group.getCreatedBy()
                    + " vous a invité en tant que "
                    + roleToAssign
                    + ".");
            notif.setLink("/groups/" + groupId);
            notificationRepository.save(notif);
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    notif
            );
        }
        return group;
    }


    @Override
    public List<GroupMemberDTO> getGroupMembers(Long groupId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        List<GroupMembership> memberships =
                groupMembershipRepository.findByGroupe(group);

        return memberships.stream().map(m -> {
            UserDTO user = mapUser(userClient.getUserById(m.getUserId()));

            // 1️⃣ rôles
            List<String> roles = new ArrayList<>();
            roles.add(m.getRole());
            // si c’est le créateur, ajouter son rôle global
            if (user.getId().equals(group.getCreatedById())
                    && user.getRole() != null && !user.getRole().isBlank()) {
                roles.add(user.getRole());
            }

            // 2️⃣ on récupère l’invitant
            String invitedByName = "";
            Long   invitedById   = null;

            if (m.getAddedById() != null) {
                UserDTO inviter = mapUser(userClient.getUserById(m.getAddedById()));
                invitedByName = inviter.getFirstName() + " " + inviter.getLastName();
                invitedById   = inviter.getId();

            }

            return new GroupMemberDTO(
                    user.getId(),
                    user.getFirstName(),
                    user.getLastName(),
                    roles,
                    user.getProfileImage(),
                    invitedByName,
                    invitedById
                    // <-- on retourne “Ajouté·e par ...”
            );
        }).toList();
    }

    @Override
    public Chat sendMessage(Long groupId, Long userId, String messageText) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        UserDTO sender = mapUser(userClient.getUserById(userId));

        // Vérifie si bloqué
        UserInfraction infraction = userInfractionRepository
                .findByUserIdAndGroupId(userId, groupId)
                .orElse(null);

        if (infraction != null && infraction.isBlocked()) {
            if (infraction.getBlockedUntil() != null && infraction.getBlockedUntil().isBefore(LocalDateTime.now())) {
                infraction.setBlocked(false);
                infraction.setInfractionCount(0);
                infraction.setBlockedUntil(null);
                userInfractionRepository.save(infraction);
            } else {
                return group.getChat(); // ❌ Ne rien faire si bloqué
            }
        }

        // ❌ Message sensible → ne pas l’enregistrer ni l’envoyer
        if (isMessageInappropriate(messageText)) {
            // Juste compter l’infraction (optionnel)
            UserInfraction userInfraction = userInfractionRepository
                    .findByUserIdAndGroupId(userId, groupId)
                    .orElse(new UserInfraction(userId, groupId));

            userInfraction.setInfractionCount(userInfraction.getInfractionCount() + 1);
            userInfractionRepository.save(userInfraction);

            // ❌ Ne sauvegarde rien, ne notifie rien
            return group.getChat();
        }

        // ✅ Message normal
        String profileImage = sender.getProfileImage();
        if (profileImage != null && !profileImage.startsWith("data:image")) {
            profileImage = "data:image/png;base64," + profileImage;
        }

        Message message = new Message();
        message.setSenderName(sender.getFirstName() + " " + sender.getLastName());
        message.setSenderId(userId);
        message.setContent(messageText);
        message.setChat(group.getChat());
        message.setSenderProfileImage(profileImage);

        messageRepository.save(message);
        messagingTemplate.convertAndSend("/topic/chat/" + groupId, message);

        return group.getChat();
    }


    @Override
    public List<Message> getMessages(Long groupId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));

        List<Message> messages = group.getChat().getMessageList();

        for (Message m : messages) {
            m.setReactions(reactionRepository.findByMessage(m));

            if (m.getReplyTo() != null) {
                Message parent = m.getReplyTo();
                Message reply = new Message();
                reply.setId(parent.getId());
                reply.setContent(parent.getContent());
                reply.setSenderName(parent.getSenderName());
                reply.setFileUrl(parent.getFileUrl());

                m.setReplyToMessage(reply);
                m.setReplyToSenderId(parent.getSenderId()); // ✅ AJOUT ICI, super important
            }
        }


        return messages;
    }


    @Override
    public List<Groupe> getAllGroups() {
        List<Groupe> groups = groupeRepository.findAll();
        for (Groupe g : groups) {
            g.setMessageCount((g.getChat() != null && g.getChat().getMessageList() != null)
                    ? g.getChat().getMessageList().size() : 0);
        }
        return groups;
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
    @Transactional
    public void requestToJoin(Long groupId, Long userId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe introuvable (ID=" + groupId + ")"));

        UserDTO user = mapUser(userClient.getUserById(userId));

        boolean isAlreadyMember = groupMembershipRepository.existsByUserIdAndGroupe(user.getId(), group);
        if (isAlreadyMember) {
            throw new RuntimeException("Tu es déjà membre de ce groupe.");
        }

        boolean alreadyRequested = joinRequestRepository.existsByGroupeAndUserId(group, user.getId());
        if (alreadyRequested) {
            throw new RuntimeException("Tu as déjà une demande en attente pour ce groupe.");
        }

        // On enregistre la demande
        JoinRequest request = new JoinRequest();
        request.setFirstName(user.getFirstName());
        request.setLastName(user.getLastName());
        request.setProfileImage(user.getProfileImage());
        request.setUserId(user.getId());
        request.setGroupe(group);
        request.setAccepted(false);
        request.setRequestedAt(LocalDateTime.now());
        joinRequestRepository.save(request);

        // --- NOUVEAU : On notifie tous les ADMIN de ce groupe ---
        // il te faut un finder qui retourne les adhésions par rôle ; tu peux en créer un analogue à :
        // List<GroupMembership> findByGroupeGroupIdAndRole(Long groupId, String role);
        List<GroupMembership> admins = groupMembershipRepository
                .findByGroupeGroupIdAndRole(groupId, "ADMIN");
        for (GroupMembership gm : admins) {
            Notification notif = new Notification();
            notif.setRecipientUserId(gm.getUserId());
            notif.setTitle("Nouvelle demande d’adhésion");
            notif.setMessage("L’utilisateur "
                    + user.getFirstName() + " " + user.getLastName()
                    + " souhaite rejoindre « " + group.getGroupName() + " »");
            notif.setLink("/groups/" + groupId + "/join-requests");
            notif.setJoinRequestId(request.getId());   // ← on stocke l’ID
            notificationRepository.save(notif);
            messagingTemplate.convertAndSendToUser(
                    gm.getUserId().toString(),
                    "/queue/notifications",
                    notif
            );
        }
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
            dto.setDescription(group.getDescription());
            dto.setGroupImage(group.getGroupImage());
            dto.setCreatedBy(group.getCreatedBy());
            dto.setCreatedById(group.getCreatedById());
            dto.setCreatedAt(group.getCreatedAt());
            dto.setMessageCount(
                    group.getChat() != null && group.getChat().getMessageList() != null
                            ? group.getChat().getMessageList().size()
                            : 0
            );

            List<GroupMemberDTO> members = groupMembershipRepository
                    .findByGroupe(group)
                    .stream()
                    .map(m -> {
                        UserDTO user = mapUser(userClient.getUserById(m.getUserId()));

                        // 1️⃣ rôles
                        List<String> roles = new ArrayList<>();
                        roles.add(m.getRole());
                        if (user.getId().equals(group.getCreatedById())
                                && user.getRole() != null && !user.getRole().isBlank()) {
                            roles.add(user.getRole());
                        }

                        // 2️⃣ qui a invité ?
                        Long   invitedById   = m.getAddedById();
                        String invitedByName = null;
                        if (invitedById != null) {
                            UserDTO inviter = mapUser(userClient.getUserById(invitedById));
                            invitedByName = inviter.getFirstName() + " " + inviter.getLastName();
                        }

                        return new GroupMemberDTO(
                                user.getId(),
                                user.getFirstName(),
                                user.getLastName(),
                                roles,
                                user.getProfileImage(),
                                invitedByName,
                                invitedById
                        );
                    })
                    .toList();

            dto.setMembers(members);
            result.add(dto);
        }

        return result;
    }


    @Override
    public void rejectJoinRequest(Long requestId) {
        JoinRequest req = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        joinRequestRepository.delete(req); // 👈 On la supprime simplement
    }

    @Override
    public void updateGroupImage(Long groupId, String base64Image) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        group.setGroupImage(base64Image);
        groupeRepository.save(group);
    }

    @Override
    public void deleteGroup(Long groupId, Long userId) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe introuvable"));
        UserDTO user = mapUser(userClient.getUserById(userId));

        GroupMembership membership = groupMembershipRepository.findByUserIdAndGroupe(user.getId(), group)
                .orElseThrow(() -> new RuntimeException("Tu ne fais pas partie de ce groupe"));

        groupeRepository.delete(group);
    }

    @Override
    public List<GroupeDTO> getGroupsCreatedBy(Long userId) {
        UserDTO user = mapUser(userClient.getUserById(userId));
        String fullName = user.getFirstName() + " " + user.getLastName();
        List<Groupe> groupes = groupeRepository.findByCreatedBy(fullName);

        return groupes.stream().map(g -> {
            GroupeDTO dto = new GroupeDTO();
            dto.setGroupId(g.getGroupId());
            dto.setGroupName(g.getGroupName());
            dto.setDescription(g.getDescription());
            dto.setCreatedBy(g.getCreatedBy());
            dto.setCreatedById(g.getCreatedById());
            dto.setGroupImage(g.getGroupImage());
            dto.setCreatedAt(g.getCreatedAt());
            dto.setMessageCount(g.getChat() != null && g.getChat().getMessageList() != null
                    ? g.getChat().getMessageList().size()
                    : 0);
            return dto;
        }).toList();
    }

    @Override
    public List<UserDTO> searchUsers(String query) {
        String lower = query == null ? "" : query.trim().toLowerCase();
        List<UserDTO> allUsers = userClient.getAllUsers();

        // 1️⃣ Définis la liste des rôles valides
        List<String> validRoles = List.of("ADMIN", "TEACHER", "MENTOR", "STUDENT");

        // 2️⃣ Si la query correspond exactement à un rôle, filtre par rôle
        for (String role : validRoles) {
            if (role.equalsIgnoreCase(lower)) {
                return allUsers.stream()
                        .filter(u -> u.getRole() != null && u.getRole().equalsIgnoreCase(role))
                        .map(this::mapUser)
                        .toList();
            }
        }

        // 3️⃣ Sinon, recherche par nom/prénom comme avant
        return allUsers.stream()
                .filter(u -> (u.getFirstName() + " " + u.getLastName())
                        .toLowerCase()
                        .contains(lower))
                .map(this::mapUser)
                .toList();
    }

    @Override
    public Chat sendTextAndOptionalFileMessage(
            Long groupId,
            Long userId,
            String messageText,
            String fileUrl,
            Long replyToId
    ) {
        Groupe group = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        UserDTO sender = mapUser(userClient.getUserById(userId));

        // 1) Vérifie si l’utilisateur est déjà bloqué
        UserInfraction inf = userInfractionRepository
                .findByUserIdAndGroupId(userId, groupId)
                .orElse(null);
        if (inf != null && inf.isBlocked()) {
            if (inf.getBlockedUntil()!=null
                    && inf.getBlockedUntil().isBefore(LocalDateTime.now())) {
                inf.setBlocked(false);
                inf.setInfractionCount(0);
                inf.setBlockedUntil(null);
                userInfractionRepository.save(inf);
            } else {
                return group.getChat();
            }
        }

        // 2) Message inapproprié → bloqué + notification admin/mentor
        if (messageText != null && isMessageInappropriate(messageText)) {
            // a) incrémente l’infraction
            UserInfraction ui = userInfractionRepository
                    .findByUserIdAndGroupId(userId, groupId)
                    .orElse(new UserInfraction(userId, groupId));
            ui.setInfractionCount(ui.getInfractionCount()+1);
            userInfractionRepository.save(ui);

            // b) warning dans le chat
            Message warning = new Message();
            warning.setSenderId(-1L);
            warning.setSenderName("⚠️ Système");
            warning.setContent("Message inapproprié bloqué.");
            warning.setFileUrl("user:"+userId);

            warning.setChat(group.getChat());
            messageRepository.save(warning);
            messagingTemplate.convertAndSend("/topic/chat/" + groupId, warning);

            // c) prépare la liste des rôles à notifier
            List<String> rolesToNotify = List.of("ADMIN", "MENTOR");
            List<GroupMembership> recipients =
                    groupMembershipRepository
                            .findByGroupeGroupIdAndRoleIn(groupId, rolesToNotify);

            // d) envoie une notification personnalisée
            for (GroupMembership gm : recipients) {
                Notification notif = new Notification();
                notif.setRecipientUserId(gm.getUserId());
                notif.setTitle("Contenu inapproprié détecté");
                notif.setMessage(String.format(
                        "L’utilisateur %s %s a posté un contenu bloqué dans « %s » :\n\"%s\"",
                        sender.getFirstName(),
                        sender.getLastName(),
                        group.getGroupName(),
                        messageText.trim()
                ));
                notif.setGroupId(groupId);         // champ ajouté
                notif.setOffenderId(userId);       // champ ajouté
                notif.setCreatedAt(LocalDateTime.now());
                notif.setRead(false);
                notificationRepository.save(notif);

                messagingTemplate.convertAndSendToUser(
                        gm.getUserId().toString(),
                        "/queue/notifications",
                        notif
                );
            }

            return group.getChat();
        }

        // 3) Sinon, message normal (avec replyTo et fichier éventuel)
        Message msg = new Message();
        msg.setSenderId(userId);
        msg.setSenderName(sender.getFirstName() + " " + sender.getLastName());
        msg.setChat(group.getChat());
        msg.setContent(messageText != null ? messageText.trim() : "");
        msg.setFileUrl(fileUrl);
        if (replyToId != null) {
            Message parent = messageRepository.findById(replyToId).orElse(null);
            if (parent != null) {
                msg.setReplyTo(parent);
                msg.setReplyToSenderId(parent.getSenderId());
                Message r = new Message();
                r.setId(parent.getId());
                r.setContent(parent.getContent());
                r.setSenderName(parent.getSenderName());
                r.setFileUrl(parent.getFileUrl());
                msg.setReplyToMessage(r);
            }
        }
        // 🖼️ Encodage image
        String profileImage = sender.getProfileImage();
        if (profileImage != null && !profileImage.startsWith("data:image")) {
            profileImage = "data:image/png;base64," + profileImage;
        }
        msg.setSenderProfileImage(profileImage);

        messageRepository.save(msg);
        messagingTemplate.convertAndSend("/topic/chat/" + groupId, msg);
        return group.getChat();
    }
    @Override
    @Transactional
    public void blockUserInGroup(Long groupId, Long userId) {
        // → 0) Récupère d’abord le rôle global de l’utilisateur ciblé
        UserDTO target = mapUser(userClient.getUserById(userId));
        // ✋ Si c’est un ADMIN global, on n’applique pas le blocage
        if ("ADMIN".equalsIgnoreCase(target.getRole())) {
            return;
        }

        // 1) Récupère ou crée l’infraction, passe en “blocked”
        UserInfraction inf = userInfractionRepository
                .findByUserIdAndGroupId(userId, groupId)
                .orElse(new UserInfraction(userId, groupId));
        inf.setBlocked(true);
        inf.setBlockedUntil(LocalDateTime.now().plusHours(24));
        userInfractionRepository.save(inf);

        // 2) Supprime l’utilisateur du groupe (si présent)
        Groupe groupe = groupeRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Groupe non trouvé"));
        groupMembershipRepository.findByUserIdAndGroupe(userId, groupe)
                .ifPresent(groupMembershipRepository::delete);

        // 3) Envoie un message système dans le chat pour annoncer le blocage
        Message sys = new Message();
        sys.setSenderId(-1L);
        sys.setSenderName("🔒 Modération");
        sys.setContent(String.format(
                "L’utilisateur %s %s a été bloqué pour comportement inapproprié et retiré du groupe.",
                target.getFirstName(), target.getLastName()
        ));
        sys.setFileUrl("user:" + userId);
        sys.setChat(groupe.getChat());
        messageRepository.save(sys);
        messagingTemplate.convertAndSend("/topic/chat/" + groupId, sys);

        // 4) Notifie directement l’utilisateur qu’il a été bloqué
        messagingTemplate.convertAndSendToUser(
                userId.toString(),    // destination : l’ID de l’utilisateur
                "/queue/blocked",     // canal “blocked”
                groupId               // contenu : l’ID du groupe bloqué
        );
    }


    private boolean isMessageInappropriate(String content) {
        if (content == null) return false;
        String[] tokens = content
                .toLowerCase()
                .split("\\W+");  // split sur tout ce qui n'est pas lettre/chiffre/_

        for (String w : tokens) {
            switch (w) {
                case "violence": case "haine": case "suicide": case "terrorisme":
                case "menace": case "insulte": case "injure": case "tuer": case "battre":
                case "sale": case "idiot": case "con": case "merde": case "connard":
                case "pute": case "salope":
                case "kill": case "hate": case "terrorist": case "stupid": case "dumb":
                case "fool": case "bitch": case "fuck": case "shit": case "asshole":
                case "bastard": case "jerk": case "moron": case "whore":
                    return true;
                default:
                    // mot OK
            }
        }
        return false;
    }
    @Override
    public void reactToMessage(Long groupId, Long messageId, Long userId, String emoji) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message introuvable"));

        // 🔁 Vérifie s’il y a déjà une réaction de cet utilisateur
        Reaction existingReaction = reactionRepository.findByMessageAndUserId(message, userId).orElse(null);

        if (existingReaction != null) {
            existingReaction.setEmoji(emoji);
            reactionRepository.save(existingReaction);
        } else {
            UserDTO user = userClient.getUserById(userId); // ✅ Évite double appel
            Reaction newReaction = new Reaction();
            newReaction.setEmoji(emoji);
            newReaction.setUserId(userId);
            newReaction.setUserName(user.getFirstName() + " " + user.getLastName());
            newReaction.setMessage(message);
            reactionRepository.save(newReaction);
        }

        // ✅ Recharge les réactions avec noms enrichis
        List<Reaction> updatedReactions = reactionRepository.findByMessage(message);
        for (Reaction r : updatedReactions) {
            if (r.getUserName() == null || r.getUserName().isBlank()) {
                UserDTO u = userClient.getUserById(r.getUserId());
                r.setUserName(u.getFirstName() + " " + u.getLastName());
                r.setUserProfileImage(u.getProfileImage()); // 👈 ajoute ce champ dans Reaction si pas encore fait !

            }
        }
        message.setReactions(updatedReactions);
        message.setType("REACTION_UPDATED");

        // 🚀 Envoi via WebSocket
        messagingTemplate.convertAndSend("/topic/chat/" + groupId, message);
    }

}