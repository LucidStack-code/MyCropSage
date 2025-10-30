from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

class Problem(models.Model):
    name = models.CharField(max_length=200)
    aliases = models.JSONField(default=list)
    symptoms = models.JSONField(default=list)
    remedies = models.JSONField(default=list)
    severity = models.CharField(max_length=50, default='medium')
    description = models.TextField(blank=True, null=True)
    causes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Store(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    lat = models.FloatField()
    lng = models.FloatField()
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return self.name


# ✅ Add signal to refresh ML cache when Problem changes
@receiver([post_save, post_delete], sender=Problem)
def refresh_problem_cache(sender, **kwargs):
    try:
        from api.ml.classifier import clear_cache
        clear_cache()
    except Exception as e:
        print("⚠️ Cache refresh failed:", e)
