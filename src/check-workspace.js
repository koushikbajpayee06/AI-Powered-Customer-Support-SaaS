import prisma from "./config/db.js";
import bcrypt from "bcrypt";

try {
  const passwordHash = await bcrypt.hash("PracticeOnly123!", 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: "Practice Admin",
        email: "admin@example.com",
        passwordHash,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: "Practice Company",
        slug: "practice-company",
      },
    });

    const membership = await tx.membership.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "ADMIN",
      },
    });

    return { user, workspace, membership };
  });

  console.log(result);
} catch (error) {
  console.error("Creation failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}