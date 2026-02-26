export const mockThoughtEvents = [
	{ type: 'tool_call', name: 'search_pump_specs', args: { query: 'Grundfos CR 45-3' } },
	{
		type: 'tool_result',
		name: 'search_pump_specs',
		result: JSON.stringify([
			'https://www.chemengjournal.com/pump-selection-guide-2025.pdf',
			'https://www.pumpsandsystems.com/chemical-process-pumps-overview',
			'https://www.flowcontrolnetwork.com/industrial-pump-materials.html',
			'https://www.engineeringtoolbox.com/centrifugal-pump-curves.html',
			'https://www.chemicalprocessing.com/articles/2024/optimizing-pump-efficiency',
			'https://www.chemicalplantsafety.org/pump-failure-case-studies',
			'https://www.industrialfluidpower.com/chemical-pump-maintenance',
			'https://www.pumpacademy.org/advanced-pump-selection',
			'https://www.processindustryforum.com/pump-troubleshooting-guide',
			'https://www.chemind.com/whitepapers/chemical-pump-best-practices.pdf',
		]),
	},
	{
		type: 'thought',
		content:
			'Rejecting 7 URLs: amazon.com (retail), ebay.com (marketplace), alibaba.com (wholesale), pumpsdirect.com (e-commerce), wikipedia.org (general reference), quora.com (forum), youtube.com (video). Selecting 3 technical sources for deep reading.',
	},
	{ type: 'tool_call', name: 'read_webpage', args: { url: 'https://www.chemengjournal.com/pump-selection-guide-2025.pdf' } },
	{ type: 'tool_result', name: 'read_webpage', result: 'Page content retrieved' },
	{ type: 'tool_call', name: 'read_webpage', args: { url: 'https://www.chemicalprocessing.com/articles/2024/optimizing-pump-efficiency' } },
	{ type: 'tool_result', name: 'read_webpage', result: 'Page content retrieved' },
	{ type: 'tool_call', name: 'read_webpage', args: { url: 'https://www.chemind.com/whitepapers/chemical-pump-best-practices.pdf' } },
	{ type: 'tool_result', name: 'read_webpage', result: 'Page content retrieved' },
	{
		type: 'thought',
		content:
			'Cross-referencing data from all 3 sources. The chemengjournal.com PDF is the most comprehensive with full performance curves, material compatibility charts, and API 610 compliance data. Using it as the primary source.',
	},
	{
		type: 'thought',
		content:
			'Extracting specifications for Grundfos CR 45-3: Nominal Flow 36 m³/h, Nominal Head 15 m, Motor Power 5.5 kW, Efficiency 78%. Running validation RAG analyses…',
	},
];

