import { BRAND_NAME, WHATSAPP_NUMBER } from "../config";
import { formatIDR, titleCase } from "./currency";

export function buildWhatsAppMessage({ items, customer, subtotal, productsById }) {
  const lines = [
    `Halo ${BRAND_NAME}! Saya ingin memesan:`,
    "",
    ...items.map((item, index) => {
      const product = productsById[item.productId];
      return `${index + 1}. ${product.name} — ${titleCase(item.grind)} × ${item.quantity} = ${formatIDR(product.price * item.quantity)}`;
    }),
    "",
    `Subtotal: ${formatIDR(subtotal)}`,
    "",
    `Nama: ${customer.name.trim()}`,
    `Alamat: ${customer.address.trim()}`,
    `Catatan: ${customer.notes.trim() || "-"}`,
    "",
    "Mohon konfirmasi ketersediaan produk, ongkos kirim, dan metode pembayaran. Terima kasih!",
  ];

  return lines.join("\n");
}

export function getWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}