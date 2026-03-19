import prisma from '../../config/database.js'
import { validationResult } from 'express-validator'
import { getImagePath, extractFilename } from '../../utils/fileUtils.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import { createBulkNotifications, createNotification } from '../../services/notificationService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const jobsUploadDir = path.join(__dirname, '../../../uploads/images/jobs')

const deleteImageFile = (filename) => {
  if (!filename) return
  try {
    const filePath = path.join(jobsUploadDir, extractFilename(filename))
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (err) {
    console.error('Delete job image error:', err)
  }
}

const requireValidations = (req, res) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) return null
  res.status(400).json({ error: 'Validasi gagal', errors: errors.array() })
  return errors
}

const toJobDto = (job) => ({
  id: job.id,
  title: job.title,
  slug: job.slug,
  description: job.description,
  company: job.company,
  location: job.location,
  employmentType: job.employmentType,
  salaryRange: job.salaryRange,
  contact: job.contact,
  applyLink: job.applyLink,
  image: job.image ? getImagePath(job.image, 'jobs') : null,
  status: job.status,
  authorId: job.authorId,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
  author: job.users ? {
    id: job.users.id,
    nama: job.users.nama,
    fotoProfil: job.users.profile?.fotoProfil ? getImagePath(job.users.profile.fotoProfil, 'profiles') : null,
  } : undefined,
})

const slugify = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'lowongan'
}

export const listApprovedJobs = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const { page = 1, limit = 10, q } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = { status: 'APPROVED' }
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { company: { contains: q } },
        { description: { contains: q } },
      ]
    }

    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              nama: true,
              profile: { select: { fotoProfil: true } },
            },
          },
        },
      }),
      prisma.jobs.count({ where }),
    ])

    res.json({
      jobs: jobs.map(toJobDto),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (error) {
    console.error('List approved jobs error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil lowongan' })
  }
}

export const listPendingJobs = async (req, res) => {
  try {
    const currentUserId = req.user.userId
    const role = req.user.role

    const where = { status: 'PENDING' }
    if (role !== 'PENGURUS') {
      where.authorId = currentUserId
    }

    const jobs = await prisma.jobs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            nama: true,
            profile: { select: { fotoProfil: true } },
          },
        },
      },
    })

    res.json({ jobs: jobs.map(toJobDto) })
  } catch (error) {
    console.error('List pending jobs error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil lowongan pending' })
  }
}

export const createJob = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const currentUserId = req.user.userId
    const role = req.user.role
    const {
      title,
      description,
      company,
      location,
      employmentType,
      salaryRange,
      contact,
      applyLink,
    } = req.body

    const id = randomUUID()
    const baseSlug = slugify(title)
    const slug = `${baseSlug}-${id.slice(0, 8)}`
    const image = req.file ? req.file.filename : null

    const status = role === 'PENGURUS' ? 'APPROVED' : 'PENDING'

    const job = await prisma.jobs.create({
      data: {
        id,
        title,
        slug,
        description,
        company,
        location: location || null,
        employmentType: employmentType || null,
        salaryRange: salaryRange || null,
        contact: contact || null,
        applyLink: applyLink || null,
        image,
        status,
        authorId: currentUserId,
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            nama: true,
            profile: { select: { fotoProfil: true } },
          },
        },
      },
    })

    // Notifications:
    // - Alumni creates PENDING: notify all PENGURUS to review
    // - Pengurus creates APPROVED: notify all ALUMNI & PENGURUS about new approved job
    try {
      if (status === 'PENDING') {
        const pengurus = await prisma.user.findMany({
          where: { role: 'PENGURUS' },
          select: { id: true },
        })
        const pengurusIds = pengurus.map(u => u.id).filter(Boolean)
        await createBulkNotifications(pengurusIds, {
          triggeredBy: currentUserId,
          type: 'JOB',
          message: `Lowongan baru menunggu persetujuan: ${title} (${company})`,
          relatedId: job.id,
          relatedType: 'job_pending',
        })
      } else {
        const recipients = await prisma.user.findMany({
          where: { role: { in: ['ALUMNI', 'PENGURUS'] } },
          select: { id: true },
        })
        const recipientIds = recipients.map(u => u.id).filter(uid => uid && uid !== currentUserId)
        await createBulkNotifications(recipientIds, {
          triggeredBy: currentUserId,
          type: 'JOB',
          message: `Lowongan baru dipublikasikan: ${title} (${company})`,
          relatedId: job.id,
          relatedType: 'job',
        })
      }
    } catch (notifyErr) {
      console.error('Create job notification error:', notifyErr)
    }

    res.status(201).json({
      message: status === 'PENDING'
        ? 'Lowongan berhasil dibuat dan menunggu persetujuan pengurus'
        : 'Lowongan berhasil dibuat',
      job: toJobDto(job),
    })
  } catch (error) {
    console.error('Create job error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat lowongan' })
  }
}

