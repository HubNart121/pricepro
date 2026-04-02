/* =====================================================
   PricePro — app.js
   State management, CRUD, calculations, rendering, export
   ===================================================== */
'use strict';

// ─── Constants ──────────────────────────────────────────
const STORAGE_KEY = 'pricepro-v1';

const SAMPLE = [
  { name: 'A', cost: 15,  price: 30, volume: 1000 },
  { name: 'B', cost: 10,  price: 25, volume: 1000 },
  { name: 'C', cost: 9,   price: 10, volume: 1000 },
  { name: 'D', cost: 12,  price: 25, volume: 1000 },
  { name: 'E', cost: 45,  price: 70, volume: 1000 },
  { name: 'F', cost: 50,  price: 80, volume: 1000 },
  { name: 'G', cost: 60,  price: 85, volume: 1000 },
];

// ─── State ──────────────────────────────────────────────
var products = [];
var nextId   = 1;
var metaInfo = { projectName: '', customerName: '' };

// ─── Init ───────────────────────────────────────────────
function init() {
  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      var data = JSON.parse(saved);
      products = data.products || [];
      nextId   = data.nextId   || (products.length + 1);
      metaInfo = data.metaInfo || { projectName: '', customerName: '' };
    } catch (_) {
      loadSample();
    }
  } else {
    loadSample();
  }
  render();
}

function loadSample() {
  products = SAMPLE.map(function(s, i) {
    return Object.assign({ id: i + 1 }, s);
  });
  nextId = products.length + 1;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ products: products, nextId: nextId, metaInfo: metaInfo }));
}

// ─── Calculations ────────────────────────────────────────
function calcRow(p) {
  var profit      = p.price - p.cost;
  var profitPct   = p.price > 0 ? (profit / p.price * 100) : 0;
  var costAmount  = p.cost   * p.volume;
  var saleAmount  = p.price  * p.volume;
  var profitAmount = profit  * p.volume;
  return Object.assign({}, p, { profit: profit, profitPct: profitPct, costAmount: costAmount, saleAmount: saleAmount, profitAmount: profitAmount });
}

function calcSummary(rows) {
  var totalCost   = rows.reduce(function(s, r) { return s + r.costAmount;   }, 0);
  var totalSale   = rows.reduce(function(s, r) { return s + r.saleAmount;   }, 0);
  var totalProfit = rows.reduce(function(s, r) { return s + r.profitAmount; }, 0);
  var totalPct    = totalSale > 0 ? (totalProfit / totalSale * 100) : 0;
  return { totalCost: totalCost, totalSale: totalSale, totalProfit: totalProfit, totalPct: totalPct };
}

// ─── Formatting ──────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  return Number(n).toFixed(0) + '%';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

function updateMeta(field, val) {
  metaInfo[field] = val;
  save();
}

// ─── CRUD ────────────────────────────────────────────────
function addProduct() {
  var p = { id: nextId++, name: 'สินค้าใหม่', cost: 0, price: 0, volume: 1 };
  products.push(p);
  save();
  render();
  // Auto-focus new name input
  setTimeout(function() {
    var input = document.querySelector('tr[data-id="' + p.id + '"] .input-name');
    if (input) { input.focus(); input.select(); return; }
    var card = document.querySelector('.product-card[data-id="' + p.id + '"] .card-name-input');
    if (card)  { card.focus();  card.select(); }
  }, 60);
  showToast('✅ เพิ่มสินค้าใหม่แล้ว');
}

function deleteProduct(id) {
  products = products.filter(function(p) { return p.id !== id; });
  save();
  render();
  showToast('🗑 ลบสินค้าแล้ว');
}

function updateField(id, field, rawValue) {
  var p = products.find(function(p) { return p.id === id; });
  if (!p) return;
  if (field === 'name') {
    p[field] = rawValue;
  } else {
    var num = parseFloat(rawValue);
    p[field] = isNaN(num) || num < 0 ? 0 : num;
  }
  save();
  refreshRow(id);
  updateSummary();
}

