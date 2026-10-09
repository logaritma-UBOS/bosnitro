const fs = require('fs');
const path = 'C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/actions/teamOs.ts';
let code = fs.readFileSync(path, 'utf8');

const newAction = `
export async function updateBankDetails(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");
    
    const member = await prisma.teamMember.findUnique({ where: { email: session.user.email } });
    if (!member) throw new Error("User not found");

    const bankName = formData.get("bankName") as string;
    const bankAccount = formData.get("bankAccount") as string;
    const bankAccountName = formData.get("bankAccountName") as string;

    await prisma.teamMember.update({
      where: { id: member.id },
      data: { bankName, bankAccount, bankAccountName }
    });

    revalidatePath("/admin/pilot", "layout");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
`;

if (!code.includes("updateBankDetails")) {
    code += newAction;
    fs.writeFileSync(path, code, 'utf8');
    console.log("updateBankDetails added to teamOs.ts");
} else {
    console.log("Already exists");
}
