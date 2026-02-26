
import React from 'react';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatDate(d) {
	return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function badge(label, score) {
	const palette = {
		HIGH:   { bg: '#d4edda', color: '#155724' },
		MEDIUM: { bg: '#fff3cd', color: '#856404' },
		LOW:    { bg: '#f8d7da', color: '#721c24' },
	};
	const c = palette[label] || palette.LOW;
	return (
		<span style={{ ...c, padding: '1px 8px', borderRadius: 3, fontSize: 11, fontWeight: 700, marginLeft: 8 }}>
			{label} {typeof score === 'number' ? `${Math.round(score * 100)}%` : ''}
		</span>
	);
}

function metricColor(v, inverse) {
	if (inverse) return v > 0.3 ? '#f8d7da' : v > 0.1 ? '#fff3cd' : '#d4edda';
	return v < 0.5 ? '#f8d7da' : v < 0.75 ? '#fff3cd' : '#d4edda';
}

function statusBadge(status) {
	const c = { selected: '#155724', validation: '#004085', rejected: '#721c24' };
	const bg = { selected: '#d4edda', validation: '#cce5ff', rejected: '#f8d7da' };
	return (
		<span style={{ background: bg[status] || bg.rejected, color: c[status] || c.rejected, padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
			{status}
		</span>
	);
}

/* ── Styles ──────────────────────────────────────────────────────────────── */

const S = {
	page: { background: '#fff', color: '#222', padding: '36px 40px', fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif", fontSize: 13, lineHeight: 1.55, maxWidth: 780, margin: '0 auto' },
	h1: { fontSize: 20, fontWeight: 700, letterSpacing: 1.5, margin: 0, textTransform: 'uppercase', color: '#111' },
	h2: { fontSize: 15, fontWeight: 700, margin: '24px 0 8px', color: '#111', borderBottom: '1px solid #ddd', paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
	h3: { fontSize: 13, fontWeight: 700, margin: '14px 0 4px', color: '#333' },
	th: { border: '1px solid #ccc', padding: '5px 8px', background: '#f5f5f5', fontWeight: 600, textAlign: 'left', fontSize: 12 },
	td: { border: '1px solid #ddd', padding: '5px 8px', fontSize: 12 },
	note: { background: '#f8f8f8', borderLeft: '3px solid #999', padding: '6px 10px', fontSize: 11, color: '#666', fontStyle: 'italic', margin: '6px 0 16px' },
	ul: { margin: '4px 0 8px 18px', padding: 0, fontSize: 12, lineHeight: 1.6 },
	divider: { borderTop: '1px solid #eee', margin: '20px 0' },
};

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function PrintableReport({ reportData }) {
	if (!reportData) return null;
	const { manufacturer, product_name, specifications: sp, prescriptive_analysis: pa, decision_process: dp } = reportData;
	const ra = reportData.replacement_analysis;
	const ma = reportData.maintenance_approach;
	const cf = reportData.common_faults;

	const modules = [
		{ label: 'Replacement', data: ra },
		{ label: 'Maintenance', data: ma },
		{ label: 'Faults', data: cf },
	];

	return (
		<div style={S.page}>

			{/* ── Header ── */}
			<div style={{ textAlign: 'center', marginBottom: 20 }}>
				<h1 style={S.h1}>Pump Verification Report</h1>
				<div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{formatDate(new Date())} &bull; {manufacturer} {product_name}</div>
			</div>

			{/* ── Specifications ── */}
			<h2 style={S.h2}>Specifications</h2>
			<table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
				<tbody>
					{[
						['Flow', `${sp?.nominal_flow_m3h ?? '—'} m³/h`],
						['Head', `${sp?.nominal_head_m ?? '—'} m`],
						['Power', `${sp?.motor_power_kw ?? '—'} kW`],
						['Efficiency', `${sp?.efficiency_percent ?? '—'}%`],
						['Material', sp?.material_compatibility ?? '—'],
						['Phase', `${sp?.phase ?? '—'}ø`],
						['Temp / Pressure', sp?.temp_pressure_limits ?? '—'],
					].map(([k, v], i) => (
						<tr key={i}>
							<td style={{ ...S.td, fontWeight: 600, width: '35%' }}>{k}</td>
							<td style={S.td}>{v}</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* ── Validation Sections ── */}
			{[
				{ title: 'Replacement Analysis', d: ra },
				{ title: 'Maintenance Approach', d: ma },
				{ title: 'Common Faults', d: cf },
			].map(({ title, d }, i) => d && (
				<div key={i}>
					<h2 style={S.h2}>{title} {d.confidence_label && badge(d.confidence_label, d.confidence)}</h2>
					<div style={{ marginBottom: 6 }}>{d.summary || '—'}</div>
					{d.key_findings?.length > 0 && (
						<ul style={S.ul}>{d.key_findings.map((f, j) => <li key={j}>{f}</li>)}</ul>
					)}
					{d.validation_notes && <div style={S.note}>{d.validation_notes}</div>}
				</div>
			))}

			{/* ── Data Validation Matrix ── */}
			{modules.some(m => m.data?.metrics) && (
				<>
					<h2 style={S.h2}>Data Validation Matrix</h2>
					<table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6 }}>
						<thead>
							<tr>
								{['Module', 'FAISS', 'Ground.', 'Halluc.', 'Prec.', 'Recall', 'Conf.'].map((h, i) => (
									<th key={i} style={{ ...S.th, textAlign: i ? 'center' : 'left', fontSize: 11 }}>{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{modules.map((m, i) => {
								const met = m.data?.metrics || {};
								const vals = [
									[met.faiss_score, false],
									[met.groundedness, false],
									[met.hallucination_rate, true],
									[met.precision, false],
									[met.recall, false],
									[m.data?.confidence, false],
								];
								return (
									<tr key={i}>
										<td style={{ ...S.td, fontWeight: 600 }}>{m.label}</td>
										{vals.map(([v, inv], j) => (
											<td key={j} style={{ ...S.td, textAlign: 'center', fontWeight: 600, background: metricColor(v || 0, inv) }}>
												{Math.round((v || 0) * 100)}%
											</td>
										))}
									</tr>
								);
							})}
						</tbody>
					</table>
					<div style={{ fontSize: 10, color: '#999', marginBottom: 16 }}>
						<span style={{ background: '#d4edda', padding: '0 4px', borderRadius: 2 }}>Good</span>{' '}
						<span style={{ background: '#fff3cd', padding: '0 4px', borderRadius: 2 }}>Moderate</span>{' '}
						<span style={{ background: '#f8d7da', padding: '0 4px', borderRadius: 2 }}>Poor</span>
						{' · Hallucination is inverse (lower = better)'}
					</div>
				</>
			)}

			{/* ── Prescriptive Analysis ── */}
			<h2 style={S.h2}>Prescriptive Analysis</h2>
			{[
				['Applications', pa?.recommended_applications],
				['Faults to Watch', pa?.common_faults_to_watch],
				['Troubleshooting', pa?.troubleshooting_tips],
			].map(([label, items], i) => items?.length > 0 && (
				<div key={i}>
					<h3 style={S.h3}>{label}</h3>
					<ul style={S.ul}>{items.map((x, j) => <li key={j}>{x}</li>)}</ul>
				</div>
			))}

			{/* ── Source Validation ── */}
			<h2 style={S.h2}>Data Source Validation</h2>
			<div style={{ marginBottom: 6 }}>
				<strong>Primary:</strong>{' '}
				{dp?.selected_url ? <a href={dp.selected_url} style={{ color: '#111' }}>{dp.selected_url}</a> : '—'}
			</div>
			{dp?.final_selection_reasoning && (
				<div style={S.note}>{dp.final_selection_reasoning}</div>
			)}

			{/* Source Evaluations Table */}
			{dp?.source_evaluations?.length > 0 && (
				<>
					<h3 style={S.h3}>Source Selection Reasoning</h3>
					<table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
						<thead>
							<tr>
								<th style={{ ...S.th, fontSize: 11 }}>URL</th>
								<th style={{ ...S.th, fontSize: 11, width: 70 }}>Status</th>
								<th style={{ ...S.th, fontSize: 11 }}>Reasoning</th>
							</tr>
						</thead>
						<tbody>
							{dp.source_evaluations.map((ev, i) => (
								<tr key={i}>
									<td style={{ ...S.td, wordBreak: 'break-all', maxWidth: 180 }}>{ev.url || '—'}</td>
									<td style={{ ...S.td, textAlign: 'center' }}>{statusBadge(ev.status)}</td>
									<td style={S.td}>{ev.reason_for_choice || ev.reason_for_elimination || '—'}</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}
		</div>
	);
}
