package com.unihelp.event.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unihelp.event.entities.Event;
import com.unihelp.event.entities.Ticket;
import com.unihelp.event.services.EventService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import jakarta.mail.MessagingException;
import java.util.Collections;
import java.util.List;
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper; // For JSON parsing
    private static final Logger logger = LoggerFactory.getLogger(EventController.class);

    @Value("${gemini.api-key}")
    private String geminiApiKey;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String geminiBaseUrl;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Event createEvent(@RequestBody Event event) {
        return eventService.createEvent(event);
    }

    @GetMapping
    public List<Event> getAllEvents() {
        return eventService.getAllEvents();
    }

    @GetMapping("/{id}")
    public Event getEventById(@PathVariable Long id) {
        return eventService.getEventById(id);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public Event updateEvent(@PathVariable Long id, @RequestBody Event event) throws MessagingException {
        return eventService.updateEvent(id, event);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
    }

    @GetMapping("/{id}/bookings")
    public List<Ticket> getEventBookings(@PathVariable Long id) {
        return eventService.getTicketsByEventId(id);
    }
    @PostMapping("/suggest-description")
    @Retryable(
            value = { RestClientException.class },
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public ResponseEntity<String> suggestDescription(@RequestBody String requestBody) {
        try {
            String eventTitle;

            // Try to parse the request body as JSON
            try {
                JsonNode requestNode = objectMapper.readTree(requestBody);
                // Check if the request body is a plain string
                if (requestNode.isTextual()) {
                    eventTitle = requestNode.asText();
                } else {
                    // Otherwise, assume it's a JSON object with a "title" field
                    JsonNode titleNode = requestNode.path("title");
                    if (titleNode.isMissingNode() || !titleNode.isTextual()) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Request body must be a string or a JSON object with a 'title' field.");
                    }
                    eventTitle = titleNode.asText();
                }
            } catch (Exception e) {
                // If parsing as JSON fails, assume the requestBody is a plain string
                eventTitle = requestBody;
            }

            // Validate the event title
            if (eventTitle == null || eventTitle.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Event title cannot be empty.");
            }

            // Prepare the prompt for the Gemini API
            String prompt = "Write a single short event description (100 characters or less) for " + eventTitle + ".";

            // Create the request object
            GeminiChatResponse.GenerateContentRequest geminiRequest = new GeminiChatResponse.GenerateContentRequest();
            GeminiChatResponse.Content content = new GeminiChatResponse.Content();
            content.setRole("user");
            GeminiChatResponse.Part part = new GeminiChatResponse.Part();
            part.setText(prompt);
            content.setParts(List.of(part));
            geminiRequest.setContents(List.of(content));

            // Serialize to JSON
            String geminiRequestBody = objectMapper.writeValueAsString(geminiRequest);

            // Log the request body for debugging
            logger.info("Gemini API Request Body: " + geminiRequestBody);

            // Set up the headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            // Create the HTTP entity with the request body and headers
            HttpEntity<String> entity = new HttpEntity<>(geminiRequestBody, headers);

            // Construct the full Gemini API URL using the base URL
            String geminiApiUrl = geminiBaseUrl + "/models/gemini-1.5-pro:generateContent?key=" + geminiApiKey;
            ResponseEntity<String> response = restTemplate.exchange(
                    geminiApiUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            // Log the raw response for debugging
            String responseBody = response.getBody();
            logger.info("Gemini API Response: " + responseBody);

            // Check if the response body is null or empty
            if (responseBody == null || responseBody.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Gemini API response is empty.");
            }

            // Parse the response using Jackson
            JsonNode rootNode = objectMapper.readTree(responseBody);

            // Check for error in the response
            JsonNode errorNode = rootNode.path("error");
            if (!errorNode.isMissingNode() && !errorNode.isEmpty()) {
                String errorMessage = errorNode.path("message").asText("Unknown error from Gemini API");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Gemini API error: " + errorMessage);
            }

            // Try parsing the new format with "text" field
            JsonNode textNode = rootNode.path("text");
            if (!textNode.isMissingNode() && textNode.isTextual()) {
                String description = textNode.asText();
                // Optionally, extract the first option if multiple options are provided
                if (description.contains("**Option 1")) {
                    String[] options = description.split("(?=\\*\\*Option \\d)");
                    description = options[0].replace("**Option 1 (Short & Sweet):**\n\n", "").trim();
                }
                return ResponseEntity.ok(description);
            }

            // Fallback to the original parsing logic
            textNode = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text");
            if (textNode == null || textNode.isMissingNode()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to parse Gemini API response: " + responseBody);
            }

            String description = textNode.asText();
            return ResponseEntity.ok(description);
        } catch (RestClientException e) {
            logger.error("RestClientException while calling Gemini API: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to generate description: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected exception in suggestDescription: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to generate description: " + e.getMessage());
        }
    }
}