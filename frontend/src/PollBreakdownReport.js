import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b', '#0ea5e9', '#84cc16'];

function toPieData(entries) {
  return entries
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
}

function MiniPie({ title, data, emptyLabel }) {
  const hasData = data.some((d) => d.value > 0);
  if (!hasData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</p>
        <p className="text-xs text-slate-500 py-8 text-center">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-600 dark:bg-slate-800">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 px-1">{title}</p>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={68}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [v, 'Count']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Visual analytics for admin poll breakdown modal */
export function PollChartsGrid({ stats }) {
  if (!stats) return null;

  const rd = stats.ratingDistribution || {};
  const ratingData = toPieData([
    ['1★', rd[1] || 0],
    ['2★', rd[2] || 0],
    ['3★', rd[3] || 0],
    ['4★', rd[4] || 0],
    ['5★', rd[5] || 0],
  ]);

  const exp = stats.experience || {};
  const experienceData = toPieData([
    ['Good', exp.Good || 0],
    ['Average', exp.Average || 0],
    ['Bad', exp.Bad || 0],
  ]);

  const bp = stats.bestPart || {};
  const bestPartData = toPieData([
    ['Activities', bp.Activities || 0],
    ['Speaker', bp.Speaker || 0],
    ['Food', bp.Food || 0],
    ['Organization', bp.Organization || 0],
  ]);

  const skip = stats.attendedSkipped || 0;
  const attendanceData = toPieData([
    ['Yes', stats.attendedYes || 0],
    ['No', stats.attendedNo || 0],
    ...(skip > 0 ? [['Not answered', skip]] : []),
  ]);

  return (
    <div className="mb-6">
      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3 text-sm">Charts</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MiniPie title="Attendance" data={attendanceData} emptyLabel="No attendance data" />
        <MiniPie title="Star rating (1–5)" data={ratingData} emptyLabel="No ratings" />
        <MiniPie title="How was the event?" data={experienceData} emptyLabel="No answers" />
        <MiniPie title="Best part" data={bestPartData} emptyLabel="No answers" />
      </div>
    </div>
  );
}

function truncateCell(s, max = 120) {
  if (s == null || s === '') return '—';
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** Build and download PDF report for one event poll */
export function downloadPollReportPdf(pollDetail) {
  const { event, stats, responses } = pollDetail || {};
  const title = event?.title || 'Event';
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  let y = 14;

  doc.setFontSize(16);
  doc.text('ResQ Portal — Event poll report', 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Event: ${title}`, 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  if (event?.startDateTime) {
    doc.text(`Event start: ${new Date(event.startDateTime).toLocaleString()}`, 14, y);
    y += 5;
  }
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Total responses: ${stats?.total ?? 0}`, 14, y);
  y += 5;
  if (stats?.ratingAverage != null) {
    doc.text(`Average rating: ${stats.ratingAverage} / 5`, 14, y);
    y += 5;
  }
  y += 4;

  const summaryBody = [
    ['Attendance — Yes', String(stats?.attendedYes ?? 0)],
    ['Attendance — No', String(stats?.attendedNo ?? 0)],
    ['Attendance — Not answered', String(stats?.attendedSkipped ?? 0)],
    ['1★', String(stats?.ratingDistribution?.[1] ?? 0)],
    ['2★', String(stats?.ratingDistribution?.[2] ?? 0)],
    ['3★', String(stats?.ratingDistribution?.[3] ?? 0)],
    ['4★', String(stats?.ratingDistribution?.[4] ?? 0)],
    ['5★', String(stats?.ratingDistribution?.[5] ?? 0)],
    ['Experience — Good', String(stats?.experience?.Good ?? 0)],
    ['Experience — Average', String(stats?.experience?.Average ?? 0)],
    ['Experience — Bad', String(stats?.experience?.Bad ?? 0)],
    ['Best part — Activities', String(stats?.bestPart?.Activities ?? 0)],
    ['Best part — Speaker', String(stats?.bestPart?.Speaker ?? 0)],
    ['Best part — Food', String(stats?.bestPart?.Food ?? 0)],
    ['Best part — Organization', String(stats?.bestPart?.Organization ?? 0)],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Count']],
    body: summaryBody,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  const afterSummary = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y + 60;

  const responseRows = (responses || []).map((r) => [
    new Date(r.createdAt).toLocaleString(),
    typeof r.attended === 'boolean' ? (r.attended ? 'Yes' : 'No') : '—',
    r.rating != null ? String(r.rating) : '—',
    r.experience ?? '—',
    r.bestPart ?? '—',
    truncateCell(r.suggestion, 200),
  ]);

  autoTable(doc, {
    startY: afterSummary,
    head: [['Submitted', 'Attended', 'Rating', 'Experience', 'Best part', 'Suggestion']],
    body: responseRows.length ? responseRows : [['—', '—', '—', '—', '—', 'No rows']],
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85] },
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 16 },
      2: { cellWidth: 12 },
      3: { cellWidth: 22 },
      4: { cellWidth: 28 },
      5: { cellWidth: 62 },
    },
    margin: { left: 14, right: 14 },
  });

  const safe = title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 48) || 'event';
  doc.save(`poll-report-${safe}.pdf`);
}
