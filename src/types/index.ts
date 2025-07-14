import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  isAdmin?: boolean;
}

export interface LostFoundItem {
  id?: string;
  name: string;
  category: string;
  status: "lost" | "found" | "returned";
  location: string;
  date: Timestamp;
  description: string;
  contact: string;
  imageUrl?: string;
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: Timestamp;
  isApproved: boolean;
  linkedItemId?: string; // ID of the matching item
  isLinked?: boolean; // Whether this item is linked to another
  originalLostItemId?: string; // For found items, reference to original lost item
}

export type ItemStatus = "lost" | "found" | "returned";
export type ItemCategory =
  | "Electronics"
  | "Clothing"
  | "Books"
  | "Sports Equipment"
  | "Personal Items"
  | "Other";
