/** Local dev talks to the nagish.dev stack — its API gateway allows localhost origins
 *  (any port); production builds talk to the prod gateway on nagish.io. */
export const apiDomain = import.meta.env.DEV ? 'nagish.dev' : 'nagish.io';
