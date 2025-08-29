
package com.tripmate.dto;
import lombok.*; import java.util.Map;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaceDto { private String source; private String ref; private String name; private Double lat; private Double lng; private String address; private String category; private String photo; private Map<String,Object> raw; }
