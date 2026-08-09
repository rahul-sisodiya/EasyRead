package com.easyreads.controller;

import com.easyreads.dto.ApiResponse;
import com.easyreads.dto.UpdateRequest;
import com.easyreads.service.HighlightService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/highlights")
public class HighlightController {

    private final HighlightService highlightService;

    public HighlightController(HighlightService highlightService) {
        this.highlightService = highlightService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> list(
            @RequestParam("userId") String userId,
            @RequestParam(value = "bookId", required = false) Long bookId) {
        List<Map<String, Object>> items = highlightService.findByUserAndBook(userId, bookId);
        ApiResponse res = new ApiResponse();
        res.setItems(items);
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<ApiResponse> save(@RequestBody UpdateRequest req) {
        String uid = req.getUserId() != null ? req.getUserId() : "guest";
        highlightService.save(uid, req.getBookId(), req.getPage(), req.getText(),
                req.getColor(), req.getNodeText(), req.getOffset());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/remove")
    public ResponseEntity<ApiResponse> remove(@RequestBody UpdateRequest req) {
        String uid = req.getUserId() != null ? req.getUserId() : "guest";
        highlightService.remove(uid, req.getBookId(), req.getPage(), req.getText(),
                req.getNodeText(), req.getOffset());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/migrate")
    public ResponseEntity<ApiResponse> migrate(@RequestBody UpdateRequest req) {
        if (req.getToUserId() != null) highlightService.migrateToUser(req.getToUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
