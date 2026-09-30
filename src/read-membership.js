import prisma from "./config/db.js";

try {
  const user = await prisma.user.findUnique({
    where: {
      email: "admin@example.com",
    },
    select: {
      name: true,
      email: true,
      memberships: {
        select: {
          role: true,
          workspace: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  console.dir(user, { depth: null });
} catch (error) {
  console.error("Read failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}