import { reactive, ref, watch } from 'vue'

export type StepStatus = 'not_started' | 'in_progress' | 'under_review' | 'completed'

export const STATUS_OPTIONS: { value: StepStatus; label: string; pct: number }[] = [
  { value: 'not_started', label: 'ยังไม่เริ่ม', pct: 0 },
  { value: 'in_progress', label: 'กำลังทำ', pct: 50 },
  { value: 'under_review', label: 'รอตรวจสอบ/แก้ไข', pct: 80 },
  { value: 'completed', label: 'เสร็จสิ้น', pct: 100 }
]

export const STEPS = [
  { key: 'problem', no: 1, title: 'Problem', th: 'ที่มาและความสำคัญของปัญหา' },
  { key: 'objective', no: 2, title: 'Objective', th: 'วัตถุประสงค์และขอบเขตงานวิจัย' },
  { key: 'method', no: 3, title: 'Method', th: 'ระเบียบวิธีวิจัยและสถาปัตยกรรม' },
  { key: 'setup', no: 4, title: 'Experiment Setup', th: 'การตั้งค่าการทดลองและเตรียมข้อมูล' },
  { key: 'metrics', no: 5, title: 'Evaluate Metrics', th: 'ตัวชี้วัดประสิทธิภาพ' },
  { key: 'results', no: 6, title: 'Results & Discussion', th: 'ผลการทดลองและการอภิปรายผล' }
] as const

const KEY = 'rf_wf_'
const SAVE_DELAY = 2000

const step = (data: Record<string, any>) => ({ status: 'not_started' as StepStatus, linked: [] as string[], data })

export const newId = () => Math.random().toString(36).slice(2, 9)

const defaults = () => ({
  steps: {
    problem: step({ statement: '', gap: '', rqs: [] as { id: string; text: string }[] }),
    objective: step({ objectives: [] as { id: string; text: string; done: boolean }[], scope: '' }),
    method: step({ images: [] as string[], blocks: [] as { id: string; title: string; body: string }[] }),
    setup: step({
      dsName: '', dsSource: '', dsSize: '', dsSplit: '', dsClean: '',
      env: '',
      hyper: [] as { id: string; k: string; v: string }[],
      baselines: [] as { id: string; text: string }[]
    }),
    metrics: step({ metrics: [] as { id: string; name: string; formula: string; why: string }[] }),
    results: step({
      runs: [] as { id: string; name: string; date: string; params: string; result: string; main: boolean }[],
      table: { cols: ['Method', 'Accuracy', 'F1'], rows: [['Baseline', '', ''], ['Proposed', '', '']] },
      charts: [] as string[],
      ablation: '',
      discussion: ''
    })
  } as Record<string, ReturnType<typeof step>>,
  matrix: {} as Record<string, Record<string, string>>,
  notes: {} as Record<string, string>,
  conclusion: { contrib: '', future: '', feedback: [] as { id: string; date: string; text: string; done: boolean }[] },
  ui: { fileId: null as string | null, step: 'problem' }
})

export type WfState = ReturnType<typeof defaults>

// fill missing keys from defaults, keep everything the user saved
const merge = (base: any, saved: any): any => {
  if (base === null || typeof base !== 'object' || Array.isArray(base)) return saved === undefined ? base : saved
  const out: any = {}
  for (const k of Object.keys(base)) out[k] = merge(base[k], saved?.[k])
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    for (const k of Object.keys(saved)) if (!(k in out)) out[k] = saved[k]
  }
  return out
}

const store = reactive<Record<string, WfState>>({})
const saveStatus = ref<'saved' | 'saving'>('saved')
let timer: ReturnType<typeof setTimeout> | null = null
let skipNext = false

const flush = () => {
  if (timer) clearTimeout(timer)
  timer = null
  Object.keys(store).forEach(id => localStorage.setItem(KEY + id, JSON.stringify(store[id])))
  saveStatus.value = 'saved'
}

if (typeof window !== 'undefined') {
  // debounced auto-save: 2s after the user stops typing
  watch(store, () => {
    if (skipNext) {
      skipNext = false
      return
    }
    saveStatus.value = 'saving'
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, SAVE_DELAY)
  }, { deep: true })
  window.addEventListener('beforeunload', () => {
    if (timer) flush()
  })
}

