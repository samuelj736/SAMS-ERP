/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Briefcase, 
  Plus, 
  CheckCircle, 
  Calendar, 
  Coins, 
  Percent, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { User, AttendanceRecord, PayrollRecord } from '../types';

interface HRSystemProps {
  users: User[];
  attendance: AttendanceRecord[];
  onClockIn: (userId: string) => void;
  onClockOut: (recordId: string) => void;
  payroll: PayrollRecord[];
  onGeneratePayroll: (userId: string, start: string, end: string, deductions: number) => void;
  onPaySalary: (payrollId: string) => void;
}

type SubTab = 'ATTENDANCE' | 'PAYROLL';

export default function HRSystem({
  users,
  attendance,
  onClockIn,
  onClockOut,
  payroll,
  onGeneratePayroll,
  onPaySalary
}: HRSystemProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('ATTENDANCE');

  // Clock state
  const [selectedClockUserId, setSelectedClockUserId] = useState('');

  // Payroll generation state
  const [selectedPayUserId, setSelectedPayUserId] = useState('');
  const [payStart, setPayStart] = useState('2026-06-01');
  const [payEnd, setPayEnd] = useState('2026-06-15');
  const [deductions, setDeductions] = useState<number>(150);

  // Determine if a user is currently clocked in (has an attendance row with no clockOut)
  const getClockedInRecord = (userId: string) => {
    return attendance.find(rec => rec.userId === userId && !rec.clockOut);
  };

  const activeClockedInRecord = selectedClockUserId ? getClockedInRecord(selectedClockUserId) : null;

  const handleClockAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClockUserId) return;

    if (activeClockedInRecord) {
      onClockOut(activeClockedInRecord.id);
    } else {
      onClockIn(selectedClockUserId);
    }
    setSelectedClockUserId('');
  };

  const handleGeneratePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayUserId) return;
    onGeneratePayroll(selectedPayUserId, payStart, payEnd, deductions);
    setSelectedPayUserId('');
    alert("Payroll generation complete. Review values in the list table below.");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
            <Users size={20} className="text-amber-500" />
            Human Resources, Hours & Payroll Engine
          </h2>
          <p className="text-xs text-gray-500 mt-1">Manage employee attendance, clocks logs, hourly wages, overtime pay thresholds (1.5x) and salary statements.</p>
        </div>

        {/* Tab selection */}
        <div className="bg-gray-100 p-1 rounded-lg flex gap-1 text-xs select-none">
          <button
            id="hr-tab-attendance"
            onClick={() => setActiveSubTab('ATTENDANCE')}
            className={`px-3 py-1.5 font-bold rounded-md transition-all cursor-pointer ${activeSubTab === 'ATTENDANCE' ? 'bg-amber-500 text-white shadow-3xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Clock-In Shifts
          </button>
          <button
            id="hr-tab-payroll"
            onClick={() => setActiveSubTab('PAYROLL')}
            className={`px-3 py-1.5 font-bold rounded-md transition-all cursor-pointer ${activeSubTab === 'PAYROLL' ? 'bg-amber-500 text-white shadow-3xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Salaries & Payroll Payroll
          </button>
        </div>
      </div>

      {/* ATTENDANCE SHIFTS SUB TAB */}
      {activeSubTab === 'ATTENDANCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active clock register */}
          <form onSubmit={handleClockAction} className="lg:col-span-4 bg-white p-6 rounded-xl border border-gray-200/80 shadow-md space-y-4">
            <h3 className="font-bold text-gray-850 text-sm border-b pb-2 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Active Shift Clock Register
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase">Select Employee</label>
              <select
                id="clock-employee-select"
                required
                value={selectedClockUserId}
                onChange={(e) => setSelectedClockUserId(e.target.value)}
                className="w-full mt-1.5 p-2.5 bg-gray-50 border rounded-lg text-xs"
              >
                <option value="">-- Choose User --</option>
                {users.map(u => {
                  const clockedIn = getClockedInRecord(u.id);
                  return (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) — {clockedIn ? '🟢 CLOCKED-IN shifts' : '🔴 Off-clock'}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedClockUserId && (
              <div className="p-3.5 rounded-lg bg-slate-50 border text-xs">
                {activeClockedInRecord ? (
                  <div className="space-y-1 text-amber-900 font-medium">
                    <p>• Status: <strong className="text-emerald-700">CLOCKED IN</strong></p>
                    <p>• Entry Time: <strong className="font-mono">{new Date(activeClockedInRecord.clockIn).toLocaleTimeString()}</strong></p>
                    <p className="text-[11px] text-gray-500 mt-2">Submit to clock-out of current florist duty shift.</p>
                  </div>
                ) : (
                  <div className="text-gray-600 font-medium space-y-1">
                    <p>• Status: <strong className="text-gray-500">Off Clock</strong></p>
                    <p>• Wage rate: <strong className="font-mono text-gray-900">₹{users.find(u=>u.id===selectedClockUserId)?.hourlyRate.toFixed(2)}/hour</strong></p>
                    <p className="text-[11px] text-gray-400 mt-2">Ready to kick-off active shop duty hours.</p>
                  </div>
                )}
              </div>
            )}

            <button
              id="btn-trigger-clock"
              type="submit"
              disabled={!selectedClockUserId}
              className={`w-full py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 ${
                activeClockedInRecord 
                  ? 'bg-rose-600 text-white hover:bg-rose-700' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Clock size={14} />
              {activeClockedInRecord ? 'Clock-OUT Shift' : 'Clock-IN Shift'}
            </button>
          </form>

          {/* Core timesheet register history */}
          <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
            <h3 className="font-bold text-gray-900 text-sm border-b pb-3 mb-3">Shop Timesheet Log History ({attendance.length} entries)</h3>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-150 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Clock In</th>
                    <th className="py-2.5 px-3">Clock Out</th>
                    <th className="py-2.5 px-3 text-right">Hours Worked</th>
                    <th className="py-2.5 px-3 text-right">Estimated Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {[...attendance]
                    .sort((a,b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
                    .map(rec => {
                      const user = users.find(u => u.id === rec.userId);
                      return (
                        <tr key={rec.id} className="hover:bg-gray-50/20">
                          <td className="py-2.5 px-3 font-mono text-gray-500 text-[10px] whitespace-nowrap">{rec.date}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-gray-800">{user?.name}</span>
                            <span className="block text-[10px] text-gray-400 font-medium">{user?.role}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-gray-500">{new Date(rec.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-500">
                            {rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                              <span className="text-emerald-600 font-bold bg-emerald-55 font-mono text-[9px] px-1 py-0.5 rounded animate-pulse">Working</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-gray-900">
                            {rec.hoursWorked !== undefined ? `${rec.hoursWorked.toFixed(2)} hrs` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-500 font-medium">
                            {rec.hoursWorked !== undefined && user ? `₹${(rec.hoursWorked * user.hourlyRate).toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SALARIES PAYROLL SUB TAB */}
      {activeSubTab === 'PAYROLL' && (
        <div className="space-y-6">
          {/* Generation form */}
          <form onSubmit={handleGeneratePayroll} className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-md space-y-4">
            <h3 className="font-bold text-gray-850 text-sm border-b pb-2 flex items-center gap-2">
              <Coins size={16} className="text-amber-500" />
              Calculate & Append Payroll Statement
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Employee</label>
                <select
                  id="payroll-employee-select"
                  required
                  value={selectedPayUserId}
                  onChange={(e) => setSelectedPayUserId(e.target.value)}
                  className="w-full mt-1.5 p-2 bg-gray-55 border rounded-lg text-xs"
                >
                  <option value="">-- Select Member --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} (₹{u.hourlyRate.toFixed(2)}/hr)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Period Start</label>
                <input
                  id="payroll-start-input"
                  type="date"
                  required
                  value={payStart}
                  onChange={(e) => setPayStart(e.target.value)}
                  className="w-full mt-1.5 p-2 bg-gray-55 border rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase font-sans">Period End</label>
                <input
                  id="payroll-end-input"
                  type="date"
                  required
                  value={payEnd}
                  onChange={(e) => setPayEnd(e.target.value)}
                  className="w-full mt-1.5 p-2 bg-gray-55 border rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Tax / local Deductions (₹)</label>
                <input
                  id="payroll-deductions-input"
                  type="number"
                  required
                  value={deductions}
                  onChange={(e) => setDeductions(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full mt-1.5 p-2 bg-gray-55 border rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="text-right pt-2 border-t border-gray-55">
              <button
                id="btn-generate-payouts"
                type="submit"
                disabled={!selectedPayUserId}
                className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-40"
              >
                Compile hours & Issue Payroll statement
              </button>
            </div>
          </form>

          {/* Salaries ledger sheet */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center font-display">
              <h3 className="font-bold text-gray-900 text-sm">Corporate Salaries Ledger</h3>
              <span className="text-xs text-gray-400 font-semibold">Overtime threshold: 40 hrs/week (Overtime rates calculated at 1.5x)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/20 border-b border-gray-100 text-[10px] text-gray-450 uppercase font-bold tracking-widest">
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3 text-center">Period range</th>
                    <th className="py-2.5 px-3 text-center font-mono">Regular hours</th>
                    <th className="py-2.5 px-3 text-center font-mono">Overtime (1.5x)</th>
                    <th className="py-2.5 px-3 text-right">Gross Slips</th>
                    <th className="py-2.5 px-3 text-right">Deductions</th>
                    <th className="py-2.5 px-3 text-right">Net Wages Pay</th>
                    <th className="py-2.5 px-3 text-center">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {payroll.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-gray-400">
                        No operations payroll logged. Generate statements above.
                      </td>
                    </tr>
                  ) : (
                    payroll.map(p => {
                      const user = users.find(u => u.id === p.userId);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/20">
                          <td className="py-3 px-3">
                            <span className="font-bold text-gray-850">{user?.name}</span>
                            <span className="block text-[10px] text-gray-400 font-medium">{user?.role} • ₹{user?.hourlyRate}/hr</span>
                          </td>
                          <td className="py-3 px-3 text-center text-[10px] text-gray-500 font-mono">
                            {p.payPeriodStart} to {p.payPeriodEnd}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-medium">{p.regularHours.toFixed(1)} hrs</td>
                          <td className="py-3 px-3 text-center font-mono font-medium text-amber-700">{p.overtimeHours.toFixed(1)} hrs</td>
                          <td className="py-3 px-3 text-right font-mono text-gray-600">₹{p.grossPay.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-mono text-rose-500 font-medium">-₹{p.deductions.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">₹{p.netPay.toFixed(2)}</td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {p.status === 'PAID' ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full" title={`Paid on: ${p.paymentDate}`}>
                                🟢 PAID ({p.paymentDate})
                              </span>
                            ) : (
                              <button
                                id={`btn-pay-salary-${p.id}`}
                                onClick={() => onPaySalary(p.id)}
                                className="py-1 px-2.5 bg-amber-50 text-amber-800 hover:bg-amber-500 hover:text-white rounded border border-amber-200 transition-all font-bold text-[10px] cursor-pointer"
                              >
                                Approve Payout
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
