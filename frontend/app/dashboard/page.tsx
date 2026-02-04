/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MdDelete } from "react-icons/md";
import { LiaUserEditSolid } from "react-icons/lia";
import { toast } from "react-toastify";
import { IoIosPersonAdd } from "react-icons/io";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import Modal from "../_components/Modal";
import StatCard from "../_components/StatCard";
import { LuSave } from "react-icons/lu";
import { TbEyeCancel } from "react-icons/tb";

type RoleId = 1 | 2 | 3;

interface User {
  id: number;
  name: string;
  email: string;
  role_id: RoleId;
}

interface NewUser {
  name: string;
  email: string;
  password: string;
  role_id: RoleId;
}

const API_URL = "http://localhost:5000";

const roleIdToName = (id: RoleId) =>
  id === 1 ? "admin" : id === 2 ? "manager" : "user";

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

export default function Page() {
  const router = useRouter();
  const loggedInUser = getUser();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempRoleId, setTempRoleId] = useState<RoleId>(3);

  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    email: "",
    password: "password",
    role_id: 3,
  });

  useEffect(() => {
    const token = getToken();

    if (!token || !loggedInUser) {
      localStorage.clear();
      router.push("/auth/login");
      return;
    }

    fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => setAllUsers(res.data || []))
      .catch(() => toast.error("Failed to load users"));
  }, [ router]);

  if (!loggedInUser) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully!", { position: "top-center" });
    router.push("/auth/login");
  };

  const handleAddUser = async () => {
    try {
      const token = getToken();

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

      setAllUsers((prev) => [...prev, data.data]);
      toast.success("User added");
      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err.message || "Add failed");
    }
  };

  const handleEditUser = async (index: number) => {
    try {
      const token = getToken();
      if (!token) return;

      const user = allUsers[index];
      console.log("User obj:",user);
      
      if (!user || !user.id) {
        toast.error("Invalid user");
        return;
      }

      const userId = Number(user.id)
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
          i === index ? { ...u, role_id: Number(tempRoleId) as RoleId } : u,
        ),
      );

      toast.success("Role updated");
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

      if (!res.ok) throw new Error("Delete failed");

      setAllUsers((prev) => prev.filter((_, i) => i !== deleteIndex));
      toast.success("User deleted");
      setShowDeleteModal(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <FaUserCircle className="text-5xl text-gray-400" />
          <h1 className="text-2xl">
            Welcome {loggedInUser?.name}
            <span className="text-purple-400"></span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {loggedInUser?.role === "admin" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-lg"
            >
              <IoIosPersonAdd /> Add User
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

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={allUsers.length} color="" />
        <StatCard
          title="Admins"
          value={allUsers.filter((u) => u.role_id === 1).length}
          color=""
        />
        <StatCard
          title="Managers"
          value={allUsers.filter((u) => u.role_id === 2).length}
          color=""
        />
        <StatCard
          title="Users"
          value={allUsers.filter((u) => u.role_id === 3).length}
          color=""
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {allUsers.map((u, index) => (
          <div
            key={u.id}
            className="border border-gray-700 rounded-lg p-4"
          >
            <h3 className="font-semibold">{u.name}</h3>
            <p className="text-gray-400 text-sm">{u.email}</p>

            <span className="text-xs capitalize text-purple-400">
              {roleIdToName(u.role_id)}
              {editingIndex === index && (
                <select
                  value={tempRoleId}
                  onChange={(e) =>
                    setTempRoleId(Number(e.target.value) as RoleId)
                  }
                  className="mt-2 w-full bg-black border border-gray-600 text-white p-1 rounded"
                >
                  <option value={1}>Admin</option>
                  <option value={2}>Manager</option>
                  <option value={3}>User</option>
                </select>
              )}
            </span>

            {loggedInUser?.role === "admin" && (
              <div key={u.id} className="flex justify-end gap-3 mt-3">
                {editingIndex === index ? (
                  <>
                    <button onClick={() => handleEditUser(index)}>
                      <LuSave className="text-green-400" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingIndex(null);
                        setTempRoleId(u.role_id);
                      }}
                    >
                      <TbEyeCancel className="text-red-400" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingIndex(index);
                        setTempRoleId(u.role_id);
                      }}
                    >
                      <LiaUserEditSolid />
                    </button>

                    <button
                      onClick={() => {
                        setDeleteIndex(index);
                        setShowDeleteModal(true);
                      }}
                    >
                      <MdDelete />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="bg-white p-6 rounded-xl text-black">
          <h2 className="text-xl font-bold mb-4">Add User</h2>

          <input
            placeholder="Name"
            className="w-full mb-3 p-2 border"
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <input
            placeholder="Email"
            className="w-full mb-3 p-2 border"
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <select
            className="w-full mb-4 p-2 border"
            onChange={(e) =>
              setNewUser({
                ...newUser,
                role_id: Number(e.target.value) as RoleId,
              })
            }
          >
            <option value={1}>Admin</option>
            <option value={2}>Manager</option>
            <option value={3}>User</option>
          </select>

          <button
            onClick={handleAddUser}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-xl mb-4">Delete User?</h2>
          <button
            onClick={handleDeleteConfirm}
            className="bg-red-500 px-4 py-2 rounded"
          >
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  );
}