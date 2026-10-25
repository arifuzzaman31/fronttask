"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", body: "" });
  const [postForm, setPostForm] = useState({ title: "", body: "" });
  const [edit, setEdit] = useState<any>(null);
  const [editPost, setEditPost] = useState<any>(null);
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) { router.push("/"); return; }
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    loadNotes();
    loadPosts();
    if (u && JSON.parse(u).role === "admin") {
      loadAllNotes();
      loadUsers();
    }
  }, []);

  const loadNotes = async () => {
    const res = await fetch(`${API}/api/notes`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setNotes(data.data || []);
  };

  const loadAllNotes = async () => {
    const res = await fetch(`${API}/api/admin/notes`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAllNotes(data.data || []);
  };

  const loadUsers = async () => {
    const res = await fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setUsers(data.data || []);
  };

  const loadPosts = async () => {
    const res = await fetch(`${API}/api/posts`);
    const data = await res.json();
    setPosts(data.data || []);
  };

  const createNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm({ title: "", body: "" }); loadNotes(); if (user?.role === "admin") loadAllNotes(); }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(postForm),
    });
    if (res.ok) { setPostForm({ title: "", body: "" }); loadPosts(); }
  };

  const updatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/posts/${editPost._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: editPost.title, body: editPost.body }),
    });
    if (res.ok) { setEditPost(null); loadPosts(); }
  };

  const deletePost = async (id: string) => {
    const res = await fetch(`${API}/api/posts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { loadPosts(); }
  };

  const updateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/notes/${edit._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: edit.title, body: edit.body }),
    });
    if (res.ok) { setEdit(null); loadNotes(); if (user?.role === "admin") loadAllNotes(); }
  };

  const deleteNote = async (id: string) => {
    const res = await fetch(`${API}/api/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { loadNotes(); if (user?.role === "admin") loadAllNotes(); }
  };

  const logout = () => { localStorage.clear(); router.push("/"); };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notes App</h1>
          <div className="flex items-center gap-4">
            <span>{user?.name} ({user?.role})</span>
            <button onClick={logout} className="bg-gray-200 px-3 py-1 rounded">Logout</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="font-bold mb-2">Create Note</h2>
          <form onSubmit={createNote} className="space-y-2">
            <input className="w-full border p-2 rounded" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="w-full border p-2 rounded" placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
          </form>
        </div>

        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="font-bold mb-2">Create Post</h2>
          <form onSubmit={createPost} className="space-y-2">
            <input className="w-full border p-2 rounded" placeholder="Title" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} required />
            <textarea className="w-full border p-2 rounded" placeholder="Body" value={postForm.body} onChange={(e) => setPostForm({ ...postForm, body: e.target.value })} />
            <button className="bg-purple-600 text-white px-4 py-2 rounded">Create Post</button>
          </form>
        </div>

        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="font-bold mb-2">My Notes</h2>
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n._id} className="border p-3 rounded flex justify-between">
                <div>
                  <h3 className="font-semibold">{n.title}</h3>
                  <p className="text-sm text-gray-600">{n.body}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEdit(n)} className="text-blue-600">Edit</button>
                  <button onClick={() => deleteNote(n._id)} className="text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="font-bold mb-2">Posts (Public Feed)</h2>
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p._id} className="border p-3 rounded flex justify-between">
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-sm text-gray-600">{p.body}</p>
                  <p className="text-xs text-gray-400">by {p.author}</p>
                </div>
                {user && p.author === user._id && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditPost(p)} className="text-blue-600">Edit</button>
                    <button onClick={() => deletePost(p._id)} className="text-red-600">Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {editPost && (
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="font-bold mb-2">Edit Post</h2>
            <form onSubmit={updatePost} className="space-y-2">
              <input className="w-full border p-2 rounded" value={editPost.title} onChange={(e) => setEditPost({ ...editPost, title: e.target.value })} />
              <textarea className="w-full border p-2 rounded" value={editPost.body} onChange={(e) => setEditPost({ ...editPost, body: e.target.value })} />
              <div className="flex gap-2">
                <button className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" onClick={() => setEditPost(null)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {edit && (
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="font-bold mb-2">Edit Note</h2>
            <form onSubmit={updateNote} className="space-y-2">
              <input className="w-full border p-2 rounded" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
              <textarea className="w-full border p-2 rounded" value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
              <div className="flex gap-2">
                <button className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" onClick={() => setEdit(null)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {user?.role === "admin" && (
          <>
            <div className="bg-white p-4 rounded shadow mb-6">
              <h2 className="font-bold mb-2">All Notes (Admin)</h2>
              <div className="space-y-2">
                {allNotes.map((n) => (
                  <div key={n._id} className="border p-3 rounded">
                    <h3 className="font-semibold">{n.title}</h3>
                    <p className="text-sm text-gray-600">{n.body}</p>
                    <p className="text-xs text-gray-400">owner: {n.owner}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-bold mb-2">Users (Admin)</h2>
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u._id} className="border p-3 rounded flex justify-between">
                    <div>
                      <p className="font-semibold">{u.name} ({u.email})</p>
                      <p className="text-sm text-gray-600">role: {u.role} | interests: {(u.interests||[]).join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
