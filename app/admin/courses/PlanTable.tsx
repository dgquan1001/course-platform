import ActionForm from '@/components/ActionForm'
import SubmitButton from '@/components/SubmitButton'
import { formatPrice } from '@/lib/site-config'
import { PLAN_MONTHS, SESSIONS_PER_MONTH, planLabel, type Plan } from '@/lib/courses'
import { createPlan, deletePlan, updatePlan } from '../actions'

// Bảng gói theo thời hạn của một chương trình: sửa giá / số buổi / đang bán, xóa, thêm gói còn thiếu
export default function PlanTable({ courseId, plans }: { courseId: string; plans: Plan[] }) {
  const missing = PLAN_MONTHS.filter((m) => !plans.some((p) => p.months === m))
  return (
    <section aria-label="Gói theo thời hạn" className="mt-3 border-t border-slate-100 pt-3">
      <p className="text-sm font-semibold text-ocean-900">
        Gói theo thời hạn {!plans.length && <span className="font-normal text-red-600">– chưa có gói, chương trình chưa nhận đăng ký</span>}
      </p>
      <ul className="mt-2 space-y-2">
        {plans.map((p) => (
          <li key={p.id} className="flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-2.5 text-sm">
            <ActionForm
              key={`${p.price}|${p.sessions}|${p.active}`}
              action={updatePlan.bind(null, p.id, p.months)}
              className="flex flex-wrap items-end gap-2"
            >
              <span className="w-20 pb-2 font-semibold text-ocean-900">Gói {planLabel(p.months)}</span>
              <label className="text-xs text-slate-500">
                Giá (VNĐ)
                <input name="price" type="number" min={0} step={1000} defaultValue={p.price} className="input mt-0.5 w-32 py-1.5 text-sm" />
              </label>
              <label className="text-xs text-slate-500">
                Số buổi
                <input name="sessions" type="number" min={1} max={500} defaultValue={p.sessions} className="input mt-0.5 w-20 py-1.5 text-sm" />
              </label>
              <label className="flex items-center gap-1.5 pb-2 text-xs text-slate-600">
                <input name="active" type="checkbox" defaultChecked={p.active} /> Đang bán
              </label>
              <SubmitButton className="btn-outline btn-sm">Lưu gói</SubmitButton>
            </ActionForm>
            <ActionForm action={deletePlan.bind(null, p.id)}>
              <SubmitButton
                className="btn btn-sm text-red-600 hover:bg-red-50"
                confirmMessage={`Xóa gói ${planLabel(p.months)} (${formatPrice(p.price)})? Đơn đã đăng ký gói này vẫn giữ nguyên thông tin gói.`}
              >
                Xóa
              </SubmitButton>
            </ActionForm>
          </li>
        ))}
      </ul>
      {!!missing.length && (
        <ActionForm action={createPlan.bind(null, courseId)} resetOnSuccess className="mt-2 flex flex-wrap items-end gap-2 text-sm">
          <label className="text-xs text-slate-500">
            Thêm gói
            <select name="months" className="input mt-0.5 w-28 py-1.5 text-sm">
              {missing.map((m) => (
                <option key={m} value={m}>
                  {planLabel(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Giá (VNĐ)
            <input name="price" type="number" min={0} step={1000} required className="input mt-0.5 w-32 py-1.5 text-sm" />
          </label>
          <label className="text-xs text-slate-500">
            Số buổi
            <input
              name="sessions"
              type="number"
              min={1}
              max={500}
              placeholder={`${SESSIONS_PER_MONTH}/tháng`}
              className="input mt-0.5 w-24 py-1.5 text-sm"
            />
          </label>
          <SubmitButton className="btn-primary btn-sm">Thêm gói</SubmitButton>
        </ActionForm>
      )}
    </section>
  )
}
