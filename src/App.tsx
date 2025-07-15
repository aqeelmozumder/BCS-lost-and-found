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
        // Changed `items-center` to `items-start` to align content to the top.
        // `py-20` was on the outer div, but is moved and adjusted to `pt-16 pb-8` on the inner grid.
        // This gives more control over the top spacing and general vertical layout.
        <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4">
          <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-2 items-center pt-32 pb-16"> {/* Added pt-16 and pb-8 to control vertical positioning */}
            {/* Left Column - Image */}
            <div className="flex justify-start">
              <div className="w-full max-w-lg">
                <img
                  src="/Lost&Found.png"
                  alt="Lost Something? We can help you find it! Check Reception CIL, Foote Center, Laundry."
                  className="w-full h-auto object-contain rounded-lg shadow-lg max-h-[60vh]"
                />
              </div>
            </div>

            {/* Right Column - Welcome Text and Description */}
            <div className="text-center md:text-left mx-auto md:ml-auto p-4 pl-0">
              <h1 className="text-4xl font-bold mb-2 leading-tight">
               Brentwood College School
              </h1>
              <h2 className="text-4xl font-bold mb-4 leading-tight">Lost & Found Platform</h2>
              <p className="text-xl text-gray-700 mb-1">
                Your dedicated website for connecting lost items with their owners
                within the Brentwood College School community.
              </p>
              <p className="text-xl text-gray-700 mb-6">
                Report items you've lost or found, and help us reunite misplaced belongings with their rightful owners.
              </p>
              <p className="text-lg font-bold text-red-700">
                Please sign in with your Brentwood account to continue.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;