import { ref, computed } from 'vue'
import type { ResearchStage, ResearchPaper, PaperStatus, StageStatus } from '~/types/research'

// Sample minimal valid PDF in Base64 for instant preview
const SAMPLE_PDF_BASE64_1 = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pi9Db250ZW50cyA1IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PmVuZG9iago1IDAgb2JqPDwvTGVuZ3RoIDg0Pj5zdHJlYW0KQlQKL0YxIDIwIFRmCjcwIDcwMCBUZAooUmVzZWFyY2ggUGFwZXIgUHJldmlldyAtIE51eHQgMykgVGoKL0YxIDEyIFRmCjAgLTMwIFRkCihFZGdlIEFJIEZyYW1ld29yayAmIFBlcmZvcm1hbmNlIEV2YWx1YXRpb24pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTYgMDAwMDAgbiAKMDAwMDAwMDExMSAwMDAwMCBuIAowMDAwMDAwMjM2IDAwMDAwIG4gCjAwMDAwMDAzMDUgMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNi9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjQ0MAolJUVPRgo='

const SAMPLE_PDF_BASE64_2 = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pi9Db250ZW50cyA1IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PmVuZG9iago1IDAgb2JqPDwvTGVuZ3RoIDkwPj5zdHJlYW0KQlQKL0YxIDIwIFRmCjcwIDcwMCBUZAooVHJhbnNmb3JtZXIgTW9kZWxzIFN1cnZleSkgVGoKL0YxIDEyIFRmCjAgLTMwIFRkCihBbmFseXNpcyBvZiBBdHRlbnRpb24gUHJ1bmluZyBhbmQgU1NNcykgVGoKRVQgZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1NiAwMDAwMCBuIAowMDAwMDAwMTExIDAwMDAwIG4gCjAwMDAwMDAyMzYgMDAwMDAgbiAKMDAwMDAwMDMwNSAwMDAwMCBuIAp0cmFpbGVyPDwvU2l6ZSA2L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKNDQ2CiUlRU9GCg=='

