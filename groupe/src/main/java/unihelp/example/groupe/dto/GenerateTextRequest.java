package unihelp.example.groupe.dto;

import java.util.Map;


public record GenerateTextRequest(
        PromptMessage prompt,
        double temperature,
        int maxOutputTokens
) {}
