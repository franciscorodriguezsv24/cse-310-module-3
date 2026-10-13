import { describeSelections } from '@/lib/catalog';
import { formatMoney } from '@/lib/pricing';
import type { ResolvedLine } from '@/state/cartReducer';
import type { Branch } from '@/types/catalog';

export interface OrderMessageInput {
  restaurantName: string;
  branch: Branch;
  customerName: string;
  notes: string;
  lines: ResolvedLine[];
  subtotal: number;
  currency: string;
}

/** Plain-text order using WhatsApp's *bold* markup. Only available lines are included. */
export function buildOrderMessage(input: OrderMessageInput): string {
  const { branch, customerName, notes, lines, subtotal, currency } = input;
  const out: string[] = [
    `Hi ${input.restaurantName} ${branch.name}! I'd like to place an order.`,
    '',
    `*Name:* ${customerName.trim()}`,
    '',
    '*Order:*',
  ];
  for (const line of lines.filter((l) => l.available)) {
    out.push(`${line.quantity} × ${line.product.name} — ${formatMoney(line.total, currency)}`);
    for (const option of describeSelections(line.product, line.selections)) {
      out.push(`   • ${option}`);
    }
  }
  out.push('', `*Total:* ${formatMoney(subtotal, currency)}`);
  const trimmedNotes = notes.trim();
  if (trimmedNotes) out.push('', `*Notes:* ${trimmedNotes}`);
  return out.join('\n');
}

/**
 * wa.me links open the WhatsApp app when installed and fall back to the web page otherwise,
 * so they work on both platforms without declaring URL-scheme queries.
 */
export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}
