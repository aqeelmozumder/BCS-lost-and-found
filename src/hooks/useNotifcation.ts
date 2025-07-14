import { useState } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
    autoClose: boolean = true,
    autoCloseDelay: number = 15000,
  ) => {
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      title,
      message,
      type,
      autoClose,
      autoCloseDelay,
    };

    setNotifications((prev) => [...prev, notification]);

    if (autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, autoCloseDelay);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const showSuccess = (title: string, message: string, autoClose = true) => {
    showNotification(title, message, "success", autoClose);
  };

  const showError = (title: string, message: string, autoClose = false) => {
    showNotification(title, message, "error", autoClose);
  };

  const showWarning = (title: string, message: string, autoClose = false) => {
    showNotification(title, message, "warning", autoClose);
  };

  const showInfo = (title: string, message: string, autoClose = true) => {
    showNotification(title, message, "info", autoClose);
  };

  return {
    notifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
  };
};
