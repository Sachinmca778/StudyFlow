'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  LayoutDashboard, Building2, Users, IndianRupee,
  LogOut, Search, Eye, TrendingUp, Shield, ChevronRight,
  CheckCircle, XCircle, Calendar, BarChart3, RefreshCw
} from 'lucide-react'

type SuperAdmin = {
  id: string
  email: string
  name: string
}

type InstituteRow = {
  id: string
  name: string
  email: string
  phone: string
  city: string | null
  state: string | null
  subscription_plan: string
  is_active: boolean
  total_students: number
  total_staff: number
  created_at: string
  admin_user_id: string
}

type GlobalStats = {
  totalInstitutes: number
  activeInstitutes: number
  totalStudents: number
  totalRevenue: number
  freeInstitutes: number
  basicInstitutes: number
  premiumInstitutes: number
}

export default function SuperAdminDashboard({ superAdmin }: { superAdmin: SuperAdmin }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'institutes' | 'institute-detail'>('overview')
  const [institutes, setInstitutes] = useState<InstituteRow[]>([])
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteRow | null>(null)
  const [instituteDetail, setInstituteDetail] = useState<any>(null)
  const [stats, setStats] = useState<GlobalStats>({
    totalInstitutes: 0, activeInstitutes: 0, totalStudents: 0,
    totalRevenue: 0, freeInstitutes: 0, basicInstitutes: 0, premiumInstitutes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchInstitutes(), fetchGlobalStats()])
    setLoading(false)
  }

  const fetchInstitutes = async () => {
    const { data } = await supabase
      .from('institutes')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setInstitutes(data)
  }

  const fetchGlobalStats = async () => {
    const { data: inst } = await supabase.from('institutes').select('subscription_plan, is_active, total_students')
    const { data: payments } = await supabase.from('fee_payments').select('amount').eq('status', 'paid')

    if (inst) {
      setStats({
        totalInstitutes: inst.length,
        activeInstitutes: inst.filter(i => i.is_active).length,
        totalStudents: inst.reduce((s, i) => s + (i.total_students || 0), 0),
        totalRevenue: (payments ?? []).reduce((s, p) => s + Number(p.amount), 0),
        freeInstitutes: inst.filter(i => i.subscription_plan === 'free').length,
        basicInstitutes: inst.filter(i => i.subscription_plan === 'basic').length,
        premiumInstitutes: inst.filter(i => i.subscription_plan === 'premium').length,
      })
    }
  }

  const viewInstituteDetail = async (inst: InstituteRow) => {
    setSelectedInstitute(inst)
    setActiveTab('institute-detail')
    setDetailLoading(true)

    const [students, batches, payments, staff] = await Promise.all([
      supabase.from('institute_students').select('id, student_name, class_level, status, created_at').eq('institute_id', inst.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('batches').select('id, name, course_name, enrolled_students, fee_amount, is_active').eq('institute_id', inst.id),
      supabase.from('fee_payments').select('amount, status, payment_date').eq('institute_id', inst.id).eq('status', 'paid'),
      supabase.from('institute_staff').select('id, name, role').eq('institute_id', inst.id),
    ])

    setInstituteDetail({
      recentStudents: students.data ?? [],
      batches: batches.data ?? [],
      totalRevenue: (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0),
      staff: staff.data ?? [],
    })

    // Log this action
    await supabase.from('super_admin_logs').insert({
      super_admin_id: superAdmin.id,
      action: 'viewed_institute',
      target_type: 'institute',
      target_id: inst.id,
      details: { institute_name: inst.name },
    })

    setDetailLoading(false)
  }

  const updateSubscriptionPlan = async (instituteId: string, plan: string) => {
    const { error } = await supabase
      .from('institutes')
      .update({ subscription_plan: plan })
      .eq('id', instituteId)

    if (!error) {
      await supabase.from('super_admin_logs').insert({
        super_admin_id: superAdmin.id,
        action: 'updated_subscription',
        target_type: 'institute',
        target_id: instituteId,
        details: { new_plan: plan },
      })
      fetchInstitutes()
      if (selectedInstitute?.id === instituteId) {
        setSelectedInstitute(prev => prev ? { ...prev, subscription_plan: plan } : null)
      }
    }
  }

  const toggleInstituteStatus = async (inst: InstituteRow) => {
    const { error } = await supabase
      .from('institutes')
      .update({ is_active: !inst.is_active })
      .eq('id', inst.id)

    if (!error) {
      await supabase.from('super_admin_logs').insert({
        super_admin_id: superAdmin.id,
        action: inst.is_active ? 'deactivated_institute' : 'activated_institute',
        target_type: 'institute',
        target_id: inst.id,
        details: { institute_name: inst.name },
      })
      fetchInstitutes()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const filteredInstitutes = institutes.filter(inst => {
    const matchSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inst.city ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchPlan = filterPlan === 'all' || inst.subscription_plan === filterPlan
    return matchSearch && matchPlan
  })

  const planBadge = (plan: string) => {
    const styles: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      premium: 'bg-purple-100 text-purple-700',
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${styles[plan] ?? styles.free}`}>
        {plan}
      </span>
    )
  }

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  const sidebar = (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500 rounded-lg">
            <Shield className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <p className="font-bold text-sm">Super Admin</p>
            <p className="text-xs text-gray-400 truncate">{superAdmin.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'institutes', label: 'All Institutes', icon: Building2 },
        ].map(item => {
          const Icon = item.icon
          const active = activeTab === item.id || (item.id === 'institutes' && activeTab === 'institute-detail')
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                active ? 'bg-yellow-500 text-gray-900 font-semibold' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )

  // ── Overview Tab ─────────────────────────────────────────────────────────────
  const overviewTab = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-500 text-sm">All institutes across StudyFlow</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Institutes', value: stats.totalInstitutes, icon: Building2, color: 'from-blue-500 to-blue-600' },
          { label: 'Active Institutes', value: stats.activeInstitutes, icon: CheckCircle, color: 'from-green-500 to-green-600' },
          { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: Users, color: 'from-purple-500 to-purple-600' },
          { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'from-orange-500 to-orange-600' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${card.color} mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Plan breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Subscription Plans</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { plan: 'Free', count: stats.freeInstitutes, color: 'bg-gray-100 text-gray-700' },
            { plan: 'Basic', count: stats.basicInstitutes, color: 'bg-blue-100 text-blue-700' },
            { plan: 'Premium', count: stats.premiumInstitutes, color: 'bg-purple-100 text-purple-700' },
          ].map(p => (
            <div key={p.plan} className={`rounded-lg p-4 ${p.color}`}>
              <p className="text-3xl font-bold">{p.count}</p>
              <p className="text-sm font-medium">{p.plan}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent institutes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Recent Institutes</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Institute', 'Location', 'Students', 'Plan', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {institutes.slice(0, 5).map(inst => (
              <tr key={inst.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewInstituteDetail(inst)}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 text-sm">{inst.name}</p>
                  <p className="text-xs text-gray-500">{inst.email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{[inst.city, inst.state].filter(Boolean).join(', ') || '—'}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{inst.total_students}</td>
                <td className="px-4 py-3">{planBadge(inst.subscription_plan)}</td>
                <td className="px-4 py-3">
                  {inst.is_active
                    ? <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle className="w-3 h-3" />Active</span>
                    : <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="w-3 h-3" />Inactive</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ── Institutes Tab ────────────────────────────────────────────────────────────
  const institutesTab = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Institutes</h1>
          <p className="text-gray-500 text-sm">{institutes.length} institutes registered</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className="input w-40">
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Institute', 'Contact', 'Location', 'Students', 'Plan', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInstitutes.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No institutes found</td></tr>
              ) : filteredInstitutes.map(inst => (
                <tr key={inst.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-sm">{inst.name}</p>
                    <p className="text-xs text-gray-400">{new Date(inst.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{inst.email}</p>
                    <p className="text-xs text-gray-500">{inst.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {[inst.city, inst.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{inst.total_students}</td>
                  <td className="px-4 py-3">
                    <select
                      value={inst.subscription_plan}
                      onChange={e => updateSubscriptionPlan(inst.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      onClick={e => e.stopPropagation()}
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleInstituteStatus(inst)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                        inst.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {inst.is_active ? <><CheckCircle className="w-3 h-3" />Active</> : <><XCircle className="w-3 h-3" />Inactive</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => viewInstituteDetail(inst)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
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

  // ── Institute Detail Tab ──────────────────────────────────────────────────────
  const instituteDetailTab = selectedInstitute && (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => setActiveTab('institutes')} className="hover:text-blue-600">All Institutes</button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{selectedInstitute.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedInstitute.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{selectedInstitute.email} · {selectedInstitute.phone}</p>
            {(selectedInstitute.city || selectedInstitute.state) && (
              <p className="text-gray-500 text-sm">{[selectedInstitute.city, selectedInstitute.state].filter(Boolean).join(', ')}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {planBadge(selectedInstitute.subscription_plan)}
            <select
              value={selectedInstitute.subscription_plan}
              onChange={e => updateSubscriptionPlan(selectedInstitute.id, e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
            <button
              onClick={() => toggleInstituteStatus(selectedInstitute)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium ${
                selectedInstitute.is_active
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {selectedInstitute.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      {detailLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : instituteDetail && (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: selectedInstitute.total_students, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: 'Total Staff', value: selectedInstitute.total_staff, icon: Users, color: 'text-purple-600 bg-purple-50' },
              { label: 'Active Batches', value: instituteDetail.batches.filter((b: any) => b.is_active).length, icon: BarChart3, color: 'text-green-600 bg-green-50' },
              { label: 'Total Revenue', value: `₹${instituteDetail.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-orange-600 bg-orange-50' },
            ].map(card => {
              const Icon = card.icon
              return (
                <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className={`inline-flex p-2 rounded-lg ${card.color} mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Students */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Recent Students</h3>
              </div>
              {instituteDetail.recentStudents.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No students yet</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Class</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {instituteDetail.recentStudents.map((s: any) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{s.student_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{s.class_level}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Batches */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Batches / Courses</h3>
              </div>
              {instituteDetail.batches.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No batches yet</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Batch</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Students</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {instituteDetail.batches.map((b: any) => (
                      <tr key={b.id}>
                        <td className="px-4 py-2">
                          <p className="text-sm font-medium text-gray-900">{b.name}</p>
                          <p className="text-xs text-gray-500">{b.course_name}</p>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{b.enrolled_students}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">₹{Number(b.fee_amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebar}
      <main className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && overviewTab}
            {activeTab === 'institutes' && institutesTab}
            {activeTab === 'institute-detail' && instituteDetailTab}
          </>
        )}
      </main>
    </div>
  )
}
