import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { LostFoundItem, User } from "../types";
import ItemCard from "./ItemCard";
import {
  Search,
  AlertCircle,
  CheckCircle,
  Package,
  Activity,
  Megaphone,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface HomepageProps {
  user: User;
  onPageChange: (page: "home" | "report-lost" | "report-found") => void;
}

const Homepage: React.FC<HomepageProps> = ({ user, onPageChange }) => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({
    totalReported: 0,
    totalFound: 0,
    totalReturned: 0,
    activeSearches: 0,
  });

  const fetchItems = useCallback(async () => {
    try {
      const itemsRef = collection(db, "items");
      const q = query(
        itemsRef,
        where("isApproved", "==", true),
        orderBy("createdAt", "desc"),
      );

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
    fetchItems();
  }, [fetchItems]);

  const calculateStats = (items: LostFoundItem[]) => {
    const returnedPairs = new Set<string>();
    items.forEach((item) => {
      if (item.status === "returned" && item.isLinked && item.linkedItemId) {
        const pair = [item.id, item.linkedItemId].sort().join("-");
        returnedPairs.add(pair);
      }
    });

    const lostItems = items.filter((item) => item.status === "lost");
    const foundItems = items.filter((item) => item.status === "found");

    setStats({
      totalReported: lostItems.length,
      totalFound: foundItems.length,
      totalReturned: returnedPairs.size,
      activeSearches: lostItems.length + foundItems.length,
    });
  };

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === "all" || item.status === filter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading items...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-red-900 via-red-800 to-red-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black bg-opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                Brentwood College School
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Lost Something?
                  <br />
                  <span className="text-red-200">Found Something?</span>
                </h1>
                <p className="text-xl lg:text-2xl text-red-100 leading-relaxed">
                  Connect lost items with their owners through our digital Lost
                  & Found portal
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onPageChange("report-lost")}
                  className="group flex items-center justify-center bg-white text-red-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <AlertCircle className="w-6 h-6 mr-3" />
                  Report Lost Item
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => onPageChange("report-found")}
                  className="group flex items-center justify-center bg-red-600 border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Report Found Item
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>

            {/* Right Visual Element */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Main Megaphone Illustration */}
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full blur-3xl scale-150"></div>

                {/* Megaphone Container */}
                <div className="relative bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-12 border border-white border-opacity-20">
                  <div className="relative">
                    {/* Megaphone Icon */}
                    <div className="bg-white rounded-2xl p-8 shadow-2xl transform rotate-12 hover:rotate-6 transition-transform duration-500">
                      <Megaphone className="w-24 h-24 text-red-600" />
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 bg-red-300 rounded-full p-3 animate-bounce">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="absolute -bottom-2 -left-2 bg-blue-100 rounded-full p-3 animate-pulse">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="absolute top-1/2 -right-8 bg-green-300 rounded-full p-3 animate-pulse">
                      <Search className="w-4 h-4 text-green-800" />
                    </div>
                  </div>
                </div>

                {/* Speech Bubbles */}
                <div className="absolute -top-8 -left-8 bg-white rounded-2xl p-4 shadow-lg transform -rotate-12 animate-float">
                  <div className="text-gray-800 font-medium text-sm">
                    Lost my keys!
                  </div>
                  <div className="absolute bottom-0 left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white transform translate-y-full"></div>
                </div>

                <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl p-4 shadow-lg transform rotate-12 animate-float-delayed">
                  <div className="text-gray-800 font-medium text-sm">
                    Found a phone!
                  </div>
                  <div className="absolute top-0 right-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white transform -translate-y-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <StatsCard
            icon={AlertCircle}
            value={stats.totalReported}
            label="Lost"
            color="red"
          />
          <StatsCard
            icon={Search}
            value={stats.totalFound}
            label="Found"
            color="green"
          />
          <StatsCard
            icon={CheckCircle}
            value={stats.totalReturned}
            label="Successfully Returned"
            color="blue"
          />
          <StatsCard
            icon={Activity}
            value={stats.activeSearches}
            label="Currently Active"
            color="purple"
          />
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All Categories
              </button>
              <button
                onClick={() => setFilter("lost")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "lost"
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Lost
              </button>
              <button
                onClick={() => setFilter("found")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "found"
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Found
              </button>
            </div>
          </div>
        </div>

        {/* Recent Items Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Package className="w-6 h-6 mr-2" />
            Recent Items
          </h2>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 text-lg">
                No items found matching your criteria.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
interface StatsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: "red" | "blue" | "green" | "purple";
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  value,
  label,
  color,
}) => {
  const colorClasses = {
    red: "text-red-600 bg-red-100",
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    purple: "text-purple-600 bg-purple-100",
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <div
        className={`w-16 h-16 ${colorClasses[color]} rounded-2xl flex items-center justify-center mb-6 mx-auto`}
      >
        <Icon className="w-8 h-8" />
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
        <div className="text-gray-600 font-medium">{label}</div>
      </div>
    </div>
  );
};

export default Homepage;
