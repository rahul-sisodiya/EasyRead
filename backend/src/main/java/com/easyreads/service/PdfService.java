package com.easyreads.service;

import com.easyreads.util.TextParser;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class PdfService {

    private static final Logger logger = LoggerFactory.getLogger(PdfService.class);
    private final TextParser textParser;

    public PdfService(TextParser textParser) {
        this.textParser = textParser;
    }

    public Map<String, String> extractFromFile(MultipartFile file) throws IOException {
        validatePdf(file);
        byte[] bytes = file.getBytes();
        String rawText = extractText(bytes);
        String cleaned = textParser.clean(rawText);
        String html = textParser.toHtml(cleaned);
        Map<String, String> result = new HashMap<>();
        result.put("text", cleaned);
        result.put("html", html);
        result.put("rawText", rawText);
        return result;
    }

    public String extractText(byte[] pdfBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            logger.info("Extracted {} pages, {} chars of text", document.getNumberOfPages(), text.length());
            return text;
        }
    }

    public void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file provided");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("File must be a PDF");
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("File content must be application/pdf");
        }
    }
}
