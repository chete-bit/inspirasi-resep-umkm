"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  BookOpen,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State Kelola Banner
  const [banners, setBanners] = useState<any[]>([]);
  const [judulBanner, setJudulBanner] = useState("");
  const [deskripsiBanner, setDeskripsiBanner] = useState("");
  const [gambarBannerUrl, setGambarBannerUrl] = useState("");
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);

  // State Kelola Blog
  const [blogs, setBlogs] = useState<any[]>([]);
  const [judulBlog, setJudulBlog] = useState("");
  const [slugBlog, setSlugBlog] = useState("");
  const [kontenBlog, setKontenBlog] = useState("");
  const [gambarBlogUrl, setGambarBlogUrl] = useState("");
  const [isSubmittingBlog, setIsSubmittingBlog] = useState(false);

  const [activeTab, setActiveTab] = useState<"banners" | "blogs">("banners");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUser(user);

      const { data: prof } = await supabase
        .from("profil_pengguna")
        .select("role")
        .eq("id", user.id)
        .single();

      if (prof?.role !== "admin") {
        alert("Akses Ditolak! Halaman ini khusus untuk Administrator.");
        router.push("/");
        return;
      }

      setIsAdmin(true);
      fetchBanners();
      fetchBlogs();
    } catch (err) {
      console.error(err);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchBanners() {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBanners(data);
  }

  async function fetchBlogs() {
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBlogs(data);
  }

  // Tambah Banner
  const handleTambahBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulBanner) return;

    setIsSubmittingBanner(true);
    try {
      await supabase.from("banners").insert({
        judul: judulBanner,
        deskripsi: deskripsiBanner,
        gambar_url: gambarBannerUrl || null,
        is_active: true,
      });

      alert("Banner berhasil ditambahkan!");
      setJudulBanner("");
      setDeskripsiBanner("");
      setGambarBannerUrl("");
      fetchBanners();
    } catch (err: any) {
      alert("Gagal menambah banner: " + err.message);
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  // Hapus Banner
  const handleHapusBanner = async (id: string) => {
    if (!confirm("Yakin ingin menghapus banner ini?")) return;
    await supabase.from("banners").delete().eq("id", id);
    fetchBanners();
  };

  // Tambah Blog
  const handleTambahBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulBlog || !kontenBlog) return;

    setIsSubmittingBlog(true);
    try {
      const generatedSlug =
        slugBlog ||
        judulBlog
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

      await supabase.from("blogs").insert({
        judul: judulBlog,
        slug: generatedSlug,
        konten: kontenBlog,
        gambar_url: gambarBlogUrl || null,
        penulis_id: currentUser.id,
      });

      alert("Artikel Blog berhasil dipublikasikan!");
      setJudulBlog("");
      setSlugBlog("");
      setKontenBlog("");
      setGambarBlogUrl("");
      fetchBlogs();
    } catch (err: any) {
      alert("Gagal membuat artikel blog: " + err.message);
    } finally {
      setIsSubmittingBlog(false);
    }
  };

  // Hapus Blog
  const handleHapusBlog = async (id: string) => {
    if (!confirm("Yakin ingin menghapus artikel blog ini?")) return;
    await supabase.from("blogs").delete().eq("id", id);
    fetchBlogs();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Admin */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-black transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <span className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Control
            Panel Admin
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveTab("banners")}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === "banners"
                ? "bg-black text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Kelola Hero Banner (
            {banners.length})
          </button>
          <button
            onClick={() => setActiveTab("blogs")}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === "blogs"
                ? "bg-black text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Kelola Artikel / Blog (
            {blogs.length})
          </button>
        </div>

        {/* SECTION 1: KELOLA BANNERS */}
        {activeTab === "banners" && (
          <div className="space-y-6">
            <form
              onSubmit={handleTambahBanner}
              className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4 shadow-sm"
            >
              <h3 className="font-extrabold text-sm text-gray-900">
                Tambah Banner Beranda Baru
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Judul Banner (misal: Temukan Resep Terbaik...)"
                  value={judulBanner}
                  onChange={(e) => setJudulBanner(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-xl outline-none focus:border-black font-bold placeholder:text-gray-400 placeholder:font-normal"
                  required
                />
                <input
                  type="text"
                  placeholder="URL Gambar Banner (Unsplash / Supabase Storage)"
                  value={gambarBannerUrl}
                  onChange={(e) => setGambarBannerUrl(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-xl outline-none focus:border-black font-bold placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>

              <textarea
                placeholder="Deskripsi singkat banner..."
                value={deskripsiBanner}
                onChange={(e) => setDeskripsiBanner(e.target.value)}
                rows={2}
                className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-xl outline-none focus:border-black font-medium resize-none placeholder:text-gray-400"
              />

              <button
                type="submit"
                disabled={isSubmittingBanner}
                className="bg-black text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-gray-800 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />{" "}
                {isSubmittingBanner ? "Menyimpan..." : "Simpan Banner"}
              </button>
            </form>

            {/* List Banners */}
            <div className="space-y-3">
              {banners.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        item.gambar_url ||
                        "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400"
                      }
                      className="w-16 h-12 rounded-xl object-cover border"
                      alt="Banner"
                    />
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-900">
                        {item.judul}
                      </h4>
                      <p className="text-[11px] text-gray-500 line-clamp-1">
                        {item.deskripsi}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleHapusBanner(item.id)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: KELOLA BLOG */}
        {activeTab === "blogs" && (
          <div className="space-y-6">
            <form
              onSubmit={handleTambahBlog}
              className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4 shadow-sm"
            >
              <h3 className="font-extrabold text-sm text-gray-900">
                Publikasikan Artikel Blog Baru
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Judul Artikel Blog..."
                  value={judulBlog}
                  onChange={(e) => setJudulBlog(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-xl outline-none focus:border-black font-bold placeholder:text-gray-400 placeholder:font-normal"
                  required
                />
                <input
                  type="text"
                  placeholder="URL Header Foto Artikel (Biarkan kosong untuk foto default)..."
                  value={gambarBlogUrl}
                  onChange={(e) => setGambarBlogUrl(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-xl outline-none focus:border-black font-bold placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>

              <textarea
                placeholder="Tuliskan konten isi artikel blog secara lengkap..."
                value={kontenBlog}
                onChange={(e) => setKontenBlog(e.target.value)}
                rows={6}
                className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-xl outline-none focus:border-black font-medium placeholder:text-gray-400"
                required
              />

              <button
                type="submit"
                disabled={isSubmittingBlog}
                className="bg-black text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-gray-800 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />{" "}
                {isSubmittingBlog
                  ? "Memublikasikan..."
                  : "Publikasikan Artikel"}
              </button>
            </form>

            {/* List Blogs */}
            <div className="space-y-3">
              {blogs.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        item.gambar_url ||
                        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300"
                      }
                      className="w-14 h-12 rounded-xl object-cover border"
                      alt="Thumbnail"
                    />
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-900">
                        {item.judul}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        Slug: /blog/{item.slug}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleHapusBlog(item.id)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
