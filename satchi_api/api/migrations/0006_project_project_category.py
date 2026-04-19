# Generated manually to add a hardware/software category for projects.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0005_relink_project_participants"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="project_category",
            field=models.CharField(
                blank=True,
                choices=[("HARDWARE", "Hardware"), ("SOFTWARE", "Software")],
                max_length=20,
                null=True,
            ),
        ),
    ]
