# eval/migrations/0002_evaluationjudgemark_subsubeventjudge_and_more.py
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
from decimal import Decimal
from django.core.validators import MinValueValidator, MaxValueValidator

class Migration(migrations.Migration):

    dependencies = [
        ('eval', '0001_initial'),
        ('events', '0002_mainevent_isopen_subevent_isopen_subsubevent_isopen'),  # adjust if your events app has a different latest migration
    ]

    operations = [
        # Create SubSubEventJudge model
        migrations.CreateModel(
            name='SubSubEventJudge',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('order', models.PositiveSmallIntegerField(default=0)),
                ('subsubevent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='judges', to='events.SubSubEvent')),
            ],
            options={
                'ordering': ('order', 'name'),
                'unique_together': {('subsubevent', 'name')},
            },
        ),

        # Create EvaluationJudgeMark model
        migrations.CreateModel(
            name='EvaluationJudgeMark',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('judge_name', models.CharField(max_length=200)),
                ('mark', models.DecimalField(decimal_places=2, max_digits=7, validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('10000.00'))])),
                ('comments', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('evaluation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='judge_marks', to='eval.Evaluation')),
                ('subsubevent_judge', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='evaluation_marks', to='eval.SubSubEventJudge')),
            ],
            options={
                'unique_together': {('evaluation', 'judge_name')},
            },
        ),

        # IMPORTANT: now add the subsubevent ForeignKey to Evaluation (must appear BEFORE any AlterUniqueTogether referencing it)
        migrations.AddField(
            model_name='evaluation',
            name='subsubevent',
            field=models.ForeignKey(null=False, on_delete=django.db.models.deletion.PROTECT, related_name='evaluations', to='events.SubSubEvent'),
            preserve_default=False,
        ),

        # If you also need to alter any existing fields names or other additions, include them here
        # Finally set unique_together on Evaluation (project, subsubevent)
        migrations.AlterUniqueTogether(
            name='evaluation',
            unique_together={('project', 'subsubevent')},
        ),
    ]