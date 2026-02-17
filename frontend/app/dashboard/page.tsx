/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdDelete, MdOutlineSettings } from "react-icons/md";
import { LiaUserEditSolid } from "react-icons/lia";
import { toast } from "react-toastify";
import { IoIosPersonAdd } from "react-icons/io";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import Modal from "../_components/Modal";
import StatCard from "../_components/StatCard";
import { LuSave } from "react-icons/lu";
import { TbEyeCancel } from "react-icons/tb";

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

interface NewUser {
  name: string;
  email: string;
  password: string;
  role_id: number;
}

interface ProfileEdit {
  name: string;
  email: string;
  password?: string;
}

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
}

const API_URL = "http://localhost:5000";

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
console.log("Calling permissions for user:", getUser());

const getUserPermissions = async (): Promise<Permission[]> => {
  try {
    const token = getToken();
    if (!token) return [];

    const res = await fetch(`${API_URL}/users/permissions/${getUser()?.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return [];
    console.log("User from localStorage:", getUser());

    const response = await res.json();
    console.log("User permissions:", response);

    return response.data || [];
  } catch {
    return [];
  }
};

const hasPermission = (
  permissions: Permission[] | undefined,
  resource: string,
  action: string,
) => {
  if (!Array.isArray(permissions)) {
    
    return false;
  }

  return permissions.some(
    (permission) =>
      permission.resource?.toLowerCase() === resource.toLowerCase() &&
      permission.action?.toLowerCase() === action.toLowerCase(),
  );
};

const hasAnyPermission = (
  permissions: Permission[],
  resource: string,
  actions: string[],
): boolean => {
  return actions.some((action) => hasPermission(permissions, resource, action));
};

const canPerformActionOnUser = (
  permissions: Permission[],
  targetUser: User,
  action: string,
  roles: Role[],
  isAdmin: boolean,
) => {
  if (isAdmin) return true;

  const userRole =
    roles.find((r) => r.id === targetUser.role_id)?.name.toLowerCase() || "";
  if (
    hasPermission(permissions, "users", action) ||
    hasPermission(permissions, "user", action)
  ) {
    return true;
  }

  return hasPermission(permissions, userRole, action);
};

const getAvailableRolesForAction = (
  permissions: Permission[],
  roles: Role[],
  action: string,
  isAdmin: boolean,
): Role[] => {
  if (isAdmin) return roles;

  return roles.filter((role) => {
    const roleName = role.name.toLowerCase();

    return (
      hasPermission(permissions, roleName, action) ||
      hasPermission(permissions, "users", action) ||
      hasPermission(permissions, "user", action)
    );
  });
};

export default function Page() {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState(getUser());

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempRoleId, setTempRoleId] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<any>({});

  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    email: "",
    password: "password",
    role_id: 40,
  });

  const [profileEdit, setProfileEdit] = useState<ProfileEdit>({
    name: "",
    email: "",
    password: "",
  });

  const getRoleName = (roleId: number) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  const isCurrentUserAdmin = () => {
    if (!loggedInUser || roles.length === 0) return false;

    if (loggedInUser.role && loggedInUser.role.toLowerCase() === "admin") {
      return true;
    }

    const userRole = getRoleName(loggedInUser.role_id).toLowerCase();
    return userRole === "admin";
  };

  const canCreateUsers = () => {
    if (isCurrentUserAdmin()) return true;

    return getCreateableRoles().length > 0;
  };
  const canReadUsers = () => {
    if (isCurrentUserAdmin()) return true;

    return (
      hasPermission(userPermissions, "users", "read") ||
      hasPermission(userPermissions, "user", "read")
    );
  };

  const canUpdateUsers = () => {
    if (isCurrentUserAdmin()) return true;

    return (
      hasPermission(userPermissions, "users", "update") ||
      hasPermission(userPermissions, "user", "update")
    );
  };

  const canDeleteUsers = () => {
    if (isCurrentUserAdmin()) return true;

    return (
      hasPermission(userPermissions, "users", "delete") ||
      hasPermission(userPermissions, "user", "delete")
    );
  };

  const canManageRoles = () => {
    if (isCurrentUserAdmin()) return true;
    return (
      hasAnyPermission(userPermissions, "role", [
        "create",
        "read",
        "update",
        "delete",
      ]) ||
      hasAnyPermission(userPermissions, "roles", [
        "create",
        "read",
        "update",
        "delete",
      ])
    );
  };

  const canEditSpecificUser = (user: User) => {
    return canPerformActionOnUser(
      userPermissions,
      user,
      "update",
      roles,
      isCurrentUserAdmin(),
    );
  };

  const canDeleteSpecificUser = (user: User) => {
    return canPerformActionOnUser(
      userPermissions,
      user,
      "delete",
      roles,
      isCurrentUserAdmin(),
    );
  };

  const canViewSpecificUser = (user: User) => {
    return canPerformActionOnUser(
      userPermissions,
      user,
      "read",
      roles,
      isCurrentUserAdmin(),
    );
  };

  const getCreateableRoles = () => {
    return getAvailableRolesForAction(
      userPermissions,
      roles,
      "create",
      isCurrentUserAdmin(),
    );
  };

  const getEditableRoles = (currentUser: User) => {
    return getAvailableRolesForAction(
      userPermissions,
      roles,
      "update",
      isCurrentUserAdmin(),
    );
  };

  const refreshData = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const [usersRes, rolesRes, permissions] = await Promise.all([
        fetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),

        fetch(`${API_URL}/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),

        getUserPermissions(),
      ]);

      const allUsersData = Array.isArray(usersRes?.data?.data)
        ? usersRes.data.data
        : [];

      // console.log("usersRes FULL:", usersRes);

      const rolesData = Array.isArray(rolesRes?.data) ? rolesRes.data : [];

      const safePermissions = Array.isArray(permissions) ? permissions : [];
      // console.log("All Users:", allUsersData);
      // console.log("Permissions:", permissions);
      // console.log("Roles:", rolesData);

      setRoles(rolesData);
      setUserPermissions(safePermissions);

      if (isCurrentUserAdmin()) {
        setAllUsers(allUsersData);
      } else {
        const visibleUsers = allUsersData.filter((targetUser: User) => {
          const result = canPerformActionOnUser(
            safePermissions,
            targetUser,
            "read",
            rolesData,
            false,
          );
          console.log("Manager Permissions:", safePermissions);

          // console.log("Target User:", targetUser);
          // console.log("Permissions:", permissions);
          // console.log("Result:", result);
          // console.log("CurrentUser:", loggedInUser);
          // console.log("Permissions:", permissions);

          // console.log("User:", targetUser.name, "Visible:", result);
          return result;
        });
        setAllUsers(visibleUsers);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  const hasSettingsAccess = () => {
    return canManageRoles();
  };

  const isAdmin = () => {
    return isCurrentUserAdmin();
  };

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      localStorage.clear();
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

      getUserPermissions(),
    ])
      .then(([usersRes, rolesRes, permissions]) => {
        const allUsersData = Array.isArray(usersRes?.data?.data)
          ? usersRes.data.data
          : [];

        const rolesData = Array.isArray(rolesRes?.data) ? rolesRes.data : [];

        const safePermissions = Array.isArray(permissions) ? permissions : [];

        setRoles(rolesData);
        setUserPermissions(safePermissions);

        const currentUserRole =
          user.role?.toLowerCase() ||
          rolesData
            .find((r: { id: any }) => r.id === user.role_id)
            ?.name?.toLowerCase() ||
          "";

        const isAdminUser = currentUserRole === "admin";

        if (isAdminUser) {
          setAllUsers(allUsersData);
        } else {
          const visibleUsers = allUsersData.filter((targetUser: User) =>
            canPerformActionOnUser(
              safePermissions,
              targetUser,
              "read",
              rolesData,
              false,
            ),
          );
          setAllUsers(visibleUsers);
        }

        setLoading(false);
      })

      .catch(() => {
        toast.error("Failed to load data");
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    const handleFocus = () => {
      refreshData();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    const createableRoles = getCreateableRoles();
    if (
      createableRoles.length > 0 &&
      !createableRoles.find((r) => r.id === newUser.role_id)
    ) {
      setNewUser((prev) => ({ ...prev, role_id: createableRoles[0].id }));
    }
  }, [userPermissions, roles]);

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!loggedInUser) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully!", { position: "top-center" });
    router.replace("/auth/login");
  };

  const handleSettings = async () => {
    await refreshData();

    if (hasSettingsAccess()) {
      router.push("/settings");
    } else {
      toast.error("Access denied. Required permissions not found.");
    }
  };

  const handleEditProfile = () => {
    setProfileEdit({
      name: loggedInUser.name,
      email: loggedInUser.email,
      password: "",
    });
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async () => {
    try {
      const token = getToken();
      const updateData: any = {
        name: profileEdit.name,
        email: profileEdit.email,
      };

      if (profileEdit.password && profileEdit.password.trim()) {
        updateData.password = profileEdit.password;
      }

      const res = await fetch(`${API_URL}/users/${loggedInUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const updatedUser = { ...loggedInUser, ...updateData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setLoggedInUser(updatedUser);

      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === loggedInUser.id
            ? { ...u, name: profileEdit.name, email: profileEdit.email }
            : u,
        ),
      );

      toast.success("Profile updated successfully");
      setShowProfileModal(false);
      setErrors({});
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleAddUser = async () => {
    try {
      const token = getToken();

      const createableRoles = getCreateableRoles();
      if (!createableRoles.find((r) => r.id === newUser.role_id)) {
        toast.error("You don't have permission to create users with this role");
        return;
      }

      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await refreshData();

      toast.success("User added successfully");
      setShowAddModal(false);

      const firstAvailableRole =
        createableRoles.length > 0 ? createableRoles[0].id : 40;
      setNewUser({
        name: "",
        email: "",
        password: "password",
        role_id: firstAvailableRole,
      });
    } catch (err: any) {
      toast.error(err.message || "Add failed");
    }
  };

  const handleEditUser = async (index: number) => {
    try {
      const token = getToken();
      if (!token) return;

      const user = allUsers[index];

      if (!user || !user.id) {
        toast.error("Invalid user");
        return;
      }

      const editableRoles = getEditableRoles(user);
      if (!editableRoles.find((r) => r.id === tempRoleId)) {
        toast.error("You don't have permission to assign this role");
        return;
      }

      const userId = Number(user.id);
      if (Number.isNaN(userId)) {
        toast.error("Invalid user id");
        return;
      }

      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role_id: Number(tempRoleId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setAllUsers((prev) =>
        prev.map((u, i) =>
          i === index ? { ...u, role_id: Number(tempRoleId) } : u,
        ),
      );

      toast.success("Role updated successfully");
      setEditingIndex(null);
    } catch (err: any) {
      toast.error(err.message || "Edit failed");
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteIndex === null) return;

    try {
      const token = getToken();
      const userId = allUsers[deleteIndex].id;

      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");

      setAllUsers((prev) => prev.filter((_, i) => i !== deleteIndex));
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setDeleteIndex(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const roleStats = roles.map((role) => ({
    title: `${role.name}s`,
    value: allUsers.filter((u) => u.role_id === role.id).length,
    color: "",
  }));

  const getCurrentUserRole = () => {
    const currentUser = allUsers.find((u) => u.id === loggedInUser.id);
    if (currentUser) {
      return getRoleName(currentUser.role_id);
    }
    return loggedInUser.role;
  };

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <FaUserCircle
            className="text-5xl text-gray-400 cursor-pointer"
            onClick={handleEditProfile}
          />

          <div>
            <h1 className="text-2xl">Welcome {loggedInUser?.name}</h1>
            <p className="text-purple-400 capitalize">{getCurrentUserRole()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canCreateUsers() && getCreateableRoles().length > 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-lg hover:bg-yellow-500/20 transition-colors"
            >
              <IoIosPersonAdd /> Add User
            </button>
          )}

          {hasSettingsAccess() && (
            <button
              onClick={handleSettings}
              className="flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-lg hover:bg-green-500/20 transition-colors"
            >
              <MdOutlineSettings />
              Roles
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg transition-all"
            title="Logout"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {canReadUsers() && (
          <StatCard title="Total Users" value={allUsers.length} color="" />
        )}
        {roleStats.slice(0, 3).map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allUsers.map((u, index) => {
          const canEdit = canEditSpecificUser(u);
          const canDelete = canDeleteSpecificUser(u);

          return (
            <div
              key={u.id}
              className="border border-gray-700 rounded-lg p-4 bg-gray-900/40"
            >
              <h3 className="font-semibold">{u.name}</h3>
              <p className="text-gray-400 text-sm">{u.email}</p>

              <div className="mt-2">
                <span className="text-xs capitalize text-purple-400">
                  {getRoleName(u.role_id)}
                </span>
                {editingIndex === index && canEdit && (
                  <select
                    value={tempRoleId}
                    onChange={(e) => setTempRoleId(Number(e.target.value))}
                    className="mt-2 w-full bg-black border border-gray-600 text-white p-1 rounded"
                  >
                    {getEditableRoles(u).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {(canEdit || canDelete) && (
                <div className="flex justify-end gap-3 mt-3">
                  {editingIndex === index ? (
                    <>
                      {canEdit && (
                        <button
                          onClick={() => handleEditUser(index)}
                          className="hover:scale-110 transition-transform"
                        >
                          <LuSave className="text-green-400" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingIndex(null);
                          setTempRoleId(u.role_id);
                        }}
                        className="hover:scale-110 transition-transform"
                      >
                        <TbEyeCancel className="text-red-400" />
                      </button>
                    </>
                  ) : (
                    <>
                      {canEdit && getEditableRoles(u).length > 0 && (
                        <button
                          onClick={() => {
                            setEditingIndex(index);
                            setTempRoleId(u.role_id);
                            const isDisabled =
                              !canEdit || getEditableRoles(u).length === 0;

                            <button
                              onClick={() => {
                                if (isDisabled) return;
                                setEditingIndex(index);
                                setTempRoleId(u.role_id);
                              }}
                              disabled={isDisabled}
                              title={
                                !canEdit
                                  ? "You don't have permission"
                                  : getEditableRoles(u).length === 0
                                    ? "No roles available to assign"
                                    : "Edit role"
                              }
                              className={`transition-transform ${
                                isDisabled
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:scale-110"
                              }`}
                            >
                              <LiaUserEditSolid className="text-blue-400" />
                            </button>;
                          }}
                          className="hover:scale-110 transition-transform"
                        >
                          <LiaUserEditSolid className="text-blue-400" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => {
                            setDeleteIndex(index);
                            setShowDeleteModal(true);
                          }}
                          className="hover:scale-110 transition-transform"
                        >
                          <MdDelete className="text-red-400" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="bg-gray-900 p-6 rounded-xl text-white">
          <h2 className="text-xl font-bold mb-4">Add New User</h2>

          <div className="space-y-4">
            <input
              placeholder="Full Name"
              value={newUser.name}
              className="w-full p-3 border border-gray-600 rounded-lg bg-black text-white"
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />

            <input
              placeholder="Email Address"
              type="email"
              value={newUser.email}
              className="w-full p-3 border border-gray-600 rounded-lg bg-black text-white"
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />

            <input
              placeholder="Password"
              type="password"
              value={newUser.password}
              className="w-full p-3 border border-gray-600 rounded-lg bg-black text-white"
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
            />

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={newUser.role_id}
                onChange={(e) =>
                  setNewUser({ ...newUser, role_id: Number(e.target.value) })
                }
                className="w-full p-3 border border-gray-600 rounded-lg bg-black text-white"
              >
                <option value="">Select Role</option>
                {getCreateableRoles().map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>

              {isCurrentUserAdmin() ? (
                <p className="text-green-400 text-xs mt-1">
                  Admin: All roles available
                </p>
              ) : (
                <p className="text-blue-400 text-xs mt-1">
                  Available roles based on your permissions:{" "}
                  {getCreateableRoles()
                    .map((r) => r.name)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddUser}
              disabled={
                !newUser.role_id ||
                getCreateableRoles().length === 0 ||
                !newUser.name ||
                !newUser.email
              }
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add User
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="bg-gray-900 p-6 rounded-xl text-white">
          <h2 className="text-xl font-bold mb-4">Delete User</h2>
          <p className="mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-red-400">
              {deleteIndex !== null ? allUsers[deleteIndex]?.name : ""}
            </span>
            ? This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteIndex(null);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      >
        <div className="bg-gray-900 p-6 rounded-xl text-white">
          <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                value={profileEdit.name}
                className="w-full p-3 border border-gray-600 rounded-lg bg-black text-white"
                onChange={(e) =>
                  setProfileEdit({ ...profileEdit, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profileEdit.email}
                className="w-full p-3 border border-gray-600 rounded-lg bg-black text-white"
                onChange={(e) =>
                  setProfileEdit({ ...profileEdit, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={profileEdit.password}
                placeholder="Enter new password"
                className="w-full p-3 border border-gray-600 rounded-lg bg-black text-white"
                onChange={(e) =>
                  setProfileEdit({ ...profileEdit, password: e.target.value })
                }
              />
            </div>

            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-400">
                <strong>Current Role:</strong>{" "}
                <span className="text-purple-400 capitalize">
                  {getCurrentUserRole()}
                </span>
                {isCurrentUserAdmin() && (
                  <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                    ADMIN
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isCurrentUserAdmin()
                  ? "You have full administrative access"
                  : "Role can only be changed by authorized users"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleUpdateProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Update Profile
            </button>
            <button
              onClick={() => setShowProfileModal(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
