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
  permissions?: Permission[];
}

interface Permission {
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const getRoleName = (roleId: number) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  const isAdmin = () => {
    if (!loggedInUser || roles.length === 0) return false;

    const currentUser = allUsers.find(
      (u) => u.id === loggedInUser.sub || u.id === loggedInUser.id,
    );
    if (currentUser) {
      const userRole = getRoleName(currentUser.role_id).toLowerCase();
      return userRole === "admin";
    }

    return loggedInUser.role === "admin";
  };

  const getCurrentUserRole = () => {
    const currentUser = allUsers.find(
      (u) => u.id === loggedInUser.sub || u.id === loggedInUser.id,
    );
    if (currentUser) {
      return getRoleName(currentUser.role_id);
    }
    return loggedInUser.role || "Unknown";
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
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      }),

      fetch(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch roles");
        return res.json();
      }),
    ])
      .then(([usersRes, rolesRes]) => {
        setAllUsers(usersRes.data || []);
        setRoles(rolesRes.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Data loading error:", error);
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
        <div className="text-center text-white">
          Access denied. Please log in.
        </div>
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
      if (!res.ok) throw new Error(data.message || "Failed to create role");

      setRoles((prev) => [...prev, data.data]);
      setNewRole("");
      setSelectedPermissions([]);
      toast.success("Role created successfully");
    } catch (err: any) {
      toast.error(err.message || "Create failed");
    }
  };

  const handleUpdateRole = async () => {
    if (!isAdmin()) {
      toast.error("Only admin can update roles");
      return;
    }

    if (!editingName.trim()) {
      toast.error("Role name cannot be empty");
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error("At least one permission required");
      return;
    }

    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/roles/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingName.trim(),
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                name: editingName.trim(),
                permissions: FIXED_PERMISSIONS.filter((p) =>
                  selectedPermissions.includes(p.id),
                ),
              }
            : r,
        ),
      );

      // Reset to create mode
      setIsEditMode(false);
      setEditingId(null);
      setEditingName("");
      setNewRole("");
      setSelectedPermissions([]);
      toast.success("Role updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleDeleteClick = (role: Role) => {
    if (!isAdmin()) {
      toast.error("Only admin can delete roles");
      return;
    }

    const usersWithRole = allUsers.filter((user) => user.role_id === role.id);
    if (usersWithRole.length > 0) {
      toast.error(
        `Cannot delete role. ${usersWithRole.length} user(s) still have this role.`,
      );
      return;
    }

    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/roles/${roleToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
      toast.success("Role deleted successfully");
      setShowDeleteModal(false);
      setRoleToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRoleToDelete(null);
  };

  const handleBackToDashboard = () => {
    window.dispatchEvent(new Event("dashboard-refresh"));
    router.push("/dashboard");
  };

  const getRolePermissions = (role: Role) => {
    return role.permissions?.map((p) => p.id) || [];
  };

  const handleEditRole = (role: Role) => {
    setIsEditMode(true);
    setEditingId(role.id);
    setEditingName(role.name);
    setNewRole(role.name);
    setSelectedPermissions(getRolePermissions(role));
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingId(null);
    setEditingName("");
    setNewRole("");
    setSelectedPermissions([]);
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
          {isEditMode ? "Edit Role" : "Create New Role"}
        </h2>

        <input
          value={isEditMode ? editingName : newRole}
          onChange={(e) =>
            isEditMode
              ? setEditingName(e.target.value)
              : setNewRole(e.target.value)
          }
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

        <div className="flex gap-3">
          {isEditMode ? (
            <>
              <button
                onClick={handleUpdateRole}
                disabled={
                  !editingName.trim() || selectedPermissions.length === 0
                }
                className="bg-green-500/20 text-green-400 px-6 py-3 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Role
              </button>
              <button
                onClick={handleCancelEdit}
                className="bg-red-500/20 text-red-400 px-6 py-3 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleAddRole}
              disabled={!newRole.trim() || selectedPermissions.length === 0}
              className="bg-purple-500/20 text-purple-400 px-6 py-3 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Role
            </button>
          )}
        </div>
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
              <h3 className="text-lg font-semibold text-white capitalize">
                {role.name}
              </h3>

              <div className="flex justify-end gap-4 mt-4">
                {isAdmin() ? (
                  <>
                    <button
                      onClick={() => handleEditRole(role)}
                      disabled={isEditMode}
                      className="disabled:opacity-50"
                    >
                      <MdEdit className="text-blue-400 text-xl hover:text-blue-300" />
                    </button>

                    <button
                      onClick={() => handleDeleteClick(role)}
                      disabled={isEditMode}
                      className="disabled:opacity-50"
                    >
                      <MdDelete className="text-red-400 text-xl hover:text-red-300" />
                    </button>
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">View only</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && roleToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Delete Role
            </h3>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the role{" "}
              <span className="text-red-400 font-semibold">
                &quot;{roleToDelete.name}&quot;
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}