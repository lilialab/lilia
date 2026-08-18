import { toast } from 'sonner';

export function showErrorToast(message: string, id?: string): void {
  toast.error(message, { id: id ?? message });
}

export function showSuccessToast(message: string, id?: string): void {
  toast.success(message, { id: id ?? message });
}

export function showMessageToast(message: string, id?: string): void {
  toast.message(message, { id: id ?? message });
}
