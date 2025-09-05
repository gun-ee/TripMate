package com.tripmate.controller;

import com.tripmate.dto.AccompanyPostResponses;
import com.tripmate.dto.AccompanyPostRequests;
import com.tripmate.dto.AccompanyApplicationDtos;
import com.tripmate.config.CustomUserDetails;
import com.tripmate.service.AccompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/accompany")
public class AccompanyController {

    private final AccompanyService service;

    private Long currentMemberId() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
        return userDetails.getMember().getId();
    }

    @GetMapping("/posts")
    public Page<AccompanyPostResponses.ListItem> list(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "12") int size) {
        return service.listOpen(page, size);
    }

    @GetMapping("/posts/{id}")
    public AccompanyPostResponses.Detail get(@PathVariable Long id) { return service.get(id); }

    @PostMapping("/posts")
    public Long create(@RequestBody AccompanyPostRequests.Create req) { return service.create(currentMemberId(), req); }

    @PutMapping("/posts/{id}")
    public void update(@PathVariable Long id, @RequestBody AccompanyPostRequests.Update req) { service.update(currentMemberId(), id, req); }

    @DeleteMapping("/posts/{id}")
    public void delete(@PathVariable Long id) { service.delete(currentMemberId(), id); }

    @PostMapping("/posts/{id}/close")
    public void close(@PathVariable Long id) { service.close(currentMemberId(), id); }

    @GetMapping("/myposts")
    public Page<AccompanyPostResponses.ListItem> myPosts(@RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "12") int size) {
        return service.myPosts(currentMemberId(), page, size);
    }

    @PostMapping("/posts/{postId}/apply")
    public void apply(@PathVariable Long postId, @RequestBody AccompanyApplicationDtos.ApplyReq req) {
        service.apply(currentMemberId(), postId, req);
    }

    @GetMapping("/applications/mine")
    public List<AccompanyApplicationDtos.Item> applicationsForOwner() { return service.listApplicationsForOwner(currentMemberId()); }

    @GetMapping("/posts/{postId}/applications")
    public List<AccompanyApplicationDtos.Item> applicationsByPost(@PathVariable Long postId) {
        return service.listApplicationsByPost(postId, currentMemberId());
    }

    @PostMapping("/applications/{id}/accept")
    public void accept(@PathVariable Long id) { service.accept(currentMemberId(), id); }

    @PostMapping("/applications/{id}/reject")
    public void reject(@PathVariable Long id) { service.reject(currentMemberId(), id); }
}
