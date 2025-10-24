import Fastify from "fastify" //npm install fastify

import fs from "fs" //pour acceder au systeme de fichier

// permet le tls autour de http et ws (websocket)
// pour creer la clef key.pem ainsi que le certificat associe, il faut utiliser openssl

mkdir certs
cd certs

openssl genrsa -out key.pem 2048
/*
  openssl	L’outil en ligne de commande pour gérer certificats, clés et TLS.
  genrsa	Sous-commande pour générer une clé RSA. RSA est un algorithme de chiffrement asymétrique (clé publique/clé privée).
  -out key.pem	Spécifie le fichier de sortie dans lequel la clé privée sera enregistrée. Ici key.pem.
  2048	Taille de la clé en bits.
  - 2048 bits = sécurisé pour le développement et production légère.
  - Plus le nombre est grand, plus c’est sûr mais plus lent.
*/

openssl req -new -x509 -key key.pem -out cert.pem -days 365
/*
  openssl	L’outil OpenSSL.
  req	Sous-commande pour créer et gérer les requêtes de certificat (CSR).
  -new	Indique que l’on crée une nouvelle requête de certificat.
  -x509	Spécifie que l’on génère directement un certificat auto-signé X.509 au lieu d’une requête CSR classique.
  C’est ce qu’on utilise pour le développement local.
  -key key.pem	Utilise la clé privée générée précédemment pour signer le certificat.
  -out cert.pem	Spécifie le fichier de sortie qui contiendra le certificat auto-signé.
  -days 365	Durée de validité du certificat en jours (ici 1 an).
*/
// pour binder le certificat avec l'instance fastify
// attention sous windows \\ a la place de /
const fastify = Fastify({https: {
    key: fs.readFileSync(".\\certs\\key.pem"),
    cert: fs.readFileSync(".\\certs\\cert.pem"),
  }});
