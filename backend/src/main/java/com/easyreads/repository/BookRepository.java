package com.easyreads.repository;

import com.easyreads.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Book> findByUserId(String userId);
}