export const mockIndustrialPumpReport = {
	manufacturer: 'Grundfos',
	product_name: 'CR 45-3',
	specifications: {
		nominal_flow_m3h: 36.0,
		nominal_head_m: 15.0,
		motor_power_kw: 5.5,
		efficiency_percent: 78,
		material_compatibility: 'Stainless Steel 316, PTFE',
		phase: 3,
		temp_pressure_limits: 'Max Temp: 120°C, Max Pressure: 16 bar',
	},
	prescriptive_analysis: {
		recommended_applications: [
			'Continuous transfer of aggressive chemicals in batch reactors',
			'Feed pump for distillation columns in hazardous environments',
			'Circulation of caustic and acidic solutions in scrubber systems',
			'Transfer of solvents in explosion-proof zones',
			'Metering of process fluids in automated dosing skids',
		],
		common_faults_to_watch: [
			'Seal degradation due to prolonged exposure to corrosive media',
			'Cavitation from insufficient NPSH at high flow rates',
			'Motor overheating during extended continuous operation',
			'Premature bearing wear from misalignment or vibration',
			'Blockage of impeller by solid particulates in process stream',
		],
		troubleshooting_tips: [
			'Regularly inspect and replace mechanical seals; use compatible materials for process fluids.',
			'Monitor suction pressure and ensure adequate NPSH to prevent cavitation.',
			'Implement vibration analysis and alignment checks during maintenance shutdowns.',
			'Install temperature sensors on motor windings for early detection of overheating.',
			'Flush pump with clean solvent after handling viscous or crystallizing chemicals.',
		],
	},
	replacement_analysis: {
		summary:
			"For chemical process pumps operating in aggressive environments, replacement is recommended when performance drops below 80% of nominal flow or head, or when corrosion or pitting is observed on wetted components. Upgrading to a modern, magnetically coupled pump can eliminate seal failures and reduce fugitive emissions, while selecting advanced composite materials can extend service life and lower total cost of ownership.",
		confidence: 0.82,
		confidence_label: "HIGH",
		key_findings: [
			"Performance below 80% nominal triggers replacement consideration",
			"Magnetically coupled upgrades eliminate seal failure risk",
			"Advanced composite wetted parts reduce lifecycle cost by up to 35%",
			"Retrofit kits available for in-place motor frame upgrades",
		],
		sources_matched: 5,
		validation_notes:
			"Analysis based on 5 relevant sections retrieved from RAG_for_pumps.pdf (48 total chunks indexed). Average retrieval confidence: 82% (HIGH).",
		metrics: {
			hallucination_rate: 0.05,
			groundedness: 0.92,
			precision: 0.88,
			recall: 0.80,
			faiss_score: 0.82,
		},
	},
	maintenance_approach: {
		summary:
			"A predictive maintenance schedule is advised, including quarterly vibration analysis, semi-annual thermographic inspections, and annual ultrasonic thickness testing of wetted parts. Digital monitoring of bearing temperature and seal leakage should be implemented for early fault detection. Maintenance intervals may be shortened for pumps handling highly corrosive or abrasive fluids.",
		confidence: 0.74,
		confidence_label: "HIGH",
		key_findings: [
			"Predictive maintenance reduces unplanned downtime by up to 40%",
			"Quarterly vibration analysis detects bearing degradation early",
			"Ultrasonic thickness testing is critical for corrosive service pumps",
			"IoT-based seal leak monitoring enables condition-based intervention",
		],
		sources_matched: 5,
		validation_notes:
			"Analysis based on 5 relevant sections retrieved from Study_of_Various_Maintenance_Approaches.pdf (62 total chunks indexed). Average retrieval confidence: 74% (HIGH).",
		metrics: {
			hallucination_rate: 0.08,
			groundedness: 0.85,
			precision: 0.82,
			recall: 0.76,
			faiss_score: 0.74,
		},
	},
	common_faults: {
		summary:
			"Typical faults for chemical pumps include cavitation due to low NPSH, mechanical seal leaks from chemical attack, bearing failure caused by misalignment or inadequate lubrication, and impeller clogging from solids or crystallization. Early detection and prompt corrective action are essential to prevent unplanned downtime and costly repairs.",
		confidence: 0.68,
		confidence_label: "MEDIUM",
		key_findings: [
			"Cavitation is the leading cause of premature impeller wear",
			"Chemical attack on seals accounts for 30% of unplanned shutdowns",
			"Misalignment-induced bearing failure often goes undetected without vibration monitoring",
			"Crystallisation in dead-legs can block suction and cause dry running",
			"Thermal shock during CIP cycles accelerates fatigue cracking",
		],
		sources_matched: 5,
		validation_notes:
			"Analysis based on 5 relevant sections retrieved from Elected_Operating_Problems_of_Central_Pu.pdf (39 total chunks indexed). Average retrieval confidence: 68% (MEDIUM).",
		metrics: {
			hallucination_rate: 0.12,
			groundedness: 0.78,
			precision: 0.75,
			recall: 0.70,
			faiss_score: 0.68,
		},
	},
	decision_process: {
		searched_urls: [
			'https://www.chemengjournal.com/pump-selection-guide-2025.pdf',
			'https://www.pumpsandsystems.com/chemical-process-pumps-overview',
			'https://www.flowcontrolnetwork.com/industrial-pump-materials.html',
			'https://www.engineeringtoolbox.com/centrifugal-pump-curves.html',
			'https://www.chemicalprocessing.com/articles/2024/optimizing-pump-efficiency',
			'https://www.chemicalplantsafety.org/pump-failure-case-studies',
			'https://www.industrialfluidpower.com/chemical-pump-maintenance',
			'https://www.pumpacademy.org/advanced-pump-selection',
			'https://www.processindustryforum.com/pump-troubleshooting-guide',
			'https://www.chemind.com/whitepapers/chemical-pump-best-practices.pdf',
		],
		rejected_urls_reasoning:
			'Seven URLs were excluded due to insufficient technical depth, lack of peer-reviewed data, or outdated standards. For example, several sources focused on general pump maintenance rather than chemical compatibility, and some lacked detailed performance curves or material certifications relevant to hazardous chemical service. Only sources with comprehensive technical datasheets, recent industry guidelines, and validated case studies were retained for validation and final selection.',
		validation_urls: [
			'https://www.chemengjournal.com/pump-selection-guide-2025.pdf',
			'https://www.chemicalprocessing.com/articles/2024/optimizing-pump-efficiency',
		],
		selected_url: 'https://www.chemengjournal.com/pump-selection-guide-2025.pdf',
		final_selection_reasoning:
			'The selected PDF provides a rigorous, up-to-date technical review of chemical process pump selection, including detailed performance curves, material compatibility charts, and compliance with the latest API 610 and ISO 5199 standards. Its peer-reviewed content and inclusion of real-world case studies make it the most authoritative and reliable source for this verification.',
		source_evaluations: [
			{
				url: 'https://www.chemengjournal.com/pump-selection-guide-2025.pdf',
				status: 'selected',
				reason_for_choice: 'Comprehensive peer-reviewed PDF with detailed performance curves, material compatibility charts, and API 610 compliance data.',
				reason_for_elimination: '',
			},
			{
				url: 'https://www.chemicalprocessing.com/articles/2024/optimizing-pump-efficiency',
				status: 'validation',
				reason_for_choice: 'Recent industry article with optimization data that cross-validates the primary source specifications.',
				reason_for_elimination: '',
			},
			{
				url: 'https://www.chemind.com/whitepapers/chemical-pump-best-practices.pdf',
				status: 'validation',
				reason_for_choice: 'White paper with best-practice guidelines useful for cross-checking maintenance and fault data.',
				reason_for_elimination: '',
			},
			{
				url: 'https://www.pumpsandsystems.com/chemical-process-pumps-overview',
				status: 'rejected',
				reason_for_choice: '',
				reason_for_elimination: 'General overview article without specific pump model data or performance curves.',
			},
			{
				url: 'https://www.flowcontrolnetwork.com/industrial-pump-materials.html',
				status: 'rejected',
				reason_for_choice: '',
				reason_for_elimination: 'Focused only on materials, no performance or specification data for this pump model.',
			},
			{
				url: 'https://www.engineeringtoolbox.com/centrifugal-pump-curves.html',
				status: 'rejected',
				reason_for_choice: '',
				reason_for_elimination: 'Generic centrifugal pump reference, not specific to the queried model.',
			},
			{
				url: 'https://www.chemicalplantsafety.org/pump-failure-case-studies',
				status: 'rejected',
				reason_for_choice: '',
				reason_for_elimination: 'Safety-focused case studies, no extractable specifications or maintenance protocols.',
			},
			{
				url: 'https://www.industrialfluidpower.com/chemical-pump-maintenance',
				status: 'rejected',
				reason_for_choice: '',
				reason_for_elimination: 'Generic maintenance article, lacks model-specific data or peer-reviewed evidence.',
			},
			{
				url: 'https://www.pumpacademy.org/advanced-pump-selection',
				status: 'rejected',
				reason_for_choice: '',
				reason_for_elimination: 'Educational content on selection methodology, no actual pump datasheet values.',
			},
			{
				url: 'https://www.processindustryforum.com/pump-troubleshooting-guide',
				status: 'rejected',
				reason_for_choice: '',
				reason_for_elimination: 'Troubleshooting guide with no specific model data or validated technical specifications.',
			},
		],
	},
};
