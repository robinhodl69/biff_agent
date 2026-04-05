import { useState } from "react";
import Navbar from "./Navbar";

export default function Layout({ children, centered = false }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-primary font-mono flex">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Spacer maintains navbar width to prevent content overlap */}
      <div className={`shrink-0 transition-all duration-300 ${
        isCollapsed ? "w-14" : "w-14 md:w-56"
      }`} />

      <main className={`flex-1 min-w-0 flex flex-col items-center ${
        centered ? "justify-center min-h-screen" : "pt-16"
      }`}>
        <div className={`w-full px-6 lg:px-10 pb-10 max-w-4xl`}>
          {children}
        </div>
      </main>
    </div>
  );
}
