package com.easyreads.repository;

import com.easyreads.entity.Vocab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabRepository extends JpaRepository<Vocab, Long> {
    List<Vocab> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Vocab> findByUserId(String userId);
}
