"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { signIn, signOut, auth } from "@/auth"
import { AuthError } from "next-auth"

export async function registerUser(prevState: any, formData: FormData) {
  const name = formData.get("name") as string
  const rawEmail = formData.get("email") as string
  const password = formData.get("password") as string
  const phone = formData.get("phone") as string
  
  if (!name || !rawEmail || !password || !phone) return { error: "Semua field wajib diisi, termasuk Nomor WhatsApp." }
  
  const email = rawEmail.trim().toLowerCase()
  
  const existing = await prisma.user.findUnique({ where: { email } })
  
  if (existing) {
    if (!existing.passwordHash || existing.passwordHash === "") {
      // User created via Google, now setting a password
      const passwordHash = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, name: existing.name || name, phone, emailVerified: new Date() }
      })
    } else {
      return { error: "Email sudah terdaftar. Silakan masuk (Login)." }
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: { name, email, passwordHash, role: "OWNER", phone, emailVerified: new Date() }
    })
  }

  // BEGIN SEND WA WELCOME
  const registeredUser = await prisma.user.findUnique({ where: { email } });
  if (registeredUser && phone) {
    let tier = "Starter (Gratis)";
    if (email === "warunkarsi23@gmail.com") {
      tier = "Lifetime";
    } else {
      const revenues = await prisma.ubosRevenue.findFirst({ where: { userId: registeredUser.id, status: "PAID" } });
      if (revenues) tier = "Pro Bulanan";
    }

    let target = phone.replace(/[^0-9]/g, '');
    if (target.startsWith('0')) target = '62' + target.substring(1);

    const message = `Halo *${registeredUser.name || name}*! 🎉\n\nSelamat datang dan terima kasih sudah mendaftar di *UBOS* (Universal Business Operating System).\n\nBerikut adalah detail akun pendaftaran Anda:\n👤 Nama: ${registeredUser.name || name}\n📧 Email: ${email}\n💼 Paket Saat Ini: *${tier}*\n📱 Kontak: ${phone}\n\nKami siap mendampingi perjalanan bisnis digital Anda. Jika ada pertanyaan, jangan ragu untuk membalas pesan ini!\n\nSalam sukses,\nTim UBOS`;

    try {
      fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { "Authorization": "yR1HdhH9wfPVVoKu2G4e" },
        body: new URLSearchParams({
          target: target,
          message: message,
          countryCode: "62"
        })
      }).catch(err => console.error("Fonnte trigger error:", err));
    } catch (e) {
      console.error("Gagal kirim pesan WA selamat datang:", e);
    }
  }
  // END SEND WA WELCOME
  
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/onboarding",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Registrasi berhasil, tetapi gagal masuk otomatis. Silakan login manual." }
    }
    throw error // Penting untuk alur redirect Next.js
  }
}

export async function loginUser(prevState: any, formData: FormData) {
  const rawEmail = formData.get("email") as string
  const password = formData.get("password") as string

  if (!rawEmail || !password) {
    return { error: "Alamat email dan kata sandi wajib diisi." }
  }

  const email = rawEmail.trim().toLowerCase()

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (!existing) {
      return { error: "Alamat email belum terdaftar. Silakan buat akun baru terlebih dahulu." }
    }
    if (!existing.passwordHash || existing.passwordHash === "") {
      return { error: "Akun ini didaftarkan via Google. Silakan klik tombol 'Google' di atas untuk masuk." }
    }

    const passwordsMatch = await bcrypt.compare(password, existing.passwordHash)
    if (!passwordsMatch) {
      return { error: "Kata sandi yang Anda masukkan salah. Silakan coba lagi atau gunakan fitur Lupa Sandi." }
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau kata sandi tidak sesuai." }
        default:
          return { error: "Terjadi kesalahan saat memproses login. Silakan coba kembali." }
      }
    }
    throw error // Dibutuhkan agar fitur redirect() Next.js berjalan normal
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" })
}

import { resend } from "@/lib/resend"

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const rawEmail = formData.get("email") as string
  if (!rawEmail) return { error: "Email wajib diisi" }
  
  const email = rawEmail.trim().toLowerCase()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Return success to prevent email enumeration attacks
    return { success: "Jika email terdaftar, tautan reset telah dikirim." }
  }

  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + 3600 * 1000) // 1 hour

  // Check existing token
  const existingToken = await prisma.verificationToken.findFirst({
    where: { identifier: email }
  })
  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: existingToken.token
        }
      }
    })
  }

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires
    }
  })

  const resetUrl = `${process.env.NEXTAUTH_URL || 'https://ubos.logaritma.id'}/reset-sandi?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: "UBOS <noreply@ubos.logaritma.id>",
      to: email,
      subject: "Reset Kata Sandi UBOS",
      html: `<p>Klik tautan berikut untuk mengatur ulang kata sandi Anda: <a href='${resetUrl}'>Reset Kata Sandi</a></p><p>Tautan ini akan kedaluwarsa dalam 1 jam.</p>`
    })

    if (error) {
      console.error("Resend API Error:", error)
      return { error: `Gagal mengirim email: ${error.message}` }
    }
  } catch (err) {
    console.error("Resend Try-Catch Error:", err)
    return { error: "Terjadi kesalahan internal saat menghubungi server email." }
  }

  return { success: "Jika email terdaftar, tautan reset telah dikirim." }
}

export async function resetPassword(prevState: any, formData: FormData) {
  const token = formData.get("token") as string
  const password = formData.get("password") as string

  if (!token || !password) return { error: "Tautan tidak valid atau sandi kosong." }

  const verificationToken = await prisma.verificationToken.findFirst({
    where: { token }
  })

  if (!verificationToken) {
    return { error: "Tautan reset tidak valid atau sudah digunakan." }
  }

  if (new Date(verificationToken.expires) < new Date()) {
    return { error: "Tautan reset telah kedaluwarsa." }
  }

  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier }
  })

  if (!user) return { error: "Pengguna tidak ditemukan." }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  })

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: verificationToken.identifier,
        token: verificationToken.token
      }
    }
  })

  return { success: "Kata sandi berhasil diubah! Silakan masuk dengan sandi baru Anda." }
}


export async function updatePhoneNumber(phone: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Not authenticated" };
  if (!phone || phone.length < 9) return { error: "Nomor WhatsApp tidak valid" };

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { phone: phone }
    });
    return { success: true };
  } catch (err) {
    return { error: "Gagal menyimpan nomor" };
  }
}
