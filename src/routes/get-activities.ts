import dayjs from "dayjs";
import 'dayjs/locale/pt-br';
import localizedFormat from "dayjs/plugin/localizedFormat";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)

export async function getActivity(app: FastifyInstance) {
   app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/activities', {
      schema: {
         params: z.object({
            tripId: z.string().uuid()
         }),
      }
   }, async (req) => {
      const { tripId } = req.params

      const trip = await prisma.trip.findUnique({
         where: { id: tripId },
         include: { activities: true}
      })

      if(!trip){
         throw new Error('Trip not found!')
      }

      return { activities: trip.activities }
   })
}