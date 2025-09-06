    import axiosInstance from './axios';
    export const notificationApi = {
      list: (page=0,size=20)=>axiosInstance.get(`/notifications?page=${page}&size=${size}`).then(r=>r.data),
      unread: ()=>axiosInstance.get(`/notifications/unread`).then(r=>r.data),
      unreadCount: ()=>axiosInstance.get(`/notifications/unread-count`).then(r=>r.data.count as number),
      markRead: (id:number)=>axiosInstance.put(`/notifications/${id}/read`).then(r=>r.data),
      markAll: ()=>axiosInstance.put(`/notifications/read-all`).then(r=>r.data)
    };
    