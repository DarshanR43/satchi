from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class BulkDeleteUsersTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.superadmin = User.objects.create_user(
            username="admin@test.com",
            email="admin@test.com",
            password="Password123!",
            role=User.Role.SUPERADMIN,
            is_staff=True,
            is_superuser=True,
            full_name="Super Admin",
        )
        self.participant1 = User.objects.create_user(
            username="part1@test.com",
            email="part1@test.com",
            password="Password123!",
            role=User.Role.PARTICIPANT,
            full_name="Participant One",
        )
        self.participant2 = User.objects.create_user(
            username="part2@test.com",
            email="part2@test.com",
            password="Password123!",
            role=User.Role.PARTICIPANT,
            full_name="Participant Two",
        )
        self.coordinator = User.objects.create_user(
            username="coord@test.com",
            email="coord@test.com",
            password="Password123!",
            role=User.Role.COORDINATOR,
            full_name="Coordinator User",
        )

    def test_bulk_delete_requires_superadmin(self):
        self.client.force_authenticate(user=self.participant1)
        response = self.client.post("/user/admin/users/bulk-delete/", {"user_ids": [self.participant2.id]})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_bulk_delete_by_user_ids(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.post(
            "/user/admin/users/bulk-delete/",
            {"user_ids": [self.participant1.id, self.participant2.id]},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["deleted_count"], 2)
        self.assertFalse(User.objects.filter(id__in=[self.participant1.id, self.participant2.id]).exists())
        self.assertTrue(User.objects.filter(id=self.coordinator.id).exists())

    def test_bulk_delete_all_participants(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.post(
            "/user/admin/users/bulk-delete/",
            {"delete_all_role": "PARTICIPANT"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["deleted_count"], 2)
        self.assertEqual(User.objects.filter(role=User.Role.PARTICIPANT).count(), 0)
        self.assertTrue(User.objects.filter(id=self.coordinator.id).exists())
        self.assertTrue(User.objects.filter(id=self.superadmin.id).exists())

    def test_bulk_delete_excludes_self(self):
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.post(
            "/user/admin/users/bulk-delete/",
            {"user_ids": [self.superadmin.id, self.participant1.id]},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["deleted_count"], 1)
        self.assertTrue(User.objects.filter(id=self.superadmin.id).exists())
        self.assertFalse(User.objects.filter(id=self.participant1.id).exists())

    def test_bulk_delete_prevents_removing_last_superadmin(self):
        self.client.force_authenticate(user=self.superadmin)
        other_admin = User.objects.create_user(
            username="otheradmin@test.com",
            email="otheradmin@test.com",
            password="Password123!",
            role=User.Role.SUPERADMIN,
        )
        response = self.client.post(
            "/user/admin/users/bulk-delete/",
            {"user_ids": [other_admin.id]},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(id=other_admin.id).exists())
        self.assertTrue(User.objects.filter(id=self.superadmin.id).exists())