const INITIAL_STAGES: ResearchStage[] = [
  {
    id: 'stage-1',
    stepNumber: 1,
    title: 'การกำหนดหัวข้อ & ปัญหาการวิจัย',
    titleEn: 'Topic & Problem Formulation',
    shortDesc: 'ระบุประเด็นปัญหา ตั้งคำถามวิจัย กำหนดวัตถุประสงค์ และขอบเขตการศึกษา',
    fullDesc: 'ขั้นตอนแรกที่สำคัญที่สุดคือการทำความเข้าใจปัญหาที่แท้จริง ค้นหาความต้องการ (Need) หรือจุดที่ยังขาดความรู้ (Knowledge Gap) พร้อมทั้งกำหนดเป้าหมายที่วัดผลได้อย่างชัดเจน',
    status: 'completed',
    dueDate: '2026-03-30',
    checklist: [
      { id: 'c1-1', label: 'ระบุปัญหาการวิจัยให้ชัดเจน (Problem Statement)', completed: true },
      { id: 'c1-2', label: 'กำหนดวัตถุประสงค์และขอบเขตงานวิจัย (Scope & Objectives)', completed: true },
      { id: 'c1-3', label: 'ตั้งสมมติฐานหรือคำถามวิจัยหลัก (Research Questions / Hypotheses)', completed: true },
      { id: 'c1-4', label: 'วิเคราะห์ความสำคัญและผลกระทบที่คาดว่าจะได้รับ (Impact & Contribution)', completed: true }
    ],
    tips: [
      'ปัญหาที่ดีควรกระชับ ชัดเจน และมีหลักฐานอ้างอิงยืนยันว่าปัญหานั้นมีอยู่จริง',
      'กำหนดขอบเขต (Boundary) ให้สอดคล้องกับทรัพยากรและเวลาที่มีอยู่'
    ],
    deliverables: [
      'โครงร่างหัวข้อวิจัย (Research Proposal Outline)',
      'เอกสารความเป็นมาและความสำคัญของปัญหา'
    ]
  },
  {
    id: 'stage-2',
    stepNumber: 2,
    title: 'การทบทวนวรรณกรรม & ศึกษางานที่เกี่ยวข้อง',
    titleEn: 'Literature Review & Related Works',
    shortDesc: 'สืบค้น รวบรวม วิเคราะห์ และเปรียบเทียบวรรณกรรมและเทคนิคที่มีอยู่เดิม',
    fullDesc: 'ศึกษาเปเปอร์ที่ตีพิมพ์ในฐานข้อมูลสากล (IEEE, ACM, Scopus, ScienceDirect, arXiv) เพื่อดูว่ามีผู้ใดแก้ปัญหานี้แล้วด้วยวิธีใด และหาวิธีการหรือช่องว่าง (Research Gap) ที่เราสามารถพัฒนาต่อยอดได้',
    status: 'completed',
    dueDate: '2026-05-15',
    checklist: [
      { id: 'c2-1', label: 'ค้นหางานวิจัยที่เกี่ยวข้องย้อนหลัง 3-5 ปีจากฐานข้อมูลวิชาการ', completed: true },
      { id: 'c2-2', label: 'จัดทำตารางเปรียบเทียบจุดเด่น-จุดด้อย (Comparative Matrix)', completed: true },
      { id: 'c2-3', label: 'ระบุ Research Gap และตำแหน่งของงานเรา (Research Positioning)', completed: true },
      { id: 'c2-4', label: 'จัดระเบียบการอ้างอิงด้วย BibTeX / Zotero / Mendeley', completed: true }
    ],
    tips: [
      'เน้นอ่าน Abstract, Methodology และ Conclusion ก่อนอ่านทั้งเล่ม',
      'จัดหมวดหมู่เปเปอร์ตามแนวทางการแก้ปัญหา ไม่ควรอ่านแบบสะเปะสะปะ'
    ],
    deliverables: [
      'ตารางสังเคราะห์วรรณกรรม (Literature Synthesis Table)',
      'บทที่ 2: วรรณกรรมและงานวิจัยที่เกี่ยวข้อง (Chapter 2 Draft)'
    ]
  },
  {
    id: 'stage-3',
    stepNumber: 3,
    title: 'ระเบียบวิธีวิจัย & ออกแบบสถาปัตยกรรม',
    titleEn: 'Methodology & System Architecture',
    shortDesc: 'ออกแบบวิธีการทดลอง โมเดล สถาปัตยกรรมระบบ หรือชุดข้อมูลตัวอย่าง',
    fullDesc: 'กำหนดกระบวนการทำงาน ขั้นตอนของอัลกอริทึม การเตรียมข้อมูล แหล่งที่มาของข้อมูล (Dataset) และตัวแปร/ตัวชี้วัดที่ใช้ในการประเมินประสิทธิภาพ',
    status: 'in_progress',
    dueDate: '2026-07-20',
    checklist: [
      { id: 'c3-1', label: 'ออกแบบกรอบแนวคิดการวิจัย (Conceptual Framework)', completed: true },
      { id: 'c3-2', label: 'เลือกชุดข้อมูลมาตรฐาน (Benchmark Datasets) หรือกำหนดวิธีเก็บข้อมูล', completed: true },
      { id: 'c3-3', label: 'ออกแบบสถาปัตยกรรมระบบ / Pipeline / โมเดลที่นำเสนอ', completed: false },
      { id: 'c3-4', label: 'กำหนดเกณฑ์และมาตรวัดการประเมิน (Evaluation Metrics: F1, Accuracy, Latency)', completed: false }
    ],
    tips: [
      'วาด Diagram การทำงานให้เห็นภาพชัดเจนเป็นลำดับขั้นตอน',
      'ระบุ Baseline Methods ที่จะนำมาเปรียบเทียบให้เป็นธรรม'
    ],
    deliverables: [
      'System Architecture / Methodology Diagram',
      'ข้อกำหนดชุดข้อมูลและตัวชี้วัดความสำเร็จ'
    ]
  },
  {
    id: 'stage-4',
    stepNumber: 4,
    title: 'การดำเนินการทดลอง & รวบรวมผล',
    titleEn: 'Experimentation & Data Collection',
    shortDesc: 'เตรียมข้อมูล พัฒนาโค้ด รันการทดลอง และบันทึกผลการทดสอบอย่างเป็นระบบ',
    fullDesc: 'เขียนโปรแกรม ฝึกสอนโมเดล (Training) รันการทดลองกับ Benchmark และบันทึก Logs/Checkpoints พร้อมควบคุมตัวแปรเพื่อความเที่ยงตรงของการทดลอง',
    status: 'not_started',
    dueDate: '2026-09-10',
    checklist: [
      { id: 'c4-1', label: 'ทำความสะอาดและแปลงรูปข้อมูล (Data Preprocessing / Augmentation)', completed: false },
      { id: 'c4-2', label: 'พัฒนาโค้ดตามสถาปัตยกรรมที่ออกแบบไว้บน Git', completed: false },
      { id: 'c4-3', label: 'รันการทดลองและบันทึกผลแต่ละ Epoch / Hyperparameter', completed: false },
      { id: 'c4-4', label: 'ทดสอบเทียบกับ Baseline Models ในสภาวะแวดล้อมเดียวกัน', completed: false }
    ],
    tips: [
      'ใช้ Git และ Version Control สำหรับโค้ดและการทดลองเสมอ',
      'บันทึก Seed number และ Configurations ทั้งหมดเพื่อให้ Reproduce ได้'
    ],
    deliverables: [
      'Source Code & Experiment Logs บน GitHub',
      'ตารางผลการทดลองดิบ (Raw Experimental Logs)'
    ]
  },
  {
    id: 'stage-5',
    stepNumber: 5,
    title: 'การวิเคราะห์ผล & อภิปรายผลการวิจัย',
    titleEn: 'Results Analysis & Discussion',
    shortDesc: 'แปลผลการทดลอง วิเคราะห์เชิงสถิติ อภิปรายความหมายและข้อจำกัด',
    fullDesc: 'วิเคราะห์ผลลัพธ์ที่ได้จากการทดลอง ทำความเข้าใจว่าเพราะเหตุใดวิธีของเราจึงดีกว่า (หรือด้อยกว่า) งานอื่น อภิปรายข้อค้นพบใหม่ และระบุข้อจำกัดของการวิจัย (Threats to Validity)',
    status: 'not_started',
    dueDate: '2026-10-30',
    checklist: [
      { id: 'c5-1', label: 'คำนวณและสรุปตัวชี้วัดเชิงปริมาณและสถิติ', completed: false },
      { id: 'c5-2', label: 'สร้างแผนภูมิ แผนภาพ และตารางแสดงผลเชิงเปรียบเทียบ', completed: false },
      { id: 'c5-3', label: 'เขียนอภิปรายผลเทียบกับวรรณกรรมและทฤษฎี', completed: false },
      { id: 'c5-4', label: 'ระบุข้อจำกัดของการวิจัยและทิศทางในอนาคต (Limitations & Future Work)', completed: false }
    ],
    tips: [
      'แผนภูมิควรมีแกนและคำอธิบายชัดเจน ความละเอียดสูง (Vector / 300 DPI)',
      'การอภิปรายผลต้องตอบวัตถุประสงค์ที่ตั้งไว้ในบทที่ 1 ให้ครบถ้วน'
    ],
    deliverables: [
      'ตารางเปรียบเทียบประสิทธิภาพสุดท้าย',
      'ชุดแผนภาพผลการทดลอง (Figures & Plots)'
    ]
  },
  {
    id: 'stage-6',
    stepNumber: 6,
    title: 'การเขียนบทความวิจัย / ร่างรายงาน',
    titleEn: 'Drafting Paper & Manuscript Writing',
    shortDesc: 'เรียบเรียงเป็นบทความวิจัยตามแบบฟอร์มมาตรฐานของวารสารหรือการประชุมวิชาการ',
    fullDesc: 'เขียนโครงสร้างตามมาตรฐาน IMRAD (Introduction, Method, Results, and Discussion) ตรวจสอบการจัดรูปแบบตาม Template ของงานประชุม (IEEE, ACM, Springer, Elsevier หรือ มหาวิทยาลัย)',
    status: 'not_started',
    dueDate: '2026-11-20',
    checklist: [
      { id: 'c6-1', label: 'จัดทำโครงร่างบทความตาม Template (LaTeX หรือ Overleaf / Word)', completed: false },
      { id: 'c6-2', label: 'เขียน Abstract และ Highlights ที่กระชับดึงดูดใจ', completed: false },
      { id: 'c6-3', label: 'เขียนเนื้อหาทุกส่วนให้ครบถ้วน เชื่อมโยงกันอย่างสมเหตุสมผล', completed: false },
      { id: 'c6-4', label: 'ตรวจสอบความถูกต้องของรายการเอกสารอ้างอิงทุกรายการ', completed: false }
    ],
    tips: [
      'ใช้ LaTeX ร่วมกับ Overleaf และ Git เพื่อความสะดวกในการตรวจทานร่วมกับอาจารย์',
      'ตรวจความลื่นไหลของการเล่าเรื่อง (Storytelling) ตั้งแต่ต้นจนจบ'
    ],
    deliverables: [
      'ฉบับร่างบทความวิจัยฉบับสมบูรณ์ (Full Paper Draft PDF)',
      'Source files (LaTeX / Overleaf project)'
    ]
  },
  {
    id: 'stage-7',
    stepNumber: 7,
    title: 'การตรวจทาน, ตีพิมพ์ & ส่งเผยแพร่',
    titleEn: 'Review, Submission & Publication',
    shortDesc: 'ตรวจสอบความซ้ำซ้อน ตรวจภาษา ส่งพิจารณา และปรับปรุงตามข้อเสนอแนะ',
    fullDesc: 'ตรวจสอบดัชนีความซ้ำซ้อน (Plagiarism เช่น Turnitin), Proofread ไวยากรณ์ภาษาอังกฤษ และส่งเข้าสู่ระบบ Peer-review ของวารสารหรือ Conference พร้อมปรับแก้ตาม Reviewer Comments',
    status: 'not_started',
    dueDate: '2026-12-31',
    checklist: [
      { id: 'c7-1', label: 'ตรวจ Plagiarism Score (ต่ำกว่าเกณฑ์ที่กำหนด เช่น < 15%)', completed: false },
      { id: 'c7-2', label: 'ตรวจไวยากรณ์ภาษาและการใช้คำศัพท์ทางวิชาการ (Proofreading)', completed: false },
      { id: 'c7-3', label: 'ส่งบทความผ่านระบบ Submission (เช่น EasyChair, CMT, Editorial Manager)', completed: false },
      { id: 'c7-4', label: 'ปรับปรุงตามข้อคิดเห็นของผู้ทรงคุณวุฒิ (Rebuttal & Camera-Ready)', completed: false }
    ],
    tips: [
      'ตอบข้อเสนอแนะของผู้ทรงคุณวุฒิ (Reviewer Response) อย่างสุภาพและตรงจุดแบบข้อต่อข้อ',
      'สำรองใบตอบรับการตีพิมพ์ (Acceptance Letter) ไว้อย่างเป็นระเบียบ'
    ],
    deliverables: [
      'รายงานผลการตรวจ Plagiarism (Turnitin Report)',
      'Camera-ready Manuscript & Acceptance Certificate'
    ]
  }
]

