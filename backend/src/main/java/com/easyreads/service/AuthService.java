package com.easyreads.service;

import com.easyreads.entity.User;
import com.easyreads.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public User register(String name, String email, String password) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (name == null) name = "";
        if (userRepository.existsByEmail(email)) {
            Optional<User> existing = userRepository.findByEmail(email);
            if (existing.isPresent()) {
                boolean matches = passwordEncoder.matches(password, existing.get().getPassword());
                if (matches) return existing.get();
            }
            throw new IllegalArgumentException("User already exists with this email");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    public User login(String email, String password) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        Optional<User> opt = userRepository.findByEmail(email);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        User user = opt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        return user;
    }
}
