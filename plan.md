Match History:
	1 vs 1 -> dates, players, score, winner

Lobby:
	Player clicks on join game
		if Local:
			Goes to Alias and color select
			start game
		if remote:
			bind socket user socket to game
			Host goes to waiting list

Tournament:
	0: Choose all 3-4 (Host is registered or not) client players aliases. The host uses registered alias if registered. Add Id to each player
	1: Tournament tree, shuffle all 4 players and show the tree.
	2: Match starts

Remote 1v1

Vault:
	.env.tpl -> copie-colle-modif .env -> script pour bouger les secrets importants dans vault -> conteneurs qui call vault directement

Friends:
	Create (current) friends page
	Create remove and mp buttons (friends page)

Player Stats:
	Shows other players' match history

Chat:
	Extract sockets connection to another docker container
	Block users, prevent from seeing messages
	Access other player information

2FA:
	Implement email based 2FA

Database:
	Frontend -> Send query to backend
	Backend  -> Forwards query to database
	Database -> Runs the query
	Database -> Return either a value or an error -> Backend
	Backend  -> Returns error or value -> Frontend
	Frontend -> Shows error message
