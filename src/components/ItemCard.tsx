import React from "react";
import { LostFoundItem } from "../types";
import {
  Calendar,
  MapPin,
  User,
  Mail,
  Tag,
  FileText,
  AlertCircle,
  Search,
  CheckCircle,
} from "lucide-react";

interface ItemCardProps {
  item: LostFoundItem;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "lost":
        return {
          bg: "bg-red-100 text-red-800",
          icon: AlertCircle,
        };
      case "found":
        return {
          bg: "bg-green-100 text-green-800",
          icon: Search,
        };
      case "returned":
        return {
          bg: "bg-blue-100 text-blue-800",
          icon: CheckCircle,
        };
      default:
        return {
          bg: "bg-gray-100 text-gray-800",
          icon: AlertCircle,
        };
    }
  };

  const statusStyle = getStatusStyle(item.status);
  const StatusIcon = statusStyle.icon;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
        <span
          className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg}`}
        >
          <StatusIcon className="w-3 h-3 mr-1" />
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      </div>

      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-center">
          <Tag className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium">Category:</span>
          <span className="ml-1">{item.category}</span>
        </div>

        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium">Location:</span>
          <span className="ml-1">{item.location}</span>
        </div>

        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium">Date:</span>
          <span className="ml-1">{formatDate(item.date.toDate())}</span>
        </div>

        <div className="flex items-start">
          <FileText className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
          <div>
            <span className="font-medium">Description:</span>
            <p className="ml-1 mt-1">{item.description}</p>
          </div>
        </div>

        <div className="flex items-start">
          <Mail className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
          <div>
            <span className="font-medium">Contact:</span>
            <p className="ml-1 mt-1">{item.contact}</p>
          </div>
        </div>

        <div className="flex items-center">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium">Reported by:</span>
          <span className="ml-1">{item.userName}</span>
        </div>
      </div>

      {item.imageUrl && (
        <div className="mt-4">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ItemCard;
