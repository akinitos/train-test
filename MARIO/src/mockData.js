
export const mockIndustrialPumpReport = {
	specifications: {
		nominal_flow_m3h: 36.0, // Typical nominal flow (not max)
		nominal_head_m: 15.0, // Typical nominal head (not max)
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
	},
};
