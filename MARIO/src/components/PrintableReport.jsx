
import React from 'react';

function formatDate(date) {
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
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
				minHeight: '1122px', // A4 height at 96dpi
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

			{/* Engineering Validations & Analysis Section */}
			<div style={{
				marginBottom: 40,
				padding: '32px 28px',
				border: '1px solid #111',
				background: '#fafafa',
				fontFamily: 'Georgia, Times New Roman, Times, serif',
			}}
			>
				<h2 style={{
					fontSize: 22,
					fontWeight: 700,
					margin: '0 0 18px 0',
					letterSpacing: 1,
					color: '#111',
					borderBottom: '2px solid #111',
					paddingBottom: 6,
					textTransform: 'uppercase',
				}}>ENGINEERING VALIDATIONS & ANALYSIS</h2>

				<div style={{ marginBottom: 24 }}>
					<h3 style={validationH3Style}>Replacement Options & Advantages</h3>
					<div style={validationTextStyle}>{reportData.replacement_analysis || '—'}</div>
				</div>
				<div style={{ marginBottom: 24 }}>
					<h3 style={validationH3Style}>Recommended Maintenance Approach</h3>
					<div style={validationTextStyle}>{reportData.maintenance_approach || '—'}</div>
				</div>
				<div>
					<h3 style={validationH3Style}>Common Faults & Operating Problems</h3>
					<div style={validationTextStyle}>{reportData.common_faults || '—'}</div>
				</div>
			</div>

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
