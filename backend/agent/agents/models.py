"""
Pydantic data models for the MARIO industrial pump agent.
"""

from pydantic import BaseModel, Field


# ── Specifications ───────────────────────────────────────────────────────────

class PumpSpecifications(BaseModel):
    """Core engineering specifications extracted from datasheets."""
    nominal_flow_m3h: float | None = Field(
        None, description="Nominal flow rate in cubic metres per hour (m³/h). Extract 'Nominal', 'Rated Output', 'Duty Point', or 'Best Efficiency Point'."
    )
    nominal_head_m: float | None = Field(
        None, description="Nominal head in metres. Extract 'Nominal', 'Rated Output', 'Duty Point', or 'Best Efficiency Point'."
    )
    motor_power_kw: float | None = Field(
        None, description="Motor power in kilowatts."
    )
    efficiency_percent: float | None = Field(
        None, description="Pump efficiency as a percentage."
    )
    material_compatibility: str | None = Field(
        None, description="Materials the pump is compatible with (e.g. cast iron, stainless steel)."
    )
    phase: int | None = Field(
        None, description="Electrical phase (1 or 3)."
    )
    temp_pressure_limits: str | None = Field(
        None, description="Temperature and pressure operating limits."
    )


# ── Prescriptive Analysis ───────────────────────────────────────────────────

class PrescriptiveAnalysis(BaseModel):
    """Engineering guidance derived from the pump data."""
    recommended_applications: list[str] = Field(
        default_factory=list,
        description="List of recommended applications for this pump.",
    )
    common_faults_to_watch: list[str] = Field(
        default_factory=list,
        description="Common faults or failure modes to monitor.",
    )
    troubleshooting_tips: list[str] = Field(
        default_factory=list,
        description="Practical troubleshooting tips for field engineers.",
    )


# ── Decision Process ────────────────────────────────────────────────────────

class DecisionProcess(BaseModel):
    """Transparent record of how the agent chose its data sources."""
    searched_urls: list[str] = Field(
        default_factory=list,
        description="The 10 URLs returned by the initial search.",
    )
    rejected_urls_reasoning: str = Field(
        "", description="Explanation of why 7 URLs were dropped."
    )
    validation_urls: list[str] = Field(
        default_factory=list,
        description="The 2 URLs used to cross-validate the data.",
    )
    selected_url: str = Field(
        "", description="The single primary URL chosen as the data source."
    )
    final_selection_reasoning: str = Field(
        "", description="Reasoning behind the final URL selection."
    )


# ── Top-level Report ────────────────────────────────────────────────────────

class IndustrialPumpReport(BaseModel):
    """Complete enterprise-grade pump research report."""
    manufacturer: str = Field(..., description="Pump manufacturer name.")
    product_name: str = Field(..., description="Pump product / model name.")
    specifications: PumpSpecifications = Field(
        default_factory=PumpSpecifications,
        description="Extracted engineering specifications.",
    )
    prescriptive_analysis: PrescriptiveAnalysis = Field(
        default_factory=PrescriptiveAnalysis,
        description="Prescriptive engineering analysis.",
    )
    decision_process: DecisionProcess = Field(
        default_factory=DecisionProcess,
        description="Transparent decision-making audit trail.",
    )
