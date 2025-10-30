from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ProblemViewSet, StoreViewSet, add_store, classify, nearby_stores
from .views import admin_login

router = DefaultRouter()
router.register(r"problems", ProblemViewSet)
router.register(r"stores", StoreViewSet)

urlpatterns = [
    path("classify/", classify, name="classify"),
    path("nearby_stores/", nearby_stores, name="nearby-stores"),
    path('add_store/', add_store, name='add-store'),
    path('admin_login/', admin_login),
]

urlpatterns += router.urls