// ─── Render ──────────────────────────────────────────────
function render() {
  document.getElementById('project-name').value = metaInfo.projectName;
  document.getElementById('customer-name').value = metaInfo.customerName;

  var rows = products.map(calcRow);
  renderTable(rows);
  renderCards(rows);
  updateSummary();
  document.getElementById('product-count').textContent = products.length + ' รายการ';
  var isEmpty = products.length === 0;
  document.getElementById('empty-state').style.display = isEmpty ? 'flex' : 'none';
}

function renderTable(rows) {
  var tbody = document.getElementById('table-body');
  tbody.innerHTML = '';
  rows.forEach(function(r, idx) {
    var tr = document.createElement('tr');
    tr.dataset.id = r.id;
    tr.style.animationDelay = (idx * 0.04) + 's';
    tr.innerHTML = buildRowHTML(r, idx);
    tbody.appendChild(tr);
  });
}

function buildRowHTML(r, idx) {
  var profitClass    = r.profit     >= 0 ? 'profit' : 'loss';
  var profitAmtClass = r.profitAmount >= 0 ? 'profit' : 'loss';
  return (
    '<td class="col-no">' + (idx + 1) + '</td>' +
    '<td class="col-name"><input class="cell-input input-name" value="' + escHtml(r.name) + '"' +
    '  onchange="updateField(' + r.id + ',\'name\',this.value)"' +
    '  onblur="updateField(' + r.id + ',\'name\',this.value)"' +
    '  aria-label="ชื่อสินค้า"></td>' +
    '<td class="col-cost"><input class="cell-input input-num cost-color" type="number" min="0" step="0.01" value="' + r.cost + '"' +
    '  oninput="updateField(' + r.id + ',\'cost\',this.value)"' +
    '  aria-label="ต้นทุน"></td>' +
    '<td class="col-price"><input class="cell-input input-num price-color" type="number" min="0" step="0.01" value="' + r.price + '"' +
    '  oninput="updateField(' + r.id + ',\'price\',this.value)"' +
    '  aria-label="ราคาขาย"></td>' +
    '<td class="col-profit"><span class="cell-profit num ' + profitClass + '">' + fmt(r.profit) + '</span></td>' +
    '<td class="col-pct"><span class="cell-pct num">' + fmtPct(r.profitPct) + '</span></td>' +
    '<td class="col-volume"><input class="cell-input input-num" type="number" min="0" step="1" value="' + r.volume + '"' +
    '  oninput="updateField(' + r.id + ',\'volume\',this.value)"' +
    '  aria-label="จำนวน"></td>' +
    '<td class="col-costamt desktop-only"><span class="cell-costamt num cost-color">' + fmt(r.costAmount) + '</span></td>' +
    '<td class="col-saleamt desktop-only"><span class="cell-saleamt num price-color">' + fmt(r.saleAmount) + '</span></td>' +
    '<td class="col-profitamt desktop-only"><span class="cell-profitamt num ' + profitAmtClass + '">' + fmt(r.profitAmount) + '</span></td>' +
    '<td class="col-action"><button class="btn-delete" onclick="deleteProduct(' + r.id + ')" aria-label="ลบ ' + escHtml(r.name) + '">✕</button></td>'
  );
}

function renderCards(rows) {
  var wrapper = document.getElementById('cards-wrapper');
  wrapper.innerHTML = '';
  rows.forEach(function(r, idx) {
    var card = document.createElement('div');
    card.className  = 'product-card';
    card.dataset.id = r.id;
    card.style.animationDelay = (idx * 0.06) + 's';
    card.innerHTML  = buildCardHTML(r, idx);
    wrapper.appendChild(card);
  });
}

