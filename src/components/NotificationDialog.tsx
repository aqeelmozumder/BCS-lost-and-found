import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

interface NotificationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
  showCloseButton?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({
  isOpen,
  title,
  message,
  type,
  onClose,
  showCloseButton = true,
  autoClose = false,
  autoCloseDelay = 15000,
}) => {
  React.useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          icon: CheckCircle,
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          titleColor: "text-green-800",
          messageColor: "text-green-700",
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: XCircle,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          messageColor: "text-red-700",
        };
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          icon: AlertTriangle,
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-800",
          messageColor: "text-yellow-700",
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: Info,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          titleColor: "text-blue-800",
          messageColor: "text-blue-700",
        };
    }
  };

  const styles = getTypeStyles();
  const IconComponent = styles.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg max-w-md w-full mx-4 p-6`}
      >
        <div className="flex items-start">
          <div className={`${styles.iconBg} rounded-full p-2 mr-4`}>
            <IconComponent className={`${styles.iconColor} w-6 h-6`} />
          </div>
          <div className="flex-1">
            <h3 className={`${styles.titleColor} text-lg font-semibold mb-2`}>
              {title}
            </h3>
            <p className={`${styles.messageColor} text-sm`}>{message}</p>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {showCloseButton && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDialog;
