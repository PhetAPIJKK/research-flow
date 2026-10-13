# Research Flow (ระบบขั้นตอนการทำวิจัย & จัดการรายงาน)

เว็บแอปพลิเคชันสำหรับวางแผน ติดตามขั้นตอนการวิจัย (Research Workflow Pipeline) และจัดการคลังบทความวิจัย (Papers & Artifacts) ออกแบบด้วยรูปแบบมินิมอล เรียบง่าย สบายตา พัฒนาด้วย **Nuxt 3**, **Tailwind CSS**, พร้อมระบบเชื่อมโยงข้อมูล **Git** และ **Supabase** และพร้อมสำหรับการ Deploy ผ่าน **Docker**

---

## 🌟 ฟีเจอร์หลัก (Key Features)

1. **7 ขั้นตอนการทำวิจัยมาตรฐาน (7-Stage Research Lifecycle Roadmap):**
   - **Stage 1: การกำหนดหัวข้อ & ปัญหาการวิจัย (Topic & Problem Formulation)** — นิยามปัญหา วัตถุประสงค์ สมมติฐาน และขอบเขต
   - **Stage 2: การทบทวนวรรณกรรม & ศึกษางานที่เกี่ยวข้อง (Literature Review)** — วิเคราะห์ Research Gap และสังเคราะห์ตารางวรรณกรรม
   - **Stage 3: ระเบียบวิธีวิจัย & ออกแบบสถาปัตยกรรม (Methodology & Architecture)** — ออกแบบ Framework โมเดล และชุดข้อมูล Benchmark
   - **Stage 4: การดำเนินการทดลอง & รวบรวมผล (Experimentation & Data Collection)** — พัฒนาโค้ด รันการทดลอง และบันทึก Logs
   - **Stage 5: การวิเคราะห์ผล & อภิปรายผลการวิจัย (Results Analysis & Discussion)** — วิเคราะห์สถิติ กราฟเปรียบเทียบ และข้อจำกัด
   - **Stage 6: การเขียนบทความวิจัย / ร่างรายงาน (Drafting Paper & Manuscript)** — เขียนตาม Template IMRAD (LaTeX / Overleaf)
   - **Stage 7: การตรวจทาน, ตีพิมพ์ & ส่งเผยแพร่ (Submission & Publication)** — ตรวจ Plagiarism, Proofread และส่ง Conference/Journal
2. **ระบบเช็กลิสต์และวัดผลความคืบหน้าแบบ Interactive:**
   - ติ๊กถูกงานที่เสร็จแล้วเพื่อคำนวณ % ความคืบหน้าภาพรวมอัตโนมัติ
   - เพิ่ม/ลบ รายการเช็คลิสต์ที่กำหนดเองได้
   - บันทึกคำแนะนำจากอาจารย์ที่ปรึกษา (Advisor Tips) และผลลัพธ์ที่ต้องส่งมอบ (Deliverables)
3. **คลังเปเปอร์และเอกสารวิจัย (Research Papers & Artifacts):**
   - อัปโหลดไฟล์เปเปอร์ (.pdf, .tex, .docx, .zip)
   - จัดหมวดหมู่สถานะ: Draft, Revising, Under Review, Accepted, Published
   - เชื่อมโยงแต่ละเปเปอร์เข้ากับขั้นตอนวิจัย
4. **เชื่อมต่อข้อมูล Git & Overleaf:**
   - บันทึกและดึง Commit History จาก GitHub/GitLab
   - บันทึก Quick Commit Log สำหรับติดตามการแก้ไขไฟล์ใน Overleaf
5. **เชื่อมต่อ Supabase Storage & Database:**
   - รองรับ Supabase Storage สำหรับจัดเก็บไฟล์ PDF บนคลาวด์
   - **Local Fallback:** หากยังไม่ได้ใส่ API Key ของ Supabase ระบบจะบันทึกข้อมูลและไฟล์ลงใน Browser LocalStorage ให้ทันทีโดยไม่มี Error
6. **สำรองและกู้คืนข้อมูล (Backup & Restore):**
   - Export ข้อมูลขั้นตอนวิจัยและเปเปอร์ทั้งหมดเป็น JSON ได้ในคลิกเดียว
   - Import กู้คืนข้อมูลกลับมาได้ทุกเมื่อ

---

## 🚀 วิธีการติดตั้งและรันในเครื่อง (Local Development)

### 1. รันด้วย Node.js (npm)

```bash
# ติดตั้ง dependencies
npm install

# รันโหมด Development (Hot-reload)
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

## 🐳 วิธีการ Deploy ผ่าน Docker (Docker Deployment)

ระบบมีไฟล์ `Dockerfile` (Multi-stage build) และ `docker-compose.yml` เตรียมไว้ให้พร้อมใช้งาน

### 1. Deploy ด้วย Docker Compose (แนะนำ)

```bash
docker compose up -d --build
```

ดู Logs ของระบบ:
```bash
docker compose logs -f
```

หยุดการทำงาน:
```bash
docker compose down
```

### 2. หรือ Build & Run Docker Image เอง

```bash
# 1. Build Image
docker build -t research-flow:latest .

# 2. Run Container บน Port 3000
docker run -d -p 3000:3000 --name research-flow-app research-flow:latest
```

---

## ⚙️ การตั้งค่าสภาพแวดล้อม (Environment Variables)

สร้างไฟล์ `.env` ที่โฟลเดอร์ root ของโปรเจกต์ (หรือตั้งค่าผ่านหน้าเว็บ `/settings`):

```env
# Supabase Integration (ใส่เมื่อต้องการใช้ Supabase Storage จริง)
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Git Integration (ค่าเริ่มต้น Repository)
NUXT_PUBLIC_GIT_REPO_URL=https://github.com/your-username/your-research-repo
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
web_Paper/
├── app.vue                     # Layout หลัก
├── nuxt.config.ts              # การตั้งค่า Nuxt 3 & Modules
├── tailwind.config.ts          # การตั้งค่าโทนสี Minimalist และ Typography
├── Dockerfile                  # Multi-stage Docker image
├── docker-compose.yml          # Docker Compose configuration
├── composables/
│   ├── useResearchWorkflow.ts  # จัดการ 7 ขั้นตอนวิจัย, เช็กลิสต์, คำนวณความคืบหน้า
│   ├── useGitSync.ts           # จัดการ Git Repository, Commits, Overleaf
│   └── useSupabaseSync.ts      # จัดการ Supabase Client & Local Fallback
├── types/
│   └── research.ts             # TypeScript Interfaces สำหรับ Stage, Paper, Git
├── components/
│   ├── Navbar.vue              # แถบเมนูด้านบนสไตล์มินิมอล
│   ├── StatusBadge.vue         # ป้ายสถานะแบบเรียบง่าย
│   └── UploadPaperModal.vue    # โมดอลอัปโหลดเปเปอร์พร้อมเลือกช่องทางจัดเก็บ
└── pages/
    ├── index.vue               # Dashboard ภาพรวม และ 7 ขั้นตอนแบบย่อ
    ├── workflow.vue            # หน้า 7 ขั้นตอนวิจัยแบบละเอียด พร้อม Interactive Checklist
    ├── papers.vue              # คลังเปเปอร์ ค้นหา กรอง และดาวน์โหลด
    ├── git-sync.vue            # หน้าเชื่อมโยง Git & Overleaf Timeline
    └── settings.vue            # หน้าตั้งค่า Supabase, สำรอง JSON, และคำสั่ง Docker
```
