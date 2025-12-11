import client from 'prom-client'

export const register = new client.Registry()

export const totalHttpRequests = new client.Counter({
    name: 'total_http_requests',
    help: 'Total number of HTTP requests received',
    labelNames: ['method', 'route', 'status_code']
})

register.registerMetric(totalHttpRequests)