export const loadWorkflow = (nbId: string) => {
  if (!nbId || typeof window === 'undefined' || store[nbId]) return
  let saved: any = null
  try {
    saved = JSON.parse(localStorage.getItem(KEY + nbId) || 'null')
  } catch {
    saved = null
  }
  skipNext = true
  store[nbId] = merge(defaults(), saved)
}

export const useWorkflow = () => {
  const wf = (nbId: string | null | undefined) => {
    if (!nbId) return undefined
    if (!store[nbId]) loadWorkflow(nbId)
    return store[nbId]
  }

  // overall progress = average of the 6 core steps
  const overallProgress = (nbId: string | null | undefined) => {
    const s = wf(nbId)
    if (!s) return 0
    const pcts = STEPS.map(st => STATUS_OPTIONS.find(o => o.value === s.steps[st.key].status)?.pct ?? 0)
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
  }

  const exportMarkdown = (nbId: string, nbName: string, fileTitle: (id: string) => string) => {
    const s = wf(nbId)
    if (!s) return ''
    const st = (k: string) => STATUS_OPTIONS.find(o => o.value === s.steps[k].status)?.label
    const links = (k: string) =>
      s.steps[k].linked.length ? `\n**Reference papers:** ${s.steps[k].linked.map(fileTitle).join(', ')}\n` : ''
    const p = s.steps.problem.data
    const o = s.steps.objective.data
    const m = s.steps.method.data
    const e = s.steps.setup.data
    const r = s.steps.results.data
    const L: string[] = [`# ${nbName}`, '', `Overall progress: ${overallProgress(nbId)}%`, '']

    L.push(`## 1. Problem (${st('problem')})`, '', '### Problem Statement', p.statement, '', '### Research Gap', p.gap, '', '### Research Questions')
    p.rqs.forEach((q: any, i: number) => L.push(`- RQ${i + 1}: ${q.text}`))
    L.push(links('problem'), `## 2. Objective (${st('objective')})`, '', '### Objectives')
    o.objectives.forEach((x: any) => L.push(`- [${x.done ? 'x' : ' '}] ${x.text}`))
    L.push('', '### Scope & Limitations', o.scope, '')
    L.push(`## 3. Method (${st('method')})`, '')
    m.blocks.forEach((b: any, i: number) => L.push(`### 3.${i + 1} ${b.title}`, b.body, ''))
    L.push(links('method'), `## 4. Experiment Setup (${st('setup')})`, '')
    L.push('### Dataset', `- Name: ${e.dsName}`, `- Source: ${e.dsSource}`, `- Size/Classes: ${e.dsSize}`, `- Split: ${e.dsSplit}`, `- Preprocessing: ${e.dsClean}`, '')
    L.push('### Environment', e.env, '', '### Hyperparameters')
    e.hyper.forEach((h: any) => L.push(`- ${h.k}: ${h.v}`))
    L.push('', '### Baseline Models')
    e.baselines.forEach((b: any) => L.push(`- ${b.text}`))
    L.push('', `## 5. Evaluate Metrics (${st('metrics')})`, '')
    s.steps.metrics.data.metrics.forEach((x: any) => L.push(`### ${x.name}`, `Formula: ${x.formula}`, '', `Why: ${x.why}`, ''))
    L.push(`## 6. Results & Discussion (${st('results')})`, '', '### Experiment Runs')
    r.runs.forEach((x: any) => L.push(`- ${x.main ? '★ ' : ''}${x.name} (${x.date}) — params: ${x.params} — result: ${x.result}`))
    L.push('', '### Comparison Table', `| ${r.table.cols.join(' | ')} |`, `| ${r.table.cols.map(() => '---').join(' | ')} |`)
    r.table.rows.forEach((row: string[]) => L.push(`| ${row.join(' | ')} |`))
    L.push('', '### Ablation Study & Error Analysis', r.ablation, '', '### Discussion & Key Findings', r.discussion, '')
    L.push('## Conclusion', '', '### Key Contributions', s.conclusion.contrib, '', '### Future Work', s.conclusion.future, '', '### Advisor Feedback')
    s.conclusion.feedback.forEach((f: any) => L.push(`- [${f.done ? 'x' : ' '}] ${f.date}: ${f.text}`))
    return L.join('\n')
  }

  const downloadMarkdown = (nbId: string, nbName: string, fileTitle: (id: string) => string) => {
    const md = exportMarkdown(nbId, nbName, fileTitle)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nbName.replace(/\s+/g, '_')}_research_flow.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return { store, saveStatus, wf, overallProgress, exportMarkdown, downloadMarkdown, flush, loadWorkflow }
}
