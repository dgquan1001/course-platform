import ActionForm from '@/components/ActionForm'
import SubmitButton from '@/components/SubmitButton'
import { setUserRole } from '../actions'

export type RoleTarget = { id: string; role: string; name: string }

const roleOptions = [
  { value: 'user', label: 'Bệnh nhân' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'admin', label: 'Admin' },
]

// Ô chọn vai trò (chỉ admin thấy; database chặn tự đổi quyền của mình và gỡ admin cuối cùng)
export default function RoleForm({ target }: { target: RoleTarget }) {
  return (
    <ActionForm key={target.role} action={setUserRole.bind(null, target.id)} className="flex items-center gap-2">
      <label htmlFor={`role-${target.id}`} className="sr-only">
        Vai trò của {target.name}
      </label>
      <select id={`role-${target.id}`} name="role" defaultValue={target.role} className="input w-32 py-1.5 text-sm">
        {roleOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <SubmitButton
        className="btn btn-sm whitespace-nowrap border border-ocean-200 bg-white text-ocean-700 hover:bg-ocean-50"
        confirmMessage={`Đổi vai trò của ${target.name}? Nhân viên: duyệt đơn, quản lý bệnh nhân, phiếu tham vấn. Admin: toàn quyền, kể cả sửa khóa học và phân quyền. Bệnh nhân: không vào được trang quản trị.`}
      >
        Lưu vai trò
      </SubmitButton>
    </ActionForm>
  )
}
