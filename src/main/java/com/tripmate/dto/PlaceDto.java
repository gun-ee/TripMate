
package com.tripmate.dto;
import lombok.*; import java.util.Map;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaceDto { 
    private String source; 
    private String ref; 
    private String name; 
    private Double lat; 
    private Double lng; 
    private String address; 
    private String category; 
    private String photo; 
    private String photoReference; // Google Photo API용 참조값
    private String imageUrl; // 실제 이미지 URL
    private Map<String,Object> raw; 
}
