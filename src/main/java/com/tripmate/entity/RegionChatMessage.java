package com.tripmate.entity;

import com.tripmate.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "region_chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegionChatMessage extends BaseTimeEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String region;
    
    @Column(nullable = false)
    private String city;
    
    @Column(nullable = false, length = 1000)
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @Column(name = "author_name", nullable = false)
    private String authorName;
    
    @Column(name = "author_profile_img")
    private String authorProfileImg;
    
    @Column(name = "author_location", nullable = false)
    private String authorLocation;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}