const INITIAL_PAPERS: ResearchPaper[] = [
  {
    id: 'paper-1',
    title: 'Optimizing Deep Learning Architectures for Real-Time Edge Processing',
    abstract: 'งานวิจัยนี้เสนอแนวทางการปรับแต่งสถาปัตยกรรมโมเดลโครงข่ายประสาทเทียมแบบเบาสำหรับประมวลผลบนอุปกรณ์ Edge Devices เพื่อลดความหน่วงและประหยัดพลังงาน โดยยังคงความแม่นยำสูง',
    authors: ['Apinan J.', 'Research Team'],
    keywords: ['Edge AI', 'Model Compression', 'Quantization', 'Real-time System'],
    stageId: 'stage-3',
    category: 'ร่างบทความวิจัย (Draft Manuscript)',
    status: 'draft',
    version: 'v0.3.1',
    isPinned: true,
    fileName: 'edge_ai_optimization_draft_v3.pdf',
    fileSize: '2.4 MB',
    fileType: 'application/pdf',
    fileUrl: SAMPLE_PDF_BASE64_1,
    fileData: SAMPLE_PDF_BASE64_1,
    gitRepoUrl: 'https://github.com/apinan-research/edge-ai-framework',
    gitBranch: 'main',
    gitCommitHash: '9a8b7c4',
    uploadedAt: '2026-10-10 14:30',
    updatedAt: '2026-10-12 09:15',
    storageType: 'git',
    notes: 'อัปเดตบทที่ 3 และเพิ่มผลการทดลองรอบที่ 2 เชื่อมโยงกับ GitHub commit'
  },
  {
    id: 'paper-2',
    title: 'A Comprehensive Literature Review on Efficient Transformer Models (2022-2026)',
    abstract: 'การสำรวจและวิเคราะห์เปรียบเทียบสถาปัตยกรรมโมเดล Transformer ประสิทธิภาพสูง รวมถึงเทคนิค Attention Pruning และ State-Space Models ล่าสุด',
    authors: ['Apinan J.'],
    keywords: ['Transformers', 'Literature Review', 'Attention Mechanism', 'Efficiency'],
    stageId: 'stage-2',
    category: 'การทบทวนวรรณกรรม (Literature Review)',
    status: 'revised',
    version: 'v1.0.0',
    isPinned: false,
    fileName: 'transformer_survey_final.pdf',
    fileSize: '4.8 MB',
    fileType: 'application/pdf',
    fileUrl: SAMPLE_PDF_BASE64_2,
    fileData: SAMPLE_PDF_BASE64_2,
    gitRepoUrl: 'https://github.com/apinan-research/transformer-survey-notes',
    gitBranch: 'main',
    gitCommitHash: '4e2f1a9',
    uploadedAt: '2026-05-14 11:20',
    updatedAt: '2026-05-18 16:45',
    storageType: 'supabase',
    notes: 'ผ่านการตรวจทานรอบแรกแล้ว ได้ตารางสังเคราะห์ครบ 45 เปเปอร์'
  }
]

