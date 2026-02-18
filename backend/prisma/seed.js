import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash passwords
  const password = await bcrypt.hash('password123', 10)

  // Create Alumni user
  const alumni = await prisma.user.upsert({
    where: { email: 'alumni@demo.com' },
    update: {
      emailVerified: true,
      verified: true
    },
    create: {
      email: 'alumni@demo.com',
      password,
      nama: 'Ahmad Fauzi',
      nim: '123456789',
      prodi: 'Teknik Informatika',
      angkatan: 2015,
      domisili: 'Semarang',
      whatsapp: '081234567890',
      role: 'ALUMNI',
      verified: true,
      emailVerified: true,
      profile: {
        create: {
          profesi: 'Software Engineer',
          skill: 'JavaScript, React, Node.js'
        }
      }
    }
  })

  console.log('✅ Created alumni user:', alumni.email)

  // Create Pengurus user
  const pengurus = await prisma.user.upsert({
    where: { email: 'pengurus@demo.com' },
    update: {
      emailVerified: true,
      verified: true
    },
    create: {
      email: 'pengurus@demo.com',
      password,
      nama: 'Siti Nurhaliza',
      nim: '123456790',
      prodi: 'Manajemen',
      angkatan: 2016,
      domisili: 'Yogyakarta',
      whatsapp: '081234567891',
      role: 'PENGURUS',
      verified: true,
      emailVerified: true,
      profile: {
        create: {
          profesi: 'Business Analyst',
          skill: 'Business Analysis, Project Management'
        }
      }
    }
  })

  console.log('✅ Created pengurus user:', pengurus.email)

  // Create Administrator user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      emailVerified: true,
      verified: true,
      role: 'ADMIN',
      nim: null // Ensure NIM is null for admin
    },
    create: {
      email: 'admin@demo.com',
      password,
      nama: 'Administrator',
      nim: null, // Admin tidak perlu NIM
      prodi: 'Administrasi',
      angkatan: 2010,
      domisili: 'Semarang',
      whatsapp: '081234567899',
      role: 'ADMIN',
      verified: true,
      emailVerified: true
    }
  })

  console.log('✅ Created admin user:', admin.email)

  // Create default settings
  const defaultSettings = [
    {
      key: 'admin_notification_emails',
      category: 'EMAIL',
      value: JSON.stringify(['gadinglalala121212@gmail.com']),
      type: 'JSON',
      label: 'Email Notifikasi Admin',
      description: 'Email yang akan menerima notifikasi pendaftaran user baru. Bisa menambahkan multiple email.',
      order: 1
    },
    {
      key: 'ai_openai_api_key',
      category: 'AI',
      value: '',
      type: 'STRING',
      label: 'OpenAI API Key',
      description: 'API Key untuk layanan OpenAI (opsional)',
      order: 1
    },
    {
      key: 'site_name',
      category: 'GENERAL',
      value: 'Sistem Alumni DPW IKA UII JATENG',
      type: 'STRING',
      label: 'Nama Situs',
      description: 'Nama yang ditampilkan di website',
      order: 1
    },
    {
      key: 'site_description',
      category: 'GENERAL',
      value: 'Platform jejaring alumni untuk DPW IKA UII JATENG',
      type: 'STRING',
      label: 'Deskripsi Situs',
      description: 'Deskripsi singkat tentang situs',
      order: 2
    },
    {
      key: 'max_file_size',
      category: 'GENERAL',
      value: '5242880',
      type: 'NUMBER',
      label: 'Ukuran Maksimal File (bytes)',
      description: 'Ukuran maksimal file yang dapat diupload (dalam bytes)',
      order: 3
    },
    {
      key: 'enable_registration',
      category: 'GENERAL',
      value: 'true',
      type: 'BOOLEAN',
      label: 'Aktifkan Registrasi',
      description: 'Aktifkan atau nonaktifkan fitur registrasi user baru',
      order: 4
    }
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    })
  }

  console.log('✅ Created default settings')

  console.log('🎉 Seeding completed!')
  console.log('\n📝 Demo Credentials:')
  console.log('Alumni:     alumni@demo.com / password123')
  console.log('Pengurus:   pengurus@demo.com / password123')
  console.log('Admin:      admin@demo.com / password123')
  console.log('\n📧 Email Notifikasi Admin:')
  console.log('   - gadinglalala121212@gmail.com (dari Settings)')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

