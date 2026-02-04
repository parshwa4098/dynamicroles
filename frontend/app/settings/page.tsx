"use client";

import { FaUserCircle } from "react-icons/fa";

export default function Page() {
  return (
    <>
    
     <div className="w-full max-w-400 mx-auto">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <FaUserCircle className="text-3xl sm:text-5xl text-gray-400" />
        <h1 className="text-xl sm:text-3xl font-bold text-white">
          Settings -Management  of roles
        </h1>
      </div>
       <div className="text-center py-12 text-gray-500 border border-gray-800 rounded-xl mt-4 bg-gray-900/10">
          <p>No users found in the system.</p>
        </div>
      </div>
    </>
  );
}
