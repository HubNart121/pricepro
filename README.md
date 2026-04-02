# PricePro — คำนวณราคาสินค้า

เครื่องมือคำนวณราคาสินค้า กำไร และยอดขาย สำหรับธุรกิจไทย  
รองรับ Mobile / Tablet / Desktop · Export PDF & PNG · บันทึกข้อมูลอัตโนมัติ

---

## ✨ ฟีเจอร์หลัก

- **กรอกข้อมูลสินค้า** ได้โดยตรงในตาราง (inline edit)
- **คำนวณอัตโนมัติ**: กำไร, %, ต้นทุนรวม, ยอดขาย, กำไรรวม
- **Summary Cards**: แสดงภาพรวมแบบ real-time
- **Export PNG / PDF**: ดาวน์โหลดรายงานสวยงาม
- **บันทึกอัตโนมัติ**: ข้อมูลอยู่ใน localStorage ไม่หายหลัง refresh
- **Responsive**: Mobile (card) · Tablet (compact table) · Desktop (full table)

---

## 🚀 Deploy บน GitHub Pages

### วิธีที่ 1: ผ่าน GitHub Website (ง่ายที่สุด)

1. สร้าง Repository ใหม่บน GitHub (หรือใช้ที่มีอยู่)
2. อัปโหลดไฟล์ทั้งหมด:
   - `index.html`
   - `style.css`
   - `app.js`
3. ไปที่ **Settings** → **Pages**
4. ตั้ง Source เป็น **Deploy from a branch**
5. เลือก Branch: `main` → Folder: `/ (root)`
6. กด **Save**
7. รอ 1-2 นาที แล้วเข้า URL: `https://[username].github.io/[repo-name]/`

### วิธีที่ 2: ผ่าน Git CLI

```bash
git init
git add .
git commit -m "feat: initial PricePro release"
git branch -M main
git remote add origin https://github.com/[username]/[repo-name].git
git push -u origin main
```

จากนั้นทำขั้นตอน Settings → Pages ตามวิธีที่ 1

---

## 📐 สูตรคำนวณ

| คอลัมน์ | สูตร |
|---------|------|
| กำไร (฿) | `ราคาขาย − ต้นทุน` |
| % กำไร | `(กำไร ÷ ราคาขาย) × 100` |
| ต้นทุนรวม | `ต้นทุน × จำนวน` |
| ยอดขาย | `ราคาขาย × จำนวน` |
| กำไรรวม | `กำไร × จำนวน` |
| % กำไรรวม | `กำไรรวม ÷ ยอดขายรวม × 100` |

---

## 🗂 โครงสร้างไฟล์

```
├── index.html   # โครงสร้าง HTML (Semantic)
├── style.css    # Design system + Responsive layout
├── app.js       # State, CRUD, คำนวณ, Render, Export
└── README.md    # คู่มือนี้
```

---

## 🛠 การใช้งานแบบ Local

เปิดไฟล์ `index.html` ใน browser โดยตรง  
(ไม่ต้องใช้ server — เป็น Static HTML)

หรือใช้ Live Server:

```bash
npx serve .
```

---

*PricePro v1.0 · Built with ❤️ using Vanilla HTML/CSS/JS*
