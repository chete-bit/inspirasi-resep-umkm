"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import {
  ChefHat,
  ArrowLeft,
  Edit3,
  Bookmark,
  BookOpen,
  Activity,
  Users,
  ArrowRight,
  Loader2,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";

function CreatorProfileContent() {
  const router = useRouter();
  const params = useParams();
  const usernameParam = params?.username as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // State Tab Navigasi: 'resep_saya' | 'tersimpan' | 'aktivitas' | 'mengikuti'
  const [activeTab, setActiveTab] = useState<
    "resep_saya" | "tersimpan" | "aktivitas" | "mengikuti"
  >("resep_saya");

  // State Data
  const [resepSayaList, setResepSayaList] = useState<any[]>([]);
  const [resepTersimpanList, setResepTersimpanList] = useState<any[]>([]);
  const [aktivitasList, setAktivitasList] = useState<any[]>([]);

  // Statistik
  const [totalResep, setTotalResep] = useState(0);
  const [totalCookSnap, setTotalCookSnap] = useState(0);
  const [totalPengikut, setTotalPengikut] = useState(0);

  // State Modal Edit Profil
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editFoto, setEditFoto] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (usernameParam) {
      fetchProfileAndData();
    }
  }, [usernameParam]);

  async function fetchProfileAndData() {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Cek apakah parameter berupa UUID yang valid atau sebuah username biasa
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          usernameParam,
        );

      let profileQuery = supabase.from("profil_pengguna").select("*");

      if (isUuid) {
        profileQuery = profileQuery.eq("id", usernameParam);
      } else {
        profileQuery = profileQuery.eq("username", usernameParam);
      }

      const { data: profData, error: profErr } =
        await profileQuery.maybeSingle();

      if (profErr || !profData) {
        if (user && (usernameParam === "me" || usernameParam === user.id)) {
          const { data: selfProf } = await supabase
            .from("profil_pengguna")
            .select("*")
            .eq("id", user.id)
            .single();
          if (selfProf) {
            setProfile(selfProf);
            setEditNama(selfProf.nama_lengkap || "");
            setEditBio(selfProf.bio || "");
            setEditFoto(selfProf.foto_profil || "");
            setIsOwnProfile(true);
            await fetchAllUserData(user.id);
          }
        } else {
          console.error("Error fetching profile:", profErr);
          setIsLoading(false);
          return;
        }
      } else {
        setProfile(profData);
        setEditNama(profData.nama_lengkap || "");
        setEditBio(profData.bio || "");
        setEditFoto(profData.foto_profil || "");

        const isSelf = user ? user.id === profData.id : false;
        setIsOwnProfile(isSelf);

        await fetchAllUserData(profData.id);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAllUserData(userId: string) {
    // Resep Saya (Original)
    const { data: resepSaya } = await supabase
      .from("resep")
      .select("*")
      .eq("user_id", userId)
      .is("resep_asal_id", null)
      .order("created_at", { ascending: false });

    if (resepSaya) {
      setResepSayaList(resepSaya);
      setTotalResep(resepSaya.length);
    }

    // Resep Tersimpan (Bookmark)
    const { data: resepTersimpan } = await supabase
      .from("resep")
      .select("*")
      .eq("user_id", userId)
      .not("resep_asal_id", "is", null)
      .order("created_at", { ascending: false });

    if (resepTersimpan) setResepTersimpanList(resepTersimpan);

    // Total CookSnap / Recook
    const { count: cookSnapCount } = await supabase
      .from("cook_snaps")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    setTotalCookSnap(cookSnapCount || 0);

    // Total Pengikut
    const { count: followerCount } = await supabase
      .from("pengikut")
      .select("*", { count: "exact", head: true })
      .eq("kreator_id", userId);

    setTotalPengikut(followerCount || 0);

    // Aktivitas Terbaru
    const { data: komData } = await supabase
      .from("komentar_resep")
      .select("isi_komentar, created_at, resep:resep_id(id, nama_resep)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (komData) setActivityListFormatted(komData);
  }

  function setActivityListFormatted(komData: any[]) {
    const formatted = komData.map((item) => ({
      type: "komentar",
      text: `Mengomentari resep "${item.resep?.nama_resep || "Resep"}"`,
      detail: `"${item.isi_komentar}"`,
      time: item.created_at,
      resepId: item.resep?.id,
    }));
    setAktivitasList(formatted);
  }

  // Handle Simpan Edit Profil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmittingEdit(true);
    try {
      const { error } = await supabase
        .from("profil_pengguna")
        .update({
          nama_lengkap: editNama,
          bio: editBio,
          foto_profil: editFoto,
        })
        .eq("id", currentUser.id);

      if (error) throw error;

      setProfile({
        ...profile,
        nama_lengkap: editNama,
        bio: editBio,
        foto_profil: editFoto,
      });

      setIsEditModalOpen(false);
      alert("Profil berhasil diperbarui!");
    } catch (err: any) {
      alert("Gagal memperbarui profil: " + err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center space-y-4">
        <p className="text-sm font-bold text-gray-700">
          Profil kreator tidak ditemukan.
        </p>
        <Link
          href="/"
          className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-900 font-sans pb-16">
      {/* TOPBAR HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200/80 px-6 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-black transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-xl">
              <ChefHat className="w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-tight text-gray-900">
              Inspirasi Resep UMKM
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1200px] mx-auto px-6 pt-8 space-y-8">
        {/* KARTU PROFIL UTAMA */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <img
              src={
                profile.foto_profil ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
              }
              alt={profile.nama_lengkap}
              className="w-24 h-24 md:w-28 md:h-28 rounded-3xl object-cover border-4 border-gray-100 shadow-md"
            />
            <div className="space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
                  {profile.nama_lengkap || "Koki UMKM"}
                </h1>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider w-fit mx-auto md:mx-0">
                  {profile.role === "admin"
                    ? "Administrator"
                    : "Kreator Kuliner"}
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-400">
                @{profile.username || "koki_umkm"}
              </p>
              <p className="text-xs text-gray-600 max-w-lg leading-relaxed font-medium">
                {profile.bio ||
                  "Belum ada bio singkat. Bagikan keahlian kuliner Anda di sini!"}
              </p>
            </div>
          </div>

          {/* Tombol Edit Profil */}
          {isOwnProfile && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-5 py-3 rounded-2xl transition flex items-center gap-2 shadow-sm shrink-0"
            >
              <Edit3 className="w-4 h-4" /> Edit Profil
            </button>
          )}
        </div>

        {/* STATISTIK KREATOR */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 text-center shadow-sm space-y-1">
            <p className="text-xl md:text-2xl font-black text-gray-900">
              {totalResep}
            </p>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              Total Resep
            </p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 text-center shadow-sm space-y-1">
            <p className="text-xl md:text-2xl font-black text-gray-900">
              {totalCookSnap}
            </p>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              Total Recook
            </p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 text-center shadow-sm space-y-1">
            <p className="text-xl md:text-2xl font-black text-gray-900">
              {totalPengikut}
            </p>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              Pengikut
            </p>
          </div>
        </div>

        {/* TAB NAVIGASI */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200/80 shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab("resep_saya")}
            className={`flex-1 py-3 px-4 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 shrink-0 ${
              activeTab === "resep_saya"
                ? "bg-black text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Resep Saya ({resepSayaList.length})
          </button>
          <button
            onClick={() => setActiveTab("tersimpan")}
            className={`flex-1 py-3 px-4 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 shrink-0 ${
              activeTab === "tersimpan"
                ? "bg-black text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Bookmark className="w-4 h-4" /> Tersimpan (
            {resepTersimpanList.length})
          </button>
          <button
            onClick={() => setActiveTab("aktivitas")}
            className={`flex-1 py-3 px-4 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 shrink-0 ${
              activeTab === "aktivitas"
                ? "bg-black text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Activity className="w-4 h-4" /> Aktivitas
          </button>
          <button
            onClick={() => setActiveTab("mengikuti")}
            className={`flex-1 py-3 px-4 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 shrink-0 ${
              activeTab === "mengikuti"
                ? "bg-black text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Users className="w-4 h-4" /> Mengikuti
          </button>
        </div>

        {/* KONTEN BERDASARKAN TAB AKTIF */}
        <div className="space-y-4">
          {activeTab === "resep_saya" && (
            <div>
              {resepSayaList.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-200/80 text-center space-y-3">
                  <p className="text-sm font-bold text-gray-800">
                    Belum ada resep yang dibagikan.
                  </p>
                  {isOwnProfile && (
                    <Link
                      href="/tambah-resep"
                      className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl mt-2"
                    >
                      Buat Resep Baru
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resepSayaList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-gray-200/80 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition"
                    >
                      <img
                        src={
                          item.foto_url ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300"
                        }
                        alt={item.nama_resep}
                        className="w-24 h-24 rounded-2xl object-cover shrink-0"
                      />
                      <div className="flex-1 space-y-1.5">
                        <span className="bg-gray-100 text-gray-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                          {item.kategori || "Kuliner"}
                        </span>
                        <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1">
                          {item.nama_resep}
                        </h4>
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          {item.deskripsi}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-bold text-emerald-600">
                            Margin {item.target_margin_persen || 50}%
                          </span>
                          <Link
                            href={`/resep/${item.id}`}
                            className="text-xs font-bold text-black hover:underline flex items-center gap-1"
                          >
                            Lihat <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "tersimpan" && (
            <div>
              {resepTersimpanList.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-200/80 text-center space-y-3">
                  <p className="text-sm font-bold text-gray-800">
                    Belum ada resep yang tersimpan.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resepTersimpanList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-gray-200/80 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition"
                    >
                      <img
                        src={
                          item.foto_url ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300"
                        }
                        alt={item.nama_resep}
                        className="w-24 h-24 rounded-2xl object-cover shrink-0"
                      />
                      <div className="flex-1 space-y-1.5">
                        <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                          Tersimpan
                        </span>
                        <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1">
                          {item.nama_resep}
                        </h4>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-bold text-emerald-600">
                            Porsi {item.hasil_porsi || 1}
                          </span>
                          <Link
                            href={`/resep/${item.resep_asal_id || item.id}`}
                            className="text-xs font-bold text-black hover:underline flex items-center gap-1"
                          >
                            Buka Resep <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "aktivitas" && (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-900">
                Linimasa Aktivitas
              </h3>
              {aktivitasList.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Belum ada aktivitas tercatat.
                </p>
              ) : (
                <div className="space-y-3">
                  {aktivitasList.map((act, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs"
                    >
                      <span className="text-base">💬</span>
                      <div className="space-y-1 flex-1">
                        <p className="font-bold text-gray-900">{act.text}</p>
                        <p className="text-gray-600 italic">{act.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "mengikuti" && (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-900">
                Kreator yang Diikuti
              </h3>
              <p className="text-xs text-gray-400">
                Fitur daftar following akan menampilkan kreator favorit Anda.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL EDIT PROFIL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-gray-900">
                Edit Profil Kreator
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs p-3.5 rounded-xl outline-none focus:bg-white focus:border-black font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  URL Foto Profil
                </label>
                <input
                  type="text"
                  value={editFoto}
                  onChange={(e) => setEditFoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs p-3.5 rounded-xl outline-none focus:bg-white focus:border-black font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Bio / Deskripsi Singkat
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs p-3.5 rounded-xl outline-none focus:bg-white focus:border-black font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-3 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmittingEdit ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatorProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <CreatorProfileContent />
    </Suspense>
  );
}
