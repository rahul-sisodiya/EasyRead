package com.easyreads.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {

    private String error;
    private String message;
    @JsonProperty("bookId")
    private Long bookId;
    @JsonProperty("userId")
    private String userId;
    private String email;
    private String name;
    private String html;
    private String text;

    @JsonProperty("items")
    private List<?> items;

    @JsonProperty("item")
    private Object item;

    public ApiResponse() {}

    public static ApiResponse error(String message) {
        ApiResponse r = new ApiResponse();
        r.setError(message);
        return r;
    }

    public static ApiResponse ok() {
        return new ApiResponse();
    }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getHtml() { return html; }
    public void setHtml(String html) { this.html = html; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public List<?> getItems() { return items; }
    public void setItems(List<?> items) { this.items = items; }
    public Object getItem() { return item; }
    public void setItem(Object item) { this.item = item; }
}
