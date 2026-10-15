export interface DodItem {
  id: string
  label: string
}

export interface StepGuideline {
  stepKey: string
  title: string
  thTitle: string
  mindset: string
  tasks: string[]
  dod: DodItem[]
  template: Record<string, any>
}

export const GUIDELINES: Record<string, StepGuideline> = {
  problem: {
    stepKey: 'problem',
    title: 'Problem',
    thTitle: 'ที่มาของปัญหาและช่องว่างงานวิจัย',
    mindset: 'งานวิจัยที่ดีเริ่มต้นจากการมีปัญหาที่แท้จริงและคุ้มค่าที่จะแก้ อย่าเริ่มคิดจากชื่อโมเดล ให้เริ่มจาก "Pain Point ของผู้ใช้/ระบบ" และ "จุดอ่อนของวิธีเดิมในวรรณกรรม (Research Gap)"',
    tasks: [
      'อธิบายบริบทและปัญหาสำคัญที่เกิดขึ้นในปัจจุบัน (ใครเดือดร้อน? ส่งผลเสียอย่างไร?)',
      'ทบทวนวรรณกรรมเพื่อชี้ให้เห็นช่องว่าง (Research Gap) ว่าทำไมวิธีเดิมยังแก้ได้ไม่สมบูรณ์',
      'ผูกไฟล์เปเปอร์อ้างอิงที่มีในคลังเพื่อใช้เป็นหลักฐานยืนยัน Research Gap',
      'กำหนดคำถามวิจัย (Research Questions: RQ1, RQ2...) ที่เฉพาะเจาะจงและวัดผลได้จริง'
    ],
    dod: [
      { id: 'p_dod_1', label: 'ระบุที่มา บริบท และผลกระทบของปัญหา (Pain Point) ชัดเจน' },
      { id: 'p_dod_2', label: 'ชี้ช่องว่างงานวิจัย (Research Gap) พร้อมผูกเปเปอร์อ้างอิงอย่างน้อย 2-3 ฉบับ' },
      { id: 'p_dod_3', label: 'กำหนดคำถามวิจัย (Research Questions: RQ1, RQ2...) ที่วัดผลได้จริง' }
    ],
    template: {
      statement: 'ในปัจจุบัน การประมวลผล [ระบุบริบทงานวิจัย] กำลังเผชิญกับปัญหา [ระบุปัญหาหลัก] ส่งผลกระทบทำให้ [ระบุผลกระทบ เช่น ความแม่นยำต่ำลง, ใช้เวลาและทรัพยากรสูง, เกิดความเสียหาย] ซึ่งแนวทางปัจจุบันยังไม่สามารถแก้ไขได้อย่างครอบคลุม',
      gap: 'จากการสำรวจวรรณกรรมที่ผ่านมา (เช่น [เปเปอร์อ้างอิง 1], [เปเปอร์อ้างอิง 2]) แม้จะสามารถแก้ปัญหาในเบื้องต้นได้ แต่ยังคงมีช่องว่างงานวิจัยสำคัญคือ:\n1. ไม่สามารถรองรับข้อมูลที่มีความไม่สมดุล (Imbalance) หรือมีสัญญาณรบกวนสูงได้ดีพอ\n2. โครงสร้างโมเดลเดิมมีความซับซ้อนสูง ทำให้เกิด Inference Latency สูงเกินไปในการใช้งานจริง',
      rqs: [
        { id: 'rq-1', text: 'สถาปัตยกรรมที่นำเสนอสามารถเพิ่มประสิทธิภาพความแม่นยำในการทำนายในสภาวะข้อมูลที่มีสัญญาณรบกวนได้ดีกว่าโมเดล Baseline หรือไม่?' },
        { id: 'rq-2', text: 'การประยุกต์ใช้โมดูลที่ปรับปรุงใหม่ ช่วยลดเวลาและต้นทุนการประมวลผล (Computational Cost) ลงอย่างมีนัยสำคัญหรือไม่?' }
      ]
    }
  },

  objective: {
    stepKey: 'objective',
    title: 'Objective',
    thTitle: 'วัตถุประสงค์ ขอบเขต และสมมติฐาน',
    mindset: 'วัตถุประสงค์คือสัญญาว่าเราจะส่งมอบอะไร ต้องตอบคำถามวิจัย (RQ) ให้ครบทุกข้อ และตีกรอบขอบเขต In-Scope / Out-of-Scope ให้รัดกุมเพื่อป้องกันไม่ให้งานบานปลาย',
    tasks: [
      'กำหนดวัตถุประสงค์การวิจัยให้สอดรับกับ RQ ใน Step 1 แบบ 1-to-1',
      'ตั้งสมมติฐานการวิจัย (Research Hypothesis) ที่สามารถทดสอบเชิงประจักษ์ได้',
      'กำหนดขอบเขตสิ่งที่ทำ (In-Scope) และสิ่งที่ไม่รวมในงานนี้ (Out-of-Scope / Limitations)',
      'สรุปคุณูปการหลักของงานวิจัย (Expected Contributions) 2-4 ข้อ'
    ],
    dod: [
      { id: 'o_dod_1', label: 'วัตถุประสงค์การวิจัยสอดคล้องกับคำถามวิจัย (RQ) ครบถ้วน' },
      { id: 'o_dod_2', label: 'ระบุสมมติฐานที่สามารถพิสูจน์ได้ด้วยการทดลอง (Testable Hypothesis)' },
      { id: 'o_dod_3', label: 'กำหนดขอบเขต In-Scope และ Out-of-Scope ชัดเจน' },
      { id: 'o_dod_4', label: 'ระบุคุณูปการหลัก (Expected Contributions) 2-4 ข้อ' }
    ],
    template: {
      objectives: [
        { id: 'obj-1', text: 'เพื่อออกแบบและพัฒนาสถาปัตยกรรม [ชื่อโมเดล/ระบบ] สำหรับแก้ปัญหา [ชื่อปัญหา] (ตอบ RQ1)', done: false, linkedRq: 'RQ1' },
        { id: 'obj-2', text: 'เพื่อประเมินและเปรียบเทียบประสิทธิภาพกับโมเดล Baseline มาตรฐาน (ตอบ RQ1)', done: false, linkedRq: 'RQ1' },
        { id: 'obj-3', text: 'เพื่อศึกษาผลกระทบของการตัดส่วนประกอบย่อย (Ablation Study) และวิเคราะห์เวลาประมวลผล (ตอบ RQ2)', done: false, linkedRq: 'RQ2' }
      ],
      hypothesis: 'คาดว่าการนำเสนอกลไก [ชื่อโมดูล/เทคนิค] จะช่วยให้โมเดลมีค่า F1-Score สูงกว่า Baseline อย่างน้อย 3-5% และลด Inference Latency ได้อย่างน้อย 20%',
      scopeIn: 'ทดสอบบนชุดข้อมูลมาตรฐาน [ชื่อ Dataset] ภายใต้สภาวะการทดลองที่มีการแบ่ง Train/Val/Test อย่างชัดเจน',
      scopeOut: 'ไม่ครอบคลุมการประมวลผลบน Edge Devices หรือข้อมูลที่ไม่ผ่านการกรองความถูกต้องเบื้องต้นในงานวิจัยระยะนี้',
      contributions: '1. เสนอสถาปัตยกรรมใหม่ [ชื่อโมเดล] ที่ผสมผสานกลไก...\n2. สร้างตารางและเกณฑ์การประเมินเปรียบเทียบเชิงลึกบนชุดข้อมูล...\n3. เผยแพร่ชุดโค้ดและโมเดลที่สามารถทำซ้ำได้ (Reproducible Research)'
    }
  },

  method: {
    stepKey: 'method',
    title: 'Method',
    thTitle: 'วิธีดำเนินการวิจัยและสถาปัตยกรรม',
    mindset: 'การอธิบายวิธีดำเนินการต้องละเอียดจนผู้อื่นสามารถทำซ้ำได้ (Reproducible) โดยต้องแยกให้ชัดเจนว่าส่วนไหนคือ Standard Component (ของเดิม) และส่วนไหนคือ Novelty (สิ่งที่เราคิดค้นหรือปรับปรุงใหม่)',
    tasks: [
      'ออกแบบและอัปโหลดภาพผังโครงสร้างสถาปัตยกรรม (Architecture / Pipeline Diagram)',
      'บันทึกลำดับขั้นการทำความสะอาดและแปลงข้อมูล (Data Preprocessing Pipeline)',
      'แบ่งการอธิบายออกเป็นโมดูลย่อย พร้อมระบุส่วนที่เป็น Standard Component และ Novelty',
      'ผูกไฟล์เปเปอร์อ้างอิงที่เป็นต้นแบบของทฤษฎีหรือโมเดลที่นำมาประยุกต์ใช้'
    ],
    dod: [
      { id: 'm_dod_1', label: 'มีภาพไดอะแกรมสถาปัตยกรรมหรือ Pipeline รวมของระบบชัดเจน' },
      { id: 'm_dod_2', label: 'อธิบายขั้นตอนการเตรียมข้อมูล (Preprocessing Pipeline) ละเอียดพอที่จะทำซ้ำได้' },
      { id: 'm_dod_3', label: 'ระบุความแตกต่างระหว่าง Standard Component และส่วนที่เป็น Novelty ชัดเจน' },
      { id: 'm_dod_4', label: 'ผูกเปเปอร์อ้างอิงของทฤษฎีหรือโมเดลที่นำมาต่อยอด' }
    ],
    template: {
      preprocessing: '1. Data Cleaning: ตรวจสอบและตัดข้อมูลซ้ำซ้อน (Deduplication) และจัดการค่า Missing Values\n2. Normalization & Tokenization: ปรับสเกลข้อมูลเชิงตัวเลข และแปลงข้อความเป็น Subword Tokens\n3. Data Augmentation: เพิ่มความหลากหลายของข้อมูลเพื่อป้องกัน Overfitting',
      blocks: [
        { id: 'mb-1', title: 'Data Preprocessing & Augmentation', body: 'ขั้นตอนการจัดเตรียมข้อมูล การคัดกรอง Noise และการทำ Normalization ก่อนป้อนเข้าสู่โมเดล', type: 'standard' },
        { id: 'mb-2', title: 'Feature Extraction Backbone (Standard Component)', body: 'นำโมเดลโครงสร้างพื้นฐานที่ผ่าน Pre-training (เช่น ResNet-50 หรือ BERT-base) มาใช้สกัด Representation เวกเตอร์', type: 'standard' },
        { id: 'mb-3', title: 'Proposed Novel Enhancement Module (Novelty)', body: 'โมดูลที่เรานำเสนอใหม่: ปรับปรุงกลไก Attention เพื่อจับความสัมพันธ์ระยะไกลและเพิ่มน้ำหนักความสำคัญของฟีเจอร์วิกฤต', type: 'novelty' },
        { id: 'mb-4', title: 'Loss Function & Optimization Strategy', body: 'ประยุกต์ใช้ Loss Function ผสมผสานเพื่อจัดการกับปัญหา Class Imbalance และปรับ Learning Rate ด้วย Cosine Annealing', type: 'standard' }
      ]
    }
  },

  setup: {
    stepKey: 'setup',
    title: 'Experiment Setup',
    thTitle: 'การตั้งค่าการทดลองและเตรียมข้อมูล',
    mindset: 'การทดลองต้องโปร่งใสและตรวจสอบซ้ำได้ (Reproducibility) รายละเอียดชุดข้อมูล สเปกเครื่อง และค่า Hyperparameters ทุกตัวต้องถูกบันทึกอย่างครบถ้วน',
    tasks: [
      'บันทึกข้อมูล Dataset อย่างครบถ้วน (ชื่อ, แหล่งที่มา, ขนาด, คลาส, สัดส่วน Split)',
      'ระบุสภาพแวดล้อม ฮาร์ดแวร์ และเวอร์ชันของซอฟต์แวร์เฟรมเวิร์ก',
      'บันทึกค่าพารามิเตอร์ตั้งต้น (Hyperparameters) และ Random Seed',
      'เลือกโมเดลคู่เทียบ (Baseline Models) ที่เหมาะสมและน่าเชื่อถือ'
    ],
    dod: [
      { id: 's_dod_1', label: 'บันทึกข้อมูล Dataset (ชื่อ, แหล่งที่มา, ขนาด, คลาส, สัดส่วน Split) ครบถ้วน' },
      { id: 's_dod_2', label: 'ระบุสภาพแวดล้อม สเปกฮาร์ดแวร์ และซอฟต์แวร์เฟรมเวิร์ก' },
      { id: 's_dod_3', label: 'กำหนดค่า Hyperparameters ตั้งต้น (Learning Rate, Batch Size, Seed...)' },
      { id: 's_dod_4', label: 'กำหนด Baseline Models คู่เทียบที่เหมาะสมอย่างน้อย 2-3 โมเดล' }
    ],
    template: {
      dsName: 'Benchmark Dataset (เช่น ImageNet-1K / MIMIC-III / ThaiNER)',
      dsSource: 'HuggingFace Datasets / Kaggle / เว็บไซต์วิจัยหลัก',
      dsSize: '15,000 ตัวอย่าง (กระจายตัว 5 คลาส)',
      dsSplit: 'Train 70% (10,500) : Validation 15% (2,250) : Test 15% (2,250)',
      dsClean: 'ตัดข้อมูลที่สูญหาย, ทำ Min-Max Normalization, และกรองสัญญาณรบกวน',
      env: 'GPU NVIDIA RTX 4090 24GB, RAM 64GB, Ubuntu 22.04 LTS, Python 3.10, PyTorch 2.2, CUDA 12.1',
      hyper: [
        { id: 'h-1', k: 'Learning Rate', v: '1e-4 (Warmup 5 epochs)' },
        { id: 'h-2', k: 'Batch Size', v: '32' },
        { id: 'h-3', k: 'Optimizer', v: 'AdamW (Weight Decay 1e-2)' },
        { id: 'h-4', k: 'Epochs', v: '50 (Early Stopping patience 5)' },
        { id: 'h-5', k: 'Random Seed', v: '42' }
      ],
      baselines: [
        { id: 'b-1', text: 'Baseline 1: Standard Backbone Model (เช่น ResNet-50 / BERT-base)' },
        { id: 'b-2', text: 'Baseline 2: SOTA Method จากเปเปอร์อ้างอิงล่าสุด' },
        { id: 'b-3', text: 'Baseline 3: Classical Machine Learning Model (Random Forest / SVM)' }
      ]
    }
  },

  metrics: {
    stepKey: 'metrics',
    title: 'Evaluate Metrics',
    thTitle: 'เกณฑ์และตัวชี้วัดประสิทธิภาพ',
    mindset: 'เลือกตัวชี้วัดที่สะท้อนคุณภาพงานจริง ไม่หลอกตัวเองด้วย Accuracy เพียงอย่างเดียวเมื่อข้อมูลไม่สมดุล และต้องวัดประสิทธิภาพด้านทรัพยากร (Efficiency) ควบคู่ด้วยเสมอ',
    tasks: [
      'เลือก Primary Metrics ที่เหมาะสมกับลักษณะของปัญหาและชุดข้อมูล',
      'เลือก Secondary / Efficiency Metrics เพื่อประเมินเวลาและทรัพยากร',
      'ระบุสูตรคำนวณทางคณิตศาสตร์ (LaTeX) และเหตุผลที่เลือกใช้',
      'กำหนดเกณฑ์ตัดสินความสำเร็จ (Success Criteria)'
    ],
    dod: [
      { id: 'e_dod_1', label: 'เลือก Primary Metrics สอดคล้องกับลักษณะการกระจายตัวของข้อมูล' },
      { id: 'e_dod_2', label: 'เลือก Secondary Metrics เพื่อวัดความเร็วและทรัพยากรการประมวลผล' },
      { id: 'e_dod_3', label: 'ระบุสูตรคำนวณทางคณิตศาสตร์และเกณฑ์ตัดสินความสำเร็จชัดเจน' }
    ],
    template: {
      successCriteria: 'เกณฑ์ความสำเร็จ: โมเดลที่นำเสนอต้องมีค่า Macro F1-Score สูงกว่า Baseline ทุกตัวอย่างน้อย 3% และมี Inference Latency ไม่เกิน 30 ms ต่อตัวอย่าง',
      metrics: [
        { id: 'm-1', name: 'Macro F1-Score (Primary)', formula: '2 * (Precision * Recall) / (Precision + Recall)', why: 'เป็นตัวชี้วัดหลักเนื่องจากข้อมูลมีปัญหา Class Imbalance ตัววัดนี้ให้ความสำคัญกับทุกคลาสเท่าเทียมกัน' },
        { id: 'm-2', name: 'Accuracy (Secondary)', formula: '(TP + TN) / (TP + TN + FP + FN)', why: 'ใช้วัดสัดส่วนความถูกต้องในภาพรวมเพื่อเทียบเคียงกับงานวิจัยรุ่นก่อน' },
        { id: 'm-3', name: 'Inference Latency (Efficiency)', formula: 'Time (ms) / Sample', why: 'วัดระยะเวลาการประมวลผลต่อตัวอย่าง เพื่อพิสูจน์ความเป็นไปได้ในการนำไปใช้งานจริง' }
      ]
    }
  },

  results: {
    stepKey: 'results',
    title: 'Results & Discussion',
    thTitle: 'ผลการทดลองและการอภิปรายผล',
    mindset: 'ตัวเลขผลลัพธ์เป็นเพียงจุดเริ่มต้น หัวใจของนักวิจัยคือการตอบคำถามว่า "ทำไมผลถึงดีขึ้นหรือแย่ลง" ทำการทดลองตัดส่วนประกอบ (Ablation Study) และตอบคำถามวิจัย (RQ) ให้ครบถ้วน',
    tasks: [
      'บันทึกประวัติการรันทดลองแต่ละรอบ (Iteration Log) และปักหมุด Main Result',
      'สร้างตารางเปรียบเทียบผลลัพธ์ระหว่าง Proposed Method กับ Baseline ทุกตัว',
      'จัดทำผลการทดลอง Ablation Study เพื่อพิสูจน์คุณค่าของแต่ละโมดูลย่อย',
      'วิเคราะห์เคสที่โมเดลทำนายผิดพลาด (Error Analysis)',
      'สรุปคำตอบของคำถามวิจัย (RQ Resolution: RQ1, RQ2...) ให้ครบถ้วน'
    ],
    dod: [
      { id: 'r_dod_1', label: 'บันทึกรอบการทดลองย่อย (Iteration Runs) พร้อมปักหมุด Main Result' },
      { id: 'r_dod_2', label: 'จัดทำตารางเปรียบเทียบผลลัพธ์ระหว่าง Proposed Method กับ Baselines ครบถ้วน' },
      { id: 'r_dod_3', label: 'มีผลการทดลอง Ablation Study ยืนยันความสำคัญของแต่ละโมดูล' },
      { id: 'r_dod_4', label: 'วิเคราะห์ Error Cases และสรุปคำตอบของคำถามวิจัย (RQ Resolution) ครบทุกข้อ' }
    ],
    template: {
      runs: [
        { id: 'run-1', name: 'Run #1 - Baseline Standard', date: new Date().toISOString().split('T')[0], params: 'lr=1e-4, epochs=50, batch=32', result: 'Acc: 87.2%, F1: 85.6%, Latency: 22ms', main: false },
        { id: 'run-2', name: 'Run #2 - Proposed Architecture', date: new Date().toISOString().split('T')[0], params: 'lr=1e-4, Novel Attention, Focal Loss', result: 'Acc: 92.4%, F1: 91.8%, Latency: 26ms', main: true }
      ],
      table: {
        cols: ['Method', 'Accuracy (%)', 'F1-Score (%)', 'Latency (ms)'],
        rows: [
          ['Baseline (Standard)', '87.2', '85.6', '22.1'],
          ['Baseline SOTA Ref', '89.5', '88.1', '35.4'],
          ['Proposed Method (Ours)', '92.4', '91.8', '26.8']
        ]
      },
      ablation: 'ผลการทดลองตัดส่วนประกอบ (Ablation Study):\n- โมเดลตัวเต็ม (Ours): F1 = 91.8%\n- ตัด Novel Attention ออก (ใช้ Standard Self-Attention): F1 ลดลงเหลือ 88.4% (-3.4%)\n- ตัด Focal Loss ออก (ใช้ Cross-Entropy): F1 ลดลงเหลือ 89.1% (-2.7%)\nสรุป: การทดลองยืนยันว่า Novel Attention มีบทบาทสำคัญที่สุดในการจับความสัมพันธ์ของฟีเจอร์วิกฤต',
      discussion: 'การวิเคราะห์และสรุปตอบคำถามวิจัย (RQ Resolution):\n1. ตอบ RQ1: โมเดลที่นำเสนอสามารถทำคะแนน F1 สูงกว่า Baseline เดิม 6.2% และเหนือกว่า SOTA 3.7% อย่างมีนัยสำคัญทางสถิติ (p < 0.01)\n2. ตอบ RQ2: ด้านต้นทุนเวลา แม้โมเดลจะมีพารามิเตอร์เพิ่มขึ้นเล็กน้อย แต่ Latency เพิ่มขึ้นเพียง 4.7ms ซึ่งยังอยู่ในเกณฑ์ที่ยอมรับได้สำหรับการใช้งานจริง\n\nการวิเคราะห์ข้อผิดพลาด (Error Analysis):\nพบว่าเคสที่ทำนายผิดพลาดส่วนใหญ่ (65% ของ Errors) เกิดจากกรณีที่ข้อมูลตัวอย่างมีสัญญาณรบกวนสูงมากหรือข้อมูลขาดความสมบูรณ์ ซึ่งสามารถแก้ไขได้ในงานวิจัยขั้นถัดไป'
    }
  }
}
