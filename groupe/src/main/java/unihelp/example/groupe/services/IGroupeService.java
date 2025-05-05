package unihelp.example.groupe.services;

import unihelp.example.groupe.dto.*;
import unihelp.example.groupe.entities.*;

import java.util.List;
import java.util.Map;

public interface IGroupeService {

    public Groupe createGroup(String groupName, String description, List<Long> userIds, Long createdById, String groupImage);
    public void updateGroupImage(Long groupId, String base64Image);
    List<Message> getMessages(Long groupId);
    List<Groupe> getAllGroups();
    // IGroupeService.java
    Groupe addUserById(Long groupId, Long userId, Long addedById);
    List<GroupMemberDTO> getGroupMembers(Long groupId);
    public void blockUserInGroup(Long groupId, Long userId);
    Groupe renameGroup(Long groupId, String newName);
    void leaveGroup(Long groupId, Long userId);
    public void acceptJoinRequest(Long requestId,Long acceptedById);
    List<Groupe> getGroupsForUser(Long userId);

    public void rejectJoinRequest(Long requestId);
    void handleIncomingWebSocketMessage(Long groupId, Message message);

    void requestToJoin(Long groupId, Long userId);
    public Chat sendTextAndOptionalFileMessage(Long groupId, Long userId, String messageText, String fileUrl, Long replyToId);
    public List<JoinRequestDTO> getPendingRequests(Long groupId);
    public void reactToMessage(Long groupId, Long messageId, Long userId, String emoji);
    List<GroupeWithMembersDTO> getAllGroupsWithMembers();
    public List<GroupeDTO> getGroupsCreatedBy(Long userId);
    List<UserDTO> searchUsers(String query);
    void deleteGroup(Long groupId, Long userId);
    public Chat sendMessage(Long groupId, Long userId, String messageText);
}
