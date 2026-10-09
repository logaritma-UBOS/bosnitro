const fs = require("fs");
let file = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/prisma/schema.prisma", "utf8");

// Modify TeamMember
file = file.replace(
  /assignedTickets TeamTicket\[\] @relation\("DeveloperAssigned"\)/,
  `assignedTickets TeamTicket[] @relation("DeveloperAssigned")\n  createdTickets  TeamTicket[] @relation("TicketSource")\n  fundRequests    TeamFundRequest[]`
);

// Modify TeamTicket
file = file.replace(
  /model TeamTicket \{[\s\S]*?\}/,
  `model TeamTicket {
  id            String     @id @default(uuid())
  userId        String?    
  notes         String     
  isTechBug     Boolean    @default(false)
  status        String     @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED, REJECTED
  assignedToId  String?
  assignedTo    TeamMember? @relation("DeveloperAssigned", fields: [assignedToId], references: [id])
  sourceId      String?
  source        TeamMember? @relation("TicketSource", fields: [sourceId], references: [id])
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}`
);

// Add TeamFundRequest
file += `

model TeamFundRequest {
  id            String     @id @default(uuid())
  requesterId   String
  requester     TeamMember @relation(fields: [requesterId], references: [id], onDelete: Cascade)
  amount        Float
  reason        String
  status        String     @default("PENDING") // PENDING, APPROVED, REJECTED
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}
`;

fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/prisma/schema.prisma", file, "utf8");
console.log("schema.prisma updated");
