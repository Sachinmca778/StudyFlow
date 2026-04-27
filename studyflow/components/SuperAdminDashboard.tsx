'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  LayoutDashboard, Building2, Users, IndianRupee, LogOut,
  Search, Eye, Shield, ChevronRight, CheckCircle, XCircle,
  BarChart3, RefreshCw, GraduationCap, UserCheck, Bell,
  TrendingUp, Calendar, BookOpen, Award
} from 'lucide-react'

type SuperAdmin = { id: string; email: string; name: string }

type InstituteRow = {
  id: string; name: string; email: string; phone: string
  city: string | null; state: string | null; address: string | null
  subscription_plan: string; is_active: boolean
  total_students: number; total_staff: number
  established_year: number | null; registration_number: string | null
  created_at: string; admin_user_id: string
}

type GlobalStats = {
  totalInstitutes: number; activeInstitutes: number; inactiveInstitutes: number
  totalStudents: number; activeStudents: number
  totalStaff: number; totalBatches: number; activeBatches: number
  totalRevenue: number; thisMonthRevenue: number; pendingFees: number
  totalAssignments: number; totalAttendanceRecords: number
  freeInstitutes: number; basicInstitutes: number; premiumInstitutes: number
  newThisMonth: number
}

type InstituteDetail = {
  allStudents: any[]; studentsByClass: Record<string, number>
  activeStudents: number; inactiveStudents: number
  batches: any[]; staff: any[]
  totalRevenue: number; thisMonthRevenue: number; pendingFees: number
  totalAssignments: number; attendanceToday: number
  recentPayments: any[]; announcements: any[]
}


