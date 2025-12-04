from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User  # keep if needed elsewhere
from events.models import SubSubEvent
from api.models import Project
from decimal import Decimal


class SubSubEventJudge(models.Model):
    """
    Maps a SubSubEvent to one judge (name only).
    One SubSubEvent will have multiple SubSubEventJudge rows — each row is one judge name.
    """
    subsubevent = models.ForeignKey(
        SubSubEvent, on_delete=models.CASCADE, related_name="judges"
    )
    name = models.CharField(max_length=200)
    order = models.PositiveSmallIntegerField(
        default=0,
        help_text="Optional ordering for the judges list (appearance order)."
    )

    class Meta:
        unique_together = ("subsubevent", "name")
        ordering = ("order", "name")

    def __str__(self):
        return f"{self.name} ({self.subsubevent})"


class Evaluation(models.Model):
    """
    An evaluation for a Project within a SubSubEvent.
    The per-judge marks are stored in EvaluationJudgeMark rows.
    final_score is the average of all judge marks (or 0 if none).
    total is the sum of marks (useful if you want sum instead of avg).
    """
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="evaluations"
    )
    subsubevent = models.ForeignKey(
        SubSubEvent, on_delete=models.PROTECT, related_name="evaluations"
    )
    is_disqualified = models.BooleanField(default=False)
    remarks = models.TextField(blank=True, null=True)

    # computed fields
    number_of_judges = models.PositiveIntegerField(default=0)
    total = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    final_score = models.DecimalField(
        max_digits=6, decimal_places=2, default=Decimal("0.00"),
        help_text="Average mark across judges."
    )

    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "subsubevent")

    def __str__(self):
        return f"Evaluation: {self.project} @ {self.subsubevent} — avg {self.final_score}"

    def recalculate_scores(self):
        """
        Recompute number_of_judges, total and final_score from related EvaluationJudgeMark rows.
        Call this whenever marks change.
        """
        marks_qs = self.judge_marks.all()
        count = marks_qs.count()
        if count == 0:
            self.number_of_judges = 0
            self.total = Decimal("0.00")
            self.final_score = Decimal("0.00")
            return

        total = Decimal("0.00")
        for jm in marks_qs:
            # mark stored as DecimalField
            total += Decimal(jm.mark)

        self.number_of_judges = count
        self.total = total
        # average (final_score)
        self.final_score = (total / Decimal(count)).quantize(Decimal("0.01"))

    def save(self, *args, **kwargs):
        # If you want to auto-recalculate on save, uncomment the next two lines.
        # But note: if you're creating Evaluation and then bulk-creating marks,
        # you might call recalculate_scores() after creating marks instead.
        try:
            self.recalculate_scores()
        except Exception:
            # graceful fallback if e.g. evaluation not yet saved or no related marks
            pass
        super().save(*args, **kwargs)


class EvaluationJudgeMark(models.Model):
    """
    Stores the mark (score) given by a judge for a particular Evaluation.
    You can either reference SubSubEventJudge (preferred if judge list exists),
    or just repeat the judge name to keep evaluation self-contained.
    """
    evaluation = models.ForeignKey(
        Evaluation, on_delete=models.CASCADE, related_name="judge_marks"
    )
    # optional relation to the pre-defined judge entry:
    subsubevent_judge = models.ForeignKey(
        SubSubEventJudge, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="evaluation_marks"
    )

    # store the judge name redundantly so marks remain readable even if judge entry deleted
    judge_name = models.CharField(max_length=200)

    # numeric mark — use DecimalField to avoid float precision issues
    mark = models.DecimalField(
        max_digits=7, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("10000.00"))]
    )

    comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("evaluation", "judge_name")

    def __str__(self):
        return f"{self.judge_name}: {self.mark} for {self.evaluation}"
