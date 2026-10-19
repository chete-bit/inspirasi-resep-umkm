export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Hapus simbol/karakter khusus
    .replace(/[\s_-]+/g, "-") // Ganti spasi/underscore dengan tanda hubung (-)
    .replace(/^-+|-+$/g, ""); // Hapus tanda hubung di awal/akhir
}
