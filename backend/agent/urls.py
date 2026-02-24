from django.urls import path

from . import views

urlpatterns = [
    path("agent/run/", views.agent_run, name="agent-run"),
    path("agent/stream/", views.agent_stream, name="agent-stream"),
    path("agent/health/", views.health, name="agent-health"),
]
