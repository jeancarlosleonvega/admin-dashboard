import type { FastifyInstance } from 'fastify';
import { userSuspensionsController } from './user-suspensions.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function userSuspensionsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('users.edit')],
    handler: userSuspensionsController.findByUser.bind(userSuspensionsController),
  });

  fastify.post('/', {
    preHandler: [authorize('users.edit')],
    handler: userSuspensionsController.create.bind(userSuspensionsController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('users.edit')],
    handler: userSuspensionsController.lift.bind(userSuspensionsController),
  });
}
