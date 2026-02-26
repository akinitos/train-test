
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
	const { manufacturer, product_name, specifications, replacement_options = [], data_validation_matrix = [], sources = [] } = reportData;
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

			{/* Replacement Options */}
			{replacement_options.length > 0 && (
				<div style={{ marginBottom: 32 }}>
					<h3 style={h3Style}>Replacement Options</h3>
					<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
						<thead>
							<tr>
								<th style={thStyle}>Manufacturer</th>
								<th style={thStyle}>Model</th>
								<th style={thStyle}>Flow (m³/h)</th>
								<th style={thStyle}>Head (m)</th>
								<th style={thStyle}>Power (kW)</th>
								<th style={thStyle}>Compatibility</th>
							</tr>
						</thead>
						<tbody>
							{replacement_options.map((opt, i) => (
								<tr key={i}>
									<td style={tdStyle}>{opt.manufacturer}</td>
									<td style={tdStyle}>{opt.model}</td>
									<td style={tdStyle}>{opt.nominal_flow_m3h}</td>
									<td style={tdStyle}>{opt.nominal_head_m}</td>
									<td style={tdStyle}>{opt.motor_power_kw}</td>
									<td style={tdStyle}>{opt.compatibility}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Data Validation Matrix */}
			{data_validation_matrix.length > 0 && (
				<div style={{ marginBottom: 32 }}>
					<h3 style={h3Style}>Data Validation Matrix</h3>
					<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
						<thead>
							<tr>
								<th style={thStyle}>Field</th>
								<th style={thStyle}>Primary</th>
								<th style={thStyle}>Validation</th>
								<th style={thStyle}>Match</th>
								<th style={thStyle}>Confidence</th>
							</tr>
						</thead>
						<tbody>
							{data_validation_matrix.map((row, i) => (
								<tr key={i}>
									<td style={tdStyle}>{row.field}</td>
									<td style={tdStyle}>{row.primary_source_value}</td>
									<td style={tdStyle}>{row.validation_source_value}</td>
									<td style={tdStyle}>{row.match ? '✓' : '✗'}</td>
									<td style={tdStyle}>{row.confidence}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Sources */}
			{sources.length > 0 && (
				<div>
					<h3 style={h3Style}>Sources</h3>
					{sources.map((src, i) => (
						<div key={i} style={{ marginBottom: 6, fontSize: 13 }}>
							<strong>[{src.type}]</strong>{' '}
							<a href={src.url} style={{ color: '#111', textDecoration: 'underline' }}>{src.title || src.url}</a>
							{src.notes && <span style={{ color: '#555' }}> — {src.notes}</span>}
						</div>
					))}
				</div>
			)}
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
