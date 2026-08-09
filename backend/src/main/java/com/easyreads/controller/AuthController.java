package com.easyreads.controller;

import com.easyreads.dto.ApiResponse;
import com.easyreads.dto.AuthRequest;
import com.easyreads.entity.User;
import com.easyreads.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody AuthRequest req) {
        try {
            User u = authService.register(req.getName(), req.getEmail(), req.getPassword());
            ApiResponse res = new ApiResponse();
            res.setUserId(String.valueOf(u.getId()));
            res.setEmail(u.getEmail());
            res.setName(u.getName());
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody AuthRequest req) {
        try {
            User u = authService.login(req.getEmail(), req.getPassword());
            ApiResponse res = new ApiResponse();
            res.setUserId(String.valueOf(u.getId()));
            res.setEmail(u.getEmail());
            res.setName(u.getName());
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
