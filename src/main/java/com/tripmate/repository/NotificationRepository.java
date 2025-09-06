    package com.tripmate.repository;
    import com.tripmate.entity.Member;
    import com.tripmate.entity.Notification;
    import org.springframework.data.domain.Page;
    import org.springframework.data.domain.Pageable;
    import org.springframework.data.jpa.repository.JpaRepository;
    import java.util.List;
    public interface NotificationRepository extends JpaRepository<Notification, Long> {
        Page<Notification> findByMemberOrderByCreatedAtDesc(Member member, Pageable pageable);
        List<Notification> findByMemberAndIsReadFalseOrderByCreatedAtDesc(Member member);
        long countByMemberAndIsReadFalse(Member member);
    }
    