package com.easyreads.service;

import com.easyreads.entity.Highlight;
import com.easyreads.repository.HighlightRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class HighlightService {

    private final HighlightRepository highlightRepository;

    public HighlightService(HighlightRepository highlightRepository) {
        this.highlightRepository = highlightRepository;
    }

    public List<Map<String, Object>> findByUserAndBook(String userId, Long bookId) {
        List<Highlight> list;
        if (bookId != null) {
            list = highlightRepository.findByUserIdAndBookIdOrderByCreatedAtDesc(userId, bookId);
        } else {
            list = highlightRepository.findByUserId(userId);
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Highlight h : list) result.add(toMap(h));
        return result;
    }

    public Highlight save(String userId, Long bookId, Integer page, String text, String color,
                           String nodeText, Integer offset) {
        Highlight h = new Highlight();
        h.setUserId(userId);
        h.setBookId(bookId);
        h.setPage(page != null ? page : 0);
        h.setText(text);
        h.setColor(color != null ? color : "yellow");
        h.setNodeText(nodeText);
        h.setOffset(offset != null ? offset : 0);
        return highlightRepository.save(h);
    }

    public void remove(String userId, Long bookId, Integer page, String text, String nodeText, Integer offset) {
        List<Highlight> list = highlightRepository.findByUserIdAndBookIdOrderByCreatedAtDesc(userId, bookId);
        for (Highlight h : list) {
            if (Objects.equals(h.getText(), text)
                    && (page == null || Objects.equals(h.getPage(), page))
                    && (nodeText == null || Objects.equals(h.getNodeText(), nodeText))) {
                highlightRepository.delete(h);
                return;
            }
        }
    }

    public void migrateToUser(String toUserId) {
        List<Highlight> guest = highlightRepository.findByUserId("guest");
        for (Highlight h : guest) h.setUserId(toUserId);
        highlightRepository.saveAll(guest);
    }

    private Map<String, Object> toMap(Highlight h) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("_id", String.valueOf(h.getId()));
        m.put("userId", h.getUserId());
        m.put("bookId", String.valueOf(h.getBookId()));
        m.put("page", h.getPage());
        m.put("text", h.getText());
        m.put("color", h.getColor());
        m.put("nodeText", h.getNodeText());
        m.put("offset", h.getOffset());
        m.put("createdAt", h.getCreatedAt().toString());
        return m;
    }
}
