const fs = require('fs');

const schemaAdditions = `
// --- TEAM OS MODELS ---
enum TeamRole {
  SUPER_ADMIN
  METHODOLOGY
  DEVELOPER
  OPERATIONS
}

model TeamMember {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String
  role            TeamRole
  sharePercentage Float
  walletBalance   Float    @default(0)
  totalEarned     Float    @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  ledgers         TeamLedger[]
  tasks           TeamTask[]
  assignedTickets TeamTicket[] @relation("DeveloperAssigned")
}

model TeamLedger {
  id            String      @id @default(uuid())
  type          String      // e.g. BUSINESS_REVENUE, BUSINESS_EXPENSE, RESERVE_ALLOCATION, ROYALTY, WITHDRAWAL
  amount        Float
  description   String
  teamMemberId  String?
  teamMember    TeamMember? @relation(fields: [teamMemberId], references: [id])
  createdAt     DateTime    @default(now())
}

model TeamTask {
  id            String     @id @default(uuid())
  teamMemberId  String
  teamMember    TeamMember @relation(fields: [teamMemberId], references: [id], onDelete: Cascade)
  taskName      String
  isCompleted   Boolean    @default(false)
  completedAt   DateTime?
  date          DateTime   @default(now()) // DB date
}

model TeamTicket {
  id            String     @id @default(uuid())
  userId        String?    
  notes         String     @db.Text
  isTechBug     Boolean    @default(false)
  status        String     @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED
  assignedToId  String?
  assignedTo    TeamMember? @relation("DeveloperAssigned", fields: [assignedToId], references: [id])
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}
`;

fs.appendFileSync('prisma/schema.prisma', schemaAdditions);
