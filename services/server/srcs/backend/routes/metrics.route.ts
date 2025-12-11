import { FastifyReply, FastifyRequest } from 'fastify';
import { register } from '../services/prometheus.service.js';

export async function getMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
        const metrics = await register.metrics();
        reply
            .type(register.contentType)
            .code(200)
            .send(metrics);
    }
    catch (error) {
        reply.code(500).send('Error collecting metrics:' + error);
    }
}