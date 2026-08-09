package com.easyreads.controller;

import com.easyreads.dto.ApiResponse;
import com.easyreads.dto.UpdateRequest;
import com.easyreads.entity.Book;
import com.easyreads.service.BookService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse> upload(
            @RequestParam("pdf") MultipartFile pdf,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "userId", required = false) String userId,
            @RequestParam(value = "coverDataUrl", required = false) String coverDataUrl) throws IOException {
        String safeUserId = (userId == null || userId.isBlank()) ? "guest" : userId;
        Map<String, Object> result = bookService.upload(pdf, safeUserId, title, category, coverDataUrl);
        Long bookId = (Long) result.get("bookId");
        ApiResponse res = new ApiResponse();
        res.setBookId(bookId);
        res.setMessage("PDF processed successfully");
        return ResponseEntity.ok(res);
    }

    @GetMapping("/books")
    public ResponseEntity<ApiResponse> listBooks(@RequestParam("userId") String userId) {
        List<Book> books = bookService.findByUser(userId);
        List<Map<String, Object>> items = new ArrayList<>();
        for (Book b : books) items.add(bookToMap(b));
        ApiResponse res = new ApiResponse();
        res.setItems(items);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/books/{id}")
    public ResponseEntity<ApiResponse> getBook(@PathVariable("id") Long id,
                                               @RequestParam(value = "userId", required = false) String userId) {
        Book b = bookService.findById(id);
        ApiResponse res = new ApiResponse();
        res.setItem(bookToMap(b));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/books/{id}/content")
    public ResponseEntity<ApiResponse> getContent(@PathVariable("id") Long id,
                                                   @RequestParam(value = "userId", required = false) String userId) {
        Book b = bookService.findById(id);
        ApiResponse res = new ApiResponse();
        res.setHtml(b.getHtmlContent() != null ? b.getHtmlContent() : "");
        res.setText(b.getExtractedText() != null ? b.getExtractedText() : "");
        return ResponseEntity.ok(res);
    }

    @GetMapping(value = "/books/{id}/file", produces = "application/pdf")
    public ResponseEntity<byte[]> getFile(@PathVariable("id") Long id,
                                           @RequestParam(value = "userId", required = false) String userId) {
        Book b = bookService.findById(id);
        byte[] data = b.getFileData();
        if (data == null) return ResponseEntity.notFound().build();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        String fn = b.getFileName() != null ? b.getFileName() : "book.pdf";
        headers.setContentDispositionFormData("attachment", fn);
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @GetMapping(value = "/books/{id}/cover")
    public ResponseEntity<byte[]> getCover(@PathVariable("id") Long id) {
        Book b = bookService.findById(id);
        String dataUrl = b.getCoverImage();
        if (dataUrl == null || dataUrl.isBlank()) return ResponseEntity.notFound().build();
        try {
            int comma = dataUrl.indexOf(',');
            if (comma < 0) return ResponseEntity.notFound().build();
            String meta = dataUrl.substring(0, comma);
            String b64 = dataUrl.substring(comma + 1);
            byte[] bytes = Base64.getDecoder().decode(b64);
            MediaType mt = MediaType.IMAGE_JPEG;
            if (meta.contains("png")) mt = MediaType.IMAGE_PNG;
            if (meta.contains("gif")) mt = MediaType.IMAGE_GIF;
            return ResponseEntity.ok().contentType(mt).body(bytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/books/{id}")
    public ResponseEntity<ApiResponse> updateBook(@PathVariable("id") Long id,
                                                    @RequestBody UpdateRequest req) {
        Book b = bookService.update(id, req);
        ApiResponse res = new ApiResponse();
        res.setItem(bookToMap(b));
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<ApiResponse> deleteBook(@PathVariable("id") Long id,
                                                   @RequestParam(value = "userId", required = false) String userId) {
        String safe = userId != null ? userId : "guest";
        bookService.delete(id, safe);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/books/migrate")
    public ResponseEntity<ApiResponse> migrateBooks(@RequestBody UpdateRequest req) {
        if (req.getToUserId() != null) bookService.migrateToUser(req.getToUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    static Map<String, Object> bookToMap(Book b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("_id", String.valueOf(b.getId()));
        m.put("userId", b.getUserId());
        m.put("title", b.getTitle());
        m.put("author", b.getAuthor());
        m.put("fileName", b.getFileName());
        m.put("category", b.getCategory() != null ? b.getCategory() : "Uncategorized");
        m.put("pinned", Boolean.TRUE.equals(b.getPinned()));
        m.put("lastPage", b.getLastPage() != null ? b.getLastPage() : 0);
        m.put("lastScroll", b.getLastScroll() != null ? b.getLastScroll() : 0);
        m.put("lastMode", b.getLastMode());
        m.put("totalPages", b.getTotalPages() != null ? b.getTotalPages() : 0);
        m.put("coverUrl", b.getCoverUrl());
        m.put("fileUrl", "/api/books/" + b.getId() + "/file");
        m.put("createdAt", b.getCreatedAt() != null ? b.getCreatedAt().toString() : null);
        return m;
    }
}