function buildCardHTML(r, idx) {
  var profitClass    = r.profit     >= 0 ? 'profit' : 'loss';
  var profitAmtClass = r.profitAmount >= 0 ? 'profit' : 'loss';
  return (
    '<div class="card-header">' +
    '  <div class="card-no">' + (idx + 1) + '</div>' +
    '  <input class="card-name-input" value="' + escHtml(r.name) + '"' +
    '    onchange="updateField(' + r.id + ',\'name\',this.value)"' +
    '    aria-label="ชื่อสินค้า">' +
    '  <button class="btn-delete-card" onclick="deleteProduct(' + r.id + ')" aria-label="ลบ">✕</button>' +
    '</div>' +
    '<div class="card-body">' +
    '  <div class="card-row">' +
    '    <div class="card-field">' +
    '      <label>ต้นทุน (฿)</label>' +
    '      <input class="card-input cost-color" type="number" min="0" step="0.01" value="' + r.cost + '"' +
    '        oninput="updateField(' + r.id + ',\'cost\',this.value)">' +
    '    </div>' +
    '    <div class="card-field">' +
    '      <label>ราคาขาย (฿)</label>' +
    '      <input class="card-input price-color" type="number" min="0" step="0.01" value="' + r.price + '"' +
    '        oninput="updateField(' + r.id + ',\'price\',this.value)">' +
    '    </div>' +
    '    <div class="card-field">' +
    '      <label>จำนวน</label>' +
    '      <input class="card-input" type="number" min="0" step="1" value="' + r.volume + '"' +
    '        oninput="updateField(' + r.id + ',\'volume\',this.value)">' +
    '    </div>' +
    '  </div>' +
    '  <div class="card-computed">' +
    '    <div class="card-computed-item">' +
    '      <span class="card-computed-label">กำไร</span>' +
    '      <span class="card-profit ' + profitClass + '">฿ ' + fmt(r.profit) + '</span>' +
    '    </div>' +
    '    <div class="card-computed-item">' +
    '      <span class="card-computed-label">%</span>' +
    '      <span class="card-pct">' + fmtPct(r.profitPct) + '</span>' +
    '    </div>' +
    '  </div>' +
    '  <div class="card-amounts">' +
    '    <div class="card-amount-item">' +
    '      <span class="card-computed-label">ต้นทุนรวม</span>' +
    '      <span class="card-costamt cost-color">฿ ' + fmt(r.costAmount) + '</span>' +
    '    </div>' +
    '    <div class="card-amount-item">' +
    '      <span class="card-computed-label">ยอดขาย</span>' +
    '      <span class="card-saleamt price-color">฿ ' + fmt(r.saleAmount) + '</span>' +
    '    </div>' +
    '    <div class="card-amount-item">' +
    '      <span class="card-computed-label">กำไรรวม</span>' +
    '      <span class="card-profitamt ' + profitAmtClass + '">฿ ' + fmt(r.profitAmount) + '</span>' +
    '    </div>' +
    '  </div>' +
    '</div>'
  );
}

// ─── Incremental DOM update (fast path) ──────────────────
function refreshRow(id) {
  var p = products.find(function(p) { return p.id === id; });
  if (!p) return;
  var r = calcRow(p);

  // Update table row
  var tr = document.querySelector('tr[data-id="' + id + '"]');
  if (tr) {
    var profitClass    = r.profit     >= 0 ? 'profit' : 'loss';
    var profitAmtClass = r.profitAmount >= 0 ? 'profit' : 'loss';
    tr.querySelector('.cell-profit').textContent    = fmt(r.profit);
    tr.querySelector('.cell-profit').className      = 'cell-profit num ' + profitClass;
    tr.querySelector('.cell-pct').textContent       = fmtPct(r.profitPct);
    tr.querySelector('.cell-costamt').textContent   = fmt(r.costAmount);
    tr.querySelector('.cell-saleamt').textContent   = fmt(r.saleAmount);
    tr.querySelector('.cell-profitamt').textContent = fmt(r.profitAmount);
    tr.querySelector('.cell-profitamt').className   = 'cell-profitamt num ' + profitAmtClass;
  }

  // Update card
  var card = document.querySelector('.product-card[data-id="' + id + '"]');
  if (card) {
    var pClass = r.profit >= 0 ? 'profit' : 'loss';
    var paClass = r.profitAmount >= 0 ? 'profit' : 'loss';
    card.querySelector('.card-profit').textContent    = '฿ ' + fmt(r.profit);
    card.querySelector('.card-profit').className      = 'card-profit ' + pClass;
    card.querySelector('.card-pct').textContent       = fmtPct(r.profitPct);
    card.querySelector('.card-costamt').textContent   = '฿ ' + fmt(r.costAmount);
    card.querySelector('.card-saleamt').textContent   = '฿ ' + fmt(r.saleAmount);
    card.querySelector('.card-profitamt').textContent = '฿ ' + fmt(r.profitAmount);
    card.querySelector('.card-profitamt').className   = 'card-profitamt ' + paClass;
  }
}

