"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

type UserSummary = { _id: string; name: string; role: string };
type Note = { _id: string; title: string; body?: string; owner?: string };
type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  interests?: string[];
};
type Post = { _id: string; title: string; body?: string; author?: string };

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const getToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

const getStoredUser = (): UserSummary | null => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (
      typeof parsed._id !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.role !== "string"
    ) {
      return null;
    }
    return { _id: parsed._id, name: parsed.name, role: parsed.role };
  } catch {
    try {
      localStorage.removeItem("user");
    } catch {}
    return null;
  }
};

const messageOf = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

const request = async (path: string, init: RequestInit = {}) => {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : `Request failed (${res.status})`
    );
  }
  return data;
};

export default function Dashboard() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState({ title: "", body: "" });
  const [postForm, setPostForm] = useState({ title: "", body: "" });
  const [edit, setEdit] = useState<Note | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const loadNotes = useCallback(async () => {
    try {
      const data = await request("/api/notes");
      setNotes(asArray<Note>(data.data));
    } catch (err) {
      setError(messageOf(err, "Could not load notes."));
    }
  }, []);

  const loadAllNotes = useCallback(async () => {
    try {
      const data = await request("/api/admin/notes");
      setAllNotes(asArray<Note>(data.data));
    } catch (err) {
      setError(messageOf(err, "Could not load all notes."));
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await request("/api/admin/users");
      setUsers(asArray<AdminUser>(data.data));
    } catch (err) {
      setError(messageOf(err, "Could not load users."));
    }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const data = await request("/api/posts");
      setPosts(asArray<Post>(data.data));
    } catch (err) {
      setError(messageOf(err, "Could not load posts."));
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {}
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(storedUser);
    void loadNotes();
    void loadPosts();
    if (storedUser.role === "admin") {
      void loadAllNotes();
      void loadUsers();
    }
  }, [router, loadNotes, loadPosts, loadAllNotes, loadUsers]);

  const createNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await request("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ title: "", body: "" });
      await loadNotes();
      if (user?.role === "admin") await loadAllNotes();
    } catch (err) {
      setError(messageOf(err, "Could not create note."));
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await request("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postForm),
      });
      setPostForm({ title: "", body: "" });
      await loadPosts();
    } catch (err) {
      setError(messageOf(err, "Could not create post."));
    }
  };

  const updatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPost) return;
    setError("");
    try {
      await request(`/api/posts/${editPost._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editPost.title, body: editPost.body }),
      });
      setEditPost(null);
      await loadPosts();
    } catch (err) {
      setError(messageOf(err, "Could not update post."));
    }
  };

  const deletePost = async (id: string) => {
    setError("");
    try {
      await request(`/api/posts/${id}`, { method: "DELETE" });
      await loadPosts();
    } catch (err) {
      setError(messageOf(err, "Could not delete post."));
    }
  };

  const updateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setError("");
    try {
      await request(`/api/notes/${edit._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: edit.title, body: edit.body }),
      });
      setEdit(null);
      await loadNotes();
      if (user?.role === "admin") await loadAllNotes();
    } catch (err) {
      setError(messageOf(err, "Could not update note."));
    }
  };

  const deleteNote = async (id: string) => {
    setError("");
    try {
      await request(`/api/notes/${id}`, { method: "DELETE" });
      await loadNotes();
      if (user?.role === "admin") await loadAllNotes();
    } catch (err) {
      setError(messageOf(err, "Could not delete note."));
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    router.replace("/");
  };

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

        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} className="font-medium">
              Dismiss
            </button>
          </div>
        )}

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
