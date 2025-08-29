package com.tripmate.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkSaveRequest {
    private List<TripItemSaveDto> items;
}
