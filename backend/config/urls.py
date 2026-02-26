"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

import os
import mimetypes

from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.http import FileResponse, HttpResponse

DIST_DIR = os.path.join(settings.BASE_DIR, "..", "MARIO", "dist")


def serve_react_index(request):
    """Serve the React SPA index.html."""
    index_path = os.path.join(DIST_DIR, "index.html")
    try:
        with open(index_path, "r") as f:
            return HttpResponse(f.read(), content_type="text/html")
    except FileNotFoundError:
        return HttpResponse(
            "Build the React app first: cd MARIO && npm run build",
            status=404,
        )


def serve_dist_file(request, filepath=""):
    """Serve a file from MARIO/dist/. If not found, fall back to index.html (SPA)."""
    full_path = os.path.normpath(os.path.join(DIST_DIR, filepath))

    # Security: prevent directory traversal
    if not full_path.startswith(os.path.normpath(DIST_DIR)):
        return HttpResponse("Forbidden", status=403)

    if os.path.isfile(full_path):
        content_type, _ = mimetypes.guess_type(full_path)
        return FileResponse(
            open(full_path, "rb"),
            content_type=content_type or "application/octet-stream",
        )

    # SPA fallback
    return serve_react_index(request)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("agent.urls")),
    # Root → index.html
    path("", serve_react_index, name="react-index"),
    # All other paths → try dist file, else SPA fallback
    re_path(r"^(?P<filepath>.+)$", serve_dist_file),
]
