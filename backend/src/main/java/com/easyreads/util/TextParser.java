package com.easyreads.util;

import org.springframework.stereotype.Component;

@Component
public class TextParser {

    public String clean(String rawText) {
        if (rawText == null || rawText.isEmpty()) {
            return "";
        }
        String text = rawText;
        text = text.replace("\r\n", "\n").replace("\r", "\n");
        text = text.replaceAll("\\n{3,}", "\n\n");
        text = text.replaceAll("[ \\t]+", " ");
        text = text.replaceAll("(?m)^\\s+", "");
        text = text.replaceAll("(?m)\\s+$", "");
        String[] lines = text.split("\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                sb.append("\n");
            } else {
                if (sb.length() > 0) {
                    char last = sb.charAt(sb.length() - 1);
                    if (last != '\n') {
                        if (trimmed.length() > 0 && Character.isUpperCase(trimmed.charAt(0))) {
                            sb.append("\n\n");
                        } else if (sb.length() >= 2 && sb.charAt(sb.length() - 1) == '-'
                                && Character.isLowerCase(sb.charAt(sb.length() - 2))) {
                            sb.setLength(sb.length() - 1);
                        } else {
                            sb.append(" ");
                        }
                    }
                }
                sb.append(trimmed);
            }
        }
        return sb.toString().trim();
    }

    public String toHtml(String text) {
        String s = clean(text);
        if (s.isEmpty()) {
            return "<p>No extractable text in this PDF.</p>";
        }
        String[] lines = s.replace("\r", "\n").split("\\n+");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String t = line.trim();
            if (!t.isEmpty()) {
                String escaped = escapeHtml(t);
                sb.append("<p>").append(escaped).append("</p>");
            }
        }
        return sb.toString();
    }

    private String escapeHtml(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
