import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { User, LostFoundItem, ItemCategory } from "../types";
import { useNotification } from "../hooks/useNotifcation";
import NotificationDialog from "./NotificationDialog";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ThemeProvider, createTheme } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/en-gb"; // For dd/mm/yyyy format
import {
  Package,
  Tag,
  MapPin,
  Calendar as CalendarIcon,
  FileText,
  Mail,
  Loader,
} from "lucide-react";

interface ItemFormProps {
  user: User;
  status: "lost" | "found";
  onSuccess?: () => void;
}

// Custom MUI theme to match your Brentwood branding
const theme = createTheme({
  palette: {
    primary: {
      main: "#dc2626",
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#dc2626",
              borderWidth: "2px",
            },
          },
        },
      },
    },
  },
});

const ItemForm: React.FC<ItemFormProps> = ({ user, status, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "" as ItemCategory,
    location: "",
    date: null as Dayjs | null,
    description: "",
    contact: user.email,
  });
  const [loading, setLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { notifications, showSuccess, showError, removeNotification } =
    useNotification();

  const categories: ItemCategory[] = [
    "Electronics",
    "Clothing",
    "Books",
    "Sports Equipment",
    "Personal Items",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date) {
      showError(
        "Date Required",
        "Please select the date when the item was lost or found.",
      );
      return;
    }

    setLoading(true);

    try {
      // Convert Dayjs to JavaScript Date
      const jsDate = formData.date.toDate();

      const itemData: Omit<LostFoundItem, "id"> = {
        name: formData.name,
        category: formData.category,
        location: formData.location,
        description: formData.description,
        contact: formData.contact,
        status: status,
        date: Timestamp.fromDate(jsDate),
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        createdAt: Timestamp.now(),
        isApproved: false,
      };

      await addDoc(collection(db, "items"), itemData);

      // Custom success messages based on item type
      if (status === "found") {
        showSuccess(
          "Found Item Reported Successfully",
          "Your found item has been reported. Please hand the item physically to the Reception for Admin Approval. The item will be visible to students after approval.",
        );
      } else {
        showSuccess(
          "Lost Item Reported Successfully",
          "Your lost item has been reported and will be visible after admin approval.",
        );
      }

      // Reset form
      setFormData({
        name: "",
        category: "" as ItemCategory,
        location: "",
        date: null,
        description: "",
        contact: user.email,
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 15500);
      }
    } catch (error) {
      console.error("Error submitting item:", error);
      showError(
        "Submission Failed",
        "Failed to submit your item. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Dayjs | null) => {
    setFormData((prev) => ({
      ...prev,
      date: date,
    }));
  };

  // Get min and max dates
  const today = dayjs();
  const minDate = dayjs("2025-01-01");

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <>
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center mb-6">
                  <Package className="w-8 h-8 text-red-600 mr-3" />
                  <h2 className="text-2xl font-bold text-center">
                    Report {status === "lost" ? "Lost" : "Found"} Item
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="flex items-center text-sm font-medium text-gray-700 mb-2"
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Item Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g., iPhone 13, Blue Backpack"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="flex items-center text-sm font-medium text-gray-700 mb-2"
                    >
                      <Tag className="w-4 h-4 mr-1" />
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="flex items-center text-sm font-medium text-gray-700 mb-2"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Location *
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder={
                        status === "lost"
                          ? "Where did you lose it?"
                          : "Where did you find it?"
                      }
                    />
                  </div>

                  {/* MUI DatePicker with Clickable Input */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Date {status === "lost" ? "Lost" : "Found"} *
                    </label>
                    <DatePicker
                      value={formData.date}
                      onChange={handleDateChange}
                      minDate={minDate}
                      maxDate={today}
                      format="DD/MM/YYYY"
                      enableAccessibleFieldDOMStructure={false}
                      open={datePickerOpen}
                      onOpen={() => setDatePickerOpen(true)}
                      onClose={() => setDatePickerOpen(false)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          placeholder: `Select the date when the item was ${status}`,
                          onClick: () => setDatePickerOpen(true),
                          sx: {
                            "& .MuiInputBase-input": {
                              cursor: "pointer",
                            },
                            "& .MuiInputBase-root": {
                              cursor: "pointer",
                            },
                          },
                        },
                        popper: {
                          sx: {
                            "& .MuiPaper-root": {
                              boxShadow:
                                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                              border: "1px solid #e5e7eb",
                            },
                          },
                        },
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: dd/mm/yyyy - Click anywhere to select the date
                      when the item was {status === "lost" ? "lost" : "found"}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="flex items-center text-sm font-medium text-gray-700 mb-2"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Provide detailed description including color, size, brand, etc."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact"
                      className="flex items-center text-sm font-medium text-gray-700 mb-2"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Contact Information *
                    </label>
                    <input
                      type="email"
                      id="contact"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Your email address"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        `Report ${status === "lost" ? "Lost" : "Found"} Item`
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Notification System */}
          {notifications.map((notification) => (
            <NotificationDialog
              key={notification.id}
              isOpen={true}
              title={notification.title}
              message={notification.message}
              type={notification.type}
              onClose={() => removeNotification(notification.id)}
              autoClose={notification.autoClose}
              autoCloseDelay={notification.autoCloseDelay}
            />
          ))}
        </>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default ItemForm;
