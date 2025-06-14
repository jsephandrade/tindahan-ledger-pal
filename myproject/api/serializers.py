from rest_framework import serializers
from .models import User, Task, Product, Customer
from django.contrib.auth.hashers import make_password


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'due_date', 'completed', 'owner']
        read_only_fields = ['owner']


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'unit_price', 'stock_quantity', 'created_at', 'updated_at', 'owner']
        read_only_fields = ['owner', 'created_at', 'updated_at']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'contact', 'total_owed', 'created_at', 'updated_at', 'owner']
        read_only_fields = ['owner', 'created_at', 'updated_at']
