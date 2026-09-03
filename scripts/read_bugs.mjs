import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const bugs = await prisma.bugLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(bugs, null, 2));
}
main().then(() => prisma.$disconnect()).catch(console.error);
