const fs = require('fs');
let f = fs.readFileSync('C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/prisma/schema.prisma', 'utf8');

// Add profilePicture to TeamMember
if (!f.includes('profilePicture')) {
    f = f.replace('updatedAt       DateTime @updatedAt', 'updatedAt       DateTime @updatedAt\n  profilePicture  String?');
}

// Add comments relation to TeamIdea
if (!f.includes('comments TeamIdeaComment[]')) {
    f = f.replace('author TeamMember @relation(fields: [authorId], references: [id], onDelete: Cascade)', 'author TeamMember @relation(fields: [authorId], references: [id], onDelete: Cascade)\n  comments TeamIdeaComment[]');
}

// Add comments relation to TeamMember
if (!f.includes('ideaComments    TeamIdeaComment[]')) {
    f = f.replace('ideas           TeamIdea[]', 'ideas           TeamIdea[]\n  ideaComments    TeamIdeaComment[]');
}

// Add TeamIdeaComment model
if (!f.includes('model TeamIdeaComment')) {
    f += `\n
model TeamIdeaComment {
  id        String   @id @default(uuid())
  ideaId    String
  authorId  String
  content   String
  createdAt DateTime @default(now())

  idea   TeamIdea   @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  author TeamMember @relation(fields: [authorId], references: [id], onDelete: Cascade)
}
`;
}

fs.writeFileSync('C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/prisma/schema.prisma', f, 'utf8');
console.log("Schema updated!");