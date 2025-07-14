import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { LostFoundItem, User } from "../types";
import { useNotification } from "../hooks/useNotifcation";
import NotificationDialog from "./NotificationDialog";
import {
  Settings,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  RotateCcw,
  Link,
  Unlink,
  Trash2,
  Calendar,
  User as UserIcon,
  Mail,
  MapPin,
  Tag,
  FileText,
  X,
} from "lucide-react";

interface AdminPageProps {
  user: User;
}

const AdminPage: React.FC<AdminPageProps> = ({ user }) => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "lost" | "found"
  >("pending");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [showLinkModal, setShowLinkModal] = useState<string | null>(null);
  const [showItemDetails, setShowItemDetails] = useState<string | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<LostFoundItem[]>([]);
  const {
    notifications,
    showSuccess,
    showError,
    showWarning,
    removeNotification,
  } = useNotification();

  const [stats, setStats] = useState({
    totalItems: 0,
    pendingApproval: 0,
    approvedItems: 0,
    lostItems: 0,
    foundItems: 0,
    returnedItems: 0,
    linkedItems: 0,
  });

  const fetchAllItems = useCallback(async () => {
    try {
      const itemsRef = collection(db, "items");
      const q = query(itemsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const fetchedItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LostFoundItem[];

      setItems(fetchedItems);
      calculateStats(fetchedItems);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching items:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  const calculateStats = (items: LostFoundItem[]) => {
    const returnedPairs = new Set<string>();
    items.forEach((item) => {
      if (item.status === "returned" && item.isLinked && item.linkedItemId) {
        const pair = [item.id, item.linkedItemId].sort().join("-");
        returnedPairs.add(pair);
      }
    });

    setStats({
      totalItems: items.length,
      pendingApproval: items.filter((item) => !item.isApproved).length,
      approvedItems: items.filter((item) => item.isApproved).length,
      lostItems: items.filter((item) => item.status === "lost").length,
      foundItems: items.filter((item) => item.status === "found").length,
      returnedItems: returnedPairs.size,
      linkedItems: items.filter((item) => item.isLinked).length,
    });
  };

  const handleApprove = async (itemId: string) => {
    try {
      await updateDoc(doc(db, "items", itemId), {
        isApproved: true,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isApproved: true } : item,
        ),
      );

      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, isApproved: true } : item,
      );
      calculateStats(updatedItems);

      showSuccess(
        "Item Approved",
        "Item has been approved successfully and is now visible to students.",
      );
    } catch (error) {
      console.error("Error approving item:", error);
      showError(
        "Approval Failed",
        "Failed to approve the item. Please try again.",
      );
    }
  };

  const handleReject = async (itemId: string) => {
    setShowDeleteConfirm(itemId);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      await deleteDoc(doc(db, "items", showDeleteConfirm));

      const updatedItems = items.filter(
        (item) => item.id !== showDeleteConfirm,
      );
      setItems(updatedItems);
      calculateStats(updatedItems);

      showSuccess(
        "Item Deleted",
        "Item has been permanently deleted from the system.",
      );
    } catch (error) {
      console.error("Error deleting item:", error);
      showError(
        "Deletion Failed",
        "Failed to delete the item. Please try again.",
      );
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (
    itemId: string,
    newStatus: "lost" | "found" | "returned",
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (item.status === "lost" && newStatus === "returned") {
      const foundItems = items.filter(
        (foundItem) =>
          foundItem.status === "found" &&
          foundItem.isApproved &&
          !foundItem.isLinked &&
          foundItem.id !== itemId,
      );

      if (foundItems.length === 0) {
        showWarning(
          "No Found Items Available",
          "No approved found items are available to link with this lost item.",
        );
        return;
      }

      setPotentialMatches(foundItems);
      setShowLinkModal(itemId);
      return;
    }

    try {
      await updateDoc(doc(db, "items", itemId), {
        status: newStatus,
      });

      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, status: newStatus } : item,
      );
      setItems(updatedItems);
      calculateStats(updatedItems);

      showSuccess(
        "Status Updated",
        `Item status has been updated to ${newStatus}.`,
      );
    } catch (error) {
      console.error("Error updating item status:", error);
      showError(
        "Update Failed",
        "Failed to update item status. Please try again.",
      );
    }
  };

  const linkItems = async (lostItemId: string, foundItemId: string) => {
    try {
      await updateDoc(doc(db, "items", lostItemId), {
        linkedItemId: foundItemId,
        isLinked: true,
        status: "returned",
      });

      await updateDoc(doc(db, "items", foundItemId), {
        linkedItemId: lostItemId,
        isLinked: true,
        originalLostItemId: lostItemId,
        status: "returned",
      });

      await fetchAllItems();
      setShowLinkModal(null);

      showSuccess(
        "Items Linked Successfully",
        "The lost and found items have been linked together and marked as returned.",
      );
    } catch (error) {
      console.error("Error linking items:", error);
      showError(
        "Linking Failed",
        "Failed to link the items. Please try again.",
      );
    }
  };

  const unlinkItems = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item?.isLinked || !item.linkedItemId || !item.id) {
      showError("Invalid Item", "Invalid item selected for unlinking.");
      return;
    }

    try {
      const linkedItem = items.find((i) => i.id === item.linkedItemId);
      if (!linkedItem?.id) {
        showError(
          "Linked Item Not Found",
          "The linked item could not be found.",
        );
        return;
      }

      let lostItemId: string;
      let foundItemId: string;

      if (item.originalLostItemId) {
        lostItemId = item.originalLostItemId;
        foundItemId = item.id;
      } else {
        lostItemId = item.id;
        foundItemId = linkedItem.id;
      }

      if (typeof lostItemId !== "string" || typeof foundItemId !== "string") {
        showError(
          "Invalid Item IDs",
          "Unable to determine item IDs for unlinking.",
        );
        return;
      }

      await updateDoc(doc(db, "items", lostItemId), {
        linkedItemId: null,
        isLinked: false,
        status: "lost",
        originalLostItemId: null,
      });

      await updateDoc(doc(db, "items", foundItemId), {
        linkedItemId: null,
        isLinked: false,
        status: "found",
        originalLostItemId: null,
      });

      await fetchAllItems();

      showSuccess(
        "Items Unlinked",
        "The items have been successfully unlinked and their statuses have been reset.",
      );
    } catch (error) {
      console.error("Error unlinking items:", error);
      showError(
        "Unlinking Failed",
        "Failed to unlink the items. Please try again.",
      );
    }
  };

  const filteredItems = items.filter((item) => {
    switch (filter) {
      case "pending":
        return !item.isApproved;
      case "approved":
        return item.isApproved;
      case "lost":
        return item.status === "lost";
      case "found":
        return item.status === "found";
      default:
        return true;
    }
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      lost: "bg-red-100 text-red-800",
      found: "bg-green-100 text-green-800",
      returned: "bg-blue-100 text-blue-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (timestamp: any) => {
    return timestamp.toDate().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedItem = items.find((item) => item.id === showItemDetails);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <Settings className="w-8 h-8 text-red-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-gray-600">
              Manage lost and found items for Brentwood College School
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <Package className="w-6 h-6 text-gray-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.totalItems}
              </div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <Clock className="w-6 h-6 text-orange-600 mb-2" />
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {stats.pendingApproval}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600 mb-1">
                {stats.approvedItems}
              </div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
              <div className="text-2xl font-bold text-red-600 mb-1">
                {stats.lostItems}
              </div>
              <div className="text-sm text-gray-600">Lost</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <Search className="w-6 h-6 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {stats.foundItems}
              </div>
              <div className="text-sm text-gray-600">Found</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <RotateCcw className="w-6 h-6 text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.returnedItems}
              </div>
              <div className="text-sm text-gray-600">Returned</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <Link className="w-6 h-6 text-indigo-600 mb-2" />
              <div className="text-2xl font-bold text-indigo-600 mb-1">
                {stats.linkedItems}
              </div>
              <div className="text-sm text-gray-600">Linked</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All Items ({items.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "pending"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Pending Approval ({stats.pendingApproval})
              </button>
              <button
                onClick={() => setFilter("approved")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "approved"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Approved ({stats.approvedItems})
              </button>
              <button
                onClick={() => setFilter("lost")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "lost"
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Lost Items ({stats.lostItems})
              </button>
              <button
                onClick={() => setFilter("found")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "found"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Found Items ({stats.foundItems})
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Item Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Approval
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Linked Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setShowItemDetails(item.id!)}
                          title={item.name}
                          className="block w-full text-left text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {item.name.length > 20
                            ? `${item.name.substring(0, 15)}...`
                            : item.name}
                        </button>
                        <div
                          className="text-xs text-gray-500"
                          title={item.category}
                        >
                          {item.category.length > 20
                            ? `${item.category.substring(0, 20)}...`
                            : item.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(
                              item.id!,
                              e.target.value as "lost" | "found" | "returned",
                            )
                          }
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(
                            item.status,
                          )}`}
                        >
                          {item.status === "lost" ||
                          (item.isLinked && item.originalLostItemId) ? (
                            <>
                              <option value="lost">Lost</option>
                              <option value="returned">Returned</option>
                            </>
                          ) : (
                            <>
                              <option value="found">Found</option>
                              {item.isLinked && (
                                <option value="returned">Returned</option>
                              )}
                            </>
                          )}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.userName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.userEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>
                          <span className="font-semibold">Lost/Found:</span>{" "}
                          {item.date.toDate().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div>
                          <span className="font-semibold">Submitted:</span>{" "}
                          {formatDate(item.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.isApproved
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.isApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isLinked ? (
                          <div className="text-sm">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                              <Link className="w-3 h-3 mr-1" />
                              Linked
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {item.linkedItemId?.substring(0, 8)}...
                            </div>
                            <button
                              onClick={() => unlinkItems(item.id!)}
                              className="flex items-center text-red-600 hover:text-red-800 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded-md transition-colors mt-1 font-semibold"
                            >
                              <Unlink className="w-3 h-3 mr-1" />
                              Unlink
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            Not Linked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {!item.isApproved && (
                            <button
                              onClick={() => handleApprove(item.id!)}
                              className="flex items-center justify-center text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 p-2 rounded-md transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleReject(item.id!)}
                            className="flex items-center justify-center text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 p-2 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 text-lg">
                  No items found for the selected filter.
                </div>
              </div>
            )}
          </div>
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold">Confirm Deletion</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this item? This action cannot
                  be undone.
                </p>
                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
          {showLinkModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                <div className="flex items-center mb-4">
                  <Link className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold">
                    Select Found Item to Link
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Choose which found item matches this lost item to mark both as
                  returned.
                </p>

                {potentialMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-500 mb-4">
                      No available found items to link with. Please ensure there
                      are approved found items that are not already linked.
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Available Found Items:
                    </h4>
                    <div className="space-y-2">
                      {potentialMatches.map((match) => (
                        <div
                          key={match.id}
                          className="border p-3 rounded flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium flex items-center">
                              <Package className="w-4 h-4 mr-2 text-gray-400" />
                              {match.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Tag className="w-3 h-3 mr-1" />
                              {match.category} •
                              <MapPin className="w-3 h-3 ml-2 mr-1" />
                              {match.location} •
                              <UserIcon className="w-3 h-3 ml-2 mr-1" />
                              {match.userName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-start mt-1">
                              <FileText className="w-3 h-3 mr-1 mt-0.5" />
                              {match.description}
                            </div>
                          </div>
                          <button
                            onClick={() => linkItems(showLinkModal!, match.id!)}
                            className="flex items-center bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            <Link className="w-3 h-3 mr-1" />
                            Link & Mark Returned
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowLinkModal(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {showItemDetails && selectedItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Package className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-semibold">Item Details</h3>
                  </div>
                  <button
                    onClick={() => setShowItemDetails(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <Package className="w-4 h-4 mr-2" />
                        Item Name
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {selectedItem.name}
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <Tag className="w-4 h-4 mr-2" />
                        Category
                      </label>
                      <p className="text-gray-900">{selectedItem.category}</p>
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="w-4 h-4 mr-2" />
                        Location
                      </label>
                      <p className="text-gray-900">{selectedItem.location}</p>
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        Date Lost/Found
                      </label>
                      <p className="text-gray-900">
                        {selectedItem.date
                          .toDate()
                          .toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        Date Submitted
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedItem.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Submitted By
                      </label>
                      <p className="text-gray-900 font-medium">
                        {selectedItem.userName}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {selectedItem.userEmail}
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Information
                      </label>
                      <p className="text-gray-900">{selectedItem.contact}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                          selectedItem.status,
                        )}`}
                      >
                        {selectedItem.status === "lost" && (
                          <AlertCircle className="w-4 h-4 mr-1" />
                        )}
                        {selectedItem.status === "found" && (
                          <Search className="w-4 h-4 mr-1" />
                        )}
                        {selectedItem.status === "returned" && (
                          <RotateCcw className="w-4 h-4 mr-1" />
                        )}
                        {selectedItem.status.charAt(0).toUpperCase() +
                          selectedItem.status.slice(1)}
                      </span>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Approval Status
                      </label>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedItem.isApproved
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedItem.isApproved ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approved
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-1" />
                            Pending
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 mr-2" />
                        Description
                      </label>
                      <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                        <p className="text-gray-900 text-sm whitespace-pre-wrap">
                          {selectedItem.description}
                        </p>
                      </div>
                    </div>

                    {selectedItem.isLinked && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Linked Status
                        </label>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                            <Link className="w-3 h-3 mr-1" />
                            Linked Item
                          </span>
                          <p className="text-sm text-blue-800">
                            <strong>Linked to:</strong>{" "}
                            {selectedItem.linkedItemId?.substring(0, 8)}...
                          </p>
                          {selectedItem.originalLostItemId && (
                            <p className="text-xs text-blue-600 mt-1">
                              Original Lost Item:{" "}
                              {selectedItem.originalLostItemId.substring(0, 8)}
                              ...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {!selectedItem.isLinked && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Linking Status
                        </label>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <Package className="w-3 h-3 mr-1" />
                            Not Linked
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            This item is not currently linked to any other
                            items.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {selectedItem.imageUrl && (
                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Image
                    </label>
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.name}
                      className="w-full max-w-md h-64 object-cover rounded-lg border mx-auto"
                    />
                  </div>
                )}
                <div className="mt-6 flex gap-3 justify-end">
                  {!selectedItem.isApproved && (
                    <button
                      onClick={() => {
                        handleApprove(selectedItem.id!);
                        setShowItemDetails(null);
                      }}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                  )}

                  {selectedItem.isLinked && (
                    <button
                      onClick={() => {
                        unlinkItems(selectedItem.id!);
                        setShowItemDetails(null);
                      }}
                      className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Unlink className="w-4 h-4 mr-1" />
                      Unlink
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleReject(selectedItem.id!);
                      setShowItemDetails(null);
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>

                  <button
                    onClick={() => setShowItemDetails(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
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
  );
};

export default AdminPage;