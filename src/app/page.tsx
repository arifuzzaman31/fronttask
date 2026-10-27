"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

const demoUsers = [
  { label: "Admin", email: "admin@notes.dev", password: "admin1234" },
  { label: "Ana", email: "ana@notes.dev", password: "ana123456" },
  { label: "Ben", email: "ben@notes.dev", password: "ben123456" },
  { label: "Chloe", email: "chloe@notes.dev", password: "chloe1234" },
];

const interestOptions = ["chess", "reading", "hiking", "ops", "music", "coding"];

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", interests: [] as string[] });
  const [error, setError] = useState("");
  const router = useRouter();

  const applyDemo = (u: typeof demoUsers[0]) => {
    setForm({ ...form, email: u.email, password: u.password });
    setIsLogin(true);
  };

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        const res = await fetch(`${API}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        if (!data.token || !data.user) throw new Error("Invalid login response");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        const res = await fetch(`${API}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, interests: form.interests }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Register failed");
        setIsLogin(true);
        setForm({ name: "", email: "", password: "", interests: [] });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ color: '#171717' }}>
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: '#171717' }}>{isLogin ? "Login" : "Register"}</h1>
        {isLogin && (
          <div className="mb-4">
            <p className="text-sm mb-2" style={{ color: '#4b5563' }}>Quick login:</p>
            <div className="flex flex-wrap gap-2">
              {demoUsers.map((u) => (
                <button key={u.email} type="button" onClick={() => applyDemo(u)} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200" style={{ color: '#111111' }}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          {!isLogin && (
            <>
              <input className="w-full border border-gray-300 bg-white p-2 rounded" style={{ color: '#171717' }} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div>
                <p className="text-sm mb-2" style={{ color: '#4b5563' }}>Interests</p>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <label key={interest} className="flex items-center gap-1 text-sm" style={{ color: '#171717' }}>
                      <input type="checkbox" checked={form.interests.includes(interest)} onChange={() => toggleInterest(interest)} />
                      {interest}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
          <input className="w-full border border-gray-300 bg-white p-2 rounded" style={{ color: '#171717' }} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="w-full border border-gray-300 bg-white p-2 rounded" style={{ color: '#171717' }} type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">{isLogin ? "Login" : "Register"}</button>
        </form>
        <p className="mt-4 text-center text-sm" style={{ color: '#171717' }}>
          {isLogin ? "No account? " : "Have account? "}
          <button className="text-blue-600" onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Register" : "Login"}</button>
        </p>
      </div>
    </div>
  );
}
