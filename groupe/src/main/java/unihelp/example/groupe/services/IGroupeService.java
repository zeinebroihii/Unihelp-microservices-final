package unihelp.example.groupe.services;

import unihelp.example.groupe.dto.GroupMemberDTO;
import unihelp.example.groupe.dto.GroupeWithMembersDTO;
import unihelp.example.groupe.entities.*;

import java.util.List;

public interface IGroupeService {

    Groupe createGroup(String groupName, List<Long> userIds, Long createdById);

    Groupe addUserByFullName(Long groupId, String firstName, String lastName);
    Chat sendMessage(Long groupId, Long userId, String messageText);

    List<Message> getMessages(Long groupId);

    List<Groupe> getAllGroups();

    List<GroupMemberDTO> getGroupMembers(Long groupId);

    Groupe renameGroup(Long groupId, String newName);

    void leaveGroup(Long groupId, Long userId);

    List<Groupe> getGroupsForUser(Long userId);

    void notifyVideoCall(Long groupId, Long userId);

    void startVideoCall(Long groupId, Long userId);

    void handleIncomingWebSocketMessage(Long groupId, Message message);

    void requestToJoin(Long groupId, Long userId);

    List<JoinRequest> getPendingRequests(Long groupId);

    void acceptJoinRequest(Long requestId);

    List<GroupeWithMembersDTO> getAllGroupsWithMembers();

    List<Groupe> getGroupsCreatedBy(Long userId);

    void deleteGroup(Long groupId, Long userId);
}
