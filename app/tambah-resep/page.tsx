"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Calculator,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";

interface BahanItem {
  namaBahan: string;
  jumlahBeli: string;
  satuanBeli: string;
  hargaBeli: string;
  jumlahPakai: string;
  satuanPakai: string;
  totalBiaya: number;
}

interface LangkahItem {
  urutan: number;
  instruksi: string;
  fotoUrl?: string;
  uploadingFoto?: boolean;
}

export default function TambahResepPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // State Form Utama
  const [namaResep, setNamaResep] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kategori, setKategori] = useState("makanan");
  const [porsi, setPorsi] = useState("1");
  const [targetMargin, setTargetMargin] = useState("50");
  const [isPublic, setIsPublic] = useState(true);
  const [fotoUrl, setFotoUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // State Komposisi Bahan
  const [bahanList, setBahanList] = useState<BahanItem[]>([
    {
      namaBahan: "",
      jumlahBeli: "1",
      satuanBeli: "kg",
      hargaBeli: "0",
      jumlahPakai: "0",
      satuanPakai: "gram",
      totalBiaya: 0,
    },
  ]);

  // State Langkah Pembuatan
  const [langkahList, setLangkahList] = useState<LangkahItem[]>([
    { urutan: 1, instruksi: "", fotoUrl: "", uploadingFoto: false },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("Silakan login terlebih dahulu untuk menambah resep!");
        router.push("/login");
        return;
      }
      setCurrentUser(user);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUser(false);
    }
  }

  // KALKULATOR KONVERSI SATUAN & HPP
  const hitungBiayaBahan = (
    jumlahBeliStr: string,
    satuanBeli: string,
    hargaBeliStr: string,
    jumlahPakaiStr: string,
    satuanPakai: string,
  ): number => {
    const jumlahBeli = parseFloat(jumlahBeliStr) || 0;
    const hargaBeli = parseFloat(hargaBeliStr) || 0;
    const jumlahPakai = parseFloat(jumlahPakaiStr) || 0;

    if (jumlahBeli <= 0 || hargaBeli <= 0 || jumlahPakai <= 0) return 0;

    let totalBaseBeli = jumlahBeli;
    if (satuanBeli === "kg" || satuanBeli === "liter")
      totalBaseBeli = jumlahBeli * 1000;

    let totalBasePakai = jumlahPakai;
    if (satuanPakai === "kg" || satuanPakai === "liter")
      totalBasePakai = jumlahPakai * 1000;

    const hargaPerBaseUnit = hargaBeli / totalBaseBeli;
    return hargaPerBaseUnit * totalBasePakai;
  };

  // Handle Perubahan Input Bahan
  const handleBahanChange = (
    index: number,
    field: keyof BahanItem,
    value: string,
  ) => {
    const updated = [...bahanList];
    updated[index] = { ...updated[index], [field]: value };

    const item = updated[index];
    item.totalBiaya = hitungBiayaBahan(
      item.jumlahBeli,
      item.satuanBeli,
      item.hargaBeli,
      item.jumlahPakai,
      item.satuanPakai,
    );

    setBahanList(updated);
  };

  const tambahBarisBahan = () => {
    setBahanList([
      ...bahanList,
      {
        namaBahan: "",
        jumlahBeli: "1",
        satuanBeli: "kg",
        hargaBeli: "0",
        jumlahPakai: "0",
        satuanPakai: "gram",
        totalBiaya: 0,
      },
    ]);
  };

  const hapusBarisBahan = (index: number) => {
    if (bahanList.length === 1) return;
    setBahanList(bahanList.filter((_, i) => i !== index));
  };

  // Handle Langkah Pembuatan
  const handleLangkahChange = (index: number, value: string) => {
    const updated = [...langkahList];
    updated[index].instruksi = value;
    setLangkahList(updated);
  };

  const tambahLangkah = () => {
    setLangkahList([
      ...langkahList,
      {
        urutan: langkahList.length + 1,
        instruksi: "",
        fotoUrl: "",
        uploadingFoto: false,
      },
    ]);
  };

  const hapusLangkah = (index: number) => {
    if (langkahList.length === 1) return;
    const updated = langkahList
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        urutan: i + 1,
      }));
    setLangkahList(updated);
  };

  // Upload Foto Langkah Memasak
  const handleUploadFotoLangkah = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const updated = [...langkahList];
    updated[index].uploadingFoto = true;
    setLangkahList(updated);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `langkah_${Date.now()}_${index}.${fileExt}`;
      const filePath = `resep-langkah/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resep-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("resep-images")
        .getPublicUrl(filePath);

      const finalUpdated = [...langkahList];
      finalUpdated[index].fotoUrl = publicUrlData.publicUrl;
      finalUpdated[index].uploadingFoto = false;
      setLangkahList(finalUpdated);
    } catch (err: any) {
      alert("Gagal mengunggah foto langkah: " + err.message);
      const finalUpdated = [...langkahList];
      finalUpdated[index].uploadingFoto = false;
      setLangkahList(finalUpdated);
    }
  };

  // Upload Foto Resep Utama
  const handleUploadFotoResep = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `resep_${Date.now()}.${fileExt}`;
      const filePath = `resep-main/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resep-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("resep-images")
        .getPublicUrl(filePath);

      setFotoUrl(publicUrlData.publicUrl);
    } catch (err: any) {
      alert("Gagal mengunggah foto: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Total Modal & Kalkulasi HPP
  const totalModalResep = bahanList.reduce(
    (acc, curr) => acc + curr.totalBiaya,
    0,
  );
  const porsiNum = parseFloat(porsi) || 1;
  const hppPerPorsi = totalModalResep / porsiNum;
  const marginNum = parseFloat(targetMargin) || 50;
  const saranHargaJual =
    marginNum < 100 ? hppPerPorsi / (1 - marginNum / 100) : 0;

  // SUBMIT RESEP KE SUPABASE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaResep.trim()) {
      alert("Silakan isi nama resep masakan Anda!");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Simpan Header Resep
      const { data: resepData, error: resepError } = await supabase
        .from("resep")
        .insert({
          user_id: currentUser.id,
          nama_resep: namaResep.trim(),
          deskripsi: deskripsi.trim(),
          kategori: kategori,
          foto_url: fotoUrl || null,
          hasil_porsi: porsiNum,
          target_margin_persen: marginNum,
          is_public: isPublic,
        })
        .select("id")
        .single();

      if (resepError) throw resepError;

      const newResepId = resepData.id;

      // 2. Simpan Komposisi Bahan
      const komposisiToInsert = bahanList
        .filter((b) => b.namaBahan.trim() !== "")
        .map((b) => ({
          resep_id: newResepId,
          nama_bahan: b.namaBahan.trim(),
          jumlah_beli: parseFloat(b.jumlahBeli) || 0,
          satuan_beli: b.satuanBeli,
          harga_beli: parseFloat(b.hargaBeli) || 0,
          jumlah_pakai: parseFloat(b.jumlahPakai) || 0,
          satuan_pakai: b.satuanPakai,
          total_biaya: b.totalBiaya,
        }));

      if (komposisiToInsert.length > 0) {
        const { error: bahanError } = await supabase
          .from("komposisi_resep")
          .insert(komposisiToInsert);

        if (bahanError) throw bahanError;
      }

      // 3. Simpan Langkah Pembuatan
      const langkahToInsert = langkahList
        .filter((l) => l.instruksi.trim() !== "")
        .map((l, idx) => ({
          resep_id: newResepId,
          urutan: idx + 1,
          instruksi: l.instruksi.trim(),
          foto_url: l.fotoUrl || null,
        }));

      if (langkahToInsert.length > 0) {
        const { error: langkahError } = await supabase
          .from("langkah_memasak")
          .insert(langkahToInsert);

        if (langkahError) throw langkahError;
      }

      alert("Resep berhasil dibuat dan dipublikasikan!");
      router.push(`/resep/${newResepId}`);
    } catch (err: any) {
      alert("Gagal menyimpan resep: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 px-4 md:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tombol Kembali */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        {/* FORM TAMBAH RESEP UTAMA */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-8"
        >
          <div className="border-b border-gray-100 pb-4">
            <h1 className="text-2xl font-black text-gray-900">
              Buat Resep & Kalkulasi HPP Baru
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Isi rincian takaran resep untuk menghitung harga modal per porsi
              secara otomatis.
            </p>
          </div>

          {/* SECTION 1: INFORMASI UMUM RESEP */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
              1. Informasi Resep
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Resep */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-extrabold text-gray-700 mb-2 uppercase">
                  Nama Resep Masakan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Es Teh Nusantara Kekinian / Brownies Kukus"
                  value={namaResep}
                  onChange={(e) => setNamaResep(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-2xl outline-none focus:border-black font-extrabold placeholder:text-gray-400 placeholder:font-normal"
                  required
                />
              </div>

              {/* KATEGORI KULINER */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 mb-2 uppercase">
                  Kategori Kuliner *
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-2xl outline-none focus:border-black font-bold"
                >
                  <option value="makanan">Makanan Utama / Berat</option>
                  <option value="minuman">Minuman Kekinian</option>
                  <option value="camilan">Camilan & Snack</option>
                  <option value="jajanan_pasar">Jajanan Pasar</option>
                  <option value="dessert">Dessert & Kue</option>
                </select>
              </div>

              {/* Hasil Porsi */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 mb-2 uppercase">
                  Hasil Porsi (Piring / Cup) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={porsi}
                  onChange={(e) => setPorsi(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-2xl outline-none focus:border-black font-bold"
                  required
                />
              </div>

              {/* Target Margin % */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 mb-2 uppercase">
                  Target Margin Keuntungan (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-2xl outline-none focus:border-black font-bold"
                  required
                />
              </div>

              {/* Akses Resep */}
              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 mb-2 uppercase">
                  Akses Resep
                </label>
                <select
                  value={isPublic ? "true" : "false"}
                  onChange={(e) => setIsPublic(e.target.value === "true")}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-2xl outline-none focus:border-black font-bold"
                >
                  <option value="true">Publik (Tampil di Komunitas)</option>
                  <option value="false">Privat (Hanya Saya)</option>
                </select>
              </div>

              {/* Deskripsi */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-extrabold text-gray-700 mb-2 uppercase">
                  Deskripsi & Cerita Singkat
                </label>
                <textarea
                  placeholder="Ceritakan keunikan resep atau ide usaha ini..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-2xl outline-none focus:border-black font-medium resize-none placeholder:text-gray-400"
                />
              </div>

              {/* Upload Foto Resep */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-[11px] font-extrabold text-gray-700 uppercase">
                  Foto Hasil Masakan
                </label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold px-5 py-3 rounded-2xl flex items-center gap-2 transition">
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-gray-600" />
                    )}
                    <span>
                      {uploadingImage ? "Mengunggah..." : "Pilih Foto"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadFotoResep}
                      className="hidden"
                    />
                  </label>

                  {fotoUrl && (
                    <div className="relative h-16 w-24 rounded-2xl overflow-hidden border border-gray-300">
                      <img
                        src={fotoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: KOMPOSISI BAHAN & KONVERSI UNIT */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
                2. Rincian Bahan Beli & Pemakaian Resep
              </h3>
              <button
                type="button"
                onClick={tambahBarisBahan}
                className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Bahan
              </button>
            </div>

            <div className="space-y-3">
              {bahanList.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200/90 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Nama Bahan (misal: Teh / Tepung Terigu / Gula)"
                      value={item.namaBahan}
                      onChange={(e) =>
                        handleBahanChange(idx, "namaBahan", e.target.value)
                      }
                      className="flex-1 bg-white border border-gray-300 text-gray-900 text-xs p-3 rounded-xl font-bold outline-none focus:border-black placeholder:text-gray-400 placeholder:font-normal"
                    />
                    {bahanList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => hapusBarisBahan(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                    {/* Jumlah Beli */}
                    <div>
                      <span className="text-[10px] text-gray-700 font-extrabold uppercase block mb-1">
                        Jumlah Beli
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={item.jumlahBeli}
                        onChange={(e) =>
                          handleBahanChange(idx, "jumlahBeli", e.target.value)
                        }
                        className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-2.5 rounded-xl font-bold outline-none focus:border-black"
                      />
                    </div>

                    {/* Satuan Beli */}
                    <div>
                      <span className="text-[10px] text-gray-700 font-extrabold uppercase block mb-1">
                        Satuan Beli
                      </span>
                      <select
                        value={item.satuanBeli}
                        onChange={(e) =>
                          handleBahanChange(idx, "satuanBeli", e.target.value)
                        }
                        className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-2.5 rounded-xl font-bold outline-none focus:border-black"
                      >
                        <option value="kg">kg</option>
                        <option value="gram">gram</option>
                        <option value="liter">liter</option>
                        <option value="ml">ml</option>
                        <option value="pcs">pcs / pack</option>
                      </select>
                    </div>

                    {/* Harga Beli */}
                    <div>
                      <span className="text-[10px] text-gray-700 font-extrabold uppercase block mb-1">
                        Harga Beli (Rp)
                      </span>
                      <input
                        type="number"
                        value={item.hargaBeli}
                        onChange={(e) =>
                          handleBahanChange(idx, "hargaBeli", e.target.value)
                        }
                        className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-2.5 rounded-xl font-bold outline-none focus:border-black"
                      />
                    </div>

                    {/* Dipakai di Resep */}
                    <div>
                      <span className="text-[10px] text-gray-700 font-extrabold uppercase block mb-1">
                        Dipakai di Resep
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={item.jumlahPakai}
                        onChange={(e) =>
                          handleBahanChange(idx, "jumlahPakai", e.target.value)
                        }
                        className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-2.5 rounded-xl font-bold outline-none focus:border-black"
                      />
                    </div>

                    {/* Satuan Pakai */}
                    <div>
                      <span className="text-[10px] text-gray-700 font-extrabold uppercase block mb-1">
                        Satuan Pakai
                      </span>
                      <select
                        value={item.satuanPakai}
                        onChange={(e) =>
                          handleBahanChange(idx, "satuanPakai", e.target.value)
                        }
                        className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-2.5 rounded-xl font-bold outline-none focus:border-black"
                      >
                        <option value="gram">gram</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="liter">liter</option>
                        <option value="pcs">pcs</option>
                      </select>
                    </div>
                  </div>

                  {/* Biaya Bahan ini */}
                  <div className="text-right pt-1">
                    <span className="text-[11px] text-gray-600 font-medium">
                      Est. Biaya Bahan:{" "}
                    </span>
                    <span className="text-xs font-black text-gray-900">
                      Rp{" "}
                      {item.totalBiaya.toLocaleString("id-ID", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RINGKASAN HARGA MODAL / HPP */}
          <div className="bg-black text-white rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-emerald-400" /> Hasil
              Kalkulasi HPP Otomatis
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-800 pt-4">
              <div>
                <p className="text-xs text-gray-400 font-medium">
                  Total Modal Resep
                </p>
                <p className="text-xl font-black mt-0.5">
                  Rp {totalModalResep.toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">
                  HPP / Porsi ({porsiNum} porsi)
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
                  Saran Harga Jual ({marginNum}%)
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

          {/* SECTION 3: LANGKAH MEMASAK + UPLOAD FOTO LANGKAH */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
                3. Langkah Pembuatan
              </h3>
              <button
                type="button"
                onClick={tambahLangkah}
                className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Langkah
              </button>
            </div>

            <div className="space-y-4">
              {langkahList.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200/90 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-black text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      Langkah {item.urutan}
                    </span>
                    {langkahList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => hapusLangkah(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <textarea
                    placeholder={`Tuliskan instruksi langkah ke-${item.urutan}...`}
                    value={item.instruksi}
                    onChange={(e) => handleLangkahChange(idx, e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-gray-300 text-gray-900 text-xs p-3.5 rounded-xl outline-none focus:border-black font-medium resize-none placeholder:text-gray-400"
                  />

                  {/* UPLOAD FOTO PADA MASING-MASING LANGKAH */}
                  <div className="flex items-center gap-3 pt-1">
                    <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-[11px] font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition">
                      {item.uploadingFoto ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-gray-600" />
                      )}
                      <span>
                        {item.uploadingFoto
                          ? "Mengunggah..."
                          : "Upload Foto Langkah"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadFotoLangkah(idx, e)}
                        className="hidden"
                      />
                    </label>

                    {item.fotoUrl && (
                      <div className="relative h-14 w-20 rounded-xl overflow-hidden border border-gray-300">
                        <img
                          src={item.fotoUrl}
                          alt={`Foto Langkah ${item.urutan}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOMBOL SIMPAN UTAMA */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white font-extrabold text-xs px-8 py-4 rounded-2xl hover:bg-gray-800 transition flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan
                  Resep...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />{" "}
                  Publikasikan Resep
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
