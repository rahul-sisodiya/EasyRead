package com.easyreads.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vocab")
public class Vocab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private String word;

    @Lob
    @Column(name = "meaning_data", columnDefinition = "LONGTEXT")
    private String meaningData;

    @Lob
    @Column(name = "translation_data", columnDefinition = "LONGTEXT")
    private String translationData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }
    public String getMeaningData() { return meaningData; }
    public void setMeaningData(String meaningData) { this.meaningData = meaningData; }
    public String getTranslationData() { return translationData; }
    public void setTranslationData(String translationData) { this.translationData = translationData; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
