"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChefHat,
  ArrowLeft,
  Search,
  BookOpen,
  Calendar,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    try {
      const { data } = await supabase
        .from("blogs")
        .select(
          `
          *,
          profil_pengguna:penulis_id (nama_lengkap, foto_profil)
        `,
        )
        .order("created_at", { ascending: false });

      if (data) setBlogs(data);
    } catch (err) {
      console.error("Error fetching blogs:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredBlogs = blogs.filter(
    (b) =>
      b.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.konten?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 px-4 md:px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Topbar Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-black transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-xl">
              <ChefHat className="w-4 h-4" />
            </div>
            <span className="font-black text-sm text-gray-900">
              Resep UMKM Blog
            </span>
          </Link>
        </div>

        {/* Hero Header Blog */}
        <div className="bg-black text-white rounded-3xl p-8 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" /> Edukasi & Tips F&B
          </div>
          <h1 className="text-2xl md:text-3xl font-black leading-tight max-w-xl">
            Wawasan, Strategi, & Tips Sukses Bisnis Kuliner UMKM
          </h1>
          <p className="text-xs text-gray-400 max-w-lg leading-relaxed">
            Temukan panduan praktis menghitung HPP, strategi pemasaran makanan,
            hingga rahasia konsistensi rasa dari para ahli.
          </p>

          {/* Search Bar Blog */}
          <div className="pt-2 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari artikel atau tips bisnis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 text-white text-xs pl-10 pr-4 py-3 rounded-2xl outline-none focus:bg-white/20 transition placeholder:text-gray-400 font-medium border border-white/10"
              />
            </div>
          </div>
        </div>

        {/* List Grid Artikel Blog */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p className="text-xs font-bold text-gray-400 mt-2">
              Memuat artikel blog...
            </p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-2">
            <p className="text-sm font-bold text-gray-800">
              Belum ada artikel yang dipublikasikan.
            </p>
            <p className="text-xs text-gray-400">
              Kembali lagi nanti untuk membaca wawasan bisnis kuliner terbaru!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredBlogs.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Foto Artikel */}
                  <div className="h-44 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={
                        item.gambar_url ||
                        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600"
                      }
                      alt={item.judul}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <Link href={`/blog/${item.slug}`}>
                      <h3 className="font-extrabold text-sm text-gray-900 hover:underline leading-snug line-clamp-2">
                        {item.judul}
                      </h3>
                    </Link>

                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                      {item.konten}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-gray-100 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 pt-3">
                    <img
                      src={
                        item.profil_pengguna?.foto_profil ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                      }
                      className="w-5 h-5 rounded-full object-cover border"
                      alt="Penulis"
                    />
                    <span className="text-[11px] font-bold text-gray-700">
                      {item.profil_pengguna?.nama_lengkap || "Admin F&B"}
                    </span>
                  </div>

                  <Link
                    href={`/blog/${item.slug}`}
                    className="text-xs font-bold text-black hover:underline flex items-center gap-1 pt-3"
                  >
                    Baca <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
