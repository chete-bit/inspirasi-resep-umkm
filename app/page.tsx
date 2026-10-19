"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Home,
  Compass,
  Lightbulb,
  Bookmark,
  Activity,
  Users,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Loader2,
  LogOut,
  Plus,
  Calendar,
} from "lucide-react";
import Link from "next/link";

// Gambar default jika artikel blog tidak memiliki gambar thumbnail
const DEFAULT_BLOG_THUMBNAIL =
  "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500";

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [resepList, setResepList] = useState<any[]>([]);
  const [aktivitasList, setAktivitasList] = useState<any[]>([]);

  // State Banner Slider
  const [banners, setBanners] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // State Blog Terbaru & Ide Usaha Dinamis
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);
  const [ideUsahaList, setIdeUsahaList] = useState<any[]>([]);

  // State Navigasi & Filter
  const [activeMenu, setActiveMenu] = useState<
    "beranda" | "jelajah" | "ide" | "tersimpan" | "aktivitas" | "resep_saya"
  >("beranda");
  const [activeTag, setActiveTag] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Counter Statistik Real
  const [totalResepSaya, setTotalResepSaya] = useState(0);
  const [totalResepDicoba, setTotalResepDicoba] = useState(0);
  const [totalPengikut, setTotalPengikut] = useState(0);

  const pillTags = [
    "Semua",
    "Populer",
    "Makanan",
    "Minuman",
    "Camilan",
    "Jajanan Pasar",
    "Modal Kecil",
    "Margin Tinggi",
  ];

  useEffect(() => {
    initHome();
  }, [activeMenu, activeTag]);

  // Timer Otomatis Pergantian Slide Banner (Setiap 5 detik)
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  async function initHome() {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: prof } = await supabase
          .from("profil_pengguna")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (prof) setProfile(prof);

        const { count: countSaya } = await supabase
          .from("resep")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("resep_asal_id", null);

        setTotalResepSaya(countSaya || 0);

        const { count: countCookSnap } = await supabase
          .from("cook_snaps")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        setTotalResepDicoba(countCookSnap || 0);

        const { count: countFollowers } = await supabase
          .from("pengikut")
          .select("*", { count: "exact", head: true })
          .eq("kreator_id", user.id);

        setTotalPengikut(countFollowers || 0);

        const { data: komData } = await supabase
          .from("komentar_resep")
          .select("isi_komentar, created_at, resep:resep_id(nama_resep)")
          .order("created_at", { ascending: false })
          .limit(4);

        if (komData) setAktivitasList(komData);
      }

      // 1. Ambil Semua Banner Aktif dari Supabase
      const { data: bannerData } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (bannerData && bannerData.length > 0) {
        setBanners(bannerData);
      } else {
        // Fallback banner default jika belum ada data di database
        setBanners([
          {
            id: "default-1",
            judul: "Temukan Resep Terbaik untuk Usaha Kuliner Anda",
            deskripsi:
              "Jelajahi ribuan resep yang sudah teruji, lengkap dengan estimasi modal, harga jual, dan hasil nyata.",
            gambar_url:
              "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200",
            link_url: "/tambah-resep",
          },
        ]);
      }

      // 2. Ambil Artikel Blog Terbaru
      const { data: blogData } = await supabase
        .from("blogs")
        .select(
          `
          *,
          profil_pengguna:penulis_id (nama_lengkap, foto_profil)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(3);

      if (blogData) setRecentBlogs(blogData);

      // 3. Ambil Ide Usaha Menjanjikan secara Dinamis
      const { data: ideData } = await supabase
        .from("resep")
        .select("*")
        .eq("is_public", true)
        .order("target_margin_persen", { ascending: false })
        .order("likes_count", { ascending: false })
        .limit(4);

      if (ideData && ideData.length > 0) {
        setIdeUsahaList(ideData);
      }

      // 4. Query Feed Resep Utama
      let query = supabase.from("resep").select(`
          *,
          profil_pengguna:user_id (nama_lengkap, foto_profil, username)
        `);

      if (activeMenu === "resep_saya" && user) {
        query = query.eq("user_id", user.id).is("resep_asal_id", null);
      } else if (activeMenu === "tersimpan" && user) {
        query = query.eq("user_id", user.id).not("resep_asal_id", "is", null);
      } else {
        query = query.eq("is_public", true);
      }

      if (activeTag === "Populer") {
        query = query.order("likes_count", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data: listResep } = await query;
      if (listResep) setResepList(listResep);
    } catch (err) {
      console.error("Error loading home:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter Search & Pill Tags
  const filteredResep = resepList.filter((item) => {
    const matchesSearch =
      item.nama_resep?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTag === "Semua" || activeTag === "Populer") return true;
    if (activeTag === "Modal Kecil") return item.hasil_porsi * 5000 <= 50000;
    if (activeTag === "Margin Tinggi")
      return (item.target_margin_persen || 0) >= 50;

    const itemKat = (item.kategori || "").toLowerCase().trim();
    const activeTagLower = activeTag.toLowerCase().trim();

    return (
      itemKat === activeTagLower ||
      itemKat.includes(activeTagLower) ||
      item.nama_resep?.toLowerCase().includes(activeTagLower) ||
      item.deskripsi?.toLowerCase().includes(activeTagLower)
    );
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const activeBannerData = banners[currentSlide] || banners[0];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-900 font-sans pb-24 md:pb-12">
      {/* TOPBAR HEADER RESPONSIVE */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200/80 px-4 md:px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="bg-black text-white p-2 rounded-2xl">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight block text-gray-900 leading-none">
                  Inspirasi Resep UMKM
                </span>
                <span className="text-[10px] text-gray-400 font-semibold">
                  Resep Nyata, Usaha Lebih Nyata
                </span>
              </div>
            </Link>

            {/* Profil / Login Tombol khusus layar Mobile */}
            <div className="flex md:hidden items-center gap-2">
              {currentUser ? (
                <Link href={`/profil/${profile?.username || currentUser.id}`}>
                  <img
                    src={
                      profile?.foto_profil ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
                    }
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-xl"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>

          {/* Kolom Pencarian */}
          <div className="flex-1 w-full md:max-w-2xl">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari resep, bahan, margin, atau ide usaha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F4F5F7] text-xs text-gray-900 pl-11 pr-4 py-2.5 md:py-3 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-black transition placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>

          {/* Akses Kanan Layar Desktop */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <button
              onClick={() => setActiveMenu("aktivitas")}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-2xl text-gray-600 transition relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  href={`/profil/${profile?.username || currentUser.id}`}
                  className="flex items-center gap-2.5 hover:opacity-80 transition"
                >
                  <img
                    src={
                      profile?.foto_profil ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
                    }
                    alt="Avatar"
                    className="w-9 h-9 rounded-2xl object-cover border border-gray-200"
                  />
                  <span className="text-xs font-black text-gray-900">
                    {profile?.nama_lengkap?.split(" ")[0] || "CT"}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Keluar"
                  className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* MAIN GRID RESPONSIVE */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 pt-4 md:pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDEBAR KIRI (Hanya di Layar Laptop/Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 space-y-6">
          <nav className="space-y-6 text-xs font-bold text-gray-600">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveMenu("beranda");
                  setActiveTag("Semua");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition ${
                  activeMenu === "beranda"
                    ? "bg-black text-white font-extrabold shadow-sm"
                    : "hover:bg-gray-200/60"
                }`}
              >
                <Home className="w-4 h-4" /> Beranda
              </button>

              <button
                onClick={() => {
                  setActiveMenu("jelajah");
                  setActiveTag("Semua");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition ${
                  activeMenu === "jelajah"
                    ? "bg-black text-white font-extrabold shadow-sm"
                    : "hover:bg-gray-200/60"
                }`}
              >
                <Compass className="w-4 h-4" /> Jelajah Resep
              </button>

              <button
                onClick={() => {
                  setActiveMenu("ide");
                  setActiveTag("Margin Tinggi");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition ${
                  activeMenu === "ide"
                    ? "bg-black text-white font-extrabold shadow-sm"
                    : "hover:bg-gray-200/60"
                }`}
              >
                <Lightbulb className="w-4 h-4" /> Ide Usaha
              </button>

              <button
                onClick={() => {
                  setActiveMenu("tersimpan");
                  setActiveTag("Semua");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition ${
                  activeMenu === "tersimpan"
                    ? "bg-black text-white font-extrabold shadow-sm"
                    : "hover:bg-gray-200/60"
                }`}
              >
                <Bookmark className="w-4 h-4" /> Tersimpan
              </button>

              <button
                onClick={() => setActiveMenu("aktivitas")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition ${
                  activeMenu === "aktivitas"
                    ? "bg-black text-white font-extrabold shadow-sm"
                    : "hover:bg-gray-200/60"
                }`}
              >
                <Activity className="w-4 h-4" /> Aktivitas
              </button>
            </div>

            <div className="space-y-1 pt-2 border-t border-gray-200/80">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-4 mb-1">
                Dapurku
              </p>

              <button
                onClick={() => {
                  setActiveMenu("resep_saya");
                  setActiveTag("Semua");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition ${
                  activeMenu === "resep_saya"
                    ? "bg-black text-white font-extrabold shadow-sm"
                    : "hover:bg-gray-200/60"
                }`}
              >
                <BookOpen className="w-4 h-4" /> Resep Saya
              </button>

              <Link
                href="/blog"
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-gray-200/60 transition text-gray-600"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" /> Artikel & Blog
              </Link>
            </div>
          </nav>

          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 space-y-3">
            <div className="bg-black text-white p-2.5 w-fit rounded-2xl">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-gray-900">
                Jadi Kreator Resep
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                Raih lebih banyak pengikut dan peluang usaha!
              </p>
            </div>
            <Link
              href="/tambah-resep"
              className="w-full bg-black hover:bg-gray-800 text-white text-xs font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2"
            >
              Mulai Sekarang <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>

        {/* AREA TENGAH FEED */}
        <main className="col-span-1 lg:col-span-9 xl:col-span-7 space-y-6">
          {/* HERO BANNER FULLWIDTH OVERLAY & CAROUSEL SLIDER */}
          {activeMenu === "beranda" && activeBannerData && (
            <div className="relative rounded-3xl overflow-hidden min-h-[220px] md:min-h-[280px] bg-black shadow-md group">
              {/* Gambar Background Fullwidth */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
                style={{
                  backgroundImage: `url('${
                    activeBannerData.gambar_url ||
                    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200"
                  }')`,
                }}
              >
                {/* Layer Overlay Dark Gradient agar Teks Selalu Jelas */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
              </div>

              {/* Konten Teks di Layer Depan */}
              <div className="relative z-10 p-6 md:p-10 h-full min-h-[220px] md:min-h-[280px] flex flex-col justify-between max-w-lg">
                <div className="space-y-3">
                  <h1 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-sm">
                    {activeBannerData.judul}
                  </h1>
                  {activeBannerData.deskripsi && (
                    <p className="text-xs md:text-sm text-gray-200 leading-relaxed font-medium line-clamp-2">
                      {activeBannerData.deskripsi}
                    </p>
                  )}
                </div>

                <div className="pt-4">
                  <Link
                    href={activeBannerData.link_url || "/tambah-resep"}
                    className="inline-flex items-center gap-2 bg-white text-black text-xs md:text-sm font-extrabold px-6 py-3.5 rounded-2xl hover:bg-gray-100 transition shadow-lg"
                  >
                    Jelajahi Sekarang <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Tombol Panah Navigasi Slider (Tampil Saat Hover Desktop) */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Indikator Titik (Dots) Slide */}
                  <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all ${
                          currentSlide === idx
                            ? "w-6 bg-white"
                            : "w-2 bg-white/50 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* PILL TAGS FILTER */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {pillTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition ${
                  activeTag === tag
                    ? "bg-black text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-200/60 border border-gray-200/80"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* LIST RESEP RESPONSIVE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 capitalize">
                {activeMenu === "beranda" && "Resep Pilihan untuk UMKM"}
                {activeMenu === "jelajah" && "Jelajah Semua Resep Komunitas"}
                {activeMenu === "ide" && "Ide Usaha Margin Tinggi"}
                {activeMenu === "tersimpan" && "Koleksi Resep Tersimpan"}
                {activeMenu === "resep_saya" && "Dapurku: Resep Saya"}
                {activeMenu === "aktivitas" && "Linimasa Aktivitas Terkini"}
              </h3>
              <span className="text-xs text-gray-400 font-bold">
                {filteredResep.length} Hasil
              </span>
            </div>

            {isLoading ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                <p className="text-xs font-bold text-gray-400 mt-2">
                  Memuat data...
                </p>
              </div>
            ) : filteredResep.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-3">
                <p className="text-sm font-bold text-gray-800">
                  Tidak ada resep yang ditemukan.
                </p>
                <p className="text-xs text-gray-400">
                  Coba pilih kategori lain atau buat resep baru Anda!
                </p>
                <Link
                  href="/tambah-resep"
                  className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition"
                >
                  <Plus className="w-4 h-4" /> Buat Resep Baru
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredResep.map((item) => {
                  const porsi = item.hasil_porsi || 1;
                  const margin = item.target_margin_persen || 50;

                  return (
                    <article
                      key={item.id}
                      className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-md transition space-y-3 p-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-gray-100">
                          <img
                            src={
                              item.foto_url ||
                              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"
                            }
                            alt={item.nama_resep}
                            className="w-full h-full object-cover"
                          />

                          <span className="absolute top-2.5 left-2.5 bg-black text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {item.kategori ||
                              (item.is_public ? "Publik" : "Privat")}
                          </span>

                          <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Users className="w-3 h-3" /> {porsi} Porsi
                          </div>
                        </div>

                        <div className="space-y-2 px-1">
                          <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1">
                            {item.nama_resep}
                          </h4>

                          <Link
                            href={`/profil/${item.profil_pengguna?.username || item.user_id}`}
                            className="flex items-center gap-2 text-xs group"
                          >
                            <img
                              src={
                                item.profil_pengguna?.foto_profil ||
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                              }
                              className="w-5 h-5 rounded-full object-cover border"
                              alt="Avatar"
                            />
                            <span className="text-[11px] font-bold text-gray-600 truncate group-hover:text-black">
                              {item.profil_pengguna?.nama_lengkap ||
                                item.sumber_penulis ||
                                "Koki UMKM"}
                            </span>
                          </Link>

                          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                            <div>
                              <p className="text-gray-400 font-semibold">
                                Porsi
                              </p>
                              <p className="font-extrabold text-gray-900">
                                {porsi} Porsi
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 font-semibold">
                                Margin
                              </p>
                              <p className="font-extrabold text-emerald-600">
                                {margin}%
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Teruji
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/resep/${item.id}`}
                        className="w-full bg-black hover:bg-gray-800 text-white text-xs font-bold py-2.5 rounded-2xl transition flex items-center justify-center gap-1.5 mt-2"
                      >
                        Lihat Resep <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* IDE USAHA MENJANJIKAN RESPONSIVE */}
          {activeMenu === "beranda" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-gray-900">
                  Ide Usaha Menjanjikan
                </h3>
              </div>

              {ideUsahaList.length === 0 ? (
                <p className="text-xs text-gray-400 bg-white p-4 rounded-2xl border border-gray-200">
                  Belum ada data ide usaha menjanjikan.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {ideUsahaList.map((ide) => (
                    <Link
                      key={ide.id}
                      href={`/resep/${ide.id}`}
                      className="relative rounded-2xl overflow-hidden h-36 group cursor-pointer border border-gray-200/80 block shadow-sm hover:shadow-md transition"
                    >
                      <img
                        src={
                          ide.foto_url ||
                          "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300"
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        alt={ide.nama_resep}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-end text-white">
                        <p className="font-black text-xs leading-snug line-clamp-1">
                          {ide.nama_resep}
                        </p>
                        <p className="text-[9px] text-gray-300 mt-0.5">
                          Porsi: {ide.hasil_porsi || 1} Porsi
                        </p>
                        <span className="text-[9px] bg-emerald-500/80 backdrop-blur-md px-2 py-0.5 rounded-md w-fit mt-1 font-extrabold text-white">
                          Margin {ide.target_margin_persen || 50}%
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ARTIKEL BLOG TERBARU RESPONSIVE */}
          {activeMenu === "beranda" && recentBlogs.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-gray-900">
                    Edukasi & Tips Bisnis Kuliner Terbaru
                  </h3>
                  <p className="text-xs text-gray-400">
                    Wawasan praktis dari para praktisi F&B
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="text-xs font-bold text-black hover:underline flex items-center gap-1 shrink-0"
                >
                  Lihat Semua Artikel <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recentBlogs.map((blog) => (
                  <article
                    key={blog.id}
                    className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-md transition space-y-3 p-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="h-32 w-full rounded-2xl overflow-hidden bg-gray-100">
                        <img
                          src={
                            blog.gambar_url && blog.gambar_url.trim() !== ""
                              ? blog.gambar_url
                              : DEFAULT_BLOG_THUMBNAIL
                          }
                          alt={blog.judul}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold pt-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(blog.created_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                      </div>

                      <Link href={`/blog/${blog.slug}`}>
                        <h4 className="font-extrabold text-xs text-gray-900 hover:underline line-clamp-2 leading-snug">
                          {blog.judul}
                        </h4>
                      </Link>

                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {blog.konten}
                      </p>
                    </div>

                    <Link
                      href={`/blog/${blog.slug}`}
                      className="w-full bg-gray-100 hover:bg-black hover:text-white text-gray-900 text-[11px] font-bold py-2 rounded-xl transition text-center block mt-2"
                    >
                      Baca Artikel
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* SIDEBAR KANAN (Hanya di Layar Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={
                  profile?.foto_profil ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
                }
                alt="Profile"
                className="w-14 h-14 rounded-2xl object-cover border border-gray-200"
              />
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 leading-tight">
                  {profile?.nama_lengkap || "CT"}
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold">
                  @{profile?.username || "ctandi2014"}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                  {profile?.bio ||
                    "Pelaku UMKM kuliner | Berbagi resep yang mudah dan menguntungkan"}
                </p>
              </div>
            </div>

            <Link
              href={`/profil/${profile?.username || currentUser?.id}`}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2.5 rounded-2xl transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              Halaman Profil <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
              <div>
                <p className="text-sm font-black text-gray-900">
                  {totalResepSaya}
                </p>
                <p className="text-[9px] text-gray-400 font-bold">Resep Saya</p>
              </div>
              <div className="border-x border-gray-100">
                <p className="text-sm font-black text-gray-900">
                  {totalResepDicoba}
                </p>
                <p className="text-[9px] text-gray-400 font-bold">
                  Resep Dicoba
                </p>
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">
                  {totalPengikut}
                </p>
                <p className="text-[9px] text-gray-400 font-bold">Pengikut</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-gray-900">
                Aktivitas Terbaru
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              {aktivitasList.length === 0 ? (
                <p className="text-[11px] text-gray-400">
                  Belum ada aktivitas terbaru.
                </p>
              ) : (
                aktivitasList.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-2xl transition"
                  >
                    <span className="text-sm">💬</span>
                    <div>
                      <p className="font-bold text-gray-800 text-[11px] leading-snug">
                        Membahas resep "{act.resep?.nama_resep || "Resep"}"
                      </p>
                      <p className="text-[10px] text-gray-500 line-clamp-1">
                        "{act.isi_komentar}"
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-amber-50 rounded-3xl border border-amber-200/60 p-5 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-black">
              💡 Tips Hari Ini
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              "Pastikan untuk menghitung ulang HPP jika terjadi kenaikan harga
              bahan baku utama."
            </p>
          </div>
        </aside>
      </div>

      {/* BOTTOM NAVIGATION BAR (Khusus Tampilan HP/Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200/80 z-50 px-6 py-2.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            setActiveMenu("beranda");
            setActiveTag("Semua");
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeMenu === "beranda"
              ? "text-black font-extrabold"
              : "text-gray-400"
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Beranda</span>
        </button>

        <button
          onClick={() => {
            setActiveMenu("jelajah");
            setActiveTag("Semua");
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeMenu === "jelajah"
              ? "text-black font-extrabold"
              : "text-gray-400"
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Jelajah</span>
        </button>

        <Link
          href="/tambah-resep"
          className="bg-black text-white p-3 rounded-full -mt-5 shadow-md flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </Link>

        <button
          onClick={() => {
            setActiveMenu("tersimpan");
            setActiveTag("Semua");
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeMenu === "tersimpan"
              ? "text-black font-extrabold"
              : "text-gray-400"
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span>Tersimpan</span>
        </button>

        <button
          onClick={() => {
            setActiveMenu("resep_saya");
            setActiveTag("Semua");
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeMenu === "resep_saya"
              ? "text-black font-extrabold"
              : "text-gray-400"
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Dapurku</span>
        </button>
      </div>
    </div>
  );
}
