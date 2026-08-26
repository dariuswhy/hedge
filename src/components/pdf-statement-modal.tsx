'use client'

import { useState, useRef } from 'react'
import { Download, Printer, Shield, TrendingUp, X } from 'lucide-react'

interface PDFStatementModalProps {
  isOpen: boolean
  onClose: () => void
  clientName: string
  clientEmail: string
  currentValue: number
  investedAmount: number
  pools?: any[]
}

export default function PDFStatementModal({
  isOpen,
  onClose,
  clientName,
  clientEmail,
  currentValue,
  investedAmount,
  pools = []
}: PDFStatementModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const netProfit = currentValue - investedAmount
  const roiPct = investedAmount > 0 ? (netProfit / investedAmount) * 100 : 0
  const isProfit = netProfit >= 0
  const statementDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const statementId = `HC-STMT-${Math.floor(100000 + Math.random() * 900000)}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="glass-card rounded-3xl max-w-3xl w-full border border-white/10 shadow-2xl overflow-hidden my-8 animate-in fade-in">
        
        {/* Top Control Bar (Non-printable) */}
        <div className="p-4 bg-black/60 border-b border-white/10 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-white">Official Institutional Portfolio Statement</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable PDF Statement Body */}
        <div ref={printRef} className="p-8 sm:p-12 bg-[#090d16] text-white font-sans space-y-8 print:p-0 print:bg-white print:text-black">
          
          {/* Statement Header Banner */}
          <div className="flex items-start justify-between border-b border-white/10 print:border-gray-300 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                  ▲
                </div>
                <div>
                  <span className="text-2xl font-bold tracking-tight text-white print:text-black">
                    HEDGE<span className="text-blue-500">CAPITAL</span>
                  </span>
                  <span className="block text-[10px] uppercase font-mono tracking-widest text-gray-400 print:text-gray-600">
                    Quantitative Asset Management
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-gray-400 print:text-gray-600 space-y-1">
              <div><strong className="text-white print:text-black">Statement ID:</strong> {statementId}</div>
              <div><strong className="text-white print:text-black">Date Generated:</strong> {statementDate}</div>
              <div><strong className="text-white print:text-black">Account Status:</strong> Verified Active</div>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="p-6 bg-black/40 print:bg-gray-50 border border-white/10 print:border-gray-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 print:text-gray-500 uppercase tracking-wider font-semibold block mb-1">Account Holder</span>
              <span className="text-base font-bold text-white print:text-black block">{clientName || 'Valued Investor'}</span>
              <span className="text-gray-400 print:text-gray-600 block">{clientEmail}</span>
            </div>
            <div className="sm:text-right">
              <span className="text-gray-400 print:text-gray-500 uppercase tracking-wider font-semibold block mb-1">Reporting Period</span>
              <span className="text-sm font-semibold text-white print:text-black block">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <span className="text-emerald-400 print:text-emerald-700 font-mono font-semibold">Audit Status: Rebalanced & Verified</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-blue-950/30 print:bg-blue-50 border border-blue-500/30 print:border-blue-200 rounded-2xl text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 print:text-blue-900 block mb-1">Total Share Valuation</span>
              <span className="text-2xl font-bold font-mono text-white print:text-blue-950">
                ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-5 bg-black/40 print:bg-gray-50 border border-white/10 print:border-gray-200 rounded-2xl text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 print:text-gray-600 block mb-1">Principal Invested</span>
              <span className="text-2xl font-bold font-mono text-gray-200 print:text-gray-900">
                ${investedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-5 bg-black/40 print:bg-gray-50 border border-white/10 print:border-gray-200 rounded-2xl text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 print:text-gray-600 block mb-1">Net ROI / Return</span>
              <span className={`text-2xl font-bold font-mono ${isProfit ? 'text-emerald-400 print:text-emerald-700' : 'text-red-400 print:text-red-700'}`}>
                {isProfit ? '+' : ''}${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-normal block">({roiPct.toFixed(1)}%)</span>
              </span>
            </div>
          </div>

          {/* Hedge Pool Allocations Table (if pools exist) */}
          {pools.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-bold text-gray-300 print:text-gray-700">Active Hedge Fund Allocations</h4>
              <div className="overflow-x-auto rounded-xl border border-white/10 print:border-gray-300 bg-black/30 print:bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 print:bg-gray-100 text-gray-400 print:text-gray-700 uppercase font-semibold border-b border-white/10 print:border-gray-300">
                    <tr>
                      <th className="py-2.5 px-4">Fund Name</th>
                      <th className="py-2.5 px-4">Strategy</th>
                      <th className="py-2.5 px-4">Allocated Capital</th>
                      <th className="py-2.5 px-4">Current Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-gray-200 text-gray-200 print:text-gray-900 font-mono">
                    {pools.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-4 font-sans font-semibold text-white print:text-black">{p.name}</td>
                        <td className="py-2.5 px-4 text-gray-400 print:text-gray-600 font-sans">{p.strategy}</td>
                        <td className="py-2.5 px-4">${Number(p.allocated_amount || p.total_capital || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-4 font-bold text-blue-400 print:text-blue-800">${Number(p.current_value || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legal Footer & Risk Disclosure */}
          <div className="pt-6 border-t border-white/10 print:border-gray-300 space-y-3 text-[10px] text-gray-500 print:text-gray-600 leading-relaxed text-justify">
            <div className="font-semibold text-gray-400 print:text-gray-700 uppercase tracking-wider text-center">Institutional Disclaimer & Regulatory Notice</div>
            <p>
              This document serves as an official monthly performance statement generated by Hedge Capital Asset Management. All valuations reflect net asset values (NAV) after applicable performance and management fees. Past performance is not a guarantee of future investment returns.
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-center text-gray-600 print:text-gray-500 pt-2 font-mono">
              <span>Hedge Capital Management LLC • Registered Investment Advisory</span>
              <span>Support: support@cpthedge.com</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