export const approveJob = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const { id } = req.params
    const currentUserId = req.user.userId

    const job = await prisma.jobs.findUnique({ where: { id } })
    if (!job) return res.status(404).json({ error: 'Lowongan tidak ditemukan' })
    if (job.status !== 'PENDING') return res.status(400).json({ error: 'Lowongan ini tidak dalam status PENDING' })

    const updated = await prisma.jobs.update({
      where: { id },
      data: { status: 'APPROVED', updatedAt: new Date() },
      include: {
        users: { select: { id: true, nama: true, profile: { select: { fotoProfil: true } } } },
      },
    })

    // Notifications:
    // - Notify job author that their job is approved
    // - Notify all ALUMNI & PENGURUS about the newly approved job
    try {
      await createNotification({
        userId: updated.authorId,
        triggeredBy: currentUserId,
        type: 'JOB',
        message: `Lowongan kamu disetujui: ${updated.title} (${updated.company})`,
        relatedId: updated.id,
        relatedType: 'job',
      })

      const recipients = await prisma.user.findMany({
        where: { role: { in: ['ALUMNI', 'PENGURUS'] } },
        select: { id: true },
      })
      const recipientIds = recipients
        .map(u => u.id)
        .filter(uid => uid && uid !== updated.authorId) // author already got direct notification above
      await createBulkNotifications(recipientIds, {
        triggeredBy: currentUserId,
        type: 'JOB',
        message: `Lowongan baru dipublikasikan: ${updated.title} (${updated.company})`,
        relatedId: updated.id,
        relatedType: 'job',
      })
    } catch (notifyErr) {
      console.error('Approve job notification error:', notifyErr)
    }

    res.json({ message: 'Lowongan berhasil disetujui', job: toJobDto(updated) })
  } catch (error) {
    console.error('Approve job error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menyetujui lowongan' })
  }
}

export const rejectJob = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const { id } = req.params
    const currentUserId = req.user.userId

    const job = await prisma.jobs.findUnique({ where: { id } })
    if (!job) return res.status(404).json({ error: 'Lowongan tidak ditemukan' })
    if (job.status !== 'PENDING') return res.status(400).json({ error: 'Lowongan ini tidak dalam status PENDING' })

    const updated = await prisma.jobs.update({
      where: { id },
      data: { status: 'REJECTED', updatedAt: new Date() },
      include: {
        users: { select: { id: true, nama: true, profile: { select: { fotoProfil: true } } } },
      },
    })

    // Notify author about rejection
    try {
      await createNotification({
        userId: updated.authorId,
        triggeredBy: currentUserId,
        type: 'JOB',
        message: `Lowongan kamu ditolak: ${updated.title} (${updated.company})`,
        relatedId: updated.id,
        relatedType: 'job',
      })
    } catch (notifyErr) {
      console.error('Reject job notification error:', notifyErr)
    }

    res.json({ message: 'Lowongan berhasil ditolak', job: toJobDto(updated) })
  } catch (error) {
    console.error('Reject job error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menolak lowongan' })
  }
}

export const deleteMyJob = async (req, res) => {
  try {
    const { id } = req.params
    const currentUserId = req.user.userId
    const role = req.user.role

    const job = await prisma.jobs.findUnique({ where: { id } })
    if (!job) return res.status(404).json({ error: 'Lowongan tidak ditemukan' })

    // Pengurus boleh menghapus lowongan apapun (pending/approved/rejected)
    // Alumni hanya boleh menghapus lowongan miliknya yang belum approved
    if (role !== 'PENGURUS') {
      if (job.authorId !== currentUserId) return res.status(403).json({ error: 'Tidak memiliki izin menghapus lowongan ini' })
      if (job.status === 'APPROVED') return res.status(400).json({ error: 'Lowongan yang sudah disetujui tidak bisa dihapus oleh pembuat' })
    }

    if (job.image) deleteImageFile(job.image)

    await prisma.jobs.delete({ where: { id } })

    res.json({ message: 'Lowongan berhasil dihapus' })
  } catch (error) {
    console.error('Delete job error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus lowongan' })
  }
}

