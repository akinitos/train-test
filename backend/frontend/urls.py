from django.urls import path
from .views import react_index

urlpatterns = [
    path("", react_index, name="react-index"),
]
