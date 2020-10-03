import { prisma } from '../utilities'
import { Installation } from '@slack/bolt'

export const findOne = async ({ teamId }: { teamId: string }) => {
  return await prisma.team.findOne({
    where: {
      teamId: teamId,
    },
  })
}

export const upsert = async ({ teamId, installation }: { teamId: string; installation: Installation }) => {
  const data = {
    teamId,
    raw: JSON.parse(JSON.stringify(installation)),
  }

  return await prisma.team.upsert({
    where: { teamId },
    create: data,
    update: data,
  })
}
