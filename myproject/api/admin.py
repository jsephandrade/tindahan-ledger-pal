from django.contrib import admin
from .models import Task, User, Product, Customer

admin.site.register(User)
admin.site.register(Task)
admin.site.register(Product)
admin.site.register(Customer)
