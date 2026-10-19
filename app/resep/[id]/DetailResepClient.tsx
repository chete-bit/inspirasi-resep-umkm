"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle,
  Calculator,
  MessageSquare,
  Send,
  ListOrdered,
  Heart,
  Camera,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function DetailResepClient({ id }: { id: string }) {
  const resepId = id;
  const router = useRouter();

  const [resep, setResep] = useState<any>(null);
  const [komposisi, setKomposisi] = useState<any[]>([]);
  const [langkahList, setLangkahList] = useState<any[]>([]);

  // State Diskusi & Paginasi
  const [komentarList, setKomentarList] = useState<any[]>([]);
  const [isiKomentar, setIsiKomentar] = useState("");
  const [pageKomentar, setPageKomentar] = useState(1);
  const limitKomentar = 10;

  // State CookSnap (Recook)
  const [cookSnapList, setCookSnapList] = useState<any[]>([]);
  const [isCookSnapModalOpen, setIsCookSnapModalOpen] = useState(false);
  const [cookSnapText, setCookSnapText] = useState("");
  const [cookSnapFotoUrl, setCookSnapFotoUrl] = useState("");
  const [uploadingCookSnap, setUploadingCookSnap] = useState(false);
  const [isSubmittingCookSnap, setIsSubmittingCookSnap] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (resepId) {
      fetchDetailResep();
    }
  }, [resepId]);

  async function fetchDetailResep() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 1. Ambil Resep Utama
      const { data: dataResep } = await supabase
        .from("resep")
        .select(
          `
          *,
          profil_pengguna:user_id (nama_lengkap, foto_profil, username)
        `,
        )
        .eq("id", resepId)
        .single();

      if (dataResep) {
        setResep(dataResep);
        setLikeCount(dataResep.likes_count || 0);
      }

      // 2. Ambil Komposisi Bahan
      const { data: dataKomposisi } = await supabase
        .from("komposisi_resep")
        .select("*")
        .eq("resep_id", resepId);

      if (dataKomposisi) setKomposisi(dataKomposisi);

      // 3. Ambil Langkah Memasak
      const { data: dataLangkah } = await supabase
        .from("langkah_memasak")
        .select("*")
        .eq("resep_id", resepId)
        .order("urutan", { ascending: true });

      if (dataLangkah) setLangkahList(dataLangkah);

      // 4. Ambil Komentar & CookSnap
      await fetchKomentar();
      await fetchCookSnap();

      // 5. Cek Status Bookmark & Like
      if (user && dataResep) {
        if (dataResep.user_id === user.id && dataResep.resep_asal_id !== null) {
          setIsSaved(true);
        } else {
          const { data: savedCheck } = await supabase
            .from("resep")
            .select("id")
            .eq("user_id", user.id)
            .eq("resep_asal_id", resepId)
            .maybeSingle();

          if (savedCheck) setIsSaved(true);
        }
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchKomentar() {
    const { data } = await supabase
      .from("komentar_resep")
      .select(
        `
        *,
        profil_pengguna:user_id (nama_lengkap, foto_profil)
      `,
      )
      .eq("resep_id", resepId)
      .order("created_at", { ascending: false });

    if (data) setKomentarList(data);
  }

  // MENGAMBIL DAFTAR COOKSNAP DENGAN PROFIL USER
  async function fetchCookSnap() {
    try {
      const { data, error } = await supabase
        .from("cook_snaps")
        .select(
          `
          *,
          profil_pengguna:user_id (nama_lengkap, foto_profil, username)
        `,
        )
        .eq("resep_id", resepId)
        .order("created_at", { ascending: false });

      if (error) {
        const { data: rawSnaps } = await supabase
          .from("cook_snaps")
          .select("*")
          .eq("resep_id", resepId)
          .order("created_at", { ascending: false });

        if (rawSnaps) setCookSnapList(rawSnaps);
        return;
      }

      if (data) {
        setCookSnapList(data);
      }
    } catch (err) {
      console.error("Error fetching cooksnaps:", err);
    }
  }

  // Handle Like
  const handleLike = async () => {
    if (!currentUser) {
      alert("Silakan login untuk menyukai resep!");
      router.push("/login");
      return;
    }

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    const newCount = newLikedState ? likeCount + 1 : likeCount - 1;
    setLikeCount(newCount);

    await supabase
      .from("resep")
      .update({ likes_count: newCount })
      .eq("id", resepId);
  };

  // FUNGSI UTAMA: Simpan Resep (Bookmark) ke Koleksi Dapurku
  const handleSimpanResep = async () => {
    if (!currentUser) {
      alert("Silakan login terlebih dahulu untuk menyimpan resep!");
      router.push("/login");
      return;
    }

    try {
      const { error } = await supabase.from("resep").insert({
        user_id: currentUser.id,
        resep_asal_id: resep.id,
        nama_resep: resep.nama_resep,
        deskripsi: resep.deskripsi,
        foto_url: resep.foto_url,
        hasil_porsi: resep.hasil_porsi,
        target_margin_persen: resep.target_margin_persen,
        sumber_penulis: resep.profil_pengguna?.nama_lengkap || "Komunitas",
        is_public: false,
      });

      if (error) throw error;

      setIsSaved(true);
      alert("Resep berhasil disimpan ke Koleksi Tersimpan (Dapurku)!");
    } catch (err: any) {
      alert("Gagal menyimpan resep: " + err.message);
    }
  };

  // Kirim Komentar Diskusi
  const handleKirimKomentar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isiKomentar.trim() || !currentUser) return;

    try {
      await supabase.from("komentar_resep").insert({
        resep_id: resepId,
        user_id: currentUser.id,
        isi_komentar: isiKomentar.trim(),
      });

      setIsiKomentar("");
      await fetchKomentar();
    } catch (err: any) {
      alert("Gagal mengirim komentar: " + err.message);
    }
  };

  // Upload Foto CookSnap
  const handleUploadCookSnapImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCookSnap(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `cooksnap_${Date.now()}.${fileExt}`;
      const filePath = `cook-snaps/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resep-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("resep-images")
        .getPublicUrl(filePath);

      setCookSnapFotoUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      alert("Gagal upload foto CookSnap: " + err.message);
    } finally {
      setUploadingCookSnap(false);
    }
  };

  // Kirim CookSnap (Recook)
  const handleSubmitCookSnap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Silakan login terlebih dahulu!");
      router.push("/login");
      return;
    }

    if (!cookSnapText.trim()) {
      alert("Ceritakan hasil recook Anda!");
      return;
    }

    setIsSubmittingCookSnap(true);
    try {
      const { error } = await supabase.from("cook_snaps").insert({
        resep_id: resepId,
        user_id: currentUser.id,
        ulasan: cookSnapText,
        foto_url: cookSnapFotoUrl || null,
      });

      if (error) throw error;

      alert("CookSnap berhasil dibagikan!");
      setCookSnapText("");
      setCookSnapFotoUrl("");
      setIsCookSnapModalOpen(false);

      await fetchCookSnap();
    } catch (err: any) {
      alert("Gagal membagikan CookSnap: " + err.message);
    } finally {
      setIsSubmittingCookSnap(false);
    }
  };

  // Paginasi Komentar
  const totalPagesKomentar =
    Math.ceil(komentarList.length / limitKomentar) || 1;
  const paginatedKomentar = komentarList.slice(
    (pageKomentar - 1) * limitKomentar,
    pageKomentar * limitKomentar,
  );

  const totalModal = komposisi.reduce(
    (acc, item) => acc + (parseFloat(item.total_biaya) || 0),
    0,
  );
  const porsi = resep?.hasil_porsi || 1;
  const hppPerPorsi = totalModal / porsi;
  const margin = resep?.target_margin_persen || 50;
  const saranHargaJual = margin < 100 ? hppPerPorsi / (1 - margin / 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xs font-bold text-gray-400">
          Memuat detail resep...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tombol Kembali */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        {/* KARTU UTAMA DETAIL RESEP */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-8">
          {/* Header Resep, Author, Like, & Tombol Simpan Resep */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-3">
              <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Resep UMKM
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                {resep?.nama_resep}
              </h1>
              <div className="flex items-center gap-3 pt-1">
                <img
                  src={
                    resep?.profil_pengguna?.foto_profil ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                  }
                  alt="Author"
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
                <div className="text-xs">
                  <p className="font-bold text-gray-900">
                    {resep?.profil_pengguna?.nama_lengkap || "Koki UMKM"}
                  </p>
                  <p className="text-gray-400">
                    @
                    {(resep?.profil_pengguna?.username || "koki").toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Aksi Tombol: Like & Tombol Simpan Resep (Bookmark) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold border transition ${
                  isLiked
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                />
                <span>{likeCount} Suka</span>
              </button>

              {/* Tombol Simpan Resep / Tersimpan */}
              {isSaved ? (
                <button
                  disabled
                  className="bg-gray-100 text-gray-400 text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-1.5 border border-gray-200 cursor-default"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Tersimpan
                </button>
              ) : (
                <button
                  onClick={handleSimpanResep}
                  className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-3 rounded-2xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Bookmark className="w-4 h-4" /> Simpan Resep
                </button>
              )}
            </div>
          </div>

          {/* Gambar Resep Utama */}
          {resep?.foto_url && (
            <div className="rounded-2xl overflow-hidden h-64 md:h-80 w-full bg-gray-100 border border-gray-200">
              <img
                src={resep.foto_url}
                alt={resep.nama_resep}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Deskripsi */}
          {resep?.deskripsi && (
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {resep.deskripsi}
            </p>
          )}

          {/* KALKULATOR HPP & ESTIMASI MODAL */}
          <div className="bg-black text-white rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-emerald-400" /> Estimasi Modal
              & Harga Jual
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-800 pt-4">
              <div>
                <p className="text-xs text-gray-400">Total Modal Resep</p>
                <p className="text-xl font-black mt-0.5">
                  Rp {totalModal.toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">
                  HPP / Porsi ({porsi} porsi)
                </p>
                <p className="text-xl font-black mt-0.5">
                  Rp{" "}
                  {hppPerPorsi.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-bold">
                  Saran Harga Jual ({margin}%)
                </p>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">
                  Rp{" "}
                  {saranHargaJual.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* RINCIAN BAHAN */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-gray-900">
              Rincian Bahan & Takaran
            </h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
              {komposisi.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 flex items-center justify-between text-xs bg-white hover:bg-gray-50/50 transition"
                >
                  <span className="font-bold text-gray-800">
                    {item.nama_bahan}
                  </span>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-500 font-medium">
                      {item.jumlah_pakai || item.jumlah_dipakai}{" "}
                      {item.satuan_pakai}
                    </span>
                    <span className="font-bold text-gray-900 min-w-[90px] text-right">
                      Rp{" "}
                      {(parseFloat(item.total_biaya) || 0).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LANGKAH PEMBUATAN */}
          {langkahList.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-gray-900" />
                <h3 className="font-extrabold text-base text-gray-900">
                  Langkah Pembuatan
                </h3>
              </div>

              <div className="space-y-4">
                {langkahList.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                        Langkah {item.urutan || idx + 1}
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-gray-800 leading-relaxed font-medium">
                      {item.instruksi}
                    </p>

                    {item.foto_url && (
                      <div className="mt-3 rounded-xl overflow-hidden h-48 w-full md:w-80 bg-gray-200 border border-gray-300">
                        <img
                          src={item.foto_url}
                          alt={`Foto Langkah ${item.urutan || idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION COOKSNAP */}
          <div className="space-y-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-gray-900" />
                <h3 className="font-extrabold text-base text-gray-900">
                  CookSnap / Hasil Recook ({cookSnapList.length})
                </h3>
              </div>
              <button
                onClick={() => setIsCookSnapModalOpen(!isCookSnapModalOpen)}
                className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" /> Kirim Recook Kamu
              </button>
            </div>

            {/* Form CookSnap Dropdown */}
            {isCookSnapModalOpen && (
              <form
                onSubmit={handleSubmitCookSnap}
                className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4"
              >
                <h4 className="font-bold text-xs text-gray-900 uppercase">
                  Bagikan Foto & Hasil Recook Resep Ini
                </h4>

                <textarea
                  placeholder="Bagaimana hasilnya? Apakah rasanya pas atau ada tips tambahan?"
                  value={cookSnapText}
                  onChange={(e) => setCookSnapText(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-gray-200 text-gray-900 text-xs p-3 rounded-xl outline-none focus:border-black transition resize-none placeholder:text-gray-400"
                />

                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition shrink-0">
                    {uploadingCookSnap ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>
                      {uploadingCookSnap
                        ? "Mengunggah..."
                        : "Upload Foto Hasil"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadCookSnapImage}
                      disabled={uploadingCookSnap}
                      className="hidden"
                    />
                  </label>

                  {cookSnapFotoUrl && (
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                      <img
                        src={cookSnapFotoUrl}
                        alt="Preview CookSnap"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 flex justify-end items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCookSnapModalOpen(false)}
                      className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCookSnap}
                      className="bg-black text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-800 transition disabled:opacity-50"
                    >
                      {isSubmittingCookSnap ? "Mengirim..." : "Kirim CookSnap"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Galeri CookSnap List */}
            {cookSnapList.length === 0 ? (
              <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                Belum ada CookSnap untuk resep ini. Jadilah yang pertama
                mengirimkan hasil recook!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cookSnapList.map((snap, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          snap.profil_pengguna?.foto_profil ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                        }
                        alt="User"
                        className="w-7 h-7 rounded-full object-cover border"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-gray-900">
                          {snap.profil_pengguna?.nama_lengkap || "Koki UMKM"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          @
                          {(
                            snap.profil_pengguna?.username || "koki"
                          ).toLowerCase()}
                        </p>
                      </div>
                    </div>

                    {snap.foto_url && (
                      <div className="rounded-xl overflow-hidden h-44 w-full bg-gray-200 border border-gray-200">
                        <img
                          src={snap.foto_url}
                          alt="CookSnap"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="text-xs text-gray-700 leading-relaxed font-medium">
                      {snap.ulasan}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KOLOM DISKUSI & KOMENTAR DENGAN PAGINASI */}
          <div className="space-y-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-900" />
                <h3 className="font-extrabold text-base text-gray-900">
                  Diskusi Resep ({komentarList.length})
                </h3>
              </div>
            </div>

            {/* Form Tulis Komentar */}
            {currentUser ? (
              <form onSubmit={handleKirimKomentar} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Tulis pertanyaan atau tanggapan..."
                  value={isiKomentar}
                  onChange={(e) => setIsiKomentar(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-xs px-4 py-3 rounded-2xl outline-none focus:bg-white focus:border-black transition placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="bg-black text-white px-5 rounded-2xl font-bold text-xs hover:bg-gray-800 transition flex items-center gap-1"
                >
                  Kirim <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                Silakan{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="font-bold text-black underline"
                >
                  login
                </button>{" "}
                untuk ikut berdiskusi.
              </p>
            )}

            {/* Daftar Komentar dengan Paginasi */}
            <div className="space-y-3">
              {paginatedKomentar.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs"
                >
                  <img
                    src={
                      item.profil_pengguna?.foto_profil ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                    }
                    alt="Commenter"
                    className="w-7 h-7 rounded-full object-cover border border-gray-200 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-gray-900">
                      {item.profil_pengguna?.nama_lengkap || "Koki UMKM"}
                    </p>
                    <p className="text-gray-700 mt-0.5 leading-relaxed">
                      {item.isi_komentar}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tombol Paginasi Diskusi */}
            {totalPagesKomentar > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <button
                  onClick={() => setPageKomentar((p) => Math.max(p - 1, 1))}
                  disabled={pageKomentar === 1}
                  className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-gray-700 disabled:opacity-40 hover:bg-gray-200 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Sebelumnya
                </button>
                <span className="font-bold text-gray-500">
                  Halaman {pageKomentar} dari {totalPagesKomentar}
                </span>
                <button
                  onClick={() =>
                    setPageKomentar((p) => Math.min(p + 1, totalPagesKomentar))
                  }
                  disabled={pageKomentar === totalPagesKomentar}
                  className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-gray-700 disabled:opacity-40 hover:bg-gray-200 transition flex items-center gap-1"
                >
                  Berikutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
