package com.easyreads.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "settings")
public class Settings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true, nullable = false)
    private String userId;

    @Column(nullable = false)
    private Integer font = 18;

    @Column(nullable = true, length = 32)
    private String theme = "dark";

    @Column(name = "line_height", nullable = false)
    private Double lineHeight = 1.6;

    @Column(name = "font_family", nullable = true, length = 32)
    private String fontFamily = "serif";

    @Column(nullable = true, length = 32)
    private String palette = "black";

    @Lob
    @Column(name = "panel_image_data_url", columnDefinition = "LONGTEXT")
    private String panelImageDataUrl;

    @Column(name = "eye_comfort", nullable = false)
    private Boolean eyeComfort = false;

    @Column(nullable = false)
    private Double warmth = 0.35;

    @Column(nullable = false)
    private Double brightness = 0.9;

    @Column(nullable = true, length = 32)
    private String mode = "page";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (font == null) font = 18;
        if (theme == null) theme = "dark";
        if (lineHeight == null) lineHeight = 1.6;
        if (fontFamily == null) fontFamily = "serif";
        if (palette == null) palette = "black";
        if (eyeComfort == null) eyeComfort = false;
        if (warmth == null) warmth = 0.35;
        if (brightness == null) brightness = 0.9;
        if (mode == null) mode = "page";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Integer getFont() { return font; }
    public void setFont(Integer font) { this.font = font; }
    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
    public Double getLineHeight() { return lineHeight; }
    public void setLineHeight(Double lineHeight) { this.lineHeight = lineHeight; }
    public String getFontFamily() { return fontFamily; }
    public void setFontFamily(String fontFamily) { this.fontFamily = fontFamily; }
    public String getPalette() { return palette; }
    public void setPalette(String palette) { this.palette = palette; }
    public String getPanelImageDataUrl() { return panelImageDataUrl; }
    public void setPanelImageDataUrl(String panelImageDataUrl) { this.panelImageDataUrl = panelImageDataUrl; }
    public Boolean getEyeComfort() { return eyeComfort; }
    public void setEyeComfort(Boolean eyeComfort) { this.eyeComfort = eyeComfort; }
    public Double getWarmth() { return warmth; }
    public void setWarmth(Double warmth) { this.warmth = warmth; }
    public Double getBrightness() { return brightness; }
    public void setBrightness(Double brightness) { this.brightness = brightness; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
