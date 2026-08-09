package com.easyreads.repository;

import com.easyreads.entity.Highlight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HighlightRepository extends JpaRepository<Highlight, Long> {
    List<Highlight> findByUserIdAndBookIdOrderByCreatedAtDesc(String userId, Long bookId);
    List<Highlight> findByUserId(String userId);
}
