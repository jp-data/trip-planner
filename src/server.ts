import cors from '@fastify/cors';
import fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { confirmTrip } from './routes/confirm-trip';
import { createTrip } from './routes/create-trip';
import { confirmParticipants } from './routes/confirm-participant';
import { createActivity } from './routes/create-activity';
import { getActivity } from './routes/get-activities';

const app = fastify()

app.register(cors, {
    origin: '*',
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(createTrip)
app.register(confirmTrip)
app.register(confirmParticipants)
app.register(createActivity)
app.register(getActivity)

app.listen({ port: 3333}).then(() => {
    console.log('Server running!')
})