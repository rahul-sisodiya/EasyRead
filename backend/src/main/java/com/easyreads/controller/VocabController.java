package com.easyreads.controller;

import com.easyreads.dto.ApiResponse;
import com.easyreads.dto.UpdateRequest;
import com.easyreads.service.VocabService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vocab")
public class VocabController {

    private final VocabService vocabService;

    public VocabController(VocabService vocabService) {
        this.vocabService = vocabService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> list(@RequestParam("userId") String userId) {
        List<Map<String, Object>> items = vocabService.findByUser(userId);
        ApiResponse res = new ApiResponse();
        res.setItems(items);
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<ApiResponse> save(@RequestBody UpdateRequest req) {
        String uid = req.getUserId() != null ? req.getUserId() : "guest";
        vocabService.save(uid, req.getWord(), req.getMeaning(), req.getTranslation());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/migrate")
    public ResponseEntity<ApiResponse> migrate(@RequestBody UpdateRequest req) {
        if (req.getToUserId() != null) vocabService.migrateToUser(req.getToUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
