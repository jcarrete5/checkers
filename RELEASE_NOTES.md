Version 1.0
===========
Initial Checkers game release

Features
--------
- Standard checkers piece movements (also specified in SRS)
- Local multiplayer
- If a piece can make a jump, then it must jump.
- Winner is the player who captures all of their opponents pieces

Features Not Implement
--------
- Real time connection with AWS DynamoDB server
- Create game / host a game and generate token (depend on RTC)
- Join game with token (depend on RTC)
- Game interface (resign, confirm, cancel) buttons
- Check game connection remotely (only local now)
