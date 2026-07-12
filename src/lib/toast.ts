export type ToastType = "success" | "error" | "info";

export interface ToastEvent {
  message: string;
  type: ToastType;
}

export function toast(message: string, type: ToastType = "info") {
  const event = new CustomEvent<ToastEvent>("assetflow-toast", {
    detail: { message, type },
  });
  window.dispatchEvent(event);
}
