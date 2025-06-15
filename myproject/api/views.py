from rest_framework import generics, viewsets, permissions
from .models import Task, User, Product, Customer
from .serializers import TaskSerializer, UserSerializer, ProductSerializer, CustomerSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.all()
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(owner=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Customer.objects.all()
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(owner=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
