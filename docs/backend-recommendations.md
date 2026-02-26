# Backend Recommendations

This document outlines the frontend expectations for the two backend API endpoints. **No backend code was modified** — only the frontend (`MARIO/`) was updated.

---

## API Endpoints

The frontend now uses **two separate endpoints** instead of a single unified one:

| Endpoint | Method | Response Type | Description |
|----------|--------|---------------|-------------|
| `/api/agent/standard/` | `POST` | `application/json` | Standard search — returns JSON with user-friendly results |
| `/api/agent/advanced/` | `POST` | `application/pdf` | Advanced search — returns a PDF file |
| `/api/agent/health/` | `GET` | `application/json` | Health check (unchanged) |

---

## Standard Search (`/api/agent/standard/`)

### Request Body

```json
{
  "message": "Grundfos | CR 95-2",
  "user_id": "default-user",
  "show_accuracy": false
}
```

| Parameter       | Type      | Default          | Description |
|-----------------|-----------|------------------|-------------|
| `message`       | `string`  | *(required)*     | Query in format `"manufacturer \| product_name"` |
| `user_id`       | `string`  | `"default-user"` | User identifier |
| `show_accuracy` | `boolean` | `false`          | When `true`, include accuracy comparison data in the response |
| `session_id`    | `string`  | `null`           | Optional session continuation |

### Expected Response (`application/json`)

The frontend can handle both plain text and structured JSON:

**Plain text response** (rendered as prose):
```json
{
  "response": "The Grundfos CR 95-2 is a vertical multistage pump with 95 m3/h flow..."
}
```

**Structured JSON response** (rendered as key-value table):
```json
{
  "response": {
    "summary": "Grundfos CR 95-2 specifications",
    "FLOWNOM56": "95 m3/h",
    "HEADNOM56": "28.4 m",
    "PHASE": "3-phase",
    "POWER": "11 kW",
    "accuracy": {
      "match_score": "94%",
      "fields_compared": 12,
      "mismatches": ["WEIGHT"]
    }
  }
}
```

- If `response` is a string → rendered as a prose text card.
- If `response` is an object → rendered as key-value detail rows.
- If `show_accuracy` is `true` and response contains an `accuracy` key → rendered in a separate "Accuracy Comparison" section.

---

## Advanced Search (`/api/agent/advanced/`)

### Request Body

Same structure as Standard Search:

```json
{
  "message": "Grundfos | CR 95-2",
  "user_id": "default-user",
  "show_accuracy": false
}
```

### Expected Response (`application/pdf`)

The backend should return the PDF file directly as a binary response:

- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="result.pdf"` (optional, for download filename hint)

The frontend:
1. Receives the PDF as a blob
2. Creates an object URL and embeds it in an `<iframe>` for inline viewing
3. Provides a "Download PDF" button that saves the file locally
4. Revokes the object URL when results are cleared (memory cleanup)

### Django Example

```python
from django.http import FileResponse

@csrf_exempt
@require_POST
def agent_advanced(request):
    body = json.loads(request.body)
    message = body.get("message", "").strip()
    show_accuracy = body.get("show_accuracy", False)
    
    # ... run agent, generate PDF ...
    
    pdf_path = "/path/to/generated/report.pdf"
    return FileResponse(
        open(pdf_path, "rb"),
        content_type="application/pdf",
        as_attachment=False,
        filename="mario_report.pdf",
    )
```

---

## URL Configuration

Register the new endpoints in `agent/urls.py`:

```python
urlpatterns = [
    path("agent/standard/", views.agent_standard, name="agent-standard"),
    path("agent/advanced/", views.agent_advanced, name="agent-advanced"),
    path("agent/health/", views.health, name="agent-health"),
]
```

The old `/api/agent/run/` and `/api/agent/stream/` endpoints are no longer used by the frontend but can be preserved for backward compatibility if needed.

---

## PDF Generation Responsibility

**PDF generation is now entirely the backend's responsibility.** The frontend no longer uses `jspdf` or `html2canvas` — those dependencies have been removed. The backend should generate the PDF (using e.g., ReportLab, WeasyPrint, or any other Python PDF library) and return it directly in the HTTP response.
