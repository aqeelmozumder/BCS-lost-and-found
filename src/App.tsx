import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase/config";
import { User } from "./types";
import Header from "./components/Header";
import Homepage from "./components/Homepage";
import AdminPage from "./components/AdminPage";
import ItemForm from "./components/ItemForm";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<
    "home" | "report-lost" | "report-found" | "admin"
  >("home");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user is admin
          const userDoc = await getDoc(doc(db, "users", firebaseUser.email!));
          const isAdmin = userDoc.exists() ? userDoc.data().isAdmin : false;

          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName!,
            isAdmin: isAdmin,
          };
          setUser(userData);
        } catch (error) {
          console.error("Error checking admin status:", error);
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName!,
            isAdmin: false,
          };
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthChange = (userData: User | null) => {
    setUser(userData);
  };

  const handlePageChange = (
    page: "home" | "report-lost" | "report-found" | "admin",
  ) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <Header
        user={user}
        onAuthChange={handleAuthChange}
        onPageChange={handlePageChange}
      />

      {user ? (
        <>
          {currentPage === "home" && (
            <Homepage user={user} onPageChange={handlePageChange} />
          )}
          {currentPage === "report-lost" && (
            <ItemForm
              user={user}
              status="lost"
              onSuccess={() => setCurrentPage("home")}
            />
          )}
          {currentPage === "report-found" && (
            <ItemForm
              user={user}
              status="found"
              onSuccess={() => setCurrentPage("home")}
            />
          )}
          {currentPage === "admin" && user.isAdmin && <AdminPage user={user} />}
        </>
      ) : (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">
              Welcome to Brentwood Lost & Found
            </h1>
            <p className="text-gray-600 mb-8">
              Please sign in with your Brentwood account to continue
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
