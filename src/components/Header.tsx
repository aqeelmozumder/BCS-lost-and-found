import React from "react";
import { signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { User } from "../types";
import { useNotification } from "../hooks/useNotifcation";
import NotificationDialog from "./NotificationDialog";
import {
  Home,
  AlertCircle,
  Search,
  Settings,
  LogOut,
  LogIn,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";

interface HeaderProps {
  user: User | null;
  onAuthChange: (user: User | null) => void;
  onPageChange: (
    page: "home" | "report-lost" | "report-found" | "admin",
  ) => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onAuthChange,
  onPageChange,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { notifications, showError, removeNotification } = useNotification();
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    hd: "brentwood.ca",
    prompt: "select_account",
  });

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      const userDoc = await getDoc(doc(db, "users", result.user.email!));
      const isAdmin = userDoc.exists() ? userDoc.data().isAdmin : false;

      const userData: User = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName!,
        isAdmin: isAdmin,
      };

      onAuthChange(userData);
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        return;
      }

      console.error("Authentication error:", error);
      showError(
        "Sign In Failed",
        "Please sign in with your Brentwood account. Make sure you're using a @brentwood.ca email address.",
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onAuthChange(null);
      onPageChange("home");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <>
      {/* Main Header */}
      <header className="bg-white shadow-lg border-b-2 border-red-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header Content */}
          <div className="flex justify-between items-center py-4">
            {/* Logo Section */}
            <div className="flex items-center">
              <button
                onClick={() => onPageChange("home")}
                className="flex items-center group transition-all duration-300 hover:scale-105"
              >
                {/* Brentwood College School Logo */}
                <div>
                  <img
                    src="/bcs_logo.png"
                    alt="Brentwood College School Logo"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div className="ml-4 text-left">
                  <h1 className="text-large font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                    Brentwood College School
                  </h1>
                  <p className="text-base text-red-600 font-medium text-left">
                    Lost & Found
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden lg:flex items-center space-x-1">
                <NavButton
                  icon={Home}
                  label="Home"
                  onClick={() => onPageChange("home")}
                  isActive={false}
                />
                <NavButton
                  icon={AlertCircle}
                  label="Report Lost"
                  onClick={() => onPageChange("report-lost")}
                  isActive={false}
                />
                <NavButton
                  icon={Search}
                  label="Report Found"
                  onClick={() => onPageChange("report-found")}
                  isActive={false}
                />
                {user.isAdmin && (
                  <NavButton
                    icon={Settings}
                    label="Admin"
                    onClick={() => onPageChange("admin")}
                    isActive={false}
                  />
                )}
              </nav>
            )}

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* User Profile */}
                  <div className="hidden md:flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.isAdmin ? "Administrator" : "Student"}
                      </p>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Sign Out</span>
                  </button>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Menu className="w-6 h-6" />
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          {user && isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4 space-y-2">
              <MobileNavButton
                icon={Home}
                label="Home"
                onClick={() => {
                  onPageChange("home");
                  setIsMobileMenuOpen(false);
                }}
              />
              <MobileNavButton
                icon={AlertCircle}
                label="Report Lost Item"
                onClick={() => {
                  onPageChange("report-lost");
                  setIsMobileMenuOpen(false);
                }}
              />
              <MobileNavButton
                icon={Search}
                label="Report Found Item"
                onClick={() => {
                  onPageChange("report-found");
                  setIsMobileMenuOpen(false);
                }}
              />
              {user.isAdmin && (
                <MobileNavButton
                  icon={Settings}
                  label="Admin Dashboard"
                  onClick={() => {
                    onPageChange("admin");
                    setIsMobileMenuOpen(false);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </header>

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
  );
};

// Navigation Button Component
interface NavButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  isActive: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  isActive,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
      isActive
        ? "bg-red-100 text-red-700 shadow-md"
        : "text-gray-700 hover:bg-red-50 hover:text-red-600"
    }`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

// Mobile Navigation Button Component
interface MobileNavButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

const MobileNavButton: React.FC<MobileNavButtonProps> = ({
  icon: Icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

export default Header;
