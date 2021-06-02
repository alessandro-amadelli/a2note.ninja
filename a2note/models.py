from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class AdditionalInfo(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    consent_ip = models.GenericIPAddressField()
    consent_timestamp = models.DateTimeField(auto_now_add=True)
