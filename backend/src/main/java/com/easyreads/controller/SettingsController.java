package com.easyreads.controller;

import com.easyreads.dto.ApiResponse;
import com.easyreads.dto.UpdateRequest;
import com.easyreads.service.SettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> get(@RequestParam("userId") String userId) {
        Map<String, Object> item = settingsService.get(userId);
        ApiResponse res = new ApiResponse();
        res.setItem(item);
        return ResponseEntity.ok(res);
    }

    @PatchMapping
    public ResponseEntity<ApiResponse> patch(@RequestBody UpdateRequest req) {
        String uid = req.getUserId() != null ? req.getUserId() : "guest";
        Map<String, Object> item = settingsService.patch(uid, req);
        ApiResponse res = new ApiResponse();
        res.setItem(item);
        return ResponseEntity.ok(res);
    }
}
