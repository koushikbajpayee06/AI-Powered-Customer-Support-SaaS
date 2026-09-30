import prisma from "./config/db.js";

try {
const deletedUser = await prisma.user.delete({
  where: {
    email: "practice@example.com",
  },
  select: {
    id: true,
    name: true,
    email: true,
  },
});

console.log("Deleted user:", deletedUser);

const user = await prisma.user.findUnique({
  where: {
    email: "practice@example.com",
  },
});

console.log("After deletion:", user);
} catch (error) {
  console.error("Database operation failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}