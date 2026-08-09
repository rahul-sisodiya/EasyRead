package com.easyreads.service;

import com.easyreads.entity.Vocab;
import com.easyreads.repository.VocabRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class VocabService {

    private final VocabRepository vocabRepository;
    private final ObjectMapper objectMapper;

    public VocabService(VocabRepository vocabRepository) {
        this.vocabRepository = vocabRepository;
        this.objectMapper = new ObjectMapper();
    }

    public List<Map<String, Object>> findByUser(String userId) {
        List<Vocab> list = vocabRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Vocab v : list) {
            result.add(toMap(v));
        }
        return result;
    }

    public Vocab save(String userId, String word, Object meaning, Object translation) {
        Vocab v = new Vocab();
        v.setUserId(userId);
        v.setWord(word);
        try {
            if (meaning != null) v.setMeaningData(objectMapper.writeValueAsString(meaning));
        } catch (JsonProcessingException ignored) {}
        try {
            if (translation != null) v.setTranslationData(objectMapper.writeValueAsString(translation));
        } catch (JsonProcessingException ignored) {}
        return vocabRepository.save(v);
    }

    public void migrateToUser(String toUserId) {
        List<Vocab> guest = vocabRepository.findByUserId("guest");
        for (Vocab v : guest) v.setUserId(toUserId);
        vocabRepository.saveAll(guest);
    }

    private Map<String, Object> toMap(Vocab v) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("_id", String.valueOf(v.getId()));
        m.put("word", v.getWord());
        try {
            if (v.getMeaningData() != null) {
                m.put("meaning", objectMapper.readValue(v.getMeaningData(), Object.class));
            }
        } catch (Exception ignored) {}
        try {
            if (v.getTranslationData() != null) {
                m.put("translation", objectMapper.readValue(v.getTranslationData(), Object.class));
            }
        } catch (Exception ignored) {}
        m.put("ts", java.sql.Timestamp.valueOf(v.getCreatedAt()).getTime());
        m.put("createdAt", v.getCreatedAt().toString());
        return m;
    }
}
