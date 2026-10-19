"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, User, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

export default function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slugParam = resolvedParams.slug;
  const router = useRouter();

  const [blog, setBlog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBlogDetail();
  }, [slugParam]);

  async function fetchBlogDetail() {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select(
          `
          *,
          profil_pengguna:penulis_id (nama_lengkap, foto_profil)
        `,
        )
        .eq("slug", slugParam)
        .maybeSingle();

      if (error || !data) {
        alert("Artikel blog tidak ditemukan!");
        router.push("/blog");
        return;
      }

      setBlog(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 px-4 md:px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Tombol Kembali */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Artikel
        </Link>

        {/* Konten Utama Artikel */}
        <article className="bg-white rounded-3xl border border-gray-200 p-6 md:p-10 shadow-sm space-y-6">
          <div className="space-y-3">
            <span className="bg-black text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Edukasi Kuliner
            </span>

            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
              {blog?.judul}
            </h1>

            <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <img
                  src={
                    blog?.profil_pengguna?.foto_profil ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                  }
                  className="w-6 h-6 rounded-full object-cover border"
                  alt="Penulis"
                />
                <span className="font-bold text-gray-900">
                  {blog?.profil_pengguna?.nama_lengkap || "Admin F&B"}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(blog?.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Foto Header Artikel */}
          {blog?.gambar_url && (
            <div className="rounded-2xl overflow-hidden h-64 md:h-80 w-full bg-gray-100 border border-gray-200">
              <img
                src={blog.gambar_url}
                alt={blog.judul}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Isinya */}
          <div className="text-xs md:text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-line space-y-4 pt-2">
            {blog?.konten}
          </div>
        </article>
      </div>
    </div>
  );
}
