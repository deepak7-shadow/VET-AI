import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Calendar, 
  Building, 
  ShieldCheck, 
  Eye, 
  FileSpreadsheet, 
  Loader2, 
  X,
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { Report } from '../types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.getReports();
      setReports(res);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadPdf = async (reportId: string, animalId: string = 'ANIMAL') => {
    try {
      setDownloadingId(reportId);
      await api.downloadReportPdf(reportId, animalId);
    } catch (err: any) {
      alert(`PDF download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportCsv = () => {
    api.exportReportsCsv(filteredReports);
  };

  const filteredReports = reports.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = 
      r.animal_id.toLowerCase().includes(q) ||
      (r.summary && r.summary.toLowerCase().includes(q)) ||
      (r.farm && r.farm.toLowerCase().includes(q));
    const matchesRisk = riskFilter === 'ALL' || (r.risk_level || '').toUpperCase() === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="card-surface p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">Veterinary Clinical Reports</h2>
            <span className="text-xs font-semibold bg-[#EAF7F0] text-[#16845B] border border-[#C4EBD5] px-2.5 py-0.5 rounded-full">
              {reports.length} Archived
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-2xl font-medium">
            Official multi-agent clinical decision support assessments, telemetry variance evidence, and downloadable printable PDF summaries.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={filteredReports.length === 0}
          className="btn-secondary text-xs self-start md:self-auto disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#16845B]" />
          <span>Export History (CSV)</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="card-surface p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by animal tag, summary, farm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#16845B] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#667085]">Risk Level:</label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#16845B]"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#16845B] animate-spin" />
          <p className="text-xs text-[#667085]">Loading clinical reports from Supabase...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="card-surface p-12 text-center max-w-md mx-auto shadow-xs">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#172033]">No Reports Found</h3>
          <p className="text-xs text-[#667085] mt-1">No clinical assessments match your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredReports.map((report) => {
            const riskLevel = (report.risk_level || 'LOW').toUpperCase();
            return (
              <div
                key={report.id}
                className="card-surface card-interactive p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">
                      {report.animal_id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      riskLevel === 'CRITICAL' ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                      riskLevel === 'HIGH' ? 'bg-[#FFEDD5] text-[#C2410C]' :
                      riskLevel === 'MODERATE' ? 'bg-[#FEF9C3] text-[#854D0E]' :
                      'bg-[#EAF7F0] text-[#16845B]'
                    }`}>
                      {riskLevel} ({report.risk_score})
                    </span>
                    <span className="text-xs text-[#667085] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#172033] font-medium leading-relaxed">
                    {report.summary}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-[#667085]">
                    <span>Farm: <strong>{report.farm || 'Green Valley Dairy'}</strong></span>
                    <span>Species: <strong>{report.species || 'Cattle'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="px-3.5 py-2 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E5EAF0] text-[#172033] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(report.id, report.animal_id)}
                    disabled={downloadingId === report.id}
                    className="btn-primary text-xs disabled:opacity-60"
                  >
                    {downloadingId === report.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF0] max-w-2xl w-full rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#172033]">
                  Clinical Report: {selectedReport.animal_id}
                </h3>
                <p className="text-xs text-[#667085]">
                  Generated on {new Date(selectedReport.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[#667085] block">Risk Score Assessment</span>
                  <span className="text-lg font-bold text-[#172033]">{selectedReport.risk_score} / 100</span>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EAF7F0] text-[#16845B]">
                  {selectedReport.risk_level}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-xs text-[#172033] mb-1">Executive Summary</h4>
                <p className="text-[#667085] leading-relaxed bg-white border border-[#E5EAF0] p-3 rounded-xl">
                  {selectedReport.summary}
                </p>
              </div>

              {selectedReport.report_content && (
                <div>
                  <h4 className="font-bold text-xs text-[#172033] mb-1">Clinical Findings & Evidence</h4>
                  <div className="bg-[#F7F9FC] border border-[#E5EAF0] p-3.5 rounded-xl whitespace-pre-wrap leading-relaxed text-[#172033] font-sans">
                    {selectedReport.report_content}
                  </div>
                </div>
              )}

              {selectedReport.recommendations && (
                <div>
                  <h4 className="font-bold text-xs text-[#172033] mb-1">Recommended Veterinary Actions</h4>
                  <p className="text-[#16845B] font-medium bg-[#EAF7F0] border border-[#C4EBD5] p-3 rounded-xl">
                    {selectedReport.recommendations}
                  </p>
                </div>
              )}

              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[11px] text-[#92400E] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                <span>
                  VET-AI provides AI-assisted health-risk monitoring and decision support. It does NOT provide a definitive veterinary diagnosis. Consult a qualified veterinarian for clinical evaluation.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-xs font-semibold text-[#667085] hover:text-[#172033]"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadPdf(selectedReport.id, selectedReport.animal_id)}
                disabled={downloadingId === selectedReport.id}
                className="btn-primary text-xs disabled:opacity-60"
              >
                {downloadingId === selectedReport.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download Report PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
