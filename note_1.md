Christella: vault, 2fa, Kibana
Paco: Register, Login, Lobby, user management (visu)
Jacques: Tournament

Obligatoire:
- Microservices (chat dans son propre conteneur)
- Tournoi
- Forms
    + login: login avec form -> login/register pas caché par logout
    + coté front: bloquer /login et /register si deja log || bloquer /logout si pas log
	+ Identifier d'où viens l'erreur de SQL constraint (email?, username?)
    + css messages d'erreur bouge tout

- Remote 1v1
- problemes nav (fleches, dans login/register entre oauth et back)

Grands:
- Live chat
- User Management (match history, friends)

Petits:
- 2FA
- Screen reader - SEO SSR
- Kibana (archiving policies)
- Languages

A la fin:
- Vault (.env.tpl -> copie-colle-modif .env -> script pour bouger les secrets importants dans vault -> conteneurs qui call vault directement) - WAF
- Normes de securité Docker et conteneurs

Peut etre:
- Support pc + tel - GDPR



---------------------------------------------

III.2 (page 5)
. if backend should be in pure PHP , can be overriden by FRAMEWORK module
. if database should follow DATABASE module
. frontend should use TYPESCRIPT can be modified FRONTEND module
frontend should be a single-page application (back and forward buttons of the browser should work)
compatible with the lastest stable up-to-date version of Mozilla-Firefox
DOCKER -> docker-compose


falcutative REMOTE PLAYERS module
system de tournoi
system d'enregistrement (alias) can be modified STANDARD USER MANAGEMENT module
system de matchmaking

III.4 (page8)
if password, must be hashed
be careful, SQL injections/XSS
if backend, HTTPS using wss (web socket security)
validations mechanisms of any data between frontend and backend (either pseudo)
OAUTH2, JWT, 2FA
credentials and .env must be ignored with .gitignore
API routes must secured

IV MODULES (page 9) mandatory = 7 majors modules, bonus = 25pts
1 major = 10 pts
1 minor = 5 pts

WEB (page 12) 30pts
M Fastify with Node.js (backend)
m Tailwind CSS + Typescript (frontend)
m database with SQlite
M tournament storage with Blockchain (Avalanche and Solidity)

USER MANAGEMENT (page 13) 20pts
M user state (login...JWT)
M remote authentication OAuth2.0


GAMEPLAY and USER EXPERIENCE (page 16) 35pts
M remote players (2 computers)
M more players
#M more game
m customization options (power-ups...., lifes)
M live chat

AI-ALGO (page 18) 15pts
M ai players (update game model only 1 time per seconds)
m dashboard (user stats)


CYBERSECURITY (page 20) 25pts
M WAF/ModSecuriy, HashiCorp Vault
m GDPR
M 2FA and JWT

DEVOPS (page 22) 25pts
M ELK (Elsaticsearch, Logstash, Kibana)
m Prometheus and Grafana
M backend as microservices

GRAPHICS (page 24)
#M 3D with Babylon.js

ACCESSIBILITY for web site (page 25) 20pts
m support on all devices
m support other browsers
m multiple language support
m Accessibility for Visually Impaired Users
#m web site SSR (SEO)

SERVER-SIDE PONG (page 25)
#M API (compatible CLI, ping time, web interface)
#M API gameplay CLI

