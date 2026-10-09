import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const hashedPassword = await bcrypt.hash('adminlog2026', 10);
  await prisma.user.updateMany({ where: { email: 'logaritma.tim@gmail.com' }, data: { name: 'Baim' } });
  
  const users = [
    { email: 'tony@logaritma.id', name: 'Tony', phone: '08000000001' },
    { email: 'reza@logaritma.id', name: 'Reza', phone: '08000000002' },
    { email: 'bana@logaritma.id', name: 'Bana', phone: '08000000003' }
  ];
  
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { 
        email: u.email, 
        name: u.name, 
        phone: u.phone, 
        passwordHash: hashedPassword, 
        role: 'OWNER' 
      }
    });
  }
  console.log('Team users seeded');
}

main().catch(console.error).finally(() => prisma.$disconnect());
