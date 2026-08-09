package com.easyreads.service;

import com.easyreads.dto.UpdateRequest;
import com.easyreads.entity.Book;
import com.easyreads.exception.ResourceNotFoundException;
import com.easyreads.repository.BookRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final PdfService pdfService;

    public BookService(BookRepository bookRepository, PdfService pdfService) {
        this.bookRepository = bookRepository;
        this.pdfService = pdfService;
    }

    public Map<String, Object> upload(MultipartFile pdf, String userId, String title, String category,
                                       String coverDataUrl) throws IOException {
        Map<String, String> extracted = pdfService.extractFromFile(pdf);
        Book book = new Book();
        book.setUserId(userId);
        book.setTitle(title != null && !title.isBlank() ? title : stripExtension(pdf.getOriginalFilename()));
        book.setCategory(category != null && !category.isBlank() ? category : "Uncategorized");
        book.setFileName(pdf.getOriginalFilename());
        book.setFileData(pdf.getBytes());
        book.setExtractedText(extracted.get("text"));
        book.setHtmlContent(extracted.get("html"));
        if (coverDataUrl != null && !coverDataUrl.isBlank()) {
            book.setCoverImage(coverDataUrl);
            book.setCoverUrl("/api/books/_id_/cover");
        }
        Book saved = bookRepository.save(book);
        if (saved.getCoverImage() != null) {
            saved.setCoverUrl("/api/books/" + saved.getId() + "/cover");
            saved = bookRepository.save(saved);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("bookId", saved.getId());
        result.put("book", saved);
        return result;
    }

    public List<Book> findByUser(String userId) {
        return bookRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Book findById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
    }

    public Book update(Long id, UpdateRequest req) {
        Book b = findById(id);
        if (req.getTitle() != null) b.setTitle(req.getTitle());
        if (req.getCategory() != null) b.setCategory(req.getCategory());
        if (req.getPinned() != null) b.setPinned(req.getPinned());
        if (req.getLastPage() != null) b.setLastPage(req.getLastPage());
        if (req.getLastScroll() != null) b.setLastScroll(req.getLastScroll());
        if (req.getLastMode() != null) b.setLastMode(req.getLastMode());
        if (req.getTotalPages() != null) b.setTotalPages(req.getTotalPages());
        if (req.getCoverDataUrl() != null) {
            b.setCoverImage(req.getCoverDataUrl());
            b.setCoverUrl("/api/books/" + id + "/cover");
        }
        return bookRepository.save(b);
    }

    public void delete(Long id, String userId) {
        Book b = findById(id);
        if (!b.getUserId().equals(userId) && !userId.equals("guest") && !"guest".equals(b.getUserId())) {
            throw new IllegalArgumentException("You do not have permission to delete this book");
        }
        bookRepository.delete(b);
    }

    public void migrateToUser(String toUserId) {
        List<Book> guestBooks = bookRepository.findByUserId("guest");
        for (Book b : guestBooks) {
            b.setUserId(toUserId);
        }
        bookRepository.saveAll(guestBooks);
    }

    private String stripExtension(String name) {
        if (name == null) return "Untitled";
        int i = name.lastIndexOf('.');
        return i > 0 ? name.substring(0, i) : name;
    }
}
