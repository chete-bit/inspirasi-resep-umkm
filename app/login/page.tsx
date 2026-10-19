"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ChefHat, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      if (isRegister) {
        // 1. Pendaftaran Akun Baru
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          // 2. Buat Profil di tabel 'profil_pengguna'
          const { error: profileError } = await supabase
            .from("profil_pengguna")
            .insert({
              id: data.user.id,
              nama_lengkap: namaLengkap || "Koki UMKM",
              username: username || email.split("@")[0],
              bio: "Pelaku UMKM kuliner | Berbagi resep yang mudah dan menguntungkan",
            });
          if (profileError) console.error("Error profile:", profileError);
        }

        alert("Pendaftaran berhasil! Silakan masuk.");
        setIsRegister(false);
      } else {
        // Login Akun
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat autentikasi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-black text-white rounded-2xl mx-auto flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {isRegister ? "Daftar Akun Baru" : "Masuk ke Dapurku"}
          </h2>
          <p className="text-xs text-gray-500">
            {isRegister
              ? "Mulai bagikan resep dan kelola HPP usaha kuliner Anda."
              : "Kelola resep, kalkulator HPP, dan jejaring komunitas UMKM."}
          </p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleAuth} className="space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {isRegister && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bu Siti"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required={isRegister}
                  className="w-full bg-gray-50 border border-gray-200 text-sm px-4 py-3 rounded-xl outline-none focus:bg-white focus:border-black transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Contoh: busiti_kuliner"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={isRegister}
                  className="w-full bg-gray-50 border border-gray-200 text-sm px-4 py-3 rounded-xl outline-none focus:bg-white focus:border-black transition"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Email</label>
            <input
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 text-sm px-4 py-3 rounded-xl outline-none focus:bg-white focus:border-black transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">
              Kata Sandi
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 text-sm px-4 py-3 rounded-xl outline-none focus:bg-white focus:border-black transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white font-bold py-3.5 rounded-2xl hover:bg-gray-800 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              "Memproses..."
            ) : (
              <>
                {isRegister ? "Daftar Sekarang" : "Masuk"}{" "}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Switch */}
        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {isRegister ? "Sudah punya akun?" : "Belum memiliki akun?"}{" "}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage("");
              }}
              className="font-bold text-black hover:underline ml-1"
            >
              {isRegister ? "Masuk" : "Daftar Akun"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
