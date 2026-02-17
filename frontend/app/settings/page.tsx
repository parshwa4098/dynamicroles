"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  FaUserShield,
  FaArrowLeft,
  FaKey,
  FaChevronDown,
} from "react-icons/fa";
import { MdDelete, MdEdit, MdAdd, MdClose } from "react-icons/md";

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
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [activeTab, setActiveTab] = useState<"roles" | "permissions">("roles");

  const [newRole, setNewRole] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const [isRoleEditMode, setIsRoleEditMode] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [newPermission, setNewPermission] = useState("");
  const [editingPermissionId, setEditingPermissionId] = useState<number | null>(
    null,
  );
  const [editingPermissionName, setEditingPermissionName] = useState("");
  const [isPermissionEditMode, setIsPermissionEditMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "role" | "permission";
    item: Role | Permission;
  } | null>(null);

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

      fetch(`${API_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch permissions");
        return res.json();
      }),
    ])
      .then(([usersRes, rolesRes, permissionsRes]) => {
        const usersData = Array.isArray(usersRes?.data?.data)
          ? usersRes.data.data
          : Array.isArray(usersRes?.data)
            ? usersRes.data
            : [];

        setAllUsers(usersData);

        setRoles(rolesRes.data || []);

        const permissionsData =
          permissionsRes.data?.data || permissionsRes.data || [];
        setPermissions(permissionsData);

        setLoading(false);
      })
      .catch((error) => {
        console.error("Data loading error:", error);
        toast.error("Failed to load data");
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".permissions-dropdown")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const removePermission = (permissionId: number) => {
    setSelectedPermissions((prev) => prev.filter((id) => id !== permissionId));
  };

  const getSelectedPermissionNames = () => {
    return permissions
      .filter((p) => selectedPermissions.includes(p.id))
      .map((p) => p.name);
  };
  const refetchPermissions = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch permissions");

      const permissionsRes = await res.json();
      const permissionsData =
        permissionsRes.data?.data || permissionsRes.data || [];
      setPermissions(permissionsData);
    } catch (error) {
      console.error("Failed to refetch permissions:", error);
    }
  };

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
        body: JSON.stringify({
          name: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create role");

      setRoles((prev) => [...prev, data.data]);

      await refetchPermissions();

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

    if (!editingRoleName.trim()) {
      toast.error("Role name cannot be empty");
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error("At least one permission required");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/roles/${editingRoleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingRoleName.trim(),
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingRoleId
            ? {
                ...r,
                name: editingRoleName.trim(),
                permissions: permissions.filter((p) =>
                  selectedPermissions.includes(p.id),
                ),
              }
            : r,
        ),
      );

      setIsRoleEditMode(false);
      setEditingRoleId(null);
      setEditingRoleName("");
      setNewRole("");
      setSelectedPermissions([]);
      toast.success("Role updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleEditRole = (role: Role) => {
    setIsRoleEditMode(true);
    setEditingRoleId(role.id);
    setEditingRoleName(role.name);
    setNewRole(role.name);
    setSelectedPermissions(role.permissions?.map((p) => p.id) || []);
  };

  const handleCancelRoleEdit = () => {
    setIsRoleEditMode(false);
    setEditingRoleId(null);
    setEditingRoleName("");
    setNewRole("");
    setSelectedPermissions([]);
  };

  const handleAddPermission = async () => {
    if (!newPermission.trim()) {
      toast.error("Permission name required");
      return;
    }

    const tempPermission = {
      id: Date.now(),
      name: newPermission.trim(),
    };

    setPermissions((prev) => [...prev, tempPermission]);
    const permissionName = newPermission.trim();
    setNewPermission("");

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: permissionName,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to create permission");

      const newPermissionData = data.data?.data || data.data || data;

      setPermissions((prev) =>
        prev.map((p) => (p.id === tempPermission.id ? newPermissionData : p)),
      );

      toast.success("Permission created successfully");
    } catch (err: any) {
      setPermissions((prev) => prev.filter((p) => p.id !== tempPermission.id));
      toast.error(err.message || "Create failed");
    }
  };

  const handleEditPermission = (permission: Permission) => {
    setIsPermissionEditMode(true);
    setEditingPermissionId(permission.id);
    setEditingPermissionName(permission.name);
    setNewPermission(permission.name);
  };

  const handleUpdatePermission = async () => {
    if (!isAdmin()) {
      toast.error("Only admin can update permissions");
      return;
    }

    if (!editingPermissionName.trim()) {
      toast.error("Permission name cannot be empty");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/permissions/${editingPermissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingPermissionName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setPermissions((prev) =>
        prev.map((p) =>
          p.id === editingPermissionId
            ? { ...p, name: editingPermissionName.trim() }
            : p,
        ),
      );

      setIsPermissionEditMode(false);
      setEditingPermissionId(null);
      setEditingPermissionName("");
      setNewPermission("");
      toast.success("Permission updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleCancelPermissionEdit = () => {
    setIsPermissionEditMode(false);
    setEditingPermissionId(null);
    setEditingPermissionName("");
    setNewPermission("");
  };

  const handleDeleteClick = (
    type: "role" | "permission",
    item: Role | Permission,
  ) => {
    if (!isAdmin()) {
      toast.error("Only admin can delete items");
      return;
    }

    if (type === "role") {
      const usersWithRole = allUsers.filter((user) => user.role_id === item.id);
      if (usersWithRole.length > 0) {
        toast.error(
          `Cannot delete role. ${usersWithRole.length} user(s) still have this role.`,
        );
        return;
      }
    }

    setItemToDelete({ type, item });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const token = getToken();
      const endpoint = itemToDelete.type === "role" ? "roles" : "permissions";

      const res = await fetch(
        `${API_URL}/${endpoint}/${itemToDelete.item.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      if (itemToDelete.type === "role") {
        setRoles((prev) => prev.filter((r) => r.id !== itemToDelete.item.id));
      } else {
        setPermissions((prev) =>
          prev.filter((p) => p.id !== itemToDelete.item.id),
        );
      }

      toast.success(
        `${itemToDelete.type === "role" ? "Role" : "Permission"} deleted successfully`,
      );
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleBackToDashboard = () => {
    window.dispatchEvent(new Event("dashboard-refresh"));
    router.push("/dashboard");
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
              ({getCurrentUserRole()} - Limited access)
            </span>
          )}
        </h1>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === "roles"
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-gray-800/50 text-gray-400 hover:text-white"
          }`}
        >
          <FaUserShield className="inline mr-2" />
          Roles
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === "permissions"
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-gray-800/50 text-gray-400 hover:text-white"
          }`}
        >
          <FaKey className="inline mr-2" />
          Permissions
        </button>
      </div>

      {activeTab === "roles" && (
        <>
          <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {isRoleEditMode ? "Edit Role" : "Create New Role"}
            </h2>

            <input
              value={isRoleEditMode ? editingRoleName : newRole}
              onChange={(e) =>
                isRoleEditMode
                  ? setEditingRoleName(e.target.value)
                  : setNewRole(e.target.value)
              }
              placeholder="Enter role name"
              className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mb-4"
            />

            <div className="mb-4">
              <h3 className="text-white mb-3">Select Permissions:</h3>

              <div className="permissions-dropdown relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white flex items-center justify-between hover:border-gray-600 transition-colors"
                >
                  <span className="text-gray-400">
                    {selectedPermissions.length === 0
                      ? "Select permissions..."
                      : `${selectedPermissions.length} permission${selectedPermissions.length > 1 ? "s" : ""} selected`}
                  </span>
                  <FaChevronDown
                    className={`text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {permissions.length === 0 ? (
                      <div className="p-3 text-gray-400 text-center">
                        No permissions available
                      </div>
                    ) : (
                      permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(
                              permission.id,
                            )}
                            onChange={() =>
                              handlePermissionToggle(permission.id)
                            }
                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-white text-sm">
                            {permission.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedPermissions.length > 0 && (
                <div className="mt-3 p-3 bg-purple-500/10 rounded-lg">
                  <p className="text-purple-300 text-sm mb-2">
                    Selected permissions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedPermissionNames().map(
                      (permissionName, index) => {
                        const permissionId = permissions.find(
                          (p) => p.name === permissionName,
                        )?.id;
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md text-xs"
                          >
                            {permissionName}
                            <button
                              onClick={() =>
                                permissionId && removePermission(permissionId)
                              }
                              className="hover:text-purple-100 ml-1"
                            >
                              <MdClose className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {isRoleEditMode ? (
                <>
                  <button
                    onClick={handleUpdateRole}
                    disabled={
                      !editingRoleName.trim() ||
                      selectedPermissions.length === 0
                    }
                    className="bg-green-500/20 text-green-400 px-6 py-3 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Role
                  </button>
                  <button
                    onClick={handleCancelRoleEdit}
                    className="bg-red-500/20 text-red-400 px-6 py-3 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddRole}
                  disabled={!newRole.trim()}
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
                  <h3 className="text-lg font-semibold text-white capitalize mb-2">
                    {role.name}
                  </h3>

                  <div className="flex justify-end gap-4 mt-4">
                    {isAdmin() ? (
                      <>
                        <button
                          onClick={() => handleEditRole(role)}
                          disabled={isRoleEditMode}
                          className="disabled:opacity-50"
                        >
                          <MdEdit className="text-blue-400 text-xl hover:text-blue-300" />
                        </button>

                        <button
                          onClick={() => handleDeleteClick("role", role)}
                          disabled={isRoleEditMode}
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
        </>
      )}

      {activeTab === "permissions" && (
        <>
          <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {isPermissionEditMode
                ? "Edit Permission"
                : "Create New Permission"}
            </h2>

            <div className="flex gap-3">
              <input
                value={
                  isPermissionEditMode ? editingPermissionName : newPermission
                }
                onChange={(e) =>
                  isPermissionEditMode
                    ? setEditingPermissionName(e.target.value)
                    : setNewPermission(e.target.value)
                }
                placeholder="Enter permission name"
                className="flex-1 bg-black border border-gray-700 p-3 rounded-lg text-white"
              />

              {isPermissionEditMode ? (
                <>
                  <button
                    onClick={handleUpdatePermission}
                    disabled={!editingPermissionName.trim()}
                    className="bg-green-500/20 text-green-400 px-6 py-3 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update
                  </button>
                  <button
                    onClick={handleCancelPermissionEdit}
                    className="bg-red-500/20 text-red-400 px-6 py-3 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddPermission}
                  disabled={!newPermission.trim()}
                  className="bg-purple-500/20 text-purple-400 px-6 py-3 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdAdd className="inline mr-1" />
                  Add
                </button>
              )}
            </div>
          </div>

          {permissions.length === 0 ? (
            <div className="text-gray-500 text-center py-10 border border-gray-800 rounded-xl">
              No permissions found
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="border border-gray-700 rounded-xl p-5 bg-gray-900/40"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {permission.name}
                  </h3>

                  <div className="flex justify-end gap-4 mt-4">
                    {isAdmin() ? (
                      <>
                        <button
                          onClick={() => handleEditPermission(permission)}
                          disabled={isPermissionEditMode}
                          className="disabled:opacity-50"
                        >
                          <MdEdit className="text-blue-400 text-xl hover:text-blue-300" />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteClick("permission", permission)
                          }
                          disabled={isPermissionEditMode}
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
        </>
      )}

      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Delete {itemToDelete.type === "role" ? "Role" : "Permission"}
            </h3>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the {itemToDelete.type}{" "}
              <span className="text-red-400 font-semibold">
                &quot;{itemToDelete.item.name}&quot;
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
