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


# ── Source Evaluation ────────────────────────────────────────────────────────

class SourceEvaluation(BaseModel):
    """Per-URL evaluation explaining why a source was chosen or eliminated."""
    url: str = Field("", description="The URL being evaluated.")
    status: str = Field(
        "",
        description="One of: 'selected', 'validation', or 'rejected'.",
    )
    reason_for_choice: str = Field(
        "",
        description="Why this source was selected / kept for validation (empty if rejected).",
    )
    reason_for_elimination: str = Field(
        "",
        description="Why this source was eliminated (empty if selected/validation).",
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
    source_evaluations: list[SourceEvaluation] = Field(
        default_factory=list,
        description="Per-URL evaluation with reason for choice and reason for elimination.",
    )


# ── Validation Metrics ──────────────────────────────────────────────────────

class ValidationMetrics(BaseModel):
    """Quality metrics from RAG validation pipeline."""
    hallucination_rate: float = Field(
        0.0, description="Fraction of claims NOT supported by context (0-1, lower is better)."
    )
    groundedness: float = Field(
        0.0, description="Fraction of claims supported by context (0-1, higher is better)."
    )
    precision: float = Field(
        0.0, description="Fraction of summary claims relevant to the query (0-1)."
    )
    recall: float = Field(
        0.0, description="Fraction of relevant context captured in summary (0-1)."
    )
    faiss_score: float = Field(
        0.0, description="Average FAISS retrieval confidence score (0-1)."
    )


# ── RAG Validation Result ───────────────────────────────────────────────────

class RAGValidation(BaseModel):
    """Structured output from a RAG validation tool, including confidence."""
    summary: str = Field("", description="Professional engineering summary.")
    confidence: float = Field(0.0, description="Retrieval confidence score 0-1.")
    confidence_label: str = Field(
        "LOW", description="Human-readable label: HIGH, MEDIUM, or LOW."
    )
    key_findings: list[str] = Field(
        default_factory=list,
        description="3-5 key engineering findings from the source PDF.",
    )
    sources_matched: int = Field(
        0, description="Number of relevant document sections found."
    )
    validation_notes: str = Field(
        "", description="Methodological note on how the analysis was produced."
    )
    metrics: ValidationMetrics = Field(
        default_factory=ValidationMetrics,
        description="Data quality metrics: hallucination rate, groundedness, precision, recall, FAISS score.",
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
    replacement_analysis: RAGValidation = Field(
        default_factory=RAGValidation,
        description="RAG-validated replacement analysis from PDF source.",
    )
    maintenance_approach: RAGValidation = Field(
        default_factory=RAGValidation,
        description="RAG-validated maintenance approach from PDF source.",
    )
    common_faults: RAGValidation = Field(
        default_factory=RAGValidation,
        description="RAG-validated common faults analysis from PDF source.",
    )
