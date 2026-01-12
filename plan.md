Click Create game:
	if player > 1
		Goes to Alias and color select
		Host goes to waiting list

Match History:
	1 vs 1 -> dates, relevant details, 

Lobby:
	Player clicks on join game
		if Local:
			Goes to Alias and color select
			start game
		if remote:
			bind socket user socket to game

Tournament:
	0: Choose all 3 client players aliases. The host uses registered alias. Add Id to each player
	1: Tournament tree, shuffle all 4 players and show the tree.
	2: Match starts
	
Friends:
	Create friends page
	Add remove, mp buttons

Player Stats:
	Shows win/loses

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
