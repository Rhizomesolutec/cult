export const WHATSAPP_NUMBER = "917626884979";
export const WHATSAPP_DISPLAY = "+91 7626 884 979";

export function whatsAppUrl(text?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
