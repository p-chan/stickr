import { prisma } from '../db'

export const upsert = async ({ userId, teamId, xoxsToken }: { userId: string; teamId: string; xoxsToken: string }) => {
  return await prisma.user.upsert({
    where: {
      userId_teamId: {
        userId: userId,
        teamId: teamId,
      },
    },
    create: {
      userId: userId,
      team: {
        connect: {
          teamId: teamId,
        },
      },
      xoxsToken: xoxsToken,
    },
    update: {
      userId: userId,
      team: {
        connect: {
          teamId: teamId,
        },
      },
      xoxsToken: xoxsToken,
    },
  })
}

export const findOne = async ({ userId, teamId }: { userId: string; teamId: string }) => {
  return await prisma.user.findOne({
    where: {
      userId_teamId: {
        userId: userId,
        teamId: teamId,
      },
    },
  })
}
