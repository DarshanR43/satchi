from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_project_event_project_faculty_mentor_name_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="project_code",
            field=models.CharField(blank=True, editable=False, max_length=255, null=True, unique=True),
        ),
    ]