// ─── Summary ─────────────────────────────────────────────
function updateSummary() {
  var rows = products.map(calcRow);
  var s    = calcSummary(rows);
  setAnimVal('sum-total-cost',   '฿ ' + fmt(s.totalCost));
  setAnimVal('sum-total-sale',   '฿ ' + fmt(s.totalSale));
  setAnimVal('sum-total-profit', '฿ ' + fmt(s.totalProfit));
  setAnimVal('sum-total-pct',    fmtPct(s.totalPct));
}

function setAnimVal(id, text) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.remove('pulse');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('pulse');
  setTimeout(function() { el.classList.remove('pulse'); }, 600);
}

// ─── Toast ───────────────────────────────────────────────
function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2200);
}

// ─── EXPORT ──────────────────────────────────────────────

// Build a self-contained export element with ALL inline styles
// (html2canvas cannot resolve CSS variables or off-screen fixed elements reliably)
function createExportElement() {
  var rows = products.map(calcRow);
  var s    = calcSummary(rows);
  var d    = new Date();
  var dateLabel = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  // Root container
  var wrap = document.createElement('div');
  wrap.style.cssText = [
    'width:1100px',
    'padding:32px 36px',
    'background:#FFFBEB',
    'font-family:Arial,Helvetica,sans-serif',
    'font-size:14px',
    'color:#1C1917',
    'box-sizing:border-box',
  ].join(';');

  // Header bar
  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #F97316;';
  
  var leftHTML = '<div style="font-size:24px;font-weight:700;color:#1C1917;line-height:1.2;">&#9672; PricePro</div>';
  if (metaInfo.projectName) {
    leftHTML += '<div style="font-size:16px;font-weight:600;color:#1C1917;margin-top:6px;">Project: <span style="color:#F97316;">' + escHtml(metaInfo.projectName) + '</span></div>';
  }
  if (metaInfo.customerName) {
    leftHTML += '<div style="font-size:14px;font-weight:600;color:#78716C;margin-top:4px;">Customer: ' + escHtml(metaInfo.customerName) + '</div>';
  }
  
  hdr.innerHTML = '<div>' + leftHTML + '</div><div style="text-align:right;"><div style="font-size:13px;color:#78716C;font-weight:600;">' + dateLabel + '</div></div>';
  wrap.appendChild(hdr);

  // Table
  var tbl = document.createElement('table');
  tbl.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';

  // TH style
  var thS = 'background:#1C1917;color:#FFFBEB;padding:10px 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px;white-space:nowrap;';
  var cols = ['#', 'สินค้า', 'ต้นทุน (฿)', 'ราคาขาย (฿)', 'กำไร (฿)', '%', 'จำนวน', 'ต้นทุนรวม', 'ยอดขาย', 'กำไรรวม'];
  var thead = '<thead><tr>' +
    cols.map(function(c) { return '<th style="' + thS + '">' + c + '</th>'; }).join('') +
    '</tr></thead>';
  tbl.innerHTML = thead;

  // Body
  var tbody = document.createElement('tbody');
  var tdBase = 'padding:8px 12px;border-bottom:1px solid #EDE4C8;';
  rows.forEach(function(r, i) {
    var bg    = i % 2 === 0 ? '#FFFFFF' : '#FEF9EC';
    var pc    = r.profit     >= 0 ? '#16A34A' : '#DC2626';
    var pac   = r.profitAmount >= 0 ? '#16A34A' : '#DC2626';
    var mono  = 'font-family:Courier New,monospace;text-align:right;';
    var tr = document.createElement('tr');
    tr.style.background = bg;
    tr.innerHTML =
      '<td style="' + tdBase + '">'                                + (i + 1)             + '</td>' +
      '<td style="' + tdBase + 'font-weight:600;">'               + escHtml(r.name)     + '</td>' +
      '<td style="' + tdBase + mono + 'color:#DC2626;">'          + fmt(r.cost)         + '</td>' +
      '<td style="' + tdBase + mono + 'color:#1D4ED8;">'          + fmt(r.price)        + '</td>' +
      '<td style="' + tdBase + mono + 'color:' + pc  + ';font-weight:700;">' + fmt(r.profit)      + '</td>' +
      '<td style="' + tdBase + mono + '">'                        + fmtPct(r.profitPct) + '</td>' +
      '<td style="' + tdBase + mono + '">'                        + fmt(r.volume)       + '</td>' +
      '<td style="' + tdBase + mono + 'color:#DC2626;">'          + fmt(r.costAmount)   + '</td>' +
      '<td style="' + tdBase + mono + 'color:#1D4ED8;">'          + fmt(r.saleAmount)   + '</td>' +
      '<td style="' + tdBase + mono + 'color:' + pac + ';font-weight:700;">' + fmt(r.profitAmount) + '</td>';
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);

  // Footer summary
  var ftS   = 'padding:10px 12px;border-top:2px solid #D4C5A0;background:#FEF9EC;font-weight:700;';
  var mono2 = 'font-family:Courier New,monospace;text-align:right;';
  var tfoot = document.createElement('tfoot');
  tfoot.innerHTML =
    '<tr>' +
    '  <td colspan="7" style="' + ftS + 'color:#78716C;">รวมทั้งหมด</td>' +
    '  <td style="' + ftS + mono2 + 'color:#DC2626;">' + fmt(s.totalCost)    + '</td>' +
    '  <td style="' + ftS + mono2 + 'color:#1D4ED8;">' + fmt(s.totalSale)   + '</td>' +
    '  <td style="' + ftS + mono2 + 'color:#16A34A;">฿ ' + fmt(s.totalProfit) + '</td>' +
    '</tr>' +
    '<tr>' +
    '  <td colspan="9" style="' + ftS + 'color:#78716C;border-top:none;">อัตรากำไรรวม</td>' +
    '  <td style="' + ftS + mono2 + 'color:#F97316;border-top:none;">' + fmtPct(s.totalPct) + '</td>' +
    '</tr>';
  tbl.appendChild(tfoot);
  wrap.appendChild(tbl);
  return wrap;
}

// Append element to body at top, capture, then remove
async function captureToCanvas(el) {
  var shell = document.createElement('div');
  shell.style.cssText = 'position:absolute;top:0;left:0;z-index:-9999;opacity:0;pointer-events:none;';
  shell.appendChild(el);
  document.body.appendChild(shell);

  // Allow layout to settle
  await new Promise(function(r) { setTimeout(r, 300); });

  var canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFBEB',
    logging: false,
    scrollX: 0,
    scrollY: 0,
  });

  document.body.removeChild(shell);
  return canvas;
}