export default function SuperAdminDashboard({ superAdmin }: { superAdmin: SuperAdmin }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'institutes' | 'students' | 'detail'>('overview')
  const [institutes, setInstitutes] = useState<InstituteRow[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteRow | null>(null)
  const [detail, setDetail] = useState<InstituteDetail | null>(null)
  const [stats, setStats] = useState<GlobalStats>({
    totalInstitutes: 0, activeInstitutes: 0, inactiveInstitutes: 0,
    totalStudents: 0, activeStudents: 0, totalStaff: 0,
    totalBatches: 0, activeBatches: 0,
    totalRevenue: 0, thisMonthRevenue: 0, pendingFees: 0,
    totalAssignments: 0, totalAttendanceRecords: 0,
    freeInstitutes: 0, basicInstitutes: 0, premiumInstitutes: 0, newThisMonth: 0,
  })
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [studentSearch, setStudentSearch] = useState('')
  const [studentClassFilter, setStudentClassFilter] = useState('all')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchInstitutes(), fetchGlobalStats(), fetchAllStudents()])
    setLoading(false)
  }

  const fetchInstitutes = async () => {
    const { data } = await supabase.from('institutes').select('*').order('created_at', { ascending: false })
    if (data) setInstitutes(data)
  }

  const fetchAllStudents = async () => {
    const { data } = await supabase
      .from('institute_students')
      .select('id, student_name, phone, class_level, status, enrollment_number, created_at, institute_id, institute:institutes(name)')
      .order('created_at', { ascending: false })
    if (data) setAllStudents(data)
  }

  const fetchGlobalStats = async () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    const today = new Date().toISOString().split('T')[0]
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [inst, students, batches, staff, payments, pendingPay, assignments, attendance] = await Promise.all([
      supabase.from('institutes').select('subscription_plan, is_active, created_at'),
      supabase.from('institute_students').select('status'),
      supabase.from('batches').select('is_active'),
      supabase.from('institute_staff').select('id'),
      supabase.from('fee_payments').select('amount, payment_date').eq('status', 'paid'),
      supabase.from('fee_payments').select('amount').in('status', ['pending', 'overdue']),
      supabase.from('institute_assignments').select('id'),
      supabase.from('student_attendance').select('id').eq('attendance_date', today),
    ])

    const instData = inst.data ?? []
    const studData = students.data ?? []
    const batchData = batches.data ?? []
    const payData = payments.data ?? []
    const pendData = pendingPay.data ?? []

    const thisMonthRevenue = payData
      .filter(p => new Date(p.payment_date) >= new Date(thisMonthStart))
      .reduce((s, p) => s + Number(p.amount), 0)

    const newThisMonth = instData.filter(i => new Date(i.created_at) >= new Date(thisMonthStart)).length

    setStats({
      totalInstitutes: instData.length,
      activeInstitutes: instData.filter(i => i.is_active).length,
      inactiveInstitutes: instData.filter(i => !i.is_active).length,
      totalStudents: studData.length,
      activeStudents: studData.filter(s => s.status === 'active').length,
      totalStaff: (staff.data ?? []).length,
      totalBatches: batchData.length,
      activeBatches: batchData.filter(b => b.is_active).length,
      totalRevenue: payData.reduce((s, p) => s + Number(p.amount), 0),
      thisMonthRevenue,
      pendingFees: pendData.reduce((s, p) => s + Number(p.amount), 0),
      totalAssignments: (assignments.data ?? []).length,
      totalAttendanceRecords: (attendance.data ?? []).length,
      freeInstitutes: instData.filter(i => i.subscription_plan === 'free').length,
      basicInstitutes: instData.filter(i => i.subscription_plan === 'basic').length,
      premiumInstitutes: instData.filter(i => i.subscription_plan === 'premium').length,
      newThisMonth,
    })
  }

  const viewDetail = async (inst: InstituteRow) => {
    setSelectedInstitute(inst)
    setActiveTab('detail')
    setDetailLoading(true)

    const today = new Date().toISOString().split('T')[0]
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [students, batches, staff, payments, pendingPay, assignments, attendance, announcements] = await Promise.all([
      supabase.from('institute_students').select('*').eq('institute_id', inst.id).order('created_at', { ascending: false }),
      supabase.from('batches').select('*').eq('institute_id', inst.id),
      supabase.from('institute_staff').select('*').eq('institute_id', inst.id),
      supabase.from('fee_payments').select('amount, payment_date, student:institute_students(student_name)').eq('institute_id', inst.id).eq('status', 'paid').order('payment_date', { ascending: false }).limit(5),
      supabase.from('fee_payments').select('amount').eq('institute_id', inst.id).in('status', ['pending', 'overdue']),
      supabase.from('institute_assignments').select('id').eq('institute_id', inst.id),
      supabase.from('student_attendance').select('id').eq('institute_id', inst.id).eq('attendance_date', today).eq('status', 'present'),
      supabase.from('announcements').select('title, announcement_type, created_at').eq('institute_id', inst.id).order('created_at', { ascending: false }).limit(5),
    ])

    const studData = students.data ?? []
    const payData = payments.data ?? []
    const allPayments = await supabase.from('fee_payments').select('amount').eq('institute_id', inst.id).eq('status', 'paid')

    // Group students by class
    const byClass: Record<string, number> = {}
    studData.forEach(s => {
      const cls = s.class_level || 'Unassigned'
      byClass[cls] = (byClass[cls] || 0) + 1
    })

    const thisMonthRevenue = payData
      .filter(p => new Date(p.payment_date) >= new Date(thisMonthStart))
      .reduce((s, p) => s + Number(p.amount), 0)

    setDetail({
      allStudents: studData,
      studentsByClass: byClass,
      activeStudents: studData.filter(s => s.status === 'active').length,
      inactiveStudents: studData.filter(s => s.status !== 'active').length,
      batches: batches.data ?? [],
      staff: staff.data ?? [],
      totalRevenue: (allPayments.data ?? []).reduce((s, p) => s + Number(p.amount), 0),
      thisMonthRevenue,
      pendingFees: (pendingPay.data ?? []).reduce((s, p) => s + Number(p.amount), 0),
      totalAssignments: (assignments.data ?? []).length,
      attendanceToday: (attendance.data ?? []).length,
      recentPayments: payData,
      announcements: announcements.data ?? [],
    })

    await supabase.from('super_admin_logs').insert({
      super_admin_id: superAdmin.id,
      action: 'viewed_institute',
      target_type: 'institute',
      target_id: inst.id,
      details: { institute_name: inst.name },
    })

    setDetailLoading(false)
  }

  const updatePlan = async (id: string, plan: string) => {
    await supabase.from('institutes').update({ subscription_plan: plan }).eq('id', id)
    await supabase.from('super_admin_logs').insert({
      super_admin_id: superAdmin.id, action: 'updated_subscription',
      target_type: 'institute', target_id: id, details: { new_plan: plan },
    })
    fetchInstitutes()
    if (selectedInstitute?.id === id) setSelectedInstitute(p => p ? { ...p, subscription_plan: plan } : null)
  }

  const toggleStatus = async (inst: InstituteRow) => {
    await supabase.from('institutes').update({ is_active: !inst.is_active }).eq('id', inst.id)
    await supabase.from('super_admin_logs').insert({
      super_admin_id: superAdmin.id,
      action: inst.is_active ? 'deactivated_institute' : 'activated_institute',
      target_type: 'institute', target_id: inst.id, details: { name: inst.name },
    })
    fetchInstitutes()
    if (selectedInstitute?.id === inst.id) setSelectedInstitute(p => p ? { ...p, is_active: !inst.is_active } : null)
  }

  const planBadge = (plan: string) => {
    const s: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      premium: 'bg-purple-100 text-purple-700',
    }
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${s[plan] ?? s.free}`}>{plan}</span>
  }

  const filteredInstitutes = institutes.filter(i => {
    const q = searchQuery.toLowerCase()
    const matchQ = i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || (i.city ?? '').toLowerCase().includes(q)
    const matchP = filterPlan === 'all' || i.subscription_plan === filterPlan
    const matchS = filterStatus === 'all' || (filterStatus === 'active' ? i.is_active : !i.is_active)
    return matchQ && matchP && matchS
  })

  const uniqueClasses = Array.from(new Set(allStudents.map(s => s.class_level).filter(Boolean)))
  const filteredStudents = allStudents.filter(s => {
    const q = studentSearch.toLowerCase()
    const matchQ = s.student_name.toLowerCase().includes(q) || s.phone?.includes(q) || (s.enrollment_number ?? '').toLowerCase().includes(q)
    const matchC = studentClassFilter === 'all' || s.class_level === studentClassFilter
    return matchQ && matchC
  })

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'institutes', label: 'All Institutes', icon: Building2, badge: institutes.length },
    { id: 'students', label: 'All Students', icon: Users, badge: stats.totalStudents },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen fixed left-0 top-0 bottom-0 z-10">
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg"><Shield className="w-5 h-5 text-gray-900" /></div>
            <div>
              <p className="font-bold text-sm">Super Admin</p>
              <p className="text-xs text-gray-400 truncate max-w-[140px]">{superAdmin.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = activeTab === item.id || (item.id === 'institutes' && activeTab === 'detail')
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left ${active ? 'bg-yellow-500 text-gray-900 font-semibold' : 'text-gray-300 hover:bg-gray-800'}`}
              >
                <span className="flex items-center gap-3"><Icon className="w-5 h-5 flex-shrink-0" />{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${active ? 'bg-gray-900 text-yellow-400' : 'bg-gray-700 text-gray-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button onClick={() => { supabase.auth.signOut(); window.location.reload() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" /><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 overflow-y-auto p-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab stats={stats} institutes={institutes} onViewDetail={viewDetail} onRefresh={fetchAll} planBadge={planBadge} />}
            {activeTab === 'institutes' && <InstitutesTab institutes={filteredInstitutes} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterPlan={filterPlan} setFilterPlan={setFilterPlan} filterStatus={filterStatus} setFilterStatus={setFilterStatus} onViewDetail={viewDetail} onUpdatePlan={updatePlan} onToggleStatus={toggleStatus} planBadge={planBadge} />}
            {activeTab === 'students' && <StudentsTab students={filteredStudents} total={allStudents.length} search={studentSearch} setSearch={setStudentSearch} classFilter={studentClassFilter} setClassFilter={setStudentClassFilter} uniqueClasses={uniqueClasses} />}
            {activeTab === 'detail' && selectedInstitute && (
              <DetailTab inst={selectedInstitute} detail={detail} loading={detailLoading} onBack={() => setActiveTab('institutes')} onUpdatePlan={updatePlan} onToggleStatus={toggleStatus} planBadge={planBadge} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ stats, institutes, onViewDetail, onRefresh, planBadge }: any) {
  const statCards = [
    { label: 'Total Institutes', value: stats.totalInstitutes, sub: `${stats.newThisMonth} new this month`, icon: Building2, grad: 'from-blue-500 to-blue-600' },
    { label: 'Active Institutes', value: stats.activeInstitutes, sub: `${stats.inactiveInstitutes} inactive`, icon: CheckCircle, grad: 'from-green-500 to-green-600' },
    { label: 'Total Students', value: stats.totalStudents.toLocaleString(), sub: `${stats.activeStudents} active`, icon: Users, grad: 'from-purple-500 to-purple-600' },
    { label: 'Total Staff', value: stats.totalStaff, sub: 'across all institutes', icon: UserCheck, grad: 'from-indigo-500 to-indigo-600' },
    { label: 'Total Batches', value: stats.totalBatches, sub: `${stats.activeBatches} active`, icon: GraduationCap, grad: 'from-pink-500 to-pink-600' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, sub: `₹${stats.thisMonthRevenue.toLocaleString()} this month`, icon: IndianRupee, grad: 'from-orange-500 to-orange-600' },
    { label: 'Pending Fees', value: `₹${stats.pendingFees.toLocaleString()}`, sub: 'to be collected', icon: TrendingUp, grad: 'from-red-500 to-red-600' },
    { label: 'Assignments', value: stats.totalAssignments, sub: 'total created', icon: BookOpen, grad: 'from-teal-500 to-teal-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-500 text-sm">Complete view of all institutes on StudyFlow</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* 8 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${card.grad} mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm font-medium text-gray-700">{card.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Plan breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-purple-500" /> Subscription Plans</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { plan: 'Free', count: stats.freeInstitutes, pct: stats.totalInstitutes ? Math.round(stats.freeInstitutes / stats.totalInstitutes * 100) : 0, bar: 'bg-gray-400' },
            { plan: 'Basic', count: stats.basicInstitutes, pct: stats.totalInstitutes ? Math.round(stats.basicInstitutes / stats.totalInstitutes * 100) : 0, bar: 'bg-blue-500' },
            { plan: 'Premium', count: stats.premiumInstitutes, pct: stats.totalInstitutes ? Math.round(stats.premiumInstitutes / stats.totalInstitutes * 100) : 0, bar: 'bg-purple-500' },
          ].map(p => (
            <div key={p.plan} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-3xl font-bold text-gray-900">{p.count}</p>
              <p className="text-sm font-medium text-gray-600 mb-2">{p.plan} Plan</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${p.bar} h-2 rounded-full`} style={{ width: `${p.pct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{p.pct}% of total</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent institutes table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Recently Joined Institutes</h3>
          <span className="text-xs text-gray-400">Latest 5</span>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{['Institute', 'Location', 'Students', 'Plan', 'Joined', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {institutes.slice(0, 5).map((inst: any) => (
              <tr key={inst.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><p className="font-medium text-gray-900 text-sm">{inst.name}</p><p className="text-xs text-gray-400">{inst.email}</p></td>
                <td className="px-4 py-3 text-sm text-gray-600">{[inst.city, inst.state].filter(Boolean).join(', ') || '—'}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{inst.total_students}</td>
                <td className="px-4 py-3">{planBadge(inst.subscription_plan)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(inst.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onViewDetail(inst)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                    <Eye className="w-3 h-3" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Institutes Tab ────────────────────────────────────────────────────────────
function InstitutesTab({ institutes, searchQuery, setSearchQuery, filterPlan, setFilterPlan, filterStatus, setFilterStatus, onViewDetail, onUpdatePlan, onToggleStatus, planBadge }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Institutes</h1>
        <p className="text-gray-500 text-sm">{institutes.length} institutes shown</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search name, email, city..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} className="input pl-9 w-full" />
          </div>
          <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className="input">
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Institute', 'Contact', 'Location', 'Students', 'Staff', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {institutes.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">No institutes found</td></tr>
              ) : institutes.map((inst: any) => (
                <tr key={inst.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 min-w-[160px]">
                    <p className="font-medium text-gray-900 text-sm">{inst.name}</p>
                    {inst.registration_number && <p className="text-xs text-gray-400">Reg: {inst.registration_number}</p>}
                  </td>
                  <td className="px-4 py-3 min-w-[160px]">
                    <p className="text-sm text-gray-700">{inst.email}</p>
                    <p className="text-xs text-gray-500">{inst.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {[inst.city, inst.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-center">{inst.total_students}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">{inst.total_staff}</td>
                  <td className="px-4 py-3">
                    <select value={inst.subscription_plan} onChange={e => onUpdatePlan(inst.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white">
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => onToggleStatus(inst)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${inst.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                      {inst.is_active ? <><CheckCircle className="w-3 h-3" />Active</> : <><XCircle className="w-3 h-3" />Inactive</>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(inst.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => onViewDetail(inst)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── All Students Tab ──────────────────────────────────────────────────────────
function StudentsTab({ students, total, search, setSearch, classFilter, setClassFilter, uniqueClasses }: any) {
  const activeCount = students.filter((s: any) => s.status === 'active').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Students</h1>
        <p className="text-gray-500 text-sm">{total} total students across all institutes</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Showing', value: students.length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Active', value: activeCount, color: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Inactive/Other', value: students.length - activeCount, color: 'bg-orange-50 text-orange-700 border-orange-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 border ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, phone, enrollment no..." value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-9 w-full" />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input w-48">
          <option value="all">All Classes</option>
          {uniqueClasses.sort().map((cls: string) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {/* Students table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Student', 'Phone', 'Class', 'Enrollment No', 'Institute', 'Status', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No students found</td></tr>
              ) : students.slice(0, 100).map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-sm">{s.student_name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.phone}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">{s.class_level || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{s.enrollment_number || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{(s.institute as any)?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length > 100 && (
            <p className="text-center text-sm text-gray-500 py-3">Showing first 100 of {students.length} results. Use filters to narrow down.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Institute Detail Tab ──────────────────────────────────────────────────────
function DetailTab({ inst, detail, loading, onBack, onUpdatePlan, onToggleStatus, planBadge }: any) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={onBack} className="hover:text-blue-600 flex items-center gap-1">
          <Building2 className="w-4 h-4" /> All Institutes
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{inst.name}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{inst.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{inst.email} · {inst.phone}</p>
            {inst.address && <p className="text-gray-400 text-xs mt-0.5">{inst.address}</p>}
            {(inst.city || inst.state) && <p className="text-gray-500 text-sm">{[inst.city, inst.state].filter(Boolean).join(', ')}</p>}
            {inst.registration_number && <p className="text-xs text-gray-400 mt-1">Reg No: {inst.registration_number}</p>}
            {inst.established_year && <p className="text-xs text-gray-400">Est. {inst.established_year}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {planBadge(inst.subscription_plan)}
            <select value={inst.subscription_plan} onChange={e => onUpdatePlan(inst.id, e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
            <button onClick={() => onToggleStatus(inst)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium ${inst.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
              {inst.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" /></div>
      ) : detail && (
        <>
          {/* 6 stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Students', value: detail.allStudents.length, sub: `${detail.activeStudents} active · ${detail.inactiveStudents} inactive`, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: 'Total Staff', value: detail.staff.length, sub: `${detail.staff.filter((s: any) => s.role === 'teacher').length} teachers`, icon: UserCheck, color: 'text-purple-600 bg-purple-50' },
              { label: 'Batches', value: detail.batches.length, sub: `${detail.batches.filter((b: any) => b.is_active).length} active`, icon: GraduationCap, color: 'text-green-600 bg-green-50' },
              { label: 'Total Revenue', value: `₹${detail.totalRevenue.toLocaleString()}`, sub: `₹${detail.thisMonthRevenue.toLocaleString()} this month`, icon: IndianRupee, color: 'text-orange-600 bg-orange-50' },
              { label: 'Pending Fees', value: `₹${detail.pendingFees.toLocaleString()}`, sub: 'to be collected', icon: TrendingUp, color: 'text-red-600 bg-red-50' },
              { label: "Today's Attendance", value: detail.attendanceToday, sub: `out of ${detail.activeStudents} active`, icon: Calendar, color: 'text-teal-600 bg-teal-50' },
            ].map(card => {
              const Icon = card.icon
              return (
                <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className={`inline-flex p-2 rounded-lg ${card.color} mb-3`}><Icon className="w-5 h-5" /></div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm font-medium text-gray-700">{card.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                </div>
              )
            })}
          </div>

          {/* Students by class */}
          {Object.keys(detail.studentsByClass).length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" /> Students by Class
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Object.entries(detail.studentsByClass)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .map(([cls, count]: any) => (
                    <div key={cls} className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple-700">{count}</p>
                      <p className="text-xs text-purple-600 font-medium truncate">{cls}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All Students list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between">
                <h3 className="font-bold text-gray-900">Students ({detail.allStudents.length})</h3>
                <span className="text-xs text-gray-400">Latest 15 shown</span>
              </div>
              {detail.allStudents.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No students yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Phone</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detail.allStudents.slice(0, 15).map((s: any) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <p className="text-sm font-medium text-gray-900">{s.student_name}</p>
                            <p className="text-xs text-gray-400 font-mono">{s.enrollment_number}</p>
                          </td>
                          <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{s.class_level}</span></td>
                          <td className="px-4 py-2 text-xs text-gray-600">{s.phone}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Batches + Staff */}
            <div className="space-y-4">
              {/* Batches */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Batches ({detail.batches.length})</h3>
                </div>
                {detail.batches.length === 0 ? <p className="p-4 text-sm text-gray-500">No batches yet</p> : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Batch</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Students</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Fee</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detail.batches.map((b: any) => (
                        <tr key={b.id}>
                          <td className="px-4 py-2"><p className="text-sm font-medium text-gray-900">{b.name}</p><p className="text-xs text-gray-400">{b.course_name}</p></td>
                          <td className="px-4 py-2 text-sm text-gray-700">{b.enrolled_students}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">₹{Number(b.fee_amount).toLocaleString()}</td>
                          <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.is_active ? 'Active' : 'Inactive'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Staff */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Staff ({detail.staff.length})</h3>
                </div>
                {detail.staff.length === 0 ? <p className="p-4 text-sm text-gray-500">No staff yet</p> : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detail.staff.map((s: any) => (
                        <tr key={s.id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{s.name}</td>
                          <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{s.role}</span></td>
                          <td className="px-4 py-2 text-xs text-gray-600">{s.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Recent payments + Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Recent Fee Payments</h3></div>
              {detail.recentPayments.length === 0 ? <p className="p-4 text-sm text-gray-500">No payments yet</p> : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detail.recentPayments.map((p: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm text-gray-900">{p.student?.student_name || '—'}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-green-700">₹{Number(p.amount).toLocaleString()}</td>
                        <td className="px-4 py-2 text-xs text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Recent Announcements</h3></div>
              {detail.announcements.length === 0 ? <p className="p-4 text-sm text-gray-500">No announcements yet</p> : (
                <div className="divide-y divide-gray-50">
                  {detail.announcements.map((a: any, i: number) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3">
                      <Bell className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{a.announcement_type}</span>
                          <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
