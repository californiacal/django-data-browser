# Generated by Django 2.0.13 on 2020-04-29 19:40

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("data_browser", "0002_auto_20200331_1842"),
    ]

    operations = [
        migrations.RemoveField(model_name="view", name="app",),
    ]