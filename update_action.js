const fs = require('fs');

const path = 'src/actions/campaign.ts';
let content = fs.readFileSync(path, 'utf8');

const newFunc = `export async function updateCampaignStatus(id: string, status: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    
    // If sending blast, try to use WA integration
    if (status === "TERKIRIM") {
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: { business: { include: { settings: true } } }
      })
      
      if (campaign && campaign.business?.settings?.fonnteToken && campaign.business.settings.waStatus === "CONNECTED") {
        // Fetch customers to blast
        let customers = await prisma.customer.findMany({
          where: { businessId: campaign.businessId }
        })
        
        if (campaign.targetSegment !== "SEMUA") {
          customers = customers.filter(c => c.category === campaign.targetSegment)
        }
        
        const phones = customers.map(c => c.phone).filter(p => p && p.length > 5).join(",")
        
        if (phones) {
          try {
            await fetch("https://api.fonnte.com/send", {
              method: "POST",
              headers: { 
                "Authorization": campaign.business.settings.fonnteToken,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                target: phones,
                message: campaign.message + "\\n\\n- Dikirim otomatis oleh UBOS"
              })
            })
          } catch(err) {
            console.error("Fonnte Blast Error:", err)
          }
        }
      }
    }
    
    await prisma.campaign.update({
      where: { id },
      data: { status, sentAt: status === "TERKIRIM" ? new Date() : undefined }
    })
    revalidatePath("/marketing")
    return { success: true }
  } catch (e: any) {
    console.error(e)
    return { error: "Gagal update status" }
  }
}`;

content = content.replace(/export async function updateCampaignStatus[\s\S]*?^}/m, newFunc);

fs.writeFileSync(path, content, 'utf8');