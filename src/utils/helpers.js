// ── FORMATTING ───────────────────────────────────────────────
export const fmtINR = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

export const today = () => new Date().toISOString().split('T')[0];

export const dueDate = (from, days = 30) => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const fmtDate = (d) => {
  if (!d) return '';
  const dt = d?.toDate ? d.toDate() : new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── INVOICE CALC ──────────────────────────────────────────────
export const calcItem = (it) => {
  const subtotal = (Number(it.qty) || 0) * (Number(it.price) || 0);
  const gstAmt = subtotal * ((Number(it.gst) || 0) / 100);
  return { subtotal, gstAmt, total: subtotal + gstAmt };
};

export const calcInvoice = (items = []) => {
  const rows = items.map(calcItem);
  const subtotal = rows.reduce((s, r) => s + r.subtotal, 0);
  const gstTotal = rows.reduce((s, r) => s + r.gstAmt, 0);
  return { subtotal, gstTotal, total: subtotal + gstTotal, rows };
};

// ── INVOICE NUMBER ────────────────────────────────────────────
export const genInvNo = (prefix = 'DL', count = 1) => {
  const yr = new Date().getFullYear();
  const yr2 = String(yr + 1).slice(2);
  return `${prefix}/${yr}-${yr2}/${String(count).padStart(3, '0')}`;
};

// ── GSTIN VALIDATION ──────────────────────────────────────────
export const validateGSTIN = (gstin) => {
  if (!gstin) return { valid: true, msg: '' }; // optional
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(gstin.toUpperCase())) {
    return { valid: false, msg: 'Invalid GSTIN format (e.g. 33AABCD1234E1ZX)' };
  }
  return { valid: true, msg: '' };
};

export const stateFromGSTIN = (gstin) => {
  const codes = {
    '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
    '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
    '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
    '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
    '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
    '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
    '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
    '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
    '26': 'Dadra & NH', '27': 'Maharashtra', '28': 'Andhra Pradesh',
    '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
    '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
    '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh (New)'
  };
  const code = (gstin || '').slice(0, 2);
  return codes[code] || '';
};

// ── WHATSAPP MESSAGE ──────────────────────────────────────────
export const whatsappMsg = (inv, total) => {
  const lines = [
    `*Invoice: ${inv.invNo}*`,
    `Date: ${inv.date}`,
    `Due: ${inv.due}`,
    ``,
    `*Items:*`,
    ...(inv.items || []).map(it =>
      `• ${it.desc} × ${it.qty} ${it.unit} = ${fmtINR(calcItem(it).total)}`
    ),
    ``,
    `*Total: ${fmtINR(total)}*`,
    ``,
    `_DL Enterprises – Thank you for your business!_`
  ].join('\n');
  return encodeURIComponent(lines);
};

// ── NUMBER TO WORDS (for invoices) ────────────────────────────
export const numToWords = (n) => {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const convert = (num) => {
    if (num === 0) return '';
    if (num < 20) return a[num] + ' ';
    if (num < 100) return b[Math.floor(num/10)] + ' ' + a[num%10] + ' ';
    if (num < 1000) return a[Math.floor(num/100)] + ' Hundred ' + convert(num%100);
    if (num < 100000) return convert(Math.floor(num/1000)) + 'Thousand ' + convert(num%1000);
    if (num < 10000000) return convert(Math.floor(num/100000)) + 'Lakh ' + convert(num%100000);
    return convert(Math.floor(num/10000000)) + 'Crore ' + convert(num%10000000);
  };
  const int = Math.floor(Math.abs(n));
  const dec = Math.round((Math.abs(n) - int) * 100);
  let words = convert(int).trim() + ' Rupees';
  if (dec > 0) words += ' and ' + convert(dec).trim() + ' Paise';
  return words + ' Only';
};
