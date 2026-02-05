"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaUserShield, FaArrowLeft } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { LuSave } from "react-icons/lu";
import { TbEyeCancel } from "react-icons/tb";

const API_URL = "http://localhost:5000";

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
}

const FIXED_PERMISSIONS = [
  { id: 1, name: "Create User" },
  { id: 2, name: "View Users" },
  { id: 3, name: "Update User" },
  { id: 4, name: "Delete User" },
  { id: 5, name: "Create Role" },
  { id: 6, name: "View Roles" },
  { id: 7, name: "Update Role" },
  { id: 8, name: "Delete Role" },
];

const getToken = () => {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("token");
  return t && t !== "undefined" ? t : null;
};

const getUser = () => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw || raw === "undefined") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState(getUser());
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRole, setNewRole] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);


  const getRoleName = (roleId: number) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  
  

  
  const isAdmin = () => {
    if (!loggedInUser || roles.length === 0) return false;
    
    const currentUser = allUsers.find(u => u.id === loggedInUser.sub);
    if (!currentUser) {
      return loggedInUser.role === "admin";
    }
    
    const userRole = getRoleName(currentUser.role_id).toLowerCase();
    return userRole === "admin";
  };

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      router.replace("/auth/login");
      return;
    }

    setLoggedInUser(user);

    Promise.all([
      fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),

      fetch(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([usersRes, rolesRes]) => {
        setAllUsers(usersRes.data || []);
        setRoles(rolesRes.data || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load data");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="w-full max-w-300 mx-auto p-6 bg-black min-h-screen">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }


  if (!loggedInUser) {
    return (
      <div className="w-full max-w-300 mx-auto p-6 bg-black min-h-screen">
        <div className="text-center text-white">Access denied. Admin or Manager role required.</div>
      </div>
    );
  }

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleAddRole = async () => {
    if (!newRole.trim()) {
      toast.error("Role name required");
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error("At least one permission required");
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
        body: JSON.stringify({
          name: newRole,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setRoles((prev) => [...prev, data.data]);
      setNewRole("");
      setSelectedPermissions([]);
      toast.success("Role created successfully");
    } catch (err: any) {
      toast.error(err.message || "Create failed");
    }
  };

  const handleUpdateRole = async (id: number) => {
    if (!isAdmin()) {
      toast.error("Only admin can update roles");
      return;
    }

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setRoles((prev) =>
        prev.map((r) => (r.id === id ? { ...r, name: editingName } : r)),
      );

      setEditingId(null);
      setEditingName("");
      toast.success("Role updated successfully");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!isAdmin()) {
      toast.error("Only admin can delete roles");
      return;
    }

    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/roles/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setRoles((prev) => prev.filter((r) => r.id !== id));
      toast.success("Role deleted successfully");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBackToDashboard = () => {
  
    window.dispatchEvent(new Event('dashboard-refresh'));
    router.push("/dashboard");
  };

  
  const getCurrentUserRole = () => {
    const currentUser = allUsers.find(u => u.id === loggedInUser.id);
    if (currentUser) {
      return getRoleName(currentUser.role_id);
    }
    return loggedInUser.role; 
  };

  return (
    <div className="w-full max-w-300 mx-auto p-6 bg-black min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={handleBackToDashboard}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <FaUserShield className="text-4xl text-purple-400" />
        <h1 className="text-2xl font-bold text-white">
         Roles Management
          {!isAdmin() && (
            <span className="text-sm text-gray-400 block">
              ({getCurrentUserRole()} - Create roles only)
            </span>
          )}
        </h1>
      </div>

      <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Create New Role
        </h2>

        <input
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          placeholder="Enter role name (e.g., superadmin, editor)"
          className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mb-4"
        />

        <div className="mb-4">
          <h3 className="text-white mb-3">Select Permissions:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FIXED_PERMISSIONS.map((permission) => (
              <label
                key={permission.id}
                className="flex items-center gap-3 text-white cursor-pointer bg-gray-800/50 p-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={() => handlePermissionToggle(permission.id)}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium">{permission.name}</span>
              </label>
            ))}
          </div>

          {selectedPermissions.length > 0 && (
            <div className="mt-3 p-3 bg-purple-500/10 rounded-lg">
              <p className="text-purple-300 text-sm">
                Selected: {selectedPermissions.length} permission
                {selectedPermissions.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleAddRole}
          disabled={!newRole.trim() || selectedPermissions.length === 0}
          className="bg-purple-500/20 text-purple-400 px-6 py-3 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Role
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
                      <LuSave className="text-green-400 text-xl hover:text-green-300" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingName("");
                      }}
                    >
                      <TbEyeCancel className="text-red-400 text-xl hover:text-red-300" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {role.name}
                  </h3>

                  <div className="flex justify-end gap-4 mt-4">
                    {isAdmin() ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(role.id);
                            setEditingName(role.name);
                          }}
                        >
                          <MdEdit className="text-blue-400 text-xl hover:text-blue-300" />
                        </button>

                        <button onClick={() => handleDeleteRole(role.id)}>
                          <MdDelete className="text-red-400 text-xl hover:text-red-300" />
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-500 text-sm">View only</span>
                    )}
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