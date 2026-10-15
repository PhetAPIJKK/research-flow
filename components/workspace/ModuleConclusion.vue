<script setup lang="ts">
import { newId } from '~/composables/useWorkflow'

const props = defineProps<{
  conclusion: {
    contrib: string
    future: string
    feedback: { id: string; date: string; text: string; done: boolean }[]
  }
}>()

const addFeedback = () => {
  if (!props.conclusion.feedback) props.conclusion.feedback = []
  props.conclusion.feedback.push({
    id: newId(),
    date: new Date().toISOString().split('T')[0],
    text: '',
    done: false
  })
}

const removeFeedback = (index: number) => {
  props.conclusion.feedback.splice(index, 1)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-sm font-bold text-zinc-900 flex items-center gap-2">
        <span>🏁 Conclusion & Advisor Feedback Log</span>
        <span class="text-xs font-normal text-zinc-500">สรุปภาพรวมและบันทึกข้อเสนอแนะอาจารย์</span>
      </h3>
      <p class="text-[11px] text-zinc-500 mt-0.5">
        บันทึกคุณูปการสำคัญ แนวทางต่อยอด และรายการสิ่งที่ต้องแก้ไขตามคำแนะนำของอาจารย์ที่ปรึกษา / ผู้ทรงคุณวุฒิ
      </p>
    </div>

    <!-- Key Contributions -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        คุณูปการสำคัญของงานวิจัย (Key Contributions)
      </label>
      <textarea
        v-model="conclusion.contrib"
        rows="4"
        placeholder="สรุป 3-4 ประเด็นสำคัญที่เป็นองค์ความรู้ใหม่ หรือประโยชน์ที่ได้จากงานวิจัยนี้..."
        class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white placeholder:text-zinc-400 leading-relaxed"
      ></textarea>
    </div>

    <!-- Future Work -->
    <div class="space-y-1.5">
      <label class="text-xs font-semibold text-zinc-800 block">
        แนวทางการพัฒนาต่อในอนาคต (Future Work)
      </label>
      <textarea
        v-model="conclusion.future"
        rows="3"
        placeholder="ข้อเสนอแนะสำหรับการต่อยอด การขยายผลไปยังโดเมนอื่น หรือการปรับปรุงโมเดลขั้นต่อไป..."
        class="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white placeholder:text-zinc-400 leading-relaxed"
      ></textarea>
    </div>

    <!-- Feedback & Revision Checklist -->
    <div class="space-y-2.5 pt-3 border-t border-zinc-100">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
          <span>บันทึกคอมเมนต์และรายการแก้ไข (Advisor Feedback & Revision)</span>
          <span v-if="conclusion.feedback && conclusion.feedback.length" class="text-[11px] text-zinc-400 font-normal">
            ({{ conclusion.feedback.filter(f => f.done).length }}/{{ conclusion.feedback.length }} แก้ไขแล้ว)
          </span>
        </label>
        <button
          type="button"
          class="text-xs px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 font-medium transition-colors"
          @click="addFeedback"
        >
          + เพิ่มคอมเมนต์
        </button>
      </div>

      <div v-if="conclusion.feedback && conclusion.feedback.length" class="space-y-2">
        <div
          v-for="(item, idx) in conclusion.feedback"
          :key="item.id"
          class="bg-zinc-50 rounded-lg border p-2.5 space-y-2 transition-colors"
          :class="item.done ? 'bg-emerald-50/40 border-emerald-200/80' : 'border-zinc-200'"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <input
                v-model="item.done"
                type="checkbox"
                class="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-800 cursor-pointer w-4 h-4"
              />
              <span class="text-xs font-semibold text-zinc-700 select-none">คอมเมนต์ #{{ idx + 1 }}</span>
              <input
                v-model="item.date"
                type="date"
                class="text-[11px] px-2 py-0.5 border border-zinc-200 rounded bg-white text-zinc-600"
              />
            </div>
            <button
              type="button"
              class="text-zinc-400 hover:text-red-600 text-xs px-1.5 py-0.5 rounded hover:bg-red-50"
              title="ลบรายการนี้"
              @click="removeFeedback(idx)"
            >
              🗑
            </button>
          </div>
          <textarea
            v-model="item.text"
            rows="2"
            placeholder="เช่น อาจารย์แนะนำให้เพิ่ม baseline transformer ในตาราง และปรับคำอธิบายในส่วน rq2..."
            class="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
            :class="item.done ? 'line-through text-zinc-500' : 'text-zinc-800'"
          ></textarea>
        </div>
      </div>
      <div v-else class="text-[11px] text-zinc-400 italic bg-zinc-50/50 p-3 rounded-lg border border-dashed border-zinc-200 text-center">
        ยังไม่มีบันทึกคอมเมนต์จากอาจารย์ที่ปรึกษา กด "+ เพิ่มคอมเมนต์" เพื่อจดบันทึก
      </div>
    </div>
  </div>
</template>
