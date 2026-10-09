const fs = require('fs');

const path = 'src/actions/whatsapp.ts';
let content = fs.readFileSync(path, 'utf8');

// Just remove saveFonnteToken completely as it is no longer used, and replace with generateWaQr

content = content.replace(/export async function saveFonnteToken[\s\S]*?^}/m, `export async function generateWaQr() {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id }
    })
    
    if (!business) return { error: "Business not found" }
    
    // For Pilot/White-label MVP: We use a master token from ENV, or fallback to a dummy if not set.
    // In production, UBOS admin must set FONNTE_MASTER_TOKEN in Vercel environment variables.
    const masterToken = process.env.FONNTE_MASTER_TOKEN || process.env.FONNTE_TOKEN || "TOKEN_TIDAK_TERSEDIA";
    
    if (masterToken === "TOKEN_TIDAK_TERSEDIA") {
      return { error: "Sistem WA UBOS belum dikonfigurasi. Hubungi Admin." }
    }

    await prisma.businessSetting.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        fonnteToken: masterToken,
        waStatus: "DISCONNECTED"
      },
      update: {
        fonnteToken: masterToken,
        waStatus: "DISCONNECTED"
      }
    })
    
    revalidatePath("/pengaturan/whatsapp")
    return { success: true }
  } catch (e) {
    return { error: "Gagal memproses permintaan QR Code" }
  }
}`);

fs.writeFileSync(path, content, 'utf8');