function dateStr() {
  var d = new Date();
  return d.getFullYear() + '' +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
}

function setExportLoading(btnId, loading, originalHTML) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.textContent = '⏳ กำลังสร้าง...';
  } else if (originalHTML) {
    btn.innerHTML = originalHTML;
  }
}

async function exportPNG() {
  var btnId = 'btn-export-png';
  var originalHTML = document.getElementById(btnId).innerHTML;
  setExportLoading(btnId, true);
  try {
    var el     = createExportElement();
    var canvas = await captureToCanvas(el);
    var link   = document.createElement('a');
    link.download = 'PricePro-' + dateStr() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('✅ ดาวน์โหลด PNG สำเร็จ');
  } catch (err) {
    showToast('❌ Export ล้มเหลว: ' + err.message);
    console.error('[PricePro] exportPNG error:', err);
  } finally {
    setExportLoading(btnId, false, originalHTML);
  }
}

async function exportPDF() {
  var btnId = 'btn-export-pdf';
  var originalHTML = document.getElementById(btnId).innerHTML;
  setExportLoading(btnId, true);
  try {
    var el     = createExportElement();
    var canvas = await captureToCanvas(el);
    var imgData = canvas.toDataURL('image/png');

    var jsPDFLib = window.jspdf;
    if (!jsPDFLib) throw new Error('jsPDF is not loaded');

    var pdf = new jsPDFLib.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    var pw  = pdf.internal.pageSize.getWidth();
    var ph  = pdf.internal.pageSize.getHeight();
    var ratio = canvas.width / canvas.height;
    var imgW  = pw - 20;
    var imgH  = imgW / ratio;
    if (imgH > ph - 20) { imgH = ph - 20; imgW = imgH * ratio; }
    var x = (pw - imgW) / 2;
    pdf.addImage(imgData, 'PNG', x, 10, imgW, imgH);
    pdf.save('PricePro-' + dateStr() + '.pdf');
    showToast('✅ ดาวน์โหลด PDF สำเร็จ');
  } catch (err) {
    showToast('❌ Export ล้มเหลว: ' + err.message);
    console.error('[PricePro] exportPDF error:', err);
  } finally {
    setExportLoading(btnId, false, originalHTML);
  }
}

