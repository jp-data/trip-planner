import dayjs from "dayjs";
import 'dayjs/locale/pt-br';
import localizedFormat from "dayjs/plugin/localizedFormat";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { getMailClient } from "../lib/mail";
import { prisma } from '../lib/prisma';

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)

export async function confirmTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            })
        }
    }, async (req, res) => {
        const { tripId } = req.params
        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                participants: { where: { is_owner: false }}
            }
        })

        if (!tripId) {
            throw new Error('Trip ID not found')
        }

        if (trip.is_confirmed) {
            return res.redirect(`http://localhost:3000/trips/${tripId}`)
        }

        await prisma.trip.update({
            where: { id: tripId },
            data: { is_confirmed: true },
        })

        const formattedStartDate = dayjs(trip.starts_at).format('LL')
        const formattedEndDate = dayjs(trip.ends_at).format('LL')

        const mail = await getMailClient()

        await Promise.all([
            trip?.participants.map(async(participant) => {
                const confirmationLink = `htttp://localhost:3333/participants/${participant.id}/confirm`
                const message = await mail.sendMail({
                    from: {
                        name: 'Equipe planner 4you',
                        address: '4you@email.com'
                    },
                    to: participant.email,
                    subject: `Confirme sua presença na viagem para ${trip.destination} em ${formattedStartDate}`,
                    html: `
                        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                            <p>Você foi convidado para uma viagem até <strong>${trip.destination}, Brasil</strong> nas datas de <strong>${formattedStartDate} a ${formattedEndDate}</strong>.</p>
                            <p></p>
                            <p>Para confirmar sua presença, clique no link abaixo:</p>
                            <p></p>
                            <p>>
                                <a href=${confirmationLink}>Confirmar viagem</a>
                            </p>
                            <p></p>
                            <p> Caso você não saiba do que se trata esse e-mail, apenas o ignore.</p>
                        </div>
                    `.trim()
                })
                console.log(nodemailer.getTestMessageUrl(message))
            })
        ])

        return res.redirect(`http://localhost:3000/trips/${tripId}`)
    })
}