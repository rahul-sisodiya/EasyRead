package com.easyreads.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class UpdateRequest {

    @JsonProperty("userId")
    private String userId;

    @JsonProperty("title")
    private String title;

    @JsonProperty("category")
    private String category;

    @JsonProperty("pinned")
    private Boolean pinned;

    @JsonProperty("lastPage")
    private Integer lastPage;

    @JsonProperty("lastScroll")
    private Integer lastScroll;

    @JsonProperty("lastMode")
    private String lastMode;

    @JsonProperty("totalPages")
    private Integer totalPages;

    @JsonProperty("coverDataUrl")
    private String coverDataUrl;

    @JsonProperty("font")
    private Integer font;

    @JsonProperty("theme")
    private String theme;

    @JsonProperty("lineHeight")
    private Double lineHeight;

    @JsonProperty("fontFamily")
    private String fontFamily;

    @JsonProperty("palette")
    private String palette;

    @JsonProperty("panelImageDataUrl")
    private String panelImageDataUrl;

    @JsonProperty("eyeComfort")
    private Boolean eyeComfort;

    @JsonProperty("warmth")
    private Double warmth;

    @JsonProperty("brightness")
    private Double brightness;

    @JsonProperty("mode")
    private String mode;

    @JsonProperty("toUserId")
    private String toUserId;

    @JsonProperty("word")
    private String word;

    private Object meaning;
    private Object translation;

    @JsonProperty("bookId")
    private Long bookId;

    @JsonProperty("page")
    private Integer page;

    @JsonProperty("text")
    private String text;

    @JsonProperty("color")
    private String color;

    @JsonProperty("nodeText")
    private String nodeText;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("extra")
    private Map<String, Object> extra;

    public UpdateRequest() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
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
    public String getCoverDataUrl() { return coverDataUrl; }
    public void setCoverDataUrl(String coverDataUrl) { this.coverDataUrl = coverDataUrl; }
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
    public String getToUserId() { return toUserId; }
    public void setToUserId(String toUserId) { this.toUserId = toUserId; }
    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }
    public Object getMeaning() { return meaning; }
    public void setMeaning(Object meaning) { this.meaning = meaning; }
    public Object getTranslation() { return translation; }
    public void setTranslation(Object translation) { this.translation = translation; }
    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }
    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getNodeText() { return nodeText; }
    public void setNodeText(String nodeText) { this.nodeText = nodeText; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public Map<String, Object> getExtra() { return extra; }
    public void setExtra(Map<String, Object> extra) { this.extra = extra; }
}