function exportCSV() {
  var csvLines = [];
  
  var escapeCSV = function(val) {
    if (val === null || val === undefined) return '""';
    var str = String(val);
    if (str.indexOf(',') >= 0 || str.indexOf('"') >= 0 || str.indexOf('\n') >= 0) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return '"' + str + '"';
  };

  csvLines.push(escapeCSV("PricePro Report"));
  if (metaInfo.projectName) csvLines.push(escapeCSV("Project:") + "," + escapeCSV(metaInfo.projectName));
  if (metaInfo.customerName) csvLines.push(escapeCSV("Customer:") + "," + escapeCSV(metaInfo.customerName));
  csvLines.push(escapeCSV("Date:") + "," + escapeCSV(dateStr()));
  csvLines.push("");

  var headers = ["#", "สินค้า", "ต้นทุน (฿)", "ราคาขาย (฿)", "กำไร (฿)", "%", "จำนวน", "ต้นทุนรวม (฿)", "ยอดขาย (฿)", "กำไรรวม (฿)"];
  csvLines.push(headers.map(escapeCSV).join(','));

  var fmtCSV = function(n) {
    return '฿ ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  products.forEach(function(p, idx) {
    var row = calcRow(p);
    var rowData = [
      idx + 1,
      row.name,
      row.cost,
      row.price,
      row.profit,
      row.profitPct.toFixed(2),
      row.volume,
      fmtCSV(row.costAmount),
      fmtCSV(row.saleAmount),
      fmtCSV(row.profitAmount)
    ];
    csvLines.push(rowData.map(escapeCSV).join(','));
  });

  // add summary line
  var totalCost = products.reduce(function(sum, p) { return sum + (p.cost * p.volume); }, 0);
  var totalSale = products.reduce(function(sum, p) { return sum + (p.price * p.volume); }, 0);
  var totalProfit = totalSale - totalCost;
  var totalPct = totalSale > 0 ? (totalProfit / totalSale * 100) : 0;
  csvLines.push(["", escapeCSV("รวมทั้งหมด"), "", "", "", escapeCSV(totalPct.toFixed(2)), "", escapeCSV(fmtCSV(totalCost)), escapeCSV(fmtCSV(totalSale)), escapeCSV(fmtCSV(totalProfit))].join(','));

  var csvContent = "\uFEFF" + csvLines.join("\n");
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  
  var link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "PricePro-" + dateStr() + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('✅ ดาวน์โหลด CSV สำเร็จ');
}

function exportData() {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ products: products, nextId: nextId, metaInfo: metaInfo }, null, 2));
  var link = document.createElement('a');
  link.setAttribute("href", dataStr);
  link.setAttribute("download", "PricePro-Backup-" + dateStr() + ".json");
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('✅ ดาวน์โหลดข้อมูลสำเร็จ');
}

function importData(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      if (data.products && Array.isArray(data.products)) {
        products = data.products;
        nextId = data.nextId || (products.length + 1);
        metaInfo = data.metaInfo || { projectName: '', customerName: '' };
        save();
        render();
        showToast('📂 นำเข้าข้อมูลสำเร็จ');
      } else {
        throw new Error('Invalid format');
      }
    } catch(err) {
      showToast('❌ ไฟล์ไม่ถูกต้อง');
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // reset input
}

// ─── Boot ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
