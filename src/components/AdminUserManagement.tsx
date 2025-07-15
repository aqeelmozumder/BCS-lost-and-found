import React, { useState, useEffect } from "react";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config"; // Make sure this path is correct for your project
import { User } from "../types/index"; // Import the User type from your central types file
import {
  UserPlus,
  Trash2,
  AlertTriangle,
  Users,
  Key,
} from "lucide-react";

// Interface for the list of admins displayed in the table
interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  createdBy?: string;
}

// Props for the AdminUserManagement component
interface AdminUserManagementProps {
  user: User | null;
}

// --- Integrated Confirmation Dialog Component ---
// This dialog is defined within the same file to avoid creating new files.
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    // Modal overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose(); // Close the dialog after confirming
            }}
            type="button"
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Confirm Removal
          </button>
        </div>
      </div>
    </div>
  );
};
// --- End of Integrated Confirmation Dialog ---

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ user }) => {
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">(
    ""
  );

  // State to manage the confirmation dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetAdminEmail, setTargetAdminEmail] = useState<string | null>(
    null
  );

  // Fetches the list of current admin users from Firestore
  const fetchAdmins = async () => {
    try {
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);

      const admins: AdminUser[] = querySnapshot.docs
        .filter((doc) => doc.data().isAdmin === true)
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email,
            createdAt:
              data.createdAt?.toDate().toLocaleDateString() || "N/A",
            createdBy: data.createdBy || "Unknown",
          };
        });

      setAdminList(admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      setMessage("Failed to load the list of admins.");
      setMessageType("error");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handles the form submission to make a new user an admin
  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setMessage("You must be logged in as an admin to perform this action.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const adminDocRef = doc(db, "users", email);
      const adminDoc = await getDoc(adminDocRef);

      if (adminDoc.exists() && adminDoc.data().isAdmin) {
        setMessage("This user is already an admin.");
        setMessageType("error");
        return;
      }

      await setDoc(
        adminDocRef,
        {
          email: email,
          isAdmin: true,
          createdAt: Timestamp.now(),
          createdBy: user.displayName, // Use display name from the logged-in user prop
        },
        { merge: true }
      );

      setMessage(`Successfully promoted ${email} to admin.`);
      setMessageType("success");
      setEmail("");
      fetchAdmins(); // Refresh admin list
    } catch (error) {
      console.error("Error making user admin:", error);
      setMessage("An error occurred while creating the admin user.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Opens the confirmation dialog before removing an admin
  const handleRemoveAdminClick = (adminEmail: string) => {
    if (user && user.email === adminEmail) {
      setMessage("You cannot remove your own admin privileges.");
      setMessageType("error");
      return;
    }
    setTargetAdminEmail(adminEmail);
    setIsConfirmOpen(true);
  };

  // Performs the actual deletion after user confirmation
  const confirmRemoveAdmin = async () => {
    if (!targetAdminEmail) return;

    try {
      await deleteDoc(doc(db, "users", targetAdminEmail));
      setMessage(`Successfully removed admin rights for ${targetAdminEmail}.`);
      setMessageType("success");
      fetchAdmins(); // Refresh the list
    } catch (error) {
      console.error("Error removing admin:", error);
      setMessage("Failed to remove admin. Please try again.");
      setMessageType("error");
    }
  };

  return (
    <>
      {/* The Confirmation Dialog is rendered here but is only visible when isConfirmOpen is true */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmRemoveAdmin}
        title="Confirm Admin Removal"
        message={`Are you sure you want to remove admin privileges from ${targetAdminEmail}? This action cannot be undone.`}
      />

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto">
        {/* Make Admin Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-gray-700 flex items-center">
            <UserPlus className="w-6 h-6 mr-3 text-indigo-600" />
            Make User an Admin
          </h3>
          <form
            onSubmit={handleMakeAdmin}
            className="flex flex-col sm:flex-row sm:items-end sm:space-x-4"
          >
            <div className="flex-grow">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                User's Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@brentwood.ca"
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="mt-3 sm:mt-0 px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Make Admin
                </>
              )}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-md text-sm ${
                messageType === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Current Admins Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
            <Users className="w-6 h-6 mr-3 text-indigo-600" />
            Current Admins
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date Added
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Added By
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {adminList.length > 0 ? (
                  adminList.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {admin.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {admin.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {admin.createdBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRemoveAdminClick(admin.email)}
                          className="flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200 focus:outline-none"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No admin users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminUserManagement;