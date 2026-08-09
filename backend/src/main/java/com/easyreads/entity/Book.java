package com.easyreads.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = true)
    private String title;

    @Column(nullable = true)
    private String author;

    @Column(name = "file_name", nullable = true)
    private String fileName;

    @Column(name = "category", nullable = true)
    private String category;

    @Lob
    @Column(name = "extracted_text", columnDefinition = "LONGTEXT")
    private String extractedText;

    @Lob
    @Column(name = "html_content", columnDefinition = "LONGTEXT")
    private String htmlContent;

    @Lob
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    private byte[] fileData;

    @Lob
    @Column(name = "cover_image", columnDefinition = "LONGTEXT")
    private String coverImage;

    @Column(name = "cover_url", nullable = true)
    private String coverUrl;

    @Column(name = "pinned", nullable = false)
    private Boolean pinned = false;

    @Column(name = "last_page", nullable = false)
    private Integer lastPage = 0;

    @Column(name = "last_scroll", nullable = false)
    private Integer lastScroll = 0;

    @Column(name = "last_mode", nullable = true)
    private String lastMode;

    @Column(name = "total_pages", nullable = false)
    private Integer totalPages = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (pinned == null) pinned = false;
        if (lastPage == null) lastPage = 0;
        if (lastScroll == null) lastScroll = 0;
        if (totalPages == null) totalPages = 0;
        if (category == null) category = "Uncategorized";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }
    public String getHtmlContent() { return htmlContent; }
    public void setHtmlContent(String htmlContent) { this.htmlContent = htmlContent; }
    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }
    public Boolean getPinned() { return pinned; }
    public void setPinned(Boolean pinned) { this.pinned = pinned; }
    public Integer getLastPage() { return lastPage; }
    public void setLastPage(Integer lastPage) { this.lastPage = lastPage; }
    public Integer getLastScroll() { return lastScroll; }
    public void setLastScroll(Integer lastScroll) { this.lastScroll = lastScroll; }
    public String getLastMode() { return lastMode; }
    public void setLastMode(String lastMode) { this.lastMode = lastMode; }
    public Integer getTotalPages() { return totalPages; }
    public void setTotalPages(Integer totalPages) { this.totalPages = totalPages; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
