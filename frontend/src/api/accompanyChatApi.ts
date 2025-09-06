    import axiosInstance from './axios';
    export const accompanyChatApi = {
      closeAndCreateRoom: (postId: number, acceptedMemberIds: number[], name?: string) =>
        axiosInstance.post(`/accompany/${postId}/close-and-create-room`, { acceptedMemberIds, name })
          .then(r => r.data as { roomId: number; name: string })
    };
    