import Swal from 'sweetalert2';

// 기본 알림
export const showAlert = (title: string, text?: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: '확인',
    confirmButtonColor: '#26a69a'
  });
};

// 성공 알림
export const showSuccess = (title: string, text?: string) => {
  return showAlert(title, text, 'success');
};

// 오류 알림
export const showError = (title: string, text?: string) => {
  return showAlert(title, text, 'error');
};

// 경고 알림
export const showWarning = (title: string, text?: string) => {
  return showAlert(title, text, 'warning');
};

// 확인 대화상자
export const showConfirm = (title: string, text?: string, confirmButtonText: string = '확인', cancelButtonText: string = '취소') => {
  return Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: '#26a69a',
    cancelButtonColor: '#d33'
  });
};

// 삭제 확인 대화상자
export const showDeleteConfirm = (title: string, text?: string) => {
  return showConfirm(title, text, '삭제', '취소');
};

// 토스트 알림
export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  return Swal.fire({
    title,
    icon,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
  });
};
