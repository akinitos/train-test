from django.http import HttpResponse
import os

def react_index(request):
    """Serve React index.html for SPA routes."""
    index_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "../MARIO/dist/index.html"
    )
    try:
        with open(index_path, "r") as f:
            return HttpResponse(f.read())
    except FileNotFoundError:
        return HttpResponse("Build the React app first.", status=404)
