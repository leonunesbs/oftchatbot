"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { api } from "@convex/_generated/api";
import { getAuthenticatedConvexHttpClient } from "@/lib/convex-server";

function toDateValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function upsertPatientBirthDateAction(formData: FormData) {
  const { client } = await getAuthenticatedConvexHttpClient();
  const birthDate = toDateValue(formData.get("birthDate"));

  await client.mutation(api.patients.upsertCurrentPatientBirthDate, {
    birthDate: birthDate || undefined,
  });

  const authData = await auth();
  if (authData.userId) {
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(authData.userId);
      const currentUnsafeMetadata =
        user.unsafeMetadata && typeof user.unsafeMetadata === "object" ? user.unsafeMetadata : {};
      await clerk.users.updateUserMetadata(authData.userId, {
        unsafeMetadata: {
          ...currentUnsafeMetadata,
          birthDate: birthDate || null,
        },
      });
    } catch (error) {
      console.warn("Falha ao sincronizar data de nascimento no Clerk", error);
    }
  }

  revalidatePath("/dashboard");
}
