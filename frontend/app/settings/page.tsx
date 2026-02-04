"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaUserShield } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { LuSave } from "react-icons/lu";
import { TbEyeCancel } from "react-icons/tb";


const API_URL = "http://localhost:5000";

interface Role {
  id: number;
  name: string;
}

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export default function SettingsPage() {


  const [roles, setRoles] = useState<Role[]>([]);
  const [newRole, setNewRole] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch(`${API_URL}/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => setRoles(res.data || []))
    
      
      .catch(() => toast.error("Failed to load roles"));
  }, []);

  const handleAddRole = async () => {
    if (!newRole.trim()) {
      toast.error("Role name required");
      return;
    }

    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setRoles((prev) => [...prev, data.data]);
      setNewRole("");
      toast.success("Role created");
    } catch (err: any) {
      toast.error(err.message || "Create failed");
    }
  };

  const handleUpdateRole = async (id: number) => {
    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/roles/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingName }),
      });

      if (!res.ok) throw new Error("Update failed");

      setRoles((prev) =>
        prev.map((r) => (r.id === id ? { ...r, name: editingName } : r)),
      );
      
      setEditingId(null);
      setEditingName("");
      toast.success("Role updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/roles/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      setRoles((prev) => prev.filter((r) => r.id !== id));
      toast.success("Role deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="w-full max-w-300 mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <FaUserShield className="text-4xl text-purple-400" />
        <h1 className="text-2xl font-bold text-white">Settings · Role Management</h1>
      </div>

    
      <div className="flex gap-3 mb-6">
        <input
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          placeholder="Enter role name"
          className="flex-1 bg-black border border-gray-700 p-3 rounded-lg text-white"
        />
        <button
          onClick={handleAddRole}
          className="bg-purple-500/20 text-purple-400 px-5 rounded-lg"
        >
          Add Role
        </button>
      </div>

      
      {roles.length === 0 ? (
        <div className="text-gray-500 text-center py-10 border border-gray-800 rounded-xl">
          No roles found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <div
              key={role.id}
              className="border border-gray-700 rounded-xl p-5 bg-gray-900/40"
            >
              {editingId === role.id ? (
                <>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full bg-black border border-gray-600 p-2 rounded mb-3 text-white"
                  />

                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleUpdateRole(role.id)}>
                      <LuSave className="text-green-400 text-xl" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingName("");
                      }}
                    >
                      <TbEyeCancel className="text-red-400 text-xl" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {role.name}
                  </h3>

                  <div className="flex justify-end gap-4 mt-4">
                    <button
                      onClick={() => {
                        setEditingId(role.id);
                        setEditingName(role.name);
                      }}
                    >
                      <MdEdit className="text-blue-400 text-xl" />
                    </button>

                    <button onClick={() => handleDeleteRole(role.id)}>
                      <MdDelete className="text-red-400 text-xl" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
