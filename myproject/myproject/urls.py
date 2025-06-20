from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from api.views import RegisterView, TaskViewSet, ProductViewSet, CustomerViewSet, UtangTransactionViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = routers.DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'utang', UtangTransactionViewSet, basename='utangtransaction')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
]
