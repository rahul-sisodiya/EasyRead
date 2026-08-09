package com.easyreads.service;

import com.easyreads.dto.UpdateRequest;
import com.easyreads.entity.Settings;
import com.easyreads.repository.SettingsRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class SettingsService {

    private final SettingsRepository settingsRepository;

    public SettingsService(SettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    public Map<String, Object> get(String userId) {
        Optional<Settings> opt = settingsRepository.findByUserId(userId);
        return toMap(opt.orElseGet(() -> defaults(userId)));
    }

    public Map<String, Object> patch(String userId, UpdateRequest req) {
        Optional<Settings> opt = settingsRepository.findByUserId(userId);
        Settings s = opt.orElseGet(() -> defaults(userId));
        if (req.getFont() != null) s.setFont(req.getFont());
        if (req.getTheme() != null) s.setTheme(req.getTheme());
        if (req.getLineHeight() != null) s.setLineHeight(req.getLineHeight());
        if (req.getFontFamily() != null) s.setFontFamily(req.getFontFamily());
        if (req.getPalette() != null) s.setPalette(req.getPalette());
        if (req.getPanelImageDataUrl() != null) s.setPanelImageDataUrl(req.getPanelImageDataUrl());
        if (req.getEyeComfort() != null) s.setEyeComfort(req.getEyeComfort());
        if (req.getWarmth() != null) s.setWarmth(req.getWarmth());
        if (req.getBrightness() != null) s.setBrightness(req.getBrightness());
        if (req.getMode() != null) s.setMode(req.getMode());
        return toMap(settingsRepository.save(s));
    }

    private Settings defaults(String userId) {
        Settings s = new Settings();
        s.setUserId(userId);
        return s;
    }

    private Map<String, Object> toMap(Settings s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("_id", String.valueOf(s.getId()));
        m.put("userId", s.getUserId());
        m.put("font", s.getFont());
        m.put("theme", s.getTheme());
        m.put("lineHeight", s.getLineHeight());
        m.put("fontFamily", s.getFontFamily());
        m.put("palette", s.getPalette());
        m.put("panelImageDataUrl", s.getPanelImageDataUrl());
        m.put("eyeComfort", s.getEyeComfort());
        m.put("warmth", s.getWarmth());
        m.put("brightness", s.getBrightness());
        m.put("mode", s.getMode());
        m.put("createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : null);
        return m;
    }
}
