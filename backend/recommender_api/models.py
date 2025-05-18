from django.db import models

# Create your models here.

class Movie(models.Model):
    title = models.CharField(max_length=255)
    movie_id = models.IntegerField(unique=True)
    
    def __str__(self):
        return self.title
