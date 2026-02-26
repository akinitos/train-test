
import React from 'react';

function formatDate(date) {
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

/**
 * Confidence badge colour mapping.
 */
function confidenceBadge(label, score) {
	const colors = {
		HIGH: { bg: '#d4edda', border: '#28a745', text: '#155724' },
		MEDIUM: { bg: '#fff3cd', border: '#ffc107', text: '#856404' },
		LOW: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
	};
	const c = colors[label] || colors.LOW;
	return (
		<span
			style={{
				display: 'inline-block',
				padding: '2px 10px',
				borderRadius: 4,
				fontSize: 12,
				fontWeight: 700,
				letterSpacing: 0.5,
				background: c.bg,
				border: `1.5px solid ${c.border}`,
				color: c.text,
				marginLeft: 10,
				verticalAlign: 'middle',
			}}
		>
			{label} — {typeof score === 'number' ? `${Math.round(score * 100)}%` : '—'}
		</span>
	);
}

/**
 * Renders a single RAG validation section (replacement, maintenance, or faults).
 */
function ValidationSection({ title, data }) {
	if (!data) return null;

	// Support both structured objects and plain strings (backwards compat)
	const isStructured = typeof data === 'object' && data !== null;

	if (!isStructured) {
		return (
			<div style={{ marginBottom: 28 }}>
				<h3 style={validationH3Style}>{title}</h3>
				<div style={validationTextStyle}>{String(data) || '—'}</div>
			</div>
		);
	}

	return (
		<div style={{ marginBottom: 28 }}>
			<h3 style={validationH3Style}>
				{title}
				{data.confidence_label && confidenceBadge(data.confidence_label, data.confidence)}
			</h3>

			{/* Summary */}
			<div style={{ ...validationTextStyle, marginBottom: 10 }}>
				{data.summary || '—'}
			</div>

			{/* Key Findings */}
			{data.key_findings && data.key_findings.length > 0 && (
				<div style={{ marginBottom: 10 }}>
					<strong style={{ fontSize: 13, color: '#333', letterSpacing: 0.5 }}>KEY FINDINGS</strong>
					<ul style={{ margin: '6px 0 0 18px', padding: 0, fontSize: 14, lineHeight: 1.7, color: '#222' }}>
						{data.key_findings.map((f, i) => (
							<li key={i}>{f}</li>
						))}
					</ul>
				</div>
			)}

			{/* Validation Notes */}
			{data.validation_notes && (
				<div
					style={{
						marginTop: 8,
						padding: '8px 12px',
						background: '#f0f0f0',
						borderLeft: '3px solid #888',
						fontSize: 12,
						color: '#555',
						fontStyle: 'italic',
						lineHeight: 1.5,
					}}
				>
					{data.validation_notes}
				</div>
			)}
		</div>
	);
}

/**
 * Colour-codes a metric cell. Green for good, yellow for moderate, red for bad.
 * `inverse` means lower values are better (e.g. hallucination_rate).
 */
function metricCell(value, inverse = false) {
	const v = typeof value === 'number' ? value : 0;
	const pct = Math.round(v * 100);
	let bg = '#d4edda'; // green
	if (inverse) {
		if (v > 0.3) bg = '#f8d7da';       // red
		else if (v > 0.1) bg = '#fff3cd';   // yellow
	} else {
		if (v < 0.5) bg = '#f8d7da';
		else if (v < 0.75) bg = '#fff3cd';
	}
	return (
		<td style={{ ...matrixTdStyle, background: bg, textAlign: 'center', fontWeight: 600 }}>
			{pct}%
		</td>
	);
}

/**
 * Renders the Data Validation Matrix table comparing metrics across RAG modules.
 */
function DataValidationMatrix({ reportData }) {
	const modules = [
		{ label: 'Replacement Analysis', data: reportData.replacement_analysis },
		{ label: 'Maintenance Approach', data: reportData.maintenance_approach },
		{ label: 'Common Faults', data: reportData.common_faults },
	];

	const hasMetrics = modules.some(m => m.data?.metrics);
	if (!hasMetrics) return null;

	return (
		<div style={{
			marginBottom: 40,
			padding: '32px 28px',
			border: '1.5px solid #111',
			background: '#fafafa',
			fontFamily: 'Georgia, Times New Roman, Times, serif',
		}}>
			<h2 style={{
				fontSize: 22,
				fontWeight: 700,
				margin: '0 0 24px 0',
				letterSpacing: 1,
				color: '#111',
				borderBottom: '2px solid #111',
				paddingBottom: 6,
				textTransform: 'uppercase',
			}}>DATA VALIDATION MATRIX</h2>

			<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
				<thead>
					<tr>
						<th style={matrixThStyle}>Module</th>
						<th style={matrixThStyle}>FAISS Score</th>
						<th style={matrixThStyle}>Groundedness</th>
						<th style={matrixThStyle}>Hallucination</th>
						<th style={matrixThStyle}>Precision</th>
						<th style={matrixThStyle}>Recall</th>
						<th style={matrixThStyle}>Confidence</th>
					</tr>
				</thead>
				<tbody>
					{modules.map((m, i) => {
						const met = m.data?.metrics || {};
						return (
							<tr key={i}>
								<td style={{ ...matrixTdStyle, fontWeight: 600 }}>{m.label}</td>
								{metricCell(met.faiss_score)}
								{metricCell(met.groundedness)}
								{metricCell(met.hallucination_rate, true)}
								{metricCell(met.precision)}
								{metricCell(met.recall)}
								{metricCell(m.data?.confidence)}
							</tr>
						);
					})}
				</tbody>
			</table>

			<div style={{ marginTop: 12, fontSize: 11, color: '#666', fontStyle: 'italic' }}>
				Color key: <span style={{ background: '#d4edda', padding: '1px 6px', borderRadius: 2 }}>Good</span>{' '}
				<span style={{ background: '#fff3cd', padding: '1px 6px', borderRadius: 2 }}>Moderate</span>{' '}
				<span style={{ background: '#f8d7da', padding: '1px 6px', borderRadius: 2 }}>Poor</span>
				{' — '}Hallucination rate is inverse (lower is better).
			</div>
		</div>
	);
}

/**
 * Renders per-URL source evaluation table (reason for choice / elimination).
 */
function SourceEvaluationTable({ evaluations }) {
	if (!evaluations || evaluations.length === 0) return null;

	const statusColors = {
		selected: { bg: '#d4edda', text: '#155724' },
		validation: { bg: '#cce5ff', text: '#004085' },
		rejected: { bg: '#f8d7da', text: '#721c24' },
	};

	return (
		<div style={{ marginTop: 24 }}>
			<h3 style={{ ...h3Style, marginTop: 0 }}>Source Selection Reasoning</h3>
			<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
				<thead>
					<tr>
						<th style={matrixThStyle}>URL</th>
						<th style={{ ...matrixThStyle, width: 80 }}>Status</th>
						<th style={matrixThStyle}>Reason for Choice</th>
						<th style={matrixThStyle}>Reason for Elimination</th>
					</tr>
				</thead>
				<tbody>
					{evaluations.map((ev, i) => {
						const sc = statusColors[ev.status] || statusColors.rejected;
						return (
							<tr key={i}>
								<td style={{ ...matrixTdStyle, wordBreak: 'break-all', maxWidth: 200 }}>
									{ev.url || '—'}
								</td>
								<td style={{ ...matrixTdStyle, textAlign: 'center' }}>
									<span style={{
										display: 'inline-block',
										padding: '1px 8px',
										borderRadius: 3,
										fontSize: 11,
										fontWeight: 700,
										textTransform: 'uppercase',
										background: sc.bg,
										color: sc.text,
									}}>
										{ev.status}
									</span>
								</td>
								<td style={matrixTdStyle}>{ev.reason_for_choice || '—'}</td>
								<td style={matrixTdStyle}>{ev.reason_for_elimination || '—'}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

export default function PrintableReport({ reportData }) {
	if (!reportData) return null;
	const { manufacturer, product_name, specifications, prescriptive_analysis, decision_process } = reportData;
	const today = new Date();

	return (
		<div
			style={{
				background: '#fff',
				color: '#111',
				padding: 40,
				fontFamily: 'Helvetica, Arial, sans-serif',
				maxWidth: 800,
				margin: '0 auto',
				boxSizing: 'border-box',
			}}
		>
			{/* Header */}
			<div style={{ textAlign: 'center', marginBottom: 32 }}>
				<h1 style={{
					fontSize: 28,
					fontWeight: 700,
					letterSpacing: 2,
					margin: 0,
					textTransform: 'uppercase',
				}}>PUMP VERIFICATION REPORT</h1>
				<div style={{ fontSize: 14, marginTop: 8, color: '#222' }}>
					Generated: {formatDate(today)}
				</div>
			</div>

			{/* Basic Info */}
			<div style={{ marginBottom: 24 }}>
				<strong>Manufacturer:</strong> {manufacturer}<br />
				<strong>Product Name:</strong> {product_name}
			</div>

			{/* Specifications Table */}
			<table
				style={{
					width: '100%',
					borderCollapse: 'collapse',
					marginBottom: 32,
					fontSize: 15,
				}}
			>
				<thead>
					<tr>
						<th style={thStyle}>Specification</th>
						<th style={thStyle}>Value</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td style={tdStyle}>Nominal Flow</td>
						<td style={tdStyle}>{specifications?.nominal_flow_m3h ?? '—'} m³/h</td>
					</tr>
					<tr>
						<td style={tdStyle}>Nominal Head</td>
						<td style={tdStyle}>{specifications?.nominal_head_m ?? '—'} m</td>
					</tr>
					<tr>
						<td style={tdStyle}>Motor Power</td>
						<td style={tdStyle}>{specifications?.motor_power_kw ?? '—'} kW</td>
					</tr>
					<tr>
						<td style={tdStyle}>Efficiency</td>
						<td style={tdStyle}>{specifications?.efficiency_percent ?? '—'} %</td>
					</tr>
					<tr>
						<td style={tdStyle}>Material Compatibility</td>
						<td style={tdStyle}>{specifications?.material_compatibility ?? '—'}</td>
					</tr>
					<tr>
						<td style={tdStyle}>Phase</td>
						<td style={tdStyle}>{specifications?.phase ?? '—'} ø</td>
					</tr>
					<tr>
						<td style={tdStyle}>Temp / Pressure Limits</td>
						<td style={tdStyle}>{specifications?.temp_pressure_limits ?? '—'}</td>
					</tr>
				</tbody>
			</table>

			{/* ── Engineering Validations & Analysis (RAG) ── */}
			<div style={{
				marginBottom: 40,
				padding: '32px 28px',
				border: '1.5px solid #111',
				background: '#fafafa',
				fontFamily: 'Georgia, Times New Roman, Times, serif',
			}}>
				<h2 style={{
					fontSize: 22,
					fontWeight: 700,
					margin: '0 0 24px 0',
					letterSpacing: 1,
					color: '#111',
					borderBottom: '2px solid #111',
					paddingBottom: 6,
					textTransform: 'uppercase',
				}}>ENGINEERING VALIDATIONS &amp; ANALYSIS</h2>

				<ValidationSection title="Replacement Options & Advantages" data={reportData.replacement_analysis} />
				<ValidationSection title="Recommended Maintenance Approach" data={reportData.maintenance_approach} />
				<ValidationSection title="Common Faults & Operating Problems" data={reportData.common_faults} />
			</div>

			{/* ── Data Validation Matrix ── */}
			<DataValidationMatrix reportData={reportData} />

			{/* Prescriptive Analysis */}
			<div style={{ marginBottom: 32 }}>
				<h3 style={h3Style}>Prescriptive Analysis</h3>
				<div>
					<strong>Recommended Applications:</strong>
					<ul>
						{(prescriptive_analysis?.recommended_applications || []).map((item, i) => (
							<li key={i}>{item}</li>
						))}
					</ul>
				</div>
				<div>
					<strong>Common Faults to Watch:</strong>
					<ul>
						{(prescriptive_analysis?.common_faults_to_watch || []).map((item, i) => (
							<li key={i}>{item}</li>
						))}
					</ul>
				</div>
				<div>
					<strong>Troubleshooting Tips:</strong>
					<ul>
						{(prescriptive_analysis?.troubleshooting_tips || []).map((item, i) => (
							<li key={i}>{item}</li>
						))}
					</ul>
				</div>
			</div>

			{/* Data Source Validation */}
			<div>
				<h3 style={h3Style}>Data Source Validation</h3>
				<div style={{ marginBottom: 8 }}>
					<strong>Selected Source:</strong> {decision_process?.selected_url ? (
						<a href={decision_process.selected_url} style={{ color: '#111', textDecoration: 'underline' }}>{decision_process.selected_url}</a>
					) : '—'}
				</div>
				<div style={{ marginBottom: 8 }}>
					<strong>Validation Reasoning:</strong>
					<div style={{ whiteSpace: 'pre-line', marginTop: 4 }}>{decision_process?.final_selection_reasoning ?? '—'}</div>
				</div>

				{/* Per-URL Source Evaluations */}
				<SourceEvaluationTable evaluations={decision_process?.source_evaluations} />
			</div>
		</div>
	);
}

const thStyle = {
	border: '1px solid #111',
	padding: '8px 12px',
	background: '#f5f5f5',
	fontWeight: 700,
	textAlign: 'left',
};

const tdStyle = {
	border: '1px solid #111',
	padding: '8px 12px',
	background: '#fff',
	textAlign: 'left',
};

const h3Style = {
	fontSize: 18,
	fontWeight: 700,
	margin: '24px 0 8px 0',
	letterSpacing: 1,
	color: '#111',
};

const validationH3Style = {
	fontSize: 17,
	fontWeight: 700,
	margin: '0 0 8px 0',
	letterSpacing: 0.5,
	color: '#111',
	textTransform: 'none',
};

const validationTextStyle = {
	fontSize: 15,
	color: '#111',
	lineHeight: 1.6,
	marginLeft: 0,
	marginBottom: 0,
	fontFamily: 'Georgia, Times New Roman, Times, serif',
};

const matrixThStyle = {
	border: '1px solid #111',
	padding: '6px 8px',
	background: '#e9ecef',
	fontWeight: 700,
	textAlign: 'left',
	fontSize: 12,
	textTransform: 'uppercase',
	letterSpacing: 0.3,
};

const matrixTdStyle = {
	border: '1px solid #ccc',
	padding: '5px 8px',
	fontSize: 12,
	lineHeight: 1.4,
	verticalAlign: 'top',
};