export const useResearchWorkflow = () => {
  const stages = ref<ResearchStage[]>(INITIAL_STAGES)
  const papers = ref<ResearchPaper[]>(INITIAL_PAPERS)
  const activeStageId = ref<string>('stage-3')
  const activePaperId = ref<string>('paper-1')
  const isLoaded = ref<boolean>(false)

  // Initialize from LocalStorage if available
  const init = () => {
    if (typeof window === 'undefined') return
    try {
      const savedStages = localStorage.getItem('research_stages')
      if (savedStages) {
        stages.value = JSON.parse(savedStages)
      }
      const savedPapers = localStorage.getItem('research_papers')
      if (savedPapers) {
        const parsed = JSON.parse(savedPapers)
        // Ensure new fields exist for backward compatibility
        papers.value = parsed.map((p: any) => ({
          ...p,
          isPinned: p.isPinned ?? false,
          category: p.category || 'ร่างบทความวิจัย (Draft Manuscript)',
          fileData: p.fileData || p.fileUrl || SAMPLE_PDF_BASE64_1
        }))
      }
      const savedActiveStage = localStorage.getItem('research_active_stage')
      if (savedActiveStage) {
        activeStageId.value = savedActiveStage
      }
      const savedActivePaper = localStorage.getItem('research_active_paper')
      if (savedActivePaper) {
        activePaperId.value = savedActivePaper
      }
    } catch (e) {
      console.warn('Failed to load from local storage:', e)
    } finally {
      isLoaded.value = true
    }
  }

  const persist = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('research_stages', JSON.stringify(stages.value))
      localStorage.setItem('research_papers', JSON.stringify(papers.value))
      localStorage.setItem('research_active_stage', activeStageId.value)
      localStorage.setItem('research_active_paper', activePaperId.value)
    } catch (e) {
      console.error('Failed to persist to localStorage', e)
    }
  }

  // Sorted papers: Pinned first, then by updatedAt descending
  const sortedPapers = computed(() => {
    return [...papers.value].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  })

  // Distinct categories available in current papers
  const categories = computed(() => {
    const defaultCats = [
      'ร่างบทความวิจัย (Draft Manuscript)',
      'การทบทวนวรรณกรรม (Literature Review)',
      'โครงร่างวิจัย (Research Proposal)',
      'ผลการทดลองและชุดข้อมูล (Experiment & Data)',
      'บทความฉบับตีพิมพ์ (Published Paper)',
      'เอกสารอื่นๆ (Other)'
    ]
    const customCats = papers.value.map(p => p.category).filter(Boolean)
    return Array.from(new Set([...defaultCats, ...customCats]))
  })

  // Toggle Pin for a paper
  const togglePin = (paperId: string) => {
    const paper = papers.value.find(p => p.id === paperId)
    if (paper) {
      paper.isPinned = !paper.isPinned
      persist()
    }
  }

  // Calculate overall research progress
  const overallProgress = computed(() => {
    let totalItems = 0
    let completedItems = 0
    for (const stage of stages.value) {
      totalItems += stage.checklist.length
      completedItems += stage.checklist.filter(c => c.completed).length
    }
    return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100)
  })

  // Stage progress helper
  const getStageProgress = (stage: ResearchStage) => {
    if (!stage.checklist.length) return 0
    const completed = stage.checklist.filter(c => c.completed).length
    return Math.round((completed / stage.checklist.length) * 100)
  }

  // Toggle checklist item
  const toggleChecklistItem = (stageId: string, itemId: string) => {
    const stage = stages.value.find(s => s.id === stageId)
    if (!stage) return
    const item = stage.checklist.find(c => c.id === itemId)
    if (item) {
      item.completed = !item.completed
      const completedCount = stage.checklist.filter(c => c.completed).length
      if (completedCount === stage.checklist.length) {
        stage.status = 'completed'
      } else if (completedCount > 0) {
        stage.status = 'in_progress'
      } else {
        stage.status = 'not_started'
      }
      persist()
    }
  }

  const setStageStatus = (stageId: string, status: StageStatus) => {
    const stage = stages.value.find(s => s.id === stageId)
    if (stage) {
      stage.status = status
      persist()
    }
  }

  // Papers management
  const addPaper = (paper: Omit<ResearchPaper, 'id' | 'uploadedAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16)
    const newPaper: ResearchPaper = {
      ...paper,
      id: `paper-${Date.now()}`,
      category: paper.category || 'ร่างบทความวิจัย (Draft Manuscript)',
      isPinned: paper.isPinned ?? false,
      uploadedAt: now,
      updatedAt: now
    }
    papers.value.unshift(newPaper)
    activePaperId.value = newPaper.id
    persist()
    return newPaper
  }

  const updatePaper = (paperId: string, updates: Partial<ResearchPaper>) => {
    const idx = papers.value.findIndex(p => p.id === paperId)
    if (idx !== -1) {
      papers.value[idx] = {
        ...papers.value[idx],
        ...updates,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }
      persist()
    }
  }

  const deletePaper = (paperId: string) => {
    papers.value = papers.value.filter(p => p.id !== paperId)
    if (activePaperId.value === paperId && papers.value.length > 0) {
      activePaperId.value = papers.value[0].id
    }
    persist()
  }

  const resetToDefault = () => {
    stages.value = JSON.parse(JSON.stringify(INITIAL_STAGES))
    papers.value = JSON.parse(JSON.stringify(INITIAL_PAPERS))
    activeStageId.value = 'stage-3'
    activePaperId.value = 'paper-1'
    persist()
  }

  return {
    stages,
    papers,
    sortedPapers,
    categories,
    activeStageId,
    activePaperId,
    overallProgress,
    isLoaded,
    init,
    persist,
    togglePin,
    getStageProgress,
    toggleChecklistItem,
    setStageStatus,
    addPaper,
    updatePaper,
    deletePaper,
    resetToDefault
  }
}
