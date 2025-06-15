from rest_framework import serializers
from .models import User, Task, Product, Customer, UtangTransaction
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


class UtangTransactionSerializer(serializers.ModelSerializer):
    # these two lines add the related names into your JSON response
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    product_name  = serializers.CharField(source='product.name',  read_only=True)

    class Meta:
        model = UtangTransaction
        # explicitly list all the fields you want returned, including the new ones
        fields = [
            'id',
            'customer',      # the FK
            'customer_name', # the human-readable name
            'product',
            'product_name',
            'quantity',
            'unit_price',
            'total_amount',
            'amount_paid',
            'remaining',     # adjust if your field is named `remaining_balance`
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'customer_name',
            'product_name',
            'created_at',
            'updated_at',
        ]