package com.easyreads.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.*;

@RestController
@RequestMapping("/api")
public class UtilsController {

    private static final Logger logger = LoggerFactory.getLogger(UtilsController.class);
    private final RestClient restClient;

    public UtilsController() {
        this.restClient = RestClient.builder().build();
    }

    @GetMapping("/meaning/{word}")
    public ResponseEntity<Object> meaning(@PathVariable("word") String word) {
        try {
            String url = "https://api.dictionaryapi.dev/api/v2/entries/en/" +
                    java.net.URLEncoder.encode(word, java.nio.charset.StandardCharsets.UTF_8);
            Object result = restClient.get().uri(url).retrieve().body(Object.class);
            if (result != null) return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.warn("Dictionary lookup failed for {}: {}", word, e.getMessage());
        }
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/translate")
    public ResponseEntity<Map<String, Object>> translate(
            @RequestParam("text") String text,
            @RequestParam(value = "to", defaultValue = "hi") String to,
            @RequestParam(value = "from", defaultValue = "en") String from) {
        String translated = tryLibreTranslate(text, from, to);
        if (translated == null) translated = tryMyMemory(text, from, to);
        if (translated == null) translated = "";
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("translatedText", translated);
        res.put("translation", translated);
        res.put("from", from);
        res.put("to", to);
        return ResponseEntity.ok(res);
    }

    private String tryLibreTranslate(String text, String from, String to) {
        String[] urls = {
                "https://libretranslate.com/translate",
                "https://libretranslate.de/translate",
                "https://translate.astian.org/translate",
                "https://translate.argosopentech.com/translate"
        };
        Map<String, String> body = new LinkedHashMap<>();
        body.put("q", text);
        body.put("source", from);
        body.put("target", to);
        body.put("format", "text");
        for (String url : urls) {
            try {
                Map<?, ?> result = restClient.post()
                        .uri(url)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(Map.class);
                if (result != null && result.get("translatedText") != null) {
                    return String.valueOf(result.get("translatedText"));
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String tryMyMemory(String text, String from, String to) {
        try {
            String pair = from + "|" + to;
            String url = "https://api.mymemory.translated.net/get?q=" +
                    java.net.URLEncoder.encode(text, java.nio.charset.StandardCharsets.UTF_8) +
                    "&langpair=" + java.net.URLEncoder.encode(pair, java.nio.charset.StandardCharsets.UTF_8);
            Map<?, ?> result = restClient.get().uri(url).retrieve().body(Map.class);
            if (result != null && result.get("responseData") instanceof Map<?, ?> rd) {
                Object t = rd.get("translatedText");
                if (t != null) return String.valueOf(t);
            }
        } catch (Exception ignored) {}
        return null;
    }
}
